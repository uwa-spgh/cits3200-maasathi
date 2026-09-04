# cits3200-maasathi
MaaSathi an mHealth application for childhood immunisation reminders and information. (Bangladesh)

## Project Overview
MaaSathi is a cross-platform, offline-first mobile application developed to support maternal health in low-to-middle-income countries, specifically Bangladesh. The application provides offline pregnancy tracking, localized appointment notifications, and emergency facility routing. It is engineered to operate on low-end hardware with stringent data privacy standards via local sandboxed storage.

## Technology Stack Architecture
This project utilizes a decoupled frontend architecture encapsulated within a native runtime bridge.

*   **Vue.js 3:** The core frontend framework responsible for DOM management, reactivity, and application state.
*   **TypeScript:** A statically typed superset of JavaScript used across the codebase to catch errors at compile time and enforce strict structural contracts.
*   **Ionic Framework:** A UI component library that provides pre-built, cross-platform mobile elements (buttons, modals, navigation) styled for both iOS and Android.
*   **Vite:** The build tool and local development server, replacing heavier bundlers for significantly faster compilation and hot-module replacement.
*   **Capacitor:** The native runtime bridge. It compiles our web assets and embeds them into native iOS and Android WebViews, granting access to device hardware.
*   **Capacitor SQLite:** A native plugin handling offline-first data persistence, replacing traditional backend ORMs to store user data locally on the device.
*   **Vue-i18n:** The internationalization (i18n) plugin handling dynamic locale switching between English and Bengali without requiring page reloads.

## Directory and File Structure
All development occurs within the `src/` directory. Below is the file tree and the explicit responsibility of each file:

```text
maasathi/
├── package.json                 # Defines npm dependencies, project metadata, and execution scripts (e.g., npm run dev).
├── tsconfig.json                # Defines TypeScript compiler rules, strict typing flags, and module resolution.
├── vite.config.ts               # Configuration file for Vite, including the Vue plugin integration.
├── index.html                   # The root HTML document that Vite serves and where the Vue app is mounted.
│
└── src/                         # Core Application Source Code
    ├── main.ts                  # The primary entry point. Initializes Vue, Ionic, the router, and localization plugins before mounting the app.
    ├── App.vue                  # The root Vue component. Serves as the base container for the application and houses the router outlet.
    ├── env.d.ts                 # TypeScript declarations for Vue single-file components and Vite environment variables.
    ├── bootstrap.ts             # One-time app data initialisation (database, pregnancy, TT history, schedule) and onboarding flags.
    │
    ├── config/
    │   └── app.ts               # Global app configuration. NAV_MODE switches between the 'homeBar' and 'tabBar' navigation prototypes, plus the nav() path helper.
    │
    ├── router/
    │   └── index.ts             # The routing configuration. Builds the route tree per navigation mode and enforces the onboarding guard.
    │
    ├── layouts/
    │   └── TabsLayout.vue       # Ionic tabs layout (IonTabs + IonTabBar) used when NAV_MODE = 'tabBar'.
    │
    ├── views/                   # Page-level components, one per route.
    │   ├── HomePage.vue         # Home screen: greeting, stage-based message card, and the 2x2 action tile grid.
    │   ├── OnboardingPage.vue   # First-launch wizard: language, name, LMP/EDD, TT vaccination history.
    │   ├── WeekInfoPage.vue     # Placeholder page showing information about the current pregnancy/postpartum stage.
    │   ├── EmergencyPage.vue    # Offline emergency call buttons (tel: links) and the danger-signs checklist.
    │   ├── RemindersPage.vue    # The timeline: today's date, upcoming and past ANC/TT/PNC reminders.
    │   ├── InformationPage.vue  # Information hub: ANC, PNC, danger signs, nutrition, vaccination.
    │   ├── AncPage.vue          # ANC information drill-down: trimester selector.
    │   ├── AncTrimesterPage.vue # ANC trimester detail: visit accordions, danger signs, nutrition, tests.
    │   ├── PncPage.vue          # PNC information drill-down: contact accordions, newborn danger signs, breastfeeding.
    │   ├── VaccinationPage.vue  # Maternal TT vaccination: dose tracker, dose record, education placeholders.
    │   ├── DangerSignsPage.vue  # Full danger-signs reference for pregnancy, labour, postpartum and newborn.
    │   ├── NutritionPage.vue    # Nutrition education placeholders.
    │   ├── ProfilePage.vue      # Profile & settings: personal info, pregnancy registration, birth registration, TT forms, history list, appearance, navigation and data reset.
    │   └── HistorySummaryPage.vue # Read-only summary of an archived pregnancy (visits, doses, delivery, schedule record).
    │
    ├── components/              # Reusable UI components.
    │   ├── PageShell.vue        # Standard page wrapper: coloured section header, content area and (in homeBar mode) the home footer button.
    │   ├── SectionHeader.vue    # Coloured overlapping page header with back button (matches the Figma mockups).
    │   ├── HomeBarFooter.vue    # Centred home button footer, per the original mockups.
    │   ├── TabsLayout.vue       # (See layouts/ - listed here for discoverability.)
    │   ├── TimelineList.vue     # Vertical timeline list for the Reminders page.
    │   ├── TimelineItem.vue     # A single timeline milestone: colour-coded dot, date, due chip, expand/complete actions.
    │   ├── ExpandableCard.vue   # Accordion card used across information pages.
    │   ├── PlaceholderBox.vue   # Empty content placeholder box (structure-only sprint).
    │   ├── LanguageSwitcher.vue # English/Bengali language selector, available on Home, Onboarding and Profile.
    │   └── ThemeCustomizerModal.vue # Theme preset picker and per-colour customisation modal.
    │
    ├── composables/             # Shared reactive state and domain logic (Vue composables).
    │   ├── useUser.ts           # The mother's display name (persisted via localStorage).
    │   ├── usePregnancy.ts      # Active pregnancy state, ANC/PNC mode, gestational week / postpartum day, birth registration, and auto-archiving after the 6-week PNC contact.
    │   ├── useTt.ts             # Bangladesh EPI 5-dose lifetime TT schedule logic: registration options, next-dose calculation from last dose date (+4 weeks), dose recording.
    │   ├── useSchedule.ts       # Generates and persists the reminder timeline (4 ANC visits, TT dose, 4 PNC contacts, milestones) and marks items completed.
    │   ├── useHistory.ts        # Archived pregnancy summaries for the Profile history section.
    │   ├── useEmergencyContacts.ts # Editable emergency contact numbers used by the Emergency page.
    │   └── useTheme.ts          # Theme colour presets (vibrant/pastel/contrast/dark) applied via CSS variables.
    │
    ├── db/
    │   ├── schemas.ts           # TypeScript interfaces for all records plus the SQLite DDL (profile, pregnancy, tt_history, tt_dose, child, schedule_item, settings).
    │   └── database.ts          # Driver-based storage layer: Capacitor SQLite on device, localStorage in the browser. Exposes typed repositories.
    │
    ├── services/
    │   └── notifications.ts     # Local notification scheduling: 7/3/1/0-day reminders before each upcoming schedule item.
    │
    ├── i18n/
    │   └── index.ts             # Shared vue-i18n instance; also exports t() for use outside components (e.g., notification text).
    │
    ├── locales/
    │   ├── en.json              # The English dictionary mapping UI text keys to English strings.
    │   └── bn.json              # The Bengali dictionary mapping UI text keys to Bengali strings.
    │
    ├── utils/
    │   └── date.ts              # Date helpers: LMP→EDD conversion, gestational week, postpartum day, schedule offset tables.
    │
    └── theme/
        └── variables.css        # Global CSS variables for the four section colours and backgrounds.
```

