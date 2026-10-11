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
| Tag | `v0.1.2-nightly-2026-10-02` | `v0.1.2` |
| GitHub prerelease | always | only if the box is ticked |
| Installs over | the last release, and each later nightly | its own nightlies |

The version is the last release with its patch ticked, unless `VERSION` steps the line up. See
[Nightly builds](#nightly-builds) and [Version numbers](#version-numbers).

## Publishing a release

Repository → **Actions → Android release → Run workflow**.

- `tag` — the version to publish, for example `v0.2.0`
- `prerelease` — leave unticked for a real release

The workflow derives the version from the tag, checks the APK is genuinely signed and correctly
aligned, runs the test suite, and only then publishes. A failure at any of those steps stops the
release rather than shipping something broken.

## Telling phones about a release

Once the update server is hosted ([server/README.md](../server/README.md)), phones on an older
build are offered a new **stable** release after you update `server/latest.json`:

- `code` — the release's versionCode, printed by the workflow as `versionCode=…`
- `name` — the version, for example `1.1.0`
- `size_mb` — the APK size in MB
- `notes` — one short sentence each in `en` and `bn`

Leave `url` as `https://github.com/uwa-spgh/cits3200-maasathi/releases/latest`, which always
points at the newest non-prerelease. Never set it for a nightly. Until the server is hosted this
step does nothing; the checked-in placeholder (`code: 1`) never offers an update.

## Nightly builds

These need no action. A nightly is the last release with its patch ticked: after `v0.1.1` the
nightlies are `v0.1.2-nightly-<date>`, and they keep ticking the last digit on their own. They never
move a minor or major version.

To advance the line deliberately — to `0.2.0`, or to `1.0.0` — write that version into the `VERSION`
file at the repo root and commit it:

```bash
echo 0.2.0 > VERSION
git commit -am 'start 0.2.0'
```

Nightlies then follow `VERSION` until it is released, after which the patch tick resumes by itself;
there is nothing to clear. Leave `VERSION` absent or empty when you are not stepping up.

To force a nightly for the current line, push a matching dated tag (the nightly runs are otherwise
triggered on a schedule):

```bash
git tag v0.1.2-nightly-2026-10-02
git push origin v0.1.2-nightly-2026-10-02
```

A nightly tag that is not on the current line is rejected, because that is how the line once
diverged: `1.0.0` nightlies appeared while the releases were still `0.1.x`, and every real release
was then un-installable next to them.

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

**A release tag can be pushed directly, or published by hand.** Both routes work; the workflow
leaves the tag it is building out of the version it compares against, so `git push origin v0.1.2`
no longer fails as un-installable against itself. Publishing by hand (Actions → Run workflow)
remains the way to rebuild an existing tag after a fix, because a re-pushed tag would otherwise
reuse the workflow from the tagged commit.

**Rolling back to a nightly is refused.** Once `v0.1.2` is installed, its own nightlies are
rejected with `INSTALL_FAILED_VERSION_DOWNGRADE`. That is intentional; the debug build covers
unstable testing.

**A stray high version poisons later releases.** versionCode is compared numerically, so a build
numbered above the line you are shipping makes every lower release un-installable to everyone who
took it — this is exactly what the old `1.0.0` nightlies did to `0.1.x`. Versioning is anchored to
the last release plus `VERSION`, and nightlies off that line are refused, so this cannot recur
silently.

**macOS needs a different base64 command.** `base64 -i release.keystore | tr -d '\n'`, not plain
`base64`, which appends a newline that corrupts the secret. Linux uses `base64 -w0`.

## Version numbers

A nightly is numbered as a prerelease of the version it will become, which is what lets it install
over the current release. After `v0.1.1` the next line is `0.1.2`:

```
v0.1.1                      ->  1019999      the last release
v0.1.2-nightly-2026-10-02   ->  1020001      installs over v0.1.1
v0.1.2                      ->  1029999      installs over its own nightlies
```

Stepping up — `VERSION` set to `0.2.0`, then cut as `v0.2.0` — moves the whole band:

```
v0.2.0-nightly-2026-10-20   ->  2000001      installs over v0.1.2
v0.2.0                      ->  2009999
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