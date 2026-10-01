#!/usr/bin/env bash
#
# One-time setup for Android release signing.
#
#   ./scripts/setup-release-signing.sh
#
# Creates the release keystore, checks it cannot be committed, and prints the exact
# command to turn it into a GitHub Actions secret. Run it once, then store the
# keystore somewhere you control and do not lose it: it IS the app's identity.
# Sign an update with a different key and users cannot upgrade without
# uninstalling, which deletes their SQLite data.
#
# Safe to re-run — it will not overwrite an existing keystore.

set -euo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
KEYSTORE_DIR="$REPO_ROOT/android/keystore"
KEYSTORE="$KEYSTORE_DIR/release.keystore"
ALIAS="${MAASATHI_KEY_ALIAS:-maasathi}"

# The distinguished name is metadata baked into the certificate. Nothing in
# Android reads it and no authority issues or checks it, so it is supplied here
# rather than prompted for: keytool's interactive version re-asks the whole DN
# block every time the confirmation is not answered with yes, which is a
# confusing loop to sit through. Override with MAASATHI_DN if you want your own.
DN="${MAASATHI_DN:-CN=MaaSathi, OU=CITS3200, O=University of Western Australia, L=Perth, ST=Western Australia, C=AU}"

say() { printf '\n== %s\n' "$1"; }

command -v keytool >/dev/null || { echo "keytool not found. Install a JDK 17+ and put its bin/ on PATH."; exit 1; }

if [[ -f "$KEYSTORE" ]]; then
  say "Keystore already exists at $KEYSTORE"
  say "NOT regenerating it. A new key would break every existing install."
else
  say "Generating $KEYSTORE (alias: $ALIAS)"
  say "Choose a store password and a key password. Record them now, and keep the file backed up."
  echo "  distinguished name: $DN"
  echo "  (metadata only — nothing in Android reads it. Override with MAASATHI_DN.)"
  mkdir -p "$KEYSTORE_DIR"
  keytool -genkeypair -v \
    -keystore "$KEYSTORE" \
    -alias "$ALIAS" \
    -dname "$DN" \
    -keyalg RSA -keysize 2048 -validity 10000

  # keytool can exit 0 without writing anything — notably when it cannot prompt
  # for a password (no TTY, or CI), where it prints "Too many failures" and gives
  # up. Never report success without the file actually being there.
  if [[ ! -s "$KEYSTORE" ]]; then
    echo
    echo "ERROR: no keystore was created at $KEYSTORE." >&2
    echo "keytool most likely could not prompt for a password. Re-run from an" >&2
    echo "interactive terminal, or pass -storepass/-keypass explicitly." >&2
    exit 1
  fi
fi

say "Certificate fingerprint"
# Informational only, so this must never block. keytool -list prompts for the
# store password on stderr and waits forever when it has no way to get one, so
# it is only ever called when the password is already known. Anything else, and
# we print the command instead of running it. stdin is closed as a backstop so a
# future edit cannot reintroduce a silent hang.
if [[ -n "${MAASATHI_KEYSTORE_PASSWORD:-}" ]]; then
  KEY_DETAILS="$(keytool -list -v -keystore "$KEYSTORE" -alias "$ALIAS" \
                   -storepass "$MAASATHI_KEYSTORE_PASSWORD" </dev/null 2>/dev/null || true)"
  if grep -qi "sha" <<<"$KEY_DETAILS"; then
    grep -iE "sha-?256|sha-?1" <<<"$KEY_DETAILS"
    echo "  Keep this. If you ever regenerate a key, this line is how you tell them apart."
  else
    echo "  Could not read it. Run:"
    echo "    keytool -list -v -keystore $KEYSTORE -alias $ALIAS"
  fi
else
  echo "  Not printed automatically, because reading it would prompt for the store"
  echo "  password. To get it:"
  echo "    keytool -list -v -keystore $KEYSTORE -alias $ALIAS"
  echo "  Keep the SHA-256 line. It is how you tell two keys apart later."
fi

say "Is it ignored by git?"
if git -C "$REPO_ROOT" check-ignore -q "$KEYSTORE"; then
  echo "  yes, ignored. Good."
else
  echo "  NO — this keystore could be committed. Stop and fix android/.gitignore."
  exit 1
fi
echo "  Double check before your first commit:"
echo "    git status --short   # the .keystore must not appear"

say "Encode it for GitHub Actions"
cat <<'EOF'
  Add four repository secrets under
  Settings > Secrets and variables > Actions > New repository secret

  On Linux:                      On macOS:
    base64 -w0 \                   base64 -i \        # then delete the
      android/keystore/             android/keystore/  # trailing newline
        release.keystore >           release.keystore  # before pasting
      keystore.b64                     > keystore.b64

    ANDROID_KEYSTORE_BASE64 = contents of keystore.b64
    ANDROID_KEYSTORE_PASSWORD = the store password
    ANDROID_KEY_ALIAS      = the alias
    ANDROID_KEY_PASSWORD   = the key password

  Encode on ONE platform and decode in CI with `base64 --decode`, which is
  what the workflow does. Do not paste the raw keystore into a secret.
EOF

say "Build a signed release locally to check it works"
cat <<'EOF'
  cd android
  MAASATHI_KEYSTORE=keystore/release.keystore \
  MAASATHI_KEYSTORE_PASSWORD='<store password>' \
  MAASATHI_KEY_ALIAS="$ALIAS" \
  MAASATHI_KEY_PASSWORD='<key password>' \
  MAASATHI_VERSION_CODE=1 \
  MAASATHI_VERSION_NAME=1.0.0 \
  ./gradlew assembleRelease

  # must be app-release.apk, NOT app-release-unsigned.apk
  ls -la app/build/outputs/apk/release/
EOF