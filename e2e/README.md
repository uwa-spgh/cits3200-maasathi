# MaaSathi Web E2E Tests

Playwright end-to-end tests for the MaaSathi Ionic Vue application running through Vite in a browser.

## How to run

### Prerequisites

Install Node.js and npm, then open a terminal in the project directory:

```bash
cd /path/to/cits3200-maasathi
npm install
```

Install the Playwright Chromium browser once on each computer:

```bash
PW_BROWSER=playwright npx playwright install chromium
```

Run all 18 tests:

```bash
PW_BROWSER=playwright npm run test:e2e
```

Expected result:

```text
18 passed
```

Run a specific test group:

```bash
PW_BROWSER=playwright npm run test:e2e -- e2e/smoke
PW_BROWSER=playwright npm run test:e2e -- e2e/mvp/mvp-01-onboarding.spec.ts
PW_BROWSER=playwright npm run test:e2e -- e2e/complete/ui-full-coverage.spec.ts
```

Open the interactive Playwright UI or the HTML report:

```bash
PW_BROWSER=playwright npm run test:e2e:ui
npm run test:e2e:report
```

## Concrete tests

There are 8 test files and 18 tests. A phase or MVP is a group of related tests, not necessarily one test.

| Phase | Test group | Concrete coverage | Tests |
|---|---|---|---:|
| 1 | Framework smoke | A fresh profile is redirected to onboarding | 1 |
| 2 | MVP-01 Onboarding | Incomplete-user guard; completed onboarding reaches Home | 2 |
| 3 | MVP-02 Reminders | Home → Reminders; timeline contains an item | 1 |
| 4 | MVP-03 Danger signs | BottomNav opens the Danger signs page | 1 |
| 5 | MVP-04 Language | English ↔ Bengali; navigation still works after switching | 1 |
| 6 | MVP-05 Birth → PNC | Birth registration changes ANC to PNC; Reminders still load | 1 |
| 7 | MVP-06 Page smoke | PNC content expands; static routes load; History Summary loads when an active pregnancy exists | 3 |
| 8 | Broader UI check      | Existing Home navigation, Information topics, ANC routes, PNC/Vaccination content, Emergency, Profile, and Reminders guidance | 8 |
| **Total** |  |  | **18** |

### Test files

- `e2e/smoke/framework-ready.spec.ts` — confirms the E2E framework and onboarding gate.
- `e2e/mvp/mvp-01-onboarding.spec.ts` — tests the incomplete-user guard and the onboarding happy path.
- `e2e/mvp/mvp-02-reminders.spec.ts` — tests the Home Reminder card and the Reminders timeline.
- `e2e/mvp/mvp-03-danger-signs.spec.ts` — tests BottomNav navigation to Danger signs.
- `e2e/mvp/mvp-04-language.spec.ts` — tests English/Bengali switching and continued navigation.
- `e2e/mvp/mvp-05-birth-pnc.spec.ts` — tests birth registration and ANC → PNC mode switching.
- `e2e/mvp/mvp-06-all-pages-smoke.spec.ts` — tests PNC content, named routes, and History Summary.
- `e2e/complete/ui-full-coverage.spec.ts` — tests the broader existing UI and direct-route coverage.

## Scope

These tests verify browser navigation, visible content, forms, localStorage-backed state, and page reachability.

They do not verify date arithmetic, EDD/LMP formulas, TT interval calculations, native SQLite behaviour, OS notifications, real phone dialling, or pixel-level visual regression.



