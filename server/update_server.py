#!/usr/bin/env python3
"""
Minimal update server for MaaSathi. Standard library only.

The app calls GET /v1/check?code=<versionCode> at most once a day.
  204 No Content  -> the phone is up to date (no body, the cheapest reply)
  200 + JSON      -> a newer stable build exists; the app offers to open `url`
  400             -> missing or non-numeric code
  503             -> latest.json is missing or invalid

The latest build is described in latest.json next to this file (or the path in
MAASATHI_MANIFEST). It is re-read on every request, so publishing an update is
just editing that file. Nothing about the phone is logged.

Not hosted yet. Android only allows HTTPS, so run this behind a reverse proxy
that terminates TLS (Caddy, nginx, ...). See server/README.md.

    python3 server/update_server.py [port]      # default 8080, binds 127.0.0.1
"""
import json
import os
import sys
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from urllib.parse import parse_qs, urlparse

DEFAULT_MANIFEST = Path(__file__).with_name('latest.json')


def load_manifest(path: Path) -> dict:
    """Reads latest.json and checks the fields the app relies on."""
    with open(path, encoding='utf-8') as f:
        data = json.load(f)
    if not isinstance(data, dict):
        raise ValueError('manifest must be a JSON object')
    if not isinstance(data.get('code'), int) or data['code'] < 1:
        raise ValueError('code must be a positive integer (the Android versionCode)')
    if not isinstance(data.get('name'), str):
        raise ValueError('name must be a string, e.g. "1.1.0"')
    if not isinstance(data.get('url'), str) or not data['url'].startswith('https://'):
        raise ValueError('url must be an https:// link')
    if not isinstance(data.get('size_mb'), (int, float)):
        raise ValueError('size_mb must be a number')
    if not isinstance(data.get('notes', {}), dict):
        raise ValueError('notes must be an object keyed by language, e.g. {"en": "...", "bn": "..."}')
    return data


class UpdateHandler(BaseHTTPRequestHandler):
    server_version = 'MaaSathiUpdate'
    sys_version = ''

    def do_GET(self) -> None:
        url = urlparse(self.path)
        if url.path != '/v1/check':
            return self._send(404)
        try:
            code = int(parse_qs(url.query)['code'][0])
        except (KeyError, ValueError):
            return self._send(400)
        try:
            latest = load_manifest(self.server.manifest_path)
        except (OSError, ValueError) as e:
            sys.stderr.write(f'update_server: bad manifest: {e}\n')
            return self._send(503)
        if latest['code'] <= code:
            return self._send(204)
        body = json.dumps(latest, ensure_ascii=False, separators=(',', ':')).encode('utf-8')
        self._send(200, body)

    def _send(self, status: int, body: bytes = b'') -> None:
        self.send_response(status)
        # The app's WebView runs on its own origin (https://localhost).
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Cache-Control', 'no-store')
        if body:
            self.send_header('Content-Type', 'application/json; charset=utf-8')
        self.send_header('Content-Length', str(len(body)))
        self.end_headers()
        self.wfile.write(body)

    def log_message(self, format: str, *args) -> None:
        # Health app: do not record IP addresses or request lines.
        pass


def make_server(host: str, port: int, manifest_path: Path | None = None) -> ThreadingHTTPServer:
    server = ThreadingHTTPServer((host, port), UpdateHandler)
    server.manifest_path = Path(manifest_path or os.environ.get('MAASATHI_MANIFEST') or DEFAULT_MANIFEST)
    return server


if __name__ == '__main__':
    port = int(sys.argv[1]) if len(sys.argv) > 1 else 8080
    server = make_server('127.0.0.1', port)
    print(f'MaaSathi update server on http://127.0.0.1:{port}/v1/check (manifest: {server.manifest_path})')
    server.serve_forever()
