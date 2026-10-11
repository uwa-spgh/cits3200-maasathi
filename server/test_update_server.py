"""Tests for update_server.py. Run: python3 -m unittest discover -s server"""
import json
import tempfile
import threading
import unittest
from pathlib import Path
from urllib.error import HTTPError
from urllib.request import urlopen

from update_server import load_manifest, make_server

MANIFEST = {
    'code': 1010001,
    'name': '1.1.0',
    'url': 'https://github.com/uwa-spgh/cits3200-maasathi/releases/latest',
    'size_mb': 13,
    'notes': {'en': 'Fixes reminder dates', 'bn': 'স্মারকের তারিখ ঠিক করা হয়েছে'},
}


class UpdateServerTest(unittest.TestCase):
    def setUp(self) -> None:
        self.dir = tempfile.TemporaryDirectory()
        self.manifest = Path(self.dir.name) / 'latest.json'
        self.write(MANIFEST)
        self.server = make_server('127.0.0.1', 0, self.manifest)
        threading.Thread(target=self.server.serve_forever, daemon=True).start()
        self.base = f'http://127.0.0.1:{self.server.server_address[1]}'

    def tearDown(self) -> None:
        self.server.shutdown()
        self.server.server_close()
        self.dir.cleanup()

    def write(self, data) -> None:
        self.manifest.write_text(json.dumps(data, ensure_ascii=False), encoding='utf-8')

    def get(self, path: str):
        try:
            with urlopen(self.base + path, timeout=5) as res:
                return res.status, res.headers, res.read()
        except HTTPError as e:
            with e:
                return e.code, e.headers, e.read()

    def test_up_to_date_gets_empty_204(self) -> None:
        for code in (1010001, 2000000):
            status, headers, body = self.get(f'/v1/check?code={code}')
            self.assertEqual((status, body), (204, b''))
            self.assertEqual(headers['Access-Control-Allow-Origin'], '*')

    def test_older_build_gets_the_manifest(self) -> None:
        status, headers, body = self.get('/v1/check?code=1000001')
        self.assertEqual(status, 200)
        self.assertEqual(json.loads(body), MANIFEST)
        self.assertEqual(headers['Access-Control-Allow-Origin'], '*')

    def test_bad_requests(self) -> None:
        self.assertEqual(self.get('/v1/check')[0], 400)
        self.assertEqual(self.get('/v1/check?code=abc')[0], 400)
        self.assertEqual(self.get('/')[0], 404)

    def test_edits_to_the_manifest_apply_without_restart(self) -> None:
        self.write({**MANIFEST, 'code': 1020001, 'name': '1.2.0'})
        status, _, body = self.get('/v1/check?code=1010001')
        self.assertEqual(status, 200)
        self.assertEqual(json.loads(body)['name'], '1.2.0')

    def test_invalid_manifest_gives_503(self) -> None:
        self.write({**MANIFEST, 'url': 'http://insecure.example/app.apk'})
        self.assertEqual(self.get('/v1/check?code=1')[0], 503)
        self.manifest.unlink()
        self.assertEqual(self.get('/v1/check?code=1')[0], 503)

    def test_shipped_placeholder_is_valid_and_never_offers_an_update(self) -> None:
        placeholder = load_manifest(Path(__file__).with_name('latest.json'))
        self.assertEqual(placeholder['code'], 1)
        self.assertTrue(placeholder['url'].endswith('/releases/latest'))


if __name__ == '__main__':
    unittest.main()
