# Releasing MaaSathi

How to publish an Android build your team can install, and how to build one yourself.

**iOS is not covered.** No iOS build is produced by any of this, and nothing here touches
`ios/` — the diff against `main` is zero lines. See [iOS](#ios) for what's missing.

## What you have now

GitHub Actions publishes a **signed, installable APK** to a GitHub Release, on two channels:

| | Nightly | Release |
|---|---|---|
| When | automatically, once a day | you trigger it |
| Tag | `v1.0.1-nightly-2026-10-01` | `v1.0.1` |
| A prerelease on GitHub | always | only if you tick the box |
| Installs over | the last release, and each later nightly | its own nightlies |

Both use the same `applicationId` and the same signing key, so a tester can move from a nightly
onto a real release without uninstalling and losing their data.

## One-time setup

### 1. Generate the keystore

```bash
git checkout release/android-signed-builds
git pull
./scripts/setup-release-signing.sh
```

It asks for one password (twice, to confirm). That is the only password — the script reuses it
for the key too. Note it down.

### 2. Back the keystore up

`android/keystore/release.keystore` — put a copy somewhere you control, not just on the laptop.

> **This is the one thing that really matters.** The keystore *is* the app's identity. Lose it and
> you can never ship an update to a copy of the app that is already installed. Your only way out
> would be a new `applicationId`, which is a different app.

### 3. Encode it

```bash
base64 -w0 android/keystore/release.keystore                     # Linux
base64 -i android/keystore/release.keystore | tr -d '\n'         # macOS
```

The macOS form matters: plain `base64` adds a trailing newline, which silently corrupts the secret.

### 4. Add four secrets

Repo → **Settings → Secrets and variables → Actions → New repository secret**.
Use *secrets*, not variables — the workflow reads `secrets.*`.

| Name | Value |
|---|---|
| `ANDROID_KEYSTORE_BASE64` | the output of step 3 |
| `ANDROID_KEYSTORE_PASSWORD` | your password |
| `ANDROID_KEY_ALIAS` | `maasathi` |
| `ANDROID_KEY_PASSWORD` | **the same password again** |

### 5. Merge the PR

Nightlies start themselves once this is on `main`.

## Publishing

**A release:** repo → **Actions → Android release → Run workflow**. Set `tag` to `v1.0.0`,
leave `prerelease` unticked.

**A nightly:** nothing to do, they appear once a day. To force one, push a tag:

```bash
git tag v1.0.1-nightly-2026-10-02
git push origin v1.0.1-nightly-2026-10-02
```

The workflow derives the version from the tag, checks the APK is really signed and 16 KB aligned,
runs the test suite, and only then publishes.

## For your team

**Nobody needs the keystore.** Two options:

- Download the `.apk` from the release page, tap it, allow installs from that source.
  Needs Android 7.0 or newer.
- Or build their own debug APK and `adb install` it.

## Debug builds

Debug builds install as a **separate app**, so they sit next to a release without fighting it:

| | applicationId | Label | Icon |
|---|---|---|---|
| release | `com.maasathi.app` | MaaSathi | white |
| debug | `com.maasathi.app.debug` | MaaSathi (debug) | teal |

This matters because Android refuses to install an update signed by a different key. With one
shared app id, a developer's debug build locks them out of the release they have installed, and
putting the release back fails with `INSTALL_FAILED_UPDATE_INCOMPATIBLE`.

The first time you switch, your debug build is a *different app*, so it starts from onboarding
again. The old copy stays under the previous id until you uninstall it. Nothing is lost.

## Building it yourself

Needs **JDK 21** and an Android SDK with **platform 36**.

```bash
npm install
npm run build
npx cap sync android          # required before the first gradle run
cd android && ./gradlew assembleDebug
```

For a signed release, pass the keystore details as environment variables —
`MAASATHI_KEYSTORE`, `MAASATHI_KEYSTORE_PASSWORD`, `MAASATHI_KEY_ALIAS`,
`MAASATHI_KEY_PASSWORD`, plus `MAASATHI_VERSION_CODE` and `MAASATHI_VERSION_NAME`. They are
documented at the top of `android/app/build.gradle`, and the workflow sets them for you. Without
them the build still works and produces an **unsigned** APK, which no phone will install.

`npx cap sync android` is not optional: `capacitor-cordova-android-plugins/` is gitignored but
included by `settings.gradle`, so Gradle fails without it.

## Things that will bite you

- **Losing the keystore.** Covered above. Back it up before you do anything else.
- **Never hand out a release signed with a throwaway key.** Android ties updates to the signing
  key per app id. Anyone who installs a build signed with a different key can never receive a
  proper update — they would have to uninstall, losing their data. Use a debug build for throwaway
  testing; it has its own app id and cannot collide.
- **Nightlies stop silently after 60 days** without activity on a public repo. They also only run
  from `main`, so they do nothing until the PR is merged.
- **You cannot roll back to a nightly.** Once `v1.0.1` is out, its nightlies are refused with
  `INSTALL_FAILED_VERSION_DOWNGRADE`. That is deliberate. Use the debug build for unstable.
- **A rebuilt keystore is a different app.** If you ever regenerate one, nobody can update.

## Version numbers

Nightlies are numbered as prereleases of the *upcoming* version, which is what lets them install
over the current release:

```
v1.0.0                      ->  100009999
v1.0.1-nightly-2026-10-01   ->  100010001    installs over v1.0.0
v1.0.1                      ->  100019999    installs over its own nightlies
```

Until anything is released, nightlies are `v1.0.0-nightly-<date>`. After `v1.0.0` they move to
`v1.0.1-nightly-<date>`.

The workflow checks every bound and fails with a message naming the fix, rather than quietly
producing a number that cannot install. The details are in the comments in
`.github/workflows/android-release.yml`.

## iOS

Not done. Nothing in this repository produces an installable iOS build, and nothing in the release
setup touches `ios/`.

To do it you would need the **Apple Developer Program at US$99/year** — without it you cannot sign
for a physical iPhone at all — plus an App Store Connect record and a decision between TestFlight
and ad-hoc profiles. TestFlight is the sane route.

If that happens, the version scheme carries over, with one substitution: iOS has no `versionCode`,
it has `CFBundleVersion` (the build number), which is the one that must always increase.
`CFBundleShortVersionString` is limited to three dot-separated integers, so it cannot carry a
`-nightly-2026-10-01` suffix — the ordering would have to live entirely in the build number.