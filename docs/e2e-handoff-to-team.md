# MaaSathi Web E2E — Team Handoff

Playwright end-to-end tests for the MaaSathi Ionic Vue web application.

This document expands the coverage summary in the [E2E README](../e2e/README.md). The suite contains **18 tests across 8 test files**, covering onboarding, reminders, danger signs, language switching, birth → PNC transition, and existing page navigation and route accessibility.

## Run Tests

Install Node.js and npm, then run these commands from the project root. The examples use macOS/Linux shell syntax.

Install dependencies and Playwright Chromium:

```bash
npm install
PW_BROWSER=playwright npx playwright install chromium
```

Run the full E2E suite:

```bash
PW_BROWSER=playwright npm run test:e2e
```

Expected result:

```text
18 passed
```

The recorded local Chromium run on 14 September 2026 completed with **18 passed in 22.2 seconds**. Run time varies between machines.

View the HTML report:

```bash
npm run test:e2e:report
```

Run interactively:

```bash
PW_BROWSER=playwright npm run test:e2e:ui
```

The configuration uses Vite at `http://127.0.0.1:5173` and selects Playwright-managed Chromium when `PW_BROWSER=playwright` is set. Without that setting, local runs default to installed Google Chrome. Outside CI, an existing server on that address is reused, so ensure it serves the checkout being tested.

## Coverage

Each row below corresponds to one `test(...)` case. A case can check several pages or actions. The `mvp-01` through `mvp-06` names identify test groups in the filenames.

| # | Group | What the test checks |
|---|---|---|
| 1 | Framework smoke | With cleared app storage, opening `/` redirects to onboarding and displays a heading. |
| 2 | Onboarding (MVP-01) | A user without completed onboarding is redirected from `/home` to onboarding. |
| 3 | Onboarding (MVP-01) | The sample onboarding flow reaches Home and displays the registered name; revisiting onboarding redirects to Home. |
| 4 | Reminders (MVP-02) | Clicking the Home Reminder card's “Learn more” button opens Reminders, with a title and at least one timeline item. |
| 5 | Danger signs (MVP-03) | The bottom navigation opens Danger signs and displays the “During pregnancy” topic button. |
| 6 | Language switching (MVP-04) | Profile switches English → Bengali; the translated Home greeting and Reminders remain usable; switching back restores English Profile text. |
| 7 | Birth → PNC (MVP-05) | Registering a birth in Profile → My pregnancy changes ANC mode to PNC mode, removes the birth registration form, and leaves Reminders accessible with a timeline item. |
| 8 | Page smoke (MVP-06) | Opening PNC displays its content container; clicking the first topic reveals its content body. |
| 9 | Page smoke (MVP-06) | Each of the 19 listed static URLs matches the requested route, avoids an onboarding redirect, and displays the application container. |
| 10 | Page smoke (MVP-06) | A pregnancy ID is read from localStorage, preferring an active record. Its History Summary URL is opened and the app container is visible without an onboarding redirect. The case skips if no ID is available. |
| 11 | Broader UI checks | Home cards open Reminders, ANC information for the sample ANC user, and Nutrition. The ANC content container is also checked. |
| 12 | Broader UI checks | After opening the Information hub directly, each of its five topic buttons navigates to ANC, PNC, Nutrition, Vaccination, or Danger signs. |
| 13 | Broader UI checks | Directly opening trimester URLs 1, 2, and 3 displays the ANC trimester container at each requested URL. |
| 14 | Broader UI checks | PNC displays its container and first topic card. Separately, Vaccination's “About tetanus” button opens the tetanus education page and displays its content container. |
| 15 | Broader UI checks | Directly opening Danger signs and Emergency displays their page containers; Emergency has at least one visible link with a `tel:` href. No call is placed. |
| 16 | Broader UI checks | Profile menu buttons navigate to Personal information, My pregnancy, My vaccinations, Emergency contacts, and Settings. |
| 17 | Broader UI checks | The first Reminders item is visible and clicked. If a guidance button is present, clicking it navigates to WeekInfo or tetanus education. |
| 18 | Broader UI checks | Opening Home after onboarding displays the registered user's greeting. |

The static-route case includes Home, WeekInfo, Emergency, Reminders, Information, ANC, ANC trimester 1, PNC, breastfeeding, Vaccination, tetanus education, Danger signs, Nutrition, Profile, and its five child pages. Onboarding and History Summary are checked separately.

### Coverage limits

- Direct URL checks do not prove that an in-app button exists. The suite does not test Home → Information hub, ANC → trimester buttons, PNC → breastfeeding, or Danger signs → Emergency as navigation paths.
- The static-route case checks URLs and the shared `ion-app` container. Breastfeeding currently receives that basic check; its article content is not asserted. The trimester case checks the container, not whether each trimester has the correct distinct content.
- History Summary can skip when no pregnancy ID is available. The Reminders guidance case can pass without a navigation check when no guidance button is found. A green summary should be read with these limits in mind.

Date calculations, native device behaviour, notifications, and visual regression are outside the scope of this E2E suite. This also excludes real phone dialling, exhaustive article-content validation, and the alternative `tabBar` navigation mode. Date-formula correctness belongs to the separate unit-test work.

## Test Structure

```text
e2e/
  smoke/
    framework-ready.spec.ts          # 1 test
  mvp/
    mvp-01-onboarding.spec.ts         # 2 tests
    mvp-02-reminders.spec.ts          # 1 test
    mvp-03-danger-signs.spec.ts       # 1 test
    mvp-04-language.spec.ts          # 1 test
    mvp-05-birth-pnc.spec.ts          # 1 test
    mvp-06-all-pages-smoke.spec.ts    # 3 tests
  complete/
    ui-full-coverage.spec.ts         # 8 tests
  support/
    storage.ts
    onboarding.ts
    language.ts
    visiblePage.ts
```

The groups total **1 + 2 + 1 + 1 + 1 + 1 + 3 + 8 = 18 tests**. The historical filename `ui-full-coverage.spec.ts` identifies the broader UI group; it does not imply exhaustive testing of every feature.

The helpers clear app storage, complete the shared onboarding flow, switch languages, and locate the visible Ionic page. Shared onboarding uses `Ayesha Rahman`, LMP `2026-03-01`, and no prior TT vaccination. The birth-registration case uses `2026-09-01`. These dates are fixed sample inputs, not assertions about correct date calculations.

## Integration Notes

This change adds the test files, helpers, Playwright configuration, and two documents: `e2e/README.md` and this handoff.

- `package.json` adds `@playwright/test` and the `test:e2e`, `test:e2e:ui`, and `test:e2e:report` scripts.
- `package-lock.json` records the Playwright dependency versions.
- `.gitignore` excludes generated `test-results/` and `playwright-report/` folders.
- Product source files under `src/` are unchanged.

Before handing off, run the suite against the intended checkout and include the observed result in the PR description. If a case fails, use the HTML report and available failure screenshots to inspect the expected and actual UI.
