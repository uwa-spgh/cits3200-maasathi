# MaaSathi — Capacitor 8 Upgrade Handoff (iOS + Android)

Covers the Capacitor 8 upgrade on both platforms, the Android build pins, and the Android
notification behaviour fixes. Sections: [iOS](#why-this-upgrade-happened) ·
[Android](#android-upgrade-verified) · [Notifications](#notification-behaviour-fixed) ·
[e2e](#web--e2e-status)

## Why this upgrade happened

The project was on **Capacitor 6.2.x**, which has no `UIScene` support. iOS 27 hard-requires
the scene lifecycle and traps on launch:

```
___UIApplicationEvaluateRuntimeIssueForNoSceneLifecycleAdoption_block_invoke
  <- -[UIApplication workspace:didCreateScene:withTransitionContext:completion:]
  <- UIApplicationMain <- AppDelegate.swift:5
Exception Type: EXC_BREAKPOINT (SIGTRAP)
```

Patching `Info.plist` with a scene manifest stops the crash, but the scene never receives a
key window, so `CAPBridgeViewController` is never instantiated and the app renders a **black
screen**. Capacitor 6 cannot be fixed for iOS 27 without hand-writing scene plumbing.

Verified that **Capacitor 7.6.9 also has no scene support** (`@capacitor/ios@7.6.9` contains no
`SceneDelegate` / `configurationForConnectingSceneSession`). Only **Capacitor 8.5.2** ships
`CAPSceneDelegateProxy.swift`, so v8 is the minimum viable target.

## What Capacitor 8 fixes

`ios/App/App/SceneDelegate.swift` (generated):

```swift
window = UIWindow(windowScene: windowScene)
window?.rootViewController = CAPBridgeViewController()
window?.makeKeyAndVisible()
```

`ios/App/App/AppDelegate.swift` implements
`application(_:configurationForConnecting:options:)` returning
`config.delegateClass = SceneDelegate.self`.

## Breaking changes you must know about

1. **CocoaPods is gone. Capacitor 8 uses Swift Package Manager.** There is no `Podfile` and no
   `.xcworkspace`. Open **`ios/App/App.xcodeproj`**. Do **not** run `pod install`.
2. **iOS deployment target is 15.0** (was 13.0). iOS 27 SDK supports only 15.0+.
3. `Info.plist` must keep its `UIApplicationSceneManifest` — it is what wires the SceneDelegate.

## Version changes applied

| Package | From | To |
|---|---|---|
| `@capacitor/core` | 6.2.1 | 8.5.2 |
| `@capacitor/cli` | 6.2.1 | 8.5.2 |
| `@capacitor/ios` | 6.2.2 | 8.5.2 |
| `@capacitor/android` | 6.2.1 | 8.5.2 |
| `@capacitor/app` | 6.0.3 | 8.1.1 |
| `@capacitor/geolocation` | 6.1.1 | 8.2.2 |
| `@capacitor/local-notifications` | 6.1.3 | 8.3.1 |
| `@capacitor-community/sqlite` | 6.0.2 | 8.1.1 |

`@capacitor/community/sqlite@8.1.1` declares `peerDependencies: { "@capacitor/core": ">=8.0.0" }`.

**No application source changes were needed.** `npx tsc --noEmit` passes clean and
`npm run build` succeeds — the Vue/TypeScript code in `src/` is untouched.

## Prerequisites

- macOS with Xcode 27.x and iOS 27 SDK — for iOS
- **JDK 21** — required for Android. Capacitor 8 regenerates
  `android/app/capacitor.build.gradle` with `JavaVersion.VERSION_21`.
- Android SDK with platform 36 (verified against `/opt/android-sdk`, platforms 34–37)

## Build and run iOS

```bash
npm install
npm run build
npx cap sync ios

# CLI build
xcodebuild -project ios/App/App.xcodeproj -scheme App \
  -configuration Debug -sdk iphonesimulator \
  -destination 'platform=iOS Simulator,name=iPhone 18 Pro' \
  -derivedDataPath ios/build CODE_SIGN_IDENTITY="-" \
  CODE_SIGNING_REQUIRED=YES CODE_SIGNING_ALLOWED=YES build
```

Or simply:

```bash
open ios/App/App.xcodeproj   # then Cmd-R
```

`CODE_SIGN_IDENTITY="-"` is ad-hoc signing, which is all a simulator build needs. For a real
device you must set a Development Team in Signing & Capabilities.

## What is already verified

- `npm install` resolves all 8 packages on v8
- `npx tsc --noEmit` — clean
- `npm run build` — succeeds
- `npx cap add ios` / `cap sync ios` — succeeds
- `xcodebuild` — BUILD SUCCEEDED
- Installed and launched on an iPhone 18 Pro simulator (iOS 27.0)
- App renders the onboarding screen correctly (was black on v6)

## What is NOT verified — do these next

### 1. ~~Android is still on Capacitor 6 pins and will NOT build as-is~~ — DONE

Android has since been moved to the Capacitor 8 pins and **builds cleanly**. See
[Android upgrade](#android-upgrade-verified) below.

### 2. Native plugin behaviour

- **`@capacitor-community/sqlite`** — ✅ **verified on Android**: logcat shows
  `MaaSathi: using SQLite storage`, so it initialises natively and does not fall back to
  `localStorage`. Untested on iOS.
- **`@capacitor/local-notifications`** — ✅ **verified on Android**, end to end: a real heads-up
  banner, correct channel importance, correct status bar icon, and the due-today reminder arriving
  10 minutes after launch. **Untested on iOS, and the shared-code changes affect it** — read
  [What this means for iOS](#what-this-means-for-ios) before testing. The iOS Simulator does not
  reliably deliver local notifications, so use a physical device.
- **`tel:` links on the Emergency page** — untested. A simulator or emulator cannot place a call.
- **Onboarding wizard** — language, name, LMP/EDD, TT vaccination history. Untested on device.
- **Bengali locale** switching, and the ANC/PNC/vaccination/danger-signs pages. Untested on device.

### 3. Known loose end, not changed

`@capacitor/geolocation` is a declared dependency but is **never imported anywhere in `src/`**.
Either wire it up or remove it. Left as-is deliberately. Note it is still compiled into the APK
and contributes `ACCESS_NETWORK_STATE`, so removing it would also drop an unnecessary permission.

### 4. This repo is behind on other branches

All remote branches, including `feature/ios-support` and `ios-app-support`, are still on
Capacitor 6. This upgrade is on a single branch and will conflict with those.

## Android upgrade (verified)

Android was still on the Capacitor 6 pins while iOS was upgraded. It has now been moved to the
Capacitor 8 pins and **verified by actually producing APKs**, not just by editing config.

### Pins changed

| Setting | Was | Now |
|---|---|---|
| `minSdkVersion` | 22 | **24** |
| `compileSdkVersion` | 34 | **36** |
| `targetSdkVersion` | 34 | **36** |
| Android Gradle Plugin | 8.2.1 | **8.13.0** |
| `google-services` plugin | 4.4.0 | **4.4.4** |
| Gradle wrapper | 8.2.1 | **8.14.3** |
| Java `sourceCompatibility` / `targetCompatibility` | 17 | **21** (regenerated by `cap sync`) |
| AndroidX pins (appcompat, core, webkit, fragment, …) | 2023 vintage | **Capacitor 8 template values** |

Files touched: `android/variables.gradle`, `android/build.gradle`,
`android/gradle/wrapper/*` (properties **and** jar, plus `gradlew`/`gradlew.bat`),
`android/app/build.gradle`, `android/app/src/main/AndroidManifest.xml`.

Two changes beyond raw version numbers, both taken from the Capacitor 8 template:

- `app/build.gradle` now uses `namespace =` / `compileSdk =` / `ignoreAssetsPattern =`. The old
  call-style syntax is deprecated and removed in Gradle 9.
- `AndroidManifest.xml` adds `navigation|density` to the activity's `configChanges`, which the
  Capacitor 8 template requires.

`compileSdk 34` was already below Google Play's submission floor, so this bump was needed
regardless of Capacitor version.

### Build and run

```bash
npm install
npm run build
npx cap sync android
cd android && ./gradlew assembleDebug      # JDK 21 required
adb install -r app/build/outputs/apk/debug/app-debug.apk
```

`npx cap sync android` is **mandatory before the first gradle run** on a fresh clone:
`android/capacitor-cordova-android-plugins/` is gitignored and `android/settings.gradle`
`include`s it, so gradle fails without it. There is no single npm script for this; run
`npm run build && npx cap sync android` and then `./gradlew assembleDebug` from `android/`.

### Verified on Linux with JDK 21 + Android SDK 36

- `assembleDebug` — **BUILD SUCCESSFUL**, `app-debug.apk` 14.3 MB
- `assembleRelease` — **BUILD SUCCESSFUL**, `app-release-unsigned.apk` 12.8 MB, and
  `lintVitalRelease` passes
- `aapt2 dump badging` confirms `minSdkVersion=24`, `targetSdkVersion=36`, `compileSdkVersion=36`
- All four native plugins are registered by `cap sync` and linked in:
  `@capacitor-community/sqlite@8.1.1`, `@capacitor/app@8.1.1`, `@capacitor/geolocation@8.2.2`,
  `@capacitor/local-notifications@8.3.1`
- Web assets are packaged under `assets/public/` (14 files)
- **16 KB page size: `zipalign -c -P 16` reports "Verification successful" on both the debug and
  release APKs.** `libsqlcipher.so` has `0x4000`-aligned `LOAD` segments. The old comment in
  `capacitor.config.ts` claiming otherwise was stale and has been corrected.
- Notification permissions are merged in correctly by the plugin's own manifest — no manual
  manifest edit needed. The APK declares `POST_NOTIFICATIONS`, `SCHEDULE_EXACT_ALARM`,
  `RECEIVE_BOOT_COMPLETED`, `WAKE_LOCK`.

### Still needs a real device or emulator

The APK builds and packages correctly. SQLite has now been confirmed on device
(`MaaSathi: using SQLite storage`), as has reminder delivery — see
[Notification behaviour](#notification-behaviour-fixed). Still outstanding:

- **Onboarding wizard on device** — language, name, LMP/EDD, TT vaccination history.
- **`tel:` links** on the Emergency page — a simulator or emulator cannot place a call.
- **Bengali locale** end to end, including the ANC/PNC/vaccination/danger-signs pages.
- **iOS** — none of the Android verification applies, and the notification changes touch shared
  code. The iOS side of this upgrade is still only "builds and renders onboarding". See
  [What this means for iOS](#what-this-means-for-ios).

## Notification behaviour (fixed) — READ THIS IF YOU ARE ON iOS

Four defects in `src/services/notifications.ts`, found from an Android device report and then
verified on hardware. **`notifications.ts` is shared cross-platform code**, so three of the four
changes alter iOS behaviour as well. See [What this means for iOS](#what-this-means-for-ios) before
testing — that section is the important one for you.

Work is on `fix/android-notification-behaviour` (PR #2), stacked on PR #1. Merge or build in that
order; building PR #1's branch reproduces the original bugs exactly, because PR #1 contains none of
this.

| # | Symptom | Platform affected |
|---|---|---|
| 1 | No banner over the screen, straight to the shade | Android only |
| 2 | A due-today reminder fired the instant the app opened | **Android and iOS** |
| 3 | Reminder bodies attached to the wrong schedule items | **Android and iOS** |
| 4 | First install produced *no* ANC visit 1 reminder (regression from fixing #2) | **Android and iOS** |

### 1. Reminders never appeared over the screen

The app never set a `channelId`, so every notification landed on the plugin's own `default`
channel, created with `IMPORTANCE_DEFAULT` (`LocalNotificationManager.createNotificationChannel`).
From API 26 the channel's importance alone decides heads-up behaviour —
`NotificationCompat.setPriority()` is ignored — and `IMPORTANCE_DEFAULT` means the shade and
nothing else.

Android also **refuses to raise the importance of a channel that already exists**, so simply
bumping the plugin's channel would not have fixed installs that already had the app. Reminders now
post to their own `maasathi-reminders` channel at `IMPORTANCE_HIGH`, created by
`ensureReminderChannel()`.

No `sound` is set on that channel, so it uses the system default notification sound and respects
the user's own setting. The plugin can only address sounds in `res/raw`, and the app ships none.

### 2. A due-today reminder fired the moment the app opened

`ANC visit1`'s `dueDate` is the registration date (`useSchedule.ts`), so on a first run the
offset-0 slot lands on *today at 09:00*. The old guard skipped past slots **except** same-day ones:

```ts
if (when.getTime() < today.getTime() && !isSameDay(when, today)) continue;
```

so a 09:00 slot opened at 14:00 was handed to the plugin. The Android implementation does not
clamp past-dated alarms — it posts them to the shade **immediately, in process, inside the
`schedule()` call** (documented in `LocalNotificationManager.buildNotification`). Worse,
`ensureAppData()` runs `regenerateSchedule()` on *every* app start, so the stale slot was re-armed
each launch.

Slots must now be at least `MIN_LEAD_MS` (60s) in the future. A slot still ahead of the clock is
unaffected, so opening the app at 08:00 still arms the 09:00 reminder.

This also fixes a second, subtler leak: the plugin's `schedule()` only clears the ids it is handed,
so *dropping* a slot left any alarm armed for that id by an earlier run still pending in
`AlarmManager`. Expired ids are now cancelled explicitly rather than merely omitted.

### 3. Reminder bodies were attached to the wrong schedule items

The type→template mapping was shifted:

```ts
if (item.type == 'ANC')       body = t('notification.reminder_anc');    // correct
if (item.type == 'MILESTONE') body = t('notification.reminder_pnc');    // EDD says "postnatal contact"
if (item.type == 'PNC')       body = t('notification.reminder_tt');     // PNC says "tetanus vaccination"
if (item.type == 'TT')        body = t('notification.reminder_edd');   // TT says "expected delivery"
```

So the expected-delivery reminder read "Your *postnatal contact* is …" (with a stray double space,
since `visitNumber('edd')` is null and the `#ordinal` placeholder was replaced with an empty
string), and the tetanus reminder said "Your expected delivery is …". Replaced with a lookup that
maps each type to its own template, matching `MILESTONE` on `ref` to distinguish the due date from
the start of the child's EPI schedule. Added `reminder_epi_start` and `reminder_generic` locale
keys (en + bn) for the two cases that had no template, so a `MILESTONE`/`TT` item can no longer
fall through to a mismatched string.

### 4. First install gave no ANC visit 1 reminder at all

This was a regression introduced by the fix for #2, caught on device and reported back. It is the
reason this section exists.

`ANC visit1` has **no entry in `ANC_VISIT_TARGET_WEEKS`** — it is special-cased to the registration
date. So a first-time install after 09:00 has *every* one of its 7/3/1/0-day slots already in the
past, and the guard from #2 discarded all four. The user registered for a visit that day and was
told nothing. A past slot now resolves three ways rather than two:

- **The "today" slot, item still upcoming** → deferred by `CATCHUP_DELAY_MS` (10 min) and armed.
  Ten minutes is far enough from the scheduling call that it cannot read as "fired as soon as I
  opened the app", which was the original complaint.
- **The same slot, already nudged today by an earlier launch** → left strictly alone. This case is
  the subtle one: the naive version pushed it into the expired list, and the cancel that follows
  destroyed the alarm the previous launch had armed but not yet delivered. The notification was
  scheduled and then silently killed on the next app open, so the user would have waited forever
  for something that had already been queued.
- **Everything else** → cancelled, as before. The 7/3/1-day bodies state a day count, so firing
  one late would make the text lie; they are dropped rather than nudged.

Dedupe is a small `id -> date` ledger in the app's own settings (`maasathi_reminder_catchup`),
pruned at 14 days. Deliberately **not** derived from the plugin's delivered list, which retains a
record until the user dismisses it and would therefore suppress the reminder on every future day
for a visit that is never completed. The ledger is written only after `schedule()` succeeds, so a
failed schedule cannot consume the day's single catch-up. A deferred reminder that would cross
midnight is skipped, because "today" would stop being true.

### Also fixed: the status bar icon (Android only)

Reminders passed `smallIcon: 'ic_launcher'`, but that resource lives in `mipmap-*` and the plugin
resolves small icons from `drawable` — so the lookup returned 0 and every notification fell back to
`android.R.drawable.ic_dialog_info`, Android's generic info glyph. Added a monochrome
`drawable/ic_stat_maasathi.xml` and pointed the plugin config at it. **The artwork is a placeholder
— swap in the real brand mark**, keeping the flat single-colour fill that Android's status bar tint
requires.

## What this means for iOS

**Nothing here has been run on iOS.** Defects #2, #3 and #4 are in shared code and change iOS
behaviour. #1 is Android-only (no channels on iOS). Specifically:

- **A banner will now appear ~10 minutes after a first launch** if the user registers for a visit
  that day. This is new. iOS shows local notifications even when the app is foregrounded (no
  `UNUserNotificationCenterDelegate` `willPresent` override exists in this project), so the user
  will see it while still in the app. **Decide whether that is acceptable** — if not, the catch-up
  needs to be gated to Android, or the app needs a foreground presentation handler.
- **Past-dated reminders no longer fire on open** (#2). Previously an ANC visit 1 registered after
  09:00 produced an immediate notification; now it produces a deferred one. This is the intended
  fix but it is a visible change.
- **Reminder text changes** (#3). TT reminders now read "Your tetanus vaccination is …" instead of
  "Your expected delivery is …", and EDD reminders "Your expected delivery is …" instead of
  "Your postnatal contact is …". Worth eyeballing on a real device in both locales.
- **New locale keys** in `en.json` and `bn.json`: `notification.reminder_epi_start`,
  `notification.reminder_generic`, `notification.channel_name`, `notification.channel_description`.
  The last two are Android-only but live in the shared files. If your branch has its own edits to
  those files, expect a conflict.
- **No-op on iOS:** `ensureReminderChannel()` returns early unless the platform is Android, and
  `channelId` / `smallIcon` are Android concepts the iOS plugin ignores.
- **`vite.config.ts` now shells out to `git rev-parse --short HEAD`** to bake a build SHA into the
  bundle. It falls back to `MAASATHI_BUILD_SHA`, then to the literal `unknown`, so a build from a
  tarball or a checkout without git still works. Console output during `vite build` is unaffected.
- **iOS reminder *scheduling* is otherwise untouched** and still unverified. The original handoff
  noted the simulator does not reliably deliver local notifications; that still stands, so use a
  physical device.

### How to test this

Android, from a clean slate — the ledger makes repeat runs a no-op, so clear app data first:

```bash
git checkout fix/android-notification-behaviour
npm install && npm run build && npx cap sync android
cd android && ./gradlew assembleDebug
adb install -r app/build/outputs/apk/debug/app-debug.apk
adb shell pm clear com.maasathi.app        # REQUIRED: wipes the catch-up ledger
adb logcat -c
adb shell am start -n com.maasathi.app/.MainActivity
adb logcat -d | grep "MaaSathi:"
```

Expect, for an item due today:

```
MaaSathi: reminders ANC/visit1 due <today> — 1 armed on "maasathi-reminders" (1 due-today catch-up), 3 expired and cleared
```

and **~10 minutes later** a heads-up banner reading "Your first ANC visit is today". Relaunching the
app before then must report `3 expired`, not `4` — if it says 4, the pending catch-up is being
cancelled and the fix has regressed.

iOS:

1. Build and run on a **physical device** (not the simulator).
2. Register a pregnancy **after 09:00 local** so the due-today path is exercised.
3. Confirm no notification appears instantly on launch, and that one appears ~10 min later.
4. Check the ANC/PNC/TT/EDD reminder text in both English and Bengali.
5. Confirm reminders for *future* items still fire at 09:00 on the right days — that path is the one
   the catch-up must not have disturbed.

If anything regresses, `MaaSathi: build <sha> starting up` is the first line of the log and tells
you which commit is actually installed.

### Verified on a real device

Android only, on a **Pixel 10 Pro XL, Android 17 (API 37)**, driven over adb with the app's WebView
inspected through the Chrome DevTools Protocol. End-to-end, for the ANC visit 1 reminder specifically:

```
reminders ANC/visit1 due 2026-09-30 — 1 armed (1 due-today catch-up), 3 expired and cleared
reminders TT/next    due 2026-09-30 — 1 armed (1 due-today catch-up), 3 expired and cleared
```

`getPending()` then showed id `594321468`, body **"Your first ANC visit is today"**, armed for
`12:21:44` — ten minutes after the `12:11:43` launch — and ten minutes after that it fired:

```
12:21:45 WearNotifPipeline: Processing new notification: 0|com.maasathi.app|594321468|null|10452
12:21:45 SceneFramework: Event: HeadsUpNotificationVisibilityChange(isVisible=true)
```

Both records show `importance=4` on `channel=maasathi-reminders`. Earlier in the same session:

- **Heads-up banners** — `HeadsUpNotificationVisibilityChange(isVisible=true)`, dismissing ~2.4s later.
- **The status bar icon is the app's own** — the record's icon is `0x7f080079`
  (`drawable/ic_stat_maasathi`), where the pre-fix build showed `0x0108009b`
  (`android.R.drawable.ic_dialog_info`, the generic system glyph).
- **Body text correct per type** — `MILESTONE/edd` gives "Your expected delivery is in 7 days",
  `ANC/visit3` gives "Your third ANC visit is in 3 days".
- **`MaaSathi: using SQLite storage`** — SQLite initialises natively and does *not* fall back to
  `localStorage`. This closes the first item the original handoff listed as never verified.
- `SCHEDULE_EXACT_ALARM` was `granted=false` on the test device, so the plugin fell back to inexact
  alarms. Reminders still arrived, just not to the minute.

The commit SHA is baked into the bundle and logged at startup, so any future report of "still not
working" is one log read rather than a rebuild-and-hope cycle.

### Reproducing the check

```bash
adb logcat -c && adb shell am start -n com.maasathi.app/.MainActivity
adb logcat -d | grep "MaaSathi:"
adb shell dumpsys notification --noredact | grep -A5 "pkg=com.maasathi.app"
```

## Web / e2e status

`PW_BROWSER=playwright npm run test:e2e` — **18 passed (53s)** across the `smoke`, `mvp` and
`complete` suites, Chromium, at the time of this handoff (`e2e/support/` holds helpers only).
The suite has since grown; see `e2e/README.md` for current coverage.

One pre-existing failure was found and fixed: `e2e/complete/ui-full-coverage.spec.ts` asserted a
Home card titled "Remember to eat well" linking to Nutrition. That card no longer exists — it was
replaced by the "what to know right now" rotating widget (`HomePage.vue`, `STAGE_NOW_TOPICS` in
`src/utils/stageArticle.ts`). The test now drives the widget's `Learn more` and asserts the real
destination, `/information/anc?topic=<key>`. Nutrition reachability is still covered, by the
Information-hub test in the same file. This was failing before the Android work and is unrelated to
Capacitor.

Also fixed: `forceCancelAllReminders()` in `src/services/notifications.ts` was the only exported
function in that module without an `isNativePlatform()` guard, so the "reset all data" action in
Profile Settings threw on web. It was caught and logged as a spurious `reset failed`, and the reset
still completed — but it now no-ops cleanly like its siblings.

## Gitignore changes

`ios/build` and `ios/DerivedData` are ignored. Without this, `ios/` was 434 MB with 431 MB of
DerivedData across 3698 files; with it, the committed iOS project is 21 files / 0.3 MB.
Capacitor's own `ios/.gitignore` additionally excludes `App/App/public` and
`capacitor-cordova-ios-plugins`, both of which are regenerated by `cap sync`.

`android/.gitignore` already covers `build/`, `*.apk`, `local.properties`,
`capacitor-cordova-android-plugins`, and the copied `assets/public`, so no Android gitignore
changes were needed. `ios/build` and `android/app/build` were the only large artefacts produced.

