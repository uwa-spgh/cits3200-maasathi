# Update server

A minimal "is there a newer version?" server for MaaSathi, kept small for users with
limited, expensive mobile data. Python standard library only, one file.

**Status: not hosted.** The app's check is off until `UPDATE_CHECK_URL` is set in
`src/services/updateCheck.ts`.

## How it works

The app (native release builds only, after onboarding) calls this at most once a day:

```
GET /v1/check?code=<versionCode>
```

| Reply | Meaning |
|---|---|
| `204`, empty body | Up to date. This is the usual reply and costs almost nothing. |
| `200` + JSON | A newer stable build exists. The app asks the user, and **Download** opens `url` in the browser. |
| `400` | `code` missing or not a number |
| `503` | `latest.json` missing or invalid |

The phone sends only its build number. The server logs nothing about requests.
Updates are never required, and "Later" hides that version until a newer one appears.

## Run locally

```bash
python3 server/update_server.py 8080        # binds 127.0.0.1
curl -i 'http://127.0.0.1:8080/v1/check?code=1'
python3 -m unittest discover -s server       # tests
```

## Publishing an update

Edit `latest.json`. It is re-read on every request, so no restart is needed:

```json
{
  "code": 1010001,
  "name": "1.1.0",
  "url": "https://github.com/uwa-spgh/cits3200-maasathi/releases/latest",
  "size_mb": 13,
  "notes": { "en": "Fixes reminder dates", "bn": "…" }
}
```

- `code` is the Android versionCode of the stable release. The **Android release** workflow
  prints it (`versionCode=…`), and phones with a lower code are offered the update.
- `url` must be `https://`. `/releases/latest` always points at the newest non-prerelease
  GitHub release, so nightlies are never offered.
- The checked-in placeholder uses `code: 1`, so it never offers an update.

## Hosting (later)

Android only allows HTTPS, so put the script behind a reverse proxy that handles TLS, for
example Caddy:

```
updates.example.org {
    reverse_proxy 127.0.0.1:8080
}
```

Then set `UPDATE_CHECK_URL = 'https://updates.example.org/v1/check'` in
`src/services/updateCheck.ts` and ship a new build.
