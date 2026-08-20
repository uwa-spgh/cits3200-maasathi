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
*   **Capacitor SQLite:** A native plugin handling offline-first data persistence, replacing traditional backend ORMs (e.g., SQLAlchemy) to store user data locally on the device.
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
    │
    ├── router/
    │   └── index.ts             # The routing configuration. Maps URL paths to specific page components in the views directory.
    │
    ├── views/
    │   └── HomePage.vue         # A page-level component. This is where UI layouts are constructed and rendered for specific routes.
    │
    ├── locales/
    │   ├── en.json              # The English dictionary mapping UI text keys to English strings.
    │   └── bn.json              # The Bengali dictionary mapping UI text keys to Bengali strings.
    │
    ├── db/
    │   └── database.ts          # Handles the Capacitor SQLite initialization, table schema definitions, and raw SQL queries.
    │
    └── services/
        ├── location.ts          # Interfaces with the device's native GPS API to calculate the nearest emergency facility offline.
        └── notifications.ts     # Interfaces with the device's native notification system to schedule local appointment reminders.

Local Development Setup

To replicate the development environment and run the application locally, follow these steps:

    Clone the repository to your local machine.

    Install dependencies: Run npm install in the root directory. This reads the package.json file and downloads all required packages.

    Start the server: Run npm run dev. This will launch the Vite development server and provide a localhost URL to view the application in your browser.

## Compiling for Mobile (Android & iOS)

Capacitor packages our compiled web code into native mobile projects. To build the application for physical devices or emulators, you will need the respective native development environments installed on your machine.

### Prerequisites
*   **Android:** [Android Studio](https://developer.android.com/studio) must be installed.
*   **iOS:** [Xcode](https://developer.apple.com/xcode/) must be installed (Note: Xcode requires a macOS environment).

### Build Process

**1. Compile the Web Assets**
Before updating the native projects, you must build the production-ready frontend code. This command uses Vite to compile and minify our Vue and TypeScript code into static web assets, placing them in a `dist/` directory.
```bash
npm run build