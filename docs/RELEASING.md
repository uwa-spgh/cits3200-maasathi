# Releasing MaaSathi

How to build installable builds for each platform, what signing is, and exactly which
credentials you need.

- [The short version](#the-short-version)
- [What signing is, and why it is the thing to be careful about](#what-signing-is-and-why-it-is-the-thing-to-be-careful-about)
- [Android](#android)
- [iOS](#ios)
- [Credential checklist](#credential-checklist)

## The short version

| | Android | iOS |
|---|---|---|
| Artifact | signed `.apk` | `.ipa` via TestFlight |
| Cost | free | **US$99/year** Apple Developer Program |
| Build machine | any (Linux/macOS) | **macOS + Xcode 27** only |
| CI runner | `ubuntu-latest` | `runs-on: xcode-27` |
| Installable by testers | yes, straight from the release page | only via TestFlight or a per-device profile |
| GitHub Releases helps? | yes — it is just installable hosting | no — you still need Apple's distribution path |

A GitHub Release is a tag plus attached files. It does **not** bypass platform signing, so a
release still has to contain properly signed artifacts. Android artifacts are then installable by
anyone. iOS artifacts are not: Apple signing restricts which devices may install them, which is
why TestFlight exists.

## What signing is, and why it is the thing to be careful about

Both platforms stamp a cryptographic signature into the binary. Its only job is to answer
"is this update really the same app?"

The consequence is the part that bites:

> **Sign an update with a different key and users cannot upgrade.** They must uninstall the old
> copy first, which deletes the app's SQLite database — every pregnancy record and reminder.

So the signing key is a **permanent identity**, not a build artefact.

- Back it up somewhere you control, offline. Not in the repo, not only in a secrets manager.
- If you lose it, you can never ship an update to an already-installed copy of the app. Your only
  remaining option is to change `applicationId` / the bundle ID and ship a new app.
- Never commit it. `.gitignore` already excludes `*.jks` and `*.keystore`, but that is a
  speed bump, not a guarantee.

## Android

### Build from source

Needs **JDK 21** and an Android SDK with **platform 36**. Nothing else is platform-specific.

```bash
git clone https://github.com/uwa-spgh/cits3200-maasathi.git
cd cits3200-maasathi
git checkout capacitor-8-upgrade

npm install
npm run build
npx cap sync android          # required before the first gradle run, see below

cd android
./gradlew assembleDebug        # unsigned-by-you, debug-signed, for `adb install`
adb install -r app/build/outputs/apk/debug/app-debug.apk
```

`npx cap sync android` is **mandatory before the first gradle run** on a fresh clone:
`android/capacitor-cordova-android-plugins/` is gitignored but `include`d by
`android/settings.gradle`, so gradle fails without it. `npm run build:android` already chains
`vite build && cap sync android && ./gradlew assembleDebug`.

### Create your signing key — once, ever

The fastest way, which also checks it cannot be committed and prints the exact
`base64` incantation for your platform:

```bash
./scripts/setup-release-signing.sh
```

Or by hand:

```bash
cd android
keytool -genkeypair -v \
  -keystore keystore/release.keystore \
  -alias maasathi \
  -keyalg RSA -keysize 2048 -validity 10000
```

It prompts for a store password and a key password. **Write down where you put the file and the
passwords.** For a student project put the file in your cloud drive or a password manager, not
just on the laptop.

`android/keystore/` is not itself gitignored, but the `*.keystore` rule in `android/.gitignore`
covers the file. Double check before your first commit:

```bash
git status --short          # the .keystore must not appear
git check-ignore -v android/keystore/release.keystore
```

### Build a signed release APK locally

Signing details are read from gradle properties first, then environment variables, so nothing
secret lives in the repo. A bare relative keystore path is resolved from the `android/` directory.

```bash
cd android
MAASATHI_KEYSTORE=keystore/release.keystore \
MAASATHI_KEYSTORE_PASSWORD='<store password>' \
MAASATHI_KEY_ALIAS=maasathi \
MAASATHI_KEY_PASSWORD='<key password>' \
MAASATHI_VERSION_CODE=1 \
MAASATHI_VERSION_NAME=1.0.0 \
./gradlew assembleRelease
```

You get `android/app/build/outputs/apk/release/app-release.apk`.

If signing details are incomplete the build still succeeds but emits
`app-release-unsigned.apk` and prints a warning listing exactly what was missing. That warning is
the only thing standing between you and shipping an uninstallable file, so do not ignore it.

To avoid retyping the passwords, put them in `~/.gradle/gradle.properties` (your home directory,
not the project):

```properties
maasathiKeystore=/absolute/path/to/release.keystore
maasathiKeystorePassword=...
maasathiKeyAlias=maasathi
maasathiKeyPassword=...
```

### Publishing with GitHub Actions

`.github/workflows/android-release.yml` builds, verifies, tests, and publishes automatically.
Either trigger it by hand from the Actions tab, or push a tag:

```bash
git tag v1.0.0
git push origin v1.0.0
```

It derives `versionName` from the tag and computes a `versionCode` that always increases, because
Android refuses to install an update whose `versionCode` is not higher. It then:

1. restores the keystore from secrets,
2. builds `assembleRelease`,
3. **verifies** the APK really is signed (`apksigner verify`), 16 KB aligned (`zipalign -c -P 16`),
   and has the expected SDK levels — failing the job if not,
4. runs the Playwright suite as a release gate,
5. attaches the APK to a GitHub Release.

Manual runs (`workflow_dispatch`) build and upload an artefact without creating a release, since
there is no tag to derive a version from.

Add these under **Settings → Secrets and variables → Actions**:

| Secret | Value |
|---|---|
| `ANDROID_KEYSTORE_BASE64` | `base64 -w0 keystore/release.keystore` |
| `ANDROID_KEYSTORE_PASSWORD` | the store password |
| `ANDROID_KEY_ALIAS` | `maasathi` |
| `ANDROID_KEY_PASSWORD` | the key password |

### Release channels

There are two, both producing a signed, installable APK with the same `applicationId` and the
same signing key.

| | Nightly | Release |
|---|---|---|
| How | automatic, 02:17 UTC daily | deliberate: manual trigger, or a `v*` tag |
| Tag | `nightly-YYYY-MM-DD` | `v1.0.0`, `v1.0.0-rc.1` |
| Marked prerelease | **always** | **by default** |
| Who tests it | people who want today's build | people installing something to keep |

Everything is a prerelease until you untick the box on a manual run, so nothing is ever published
as GitHub's "Latest" release by accident.

```bash
# trigger a release by hand: Actions > Android release > Run workflow
#   tag        = v1.0.0
#   prerelease = leave ticked for now, untick when you mean it
```

### Why nightlies cannot install over a release

Android keeps one monotonically increasing `versionCode` per `applicationId`. The two channels
share that single counter, so **it is impossible for both to install over each other in both
directions.** The scheme puts every tagged release above every nightly:

| tag | versionCode |
|---|---|
| `nightly-2026-10-01` | `20261001` |
| `v1.0.0-rc.1` | `100009901` |
| `v1.0.0` | `100010000` |
| `v1.0.1` | `100010001` |

Which gives:

- **nightly → release works.** This is the direction that matters: every tester who took a
  nightly can install the real release without uninstalling and losing their data.
- **release → nightly does not work.** Once someone installs a release, nightlies will not install
  over it. That is deliberate — they are on a release and should not be pulled back onto unstable
  builds. If you want unstable alongside a release, use the [debug
  channel](#debug-builds-and-release-builds-coexist), which has its own applicationId and
  coexists.
- `rc.1 < rc.2 < final`, because the prerelease number is subtracted rather than added.

If you would rather have release → nightly work instead, the bands have to be swapped, and you
lose nightly → release, which strands testers on nightlies. The workflow comments explain where
to change it.

### Nightly gotchas

- Scheduled workflows only run for workflow files on the **default branch**, so nightlies do
  nothing until this branch is merged to `main`.
- GitHub **disables scheduled workflows on public repositories after 60 days without activity.**
  If nightlies simply stop, check that before suspecting the build.
- One dated release per night, so the releases page gains ~365 entries a year. Use its search, or
  the CI run history, rather than scrolling.
- A rerun on the same day reuses the same tag and replaces the APK rather than failing.

### How a tester installs it

Open the release page, download the `.apk`, tap it. Android asks you to allow installs from that
source the first time. Nothing else is needed — no store, no account.

Minimum device: **Android 7.0 (API 24)**, which is the project's `minSdkVersion`.

### Debug builds and release builds coexist

Debug builds carry an `applicationIdSuffix` of `.debug`, so they install as
`com.maasathi.app.debug` alongside a real release rather than colliding with it:

| | applicationId | Label | Icon background |
|---|---|---|---|
| release | `com.maasathi.app` | MaaSathi | white |
| debug | `com.maasathi.app.debug` | MaaSathi (debug) | teal |

This is what stops the most common packaging mistake. Android refuses to install an update signed
by a different key, so with a shared applicationId a developer's debug build locks them out of the
release they installed, and installing the release back over the debug build fails with
`INSTALL_FAILED_UPDATE_INCOMPATIBLE`. Separate ids also keep debug SQLite data away from real data.

For a team, this means: **install the signed release APK from the GitHub Release page.** Nobody
needs the keystore.

What changed for existing developers: a debug build is now a *different app*, so the first run
after this change starts from onboarding again and the old debug data is not carried over. Nothing
is lost, it stays under the old applicationId until you uninstall it.

### Never hand out a throwaway-signed release

Android ties updates to a signing key per applicationId. If anyone installs a build signed with a
different key, **nobody holding that copy can ever receive a properly signed update** — they must
uninstall, which deletes the app's SQLite data, including every pregnancy record and reminder.

So: do not produce a "quick test release" with a scratch key. Either use a debug build (separate
applicationId, disposable), or let CI produce the signed release from a tag.

### Google Play, if you ever want it

Same build, different artefact:

```bash
./gradlew bundleRelease     # .aab, this is what Play requires
```

Play needs a US$25 one-off developer account, and since **31 August 2026** requires `targetSdk` 36
or higher — which this project is already on, so the SDK bump in this branch was mandatory, not
cosmetic.

## iOS

**Nothing in this repository currently produces an installable iOS build.** This section is what
is required, so the gap is explicit.

### The hard requirement

You need **Apple Developer Program membership, US$99/year**. Without it you cannot sign for a
physical iPhone at all. The free personal team allows 7-day provisioning, 3 apps, and must be
re-signed weekly — fine for a demo on your own Mac, not for distributing to testers.

Also required:

- macOS with **Xcode 27** (the project needs the iOS 27 SDK; the deployment target floor is 15.0)
- a registered bundle ID: `com.maasathi.app`
- a certificate: *Apple Development* for device testing, *Apple Distribution* for TestFlight
- a provisioning profile tying certificate + bundle ID + allowed devices
- an App Store Connect record, for TestFlight

### Distribution options

1. **TestFlight** — the sane route. Upload the build, testers install the TestFlight app, updates
   are automatic. Requires the paid membership.
2. **Ad-hoc `.ipa`** — can be attached to a GitHub Release, but the profile lists specific device
   UDIDs, and each tester needs their UDID registered plus a sideloading tool. Clunky.
3. **Enterprise** — Apple requires 100+ employees and audits this. Not applicable.
4. **Build from Xcode per Mac** — each person sets a Development team and runs ⌘R. Works with a
   free account, with the 7-day re-sign caveat.

### A trap worth naming

The `CODE_SIGN_IDENTITY="-"` build in `IOS-UPGRADE-HANDOFF.md` produces a **simulator** build.
Simulator apps cannot be given to anyone — they only run in that Mac's simulator. Getting onto a
real iPhone requires genuine signing.

### How it would work in CI

GitHub Actions has an `xcode-27` image, so an iOS job is possible:

```yaml
runs-on: xcode-27
```

It would `xcodebuild archive` with an `exportOptions.plist` and upload to App Store Connect for
TestFlight. Required secrets would be an Apple `.p8` API key plus the App Store Connect key ID and
issuer ID. This is not written yet.

### Capacitor 8 note

There is **no Podfile** and **no `.xcworkspace`** — Capacitor 8 uses Swift Package Manager. Open
`ios/App/App.xcodeproj`. Never run `pod install`. If you find a branch with a committed `Podfile`,
it predates the upgrade and will not work on iOS 27.

## Credential checklist

**Required for Android releases (free):**

- [ ] A release keystore you generated, backed up offline
- [ ] Its four values in GitHub Actions secrets

**Required for iOS releases:**

- [ ] Apple Developer Program membership, US$99/year
- [ ] Bundle ID `com.maasathi.app` registered
- [ ] An App Store Connect record
- [ ] TestFlight decided upon — this is the fork in the road; without it, iOS distribution is
      ad-hoc profiles and manual installs

**Optional:**

- [ ] Google Play developer account, US$25 one-off, only if you want Play rather than
      GitHub Releases