## Domain Logic Summary
*   **ANC:** Bangladesh's national 4-visit focused ANC schedule (before 16, 24–28, 32, 36 weeks) generated from LMP (or EDD-derived LMP). Pregnancy week is calculated automatically.
*   **Maternal TT vaccination:** 5-dose lifetime schedule. Registration distinguishes known-count / known-but-unsure / never / unknown history. The next dose is always calculated from the date of the last dose received (+4 weeks), never from pregnancy number. Lifetime doses carry across pregnancies.
*   **PNC:** Registering a birth switches the app from ANC to PNC mode and generates the 4 WHO postnatal contacts (24h, 48–72h, 7–14 days, 6 weeks) plus a child EPI module milestone.
*   **Archiving:** After the 6-week PNC contact date passes, the pregnancy is automatically moved to history (accessible under Profile → Past pregnancies) with a full appointment record. It can also be closed early manually, and a new pregnancy registered at any time.
*   **Reminders:** Local notifications are scheduled 7, 3, 1 and 0 days before every upcoming appointment or vaccination.

## Navigation Prototypes
The app ships with two navigation implementations so they can be compared side by side:
*   `homeBar` — a single centred home button at the bottom of every page, exactly as in the Figma mockups.
*   `tabBar` — an Ionic tab bar (Home / Reminders / Info / Profile) always visible at the bottom.

Switch via **Profile → Settings → Navigation style** (the app restarts to apply), or change the default in `src/config/app.ts`.

## Local Development Setup

To replicate the development environment and run the application locally, follow these steps:

    Clone the repository to your local machine.

    Install dependencies: Run npm install in the root directory. This reads the package.json file and downloads all required packages.

    Start the server: Run npm run dev. This will launch the Vite development server and provide a localhost URL to view the application in your browser.

In the browser, data is stored in localStorage; on device, the same repository layer uses native SQLite.

## Compiling for Mobile (Android & iOS)

Capacitor packages our compiled web code into native mobile projects. To build the application for physical devices or emulators, you will need the respective native development environments installed on your machine.

### Prerequisites
*   **Android:** [Android Studio](https://developer.android.com/studio) must be installed.
*   **iOS:** [Xcode](https://developer.apple.com/xcode/) must be installed (Note: Xcode requires a macOS environment; the web code stays iOS-ready via Capacitor and can be added later with `npx cap add ios`).

### Build Process

**1. Compile the Web Assets**
Before updating the native projects, you must build the production-ready frontend code. This command uses Vite to compile and minify our Vue and TypeScript code into static web assets, placing them in a `dist/` directory.
```bash
npm run build
```

**2. Sync the Native Projects**
```bash
npx cap sync android
```

**3. Build / Run**
```bash
# Debug APK
cd android && ./gradlew assembleDebug
# Output: android/app/build/outputs/apk/debug/app-debug.apk

# Or open Android Studio
npx cap open android
```

## Privacy
All tracked data remains stored locally on the device (sandboxed SQLite). No data is sent to any external server.
