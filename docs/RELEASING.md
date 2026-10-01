# Releasing MaaSathi

This project publishes signed Android builds to GitHub Releases. It does not produce iOS builds,
and nothing in this setup touches `ios/` — see [iOS](#ios).

The signing key and its four repository secrets are already configured. Publishing begins once
this work reaches `main`.

## What gets published

Two channels, both signed, both using the same application id, so a tester can move from a
nightly onto a release without uninstalling and losing their data.

| | Nightly | Release |
|---|---|---|
| When | automatically, once a day | triggered by hand |
| Tag | `v1.0.1-nightly-2026-10-01` | `v1.0.1` |
| GitHub prerelease | always | only if the box is ticked |
| Installs over | the last release, and each later nightly | its own nightlies |

## Publishing a release

Repository → **Actions → Android release → Run workflow**.

- `tag` — the version to publish, for example `v1.0.0`
- `prerelease` — leave unticked for a real release

The workflow derives the version from the tag, checks the APK is genuinely signed and correctly
aligned, runs the test suite, and only then publishes. A failure at any of those steps stops the
release rather than shipping something broken.

## Nightly builds

These need no action — one appears each night, tagged
`v1.0.0-nightly-<date>` until something is released, then `v1.0.1-nightly-<date>` and onwards.

To force one, push a tag:

```bash
git tag v1.0.1-nightly-2026-10-02
git push origin v1.0.1-nightly-2026-10-02
```

Nightlies only run once this branch is merged to `main`, because GitHub only schedules workflows
that live on the default branch.

## Installing a build

Download the `.apk` from the release page, open it, and allow installs from that source when
asked. Requires Android 7.0 or newer.

No credentials are needed for this. Nobody on the team needs access to the signing key.

## Debug builds

Debug builds install as a separate application, so they sit alongside a release without
interfering with it.

| | Application id | Label | Icon |
|---|---|---|---|
| release | `com.maasathi.app` | MaaSathi | white |
| debug | `com.maasathi.app.debug` | MaaSathi (debug) | teal |

This matters because Android refuses to install an update signed by a different key. Sharing one
application id means a debug build locks its owner out of the release they have installed, and
putting the release back afterwards fails with `INSTALL_FAILED_UPDATE_INCOMPATIBLE`.

The first build after this change is a different application, so it starts from onboarding again.
The previous copy stays under the old id until uninstalled.

## Building from source

Requires JDK 21 and an Android SDK with platform 36.

```bash
npm install
npm run build
npx cap sync android
cd android && ./gradlew assembleDebug
```

`npx cap sync android` is required before the first Gradle run: `capacitor-cordova-android-plugins`
is gitignored but referenced by `settings.gradle`, so the build fails without it.

A release build needs the signing details passed in as environment variables
(`MAASATHI_KEYSTORE`, `MAASATHI_KEYSTORE_PASSWORD`, `MAASATHI_KEY_ALIAS`,
`MAASATHI_KEY_PASSWORD`, `MAASATHI_VERSION_CODE`, `MAASATHI_VERSION_NAME`), documented at the top
of `android/app/build.gradle`. Without them the build succeeds but produces an unsigned APK, which
no device will install. The workflow sets these automatically.

To regenerate the signing key from scratch, `scripts/setup-release-signing.sh` handles it.

## Pitfalls

**The signing key cannot be replaced.** Android ties updates to it per application id. If it is
lost, no future build can update a copy of the app that is already installed — the only route
would be a new application id, which is a different app. Keep a backup somewhere separate from the
machine that generated it.

**Never distribute a build signed with a throwaway key.** Everyone who installs it is permanently
locked out of real updates, and recovering means uninstalling, which deletes their data. Debug
builds exist for that purpose and cannot cause it.

**Nightlies stop silently after 60 days** without activity on a public repository. This is GitHub
behaviour, not a fault in the setup.

**Rolling back to a nightly is refused.** Once `v1.0.1` is installed, its own nightlies are
rejected with `INSTALL_FAILED_VERSION_DOWNGRADE`. That is intentional; the debug build covers
unstable testing.

**macOS needs a different base64 command.** `base64 -i release.keystore | tr -d '\n'`, not plain
`base64`, which appends a newline that corrupts the secret. Linux uses `base64 -w0`.

## Version numbers

Nightlies are numbered as prereleases of the upcoming version, which is what allows them to
install over the current release:

```
v1.0.0                      ->  100009999
v1.0.1-nightly-2026-10-01   ->  100010001    installs over v1.0.0
v1.0.1                      ->  100019999    installs over its own nightlies
```

The workflow validates every bound and fails with a message naming the fix rather than quietly
producing a number that cannot install. The detail lives in the comments in
`.github/workflows/android-release.yml`.

## iOS

No iOS build is produced by any part of this, and `ios/` is unchanged from `main`.

Supporting it would require the Apple Developer Program at US$99/year — without it, signing for a
physical iPhone is not possible — plus an App Store Connect record and a decision between
TestFlight and ad-hoc profiles. TestFlight is the practical choice.

The version scheme would carry over with one substitution. iOS has no `versionCode`; the
equivalent is `CFBundleVersion`, which is the field that must always increase.
`CFBundleShortVersionString` is restricted to three dot-separated integers, so it cannot hold a
`-nightly-2026-10-01` suffix — all ordering would have to live in the build number instead.