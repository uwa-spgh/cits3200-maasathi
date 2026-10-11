# Update check: plan and status

Branch: `feature/update-check` (from `main`, separate from PR #40). Implemented, verified and documented.

## Goal

A minimal "is there a newer version?" check for low-bandwidth users in Bangladesh.

- At most one check per day, sending only the app's build number (Android versionCode).
- If an update exists, ask the user. Download opens the stable GitHub releases page. Nothing downloads automatically.
- No required updates. Not hosted yet: the app check stays **disabled** until someone sets `UPDATE_CHECK_URL`.

## Design

**Server:** `server/update_server.py`, Python standard library only.
- `GET /v1/check?code=<versionCode>`.
- Up to date → `204` with an empty body.
- Newer build → `200` with `server/latest.json`, about 200 bytes.
- `400` for a bad code, `503` for a bad manifest.
- CORS `*`, nothing logged.
- Re-reads `latest.json` on every request.
- The placeholder manifest has `code: 1`, so it never offers an update.
- Its `url` is `https://github.com/uwa-spgh/cits3200-maasathi/releases/latest`, which is the newest non-prerelease, i.e. stable only.

**App:** `src/services/updateCheck.ts`.
- `UPDATE_CHECK_URL = ''` means disabled. Only runs on native, non-debug builds, after onboarding.
- Waits 24 hours between checks. Records a check only if the server answered, so offline phones retry on the next launch.
- 5-second timeout. Failures are silent.
- Prompt: "Later" remembers that version code; "Download" opens the URL in the system browser.
- Strings live in `update.*` in en.json and bn.json.

## Status

- [x] `server/update_server.py`
- [x] `server/latest.json` (placeholder)
- [x] `server/test_update_server.py` (unittest)
- [x] Run the server tests (6 pass)
- [x] `src/services/updateCheck.ts`
- [x] Call it from `App.vue` after `ensureAppData()`
- [x] Locale keys `update.*` (en and bn)
- [x] `server/README.md`: run, publish, host, enable in the app
- [x] Root README: privacy line and file tree
- [x] Verify: build passes and the e2e suite passes (36). Against a local server with a temporary,
      reverted bypass: the prompt shows in en and bn with the version, size and notes; Later stores
      the dismissed code and the check isn't repeated within 24h; a dismissed version stays hidden;
      Download opens /releases/latest; offline is silent and retries next launch.
- [x] Documented in README (file tree, domain summary, `update.*` content keys, Update Server
      section, privacy), docs/RELEASING.md ("Telling phones about a release") and server/README.md
- [x] Committed and opened as a PR

## To enable later (for whoever hosts it)

1. Host `update_server.py` behind HTTPS, e.g. Caddy or nginx proxying to `127.0.0.1:8080`.
2. Set `UPDATE_CHECK_URL` in `src/services/updateCheck.ts` to `https://<host>/v1/check`.
3. On each stable release, set `code` and `name` in `latest.json` to the release's versionCode and version. Update `size_mb` and `notes` too.
