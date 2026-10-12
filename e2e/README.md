# MaaSathi browser E2E tests

Playwright runs the Ionic Vue app in Chromium or Chrome and checks onboarding,
navigation, locally stored data, and visible care information.

## Run locally

```bash
npm ci
PW_BROWSER=playwright npx playwright install chromium
PW_PORT=5188 PW_BROWSER=playwright npm run test:e2e
```

`PW_PORT` selects a dedicated localhost port. The test runner starts the Vite
server itself and refuses to reuse another checkout's server. Leave `PW_PORT`
unset to use 5173. Set `PW_BROWSER=playwright` for the managed Chromium
installation; otherwise local runs use system Chrome, which fails at browser
launch on machines without Chrome at its default install path.

To run one group, append its path:

```bash
PW_PORT=5188 PW_BROWSER=playwright npm run test:e2e -- e2e/manual
```

Type-check the test code (no browser needed) with `npm run typecheck:e2e`.

The HTML report is available through `npm run test:e2e:report`. Playwright
keeps failure screenshots in the ignored `test-results/` directory.

## Coverage

| Group | Behaviour checked |
| --- | --- |
| `smoke/` and `mvp/` | First run guard, onboarding, reminders, danger signs, language switching, birth to PNC, and route smoke. |
| `complete/ui-full-coverage.spec.ts` | Home cards, information routes, profile menu, and reminder guidance. |
| `complete/profile-interactions.spec.ts` | Profile, Birth Plan, appearance, and pregnancy detail persistence. |
| `complete/onboarding-lifecycle.spec.ts` | Estimated dates, unknown TT history, EDD entry, pregnancy closure, and archived history. |
| `complete/pregnancy-dates.spec.ts` | EDD typing fills LMP and saves EDD as the source, birth registration stores one child, and registration before 16 weeks gives ANC visit 1 the local date and a visible Due today badge (Asia/Dhaka). |
| `complete/late-registration-reminders.spec.ts` | LMP and EDD onboarding at 12, 16, 24, 26, 28, 32, 36 and 38 elapsed weeks; visible pregnancy dates, all ANC titles and due/overdue badges, chronological order, three-item limit, complete list, preparation guidance and reload persistence. |
| `complete/storage-resilience.spec.ts` | A stored table that is not an array does not crash the app, and the original value is kept in a `.corrupt` backup. |
| `complete/birth-pnc-interactions.spec.ts` | Give Birth registration, PNC contact dates, child EPI milestone, and complete/undo. |
| `manual/manual-a-b-network-language.spec.ts` | Manual A: already loaded app under Slow 4G, 3G, and Offline; Manual B: implemented English/Bengali switching and persistence. |
| `manual/manual-c-information-navigation.spec.ts` | Manual C: observable navigation to maternal care and specific medical guidance. |
| `manual/manual-d-pregnancy-schedule.spec.ts` | Manual D: fixed-date LMP/EDD and TT reminder calculations, plus completed/undo persistence. |

The date tests fix the browser clock and timezone, then check both the rendered
timeline and the browser's persisted records. Tests without a fixed clock enter
dates relative to the browser's today (`e2e/support/dates.ts`), so they stay
inside the app's LMP/EDD limits whenever they run. The route smoke checks the current
named routes; the content tests check actual guidance text.

### Registration timing and reminders

Visit 1 uses the earlier of the local registration date and LMP + 16 weeks.
Visits 2, 3 and 4 keep their LMP + 26, 32 and 36-week dates. The exact due day
shows `Due today`; a prior date shows `overdue`. Late registration keeps all
four ANC visits incomplete, including visits whose dates have already passed.

The registration-timing tests use fixed dates independent of the app's date
functions. They repeat each timing scenario through both LMP and EDD onboarding
and assert the rendered UI without reading `schedule_item` or seeding reminder
rows. Manual D retains separate persisted-record assertions. The fixtures cover
Visit 2 before/on/after its due date, Visit 3 and 4 on their due dates, and a
38-week registration where all four visits are overdue.

The default list intentionally shows three incomplete reminders. `See all
upcoming (6)` must reveal all four ANC visits, TT dose 1 and the birth milestone;
the count includes overdue items. In particular, the fourth overdue ANC visit
must remain accessible at 38 weeks. Refresh resets list expansion but preserves
the reminders' dates, badges and order, and does not mark missed visits completed.

## Manual checks still required

- The supplied manual asks for English and Nepali, while this app currently
  offers English and Bengali. A fluent reviewer must judge translation meaning
  and missing or awkward text.
- Manual C's icon comprehension and survey responses require participants.
  Browser navigation does not measure human understanding.
- Manual A's Offline test starts with the app already loaded. A cold offline
  launch and an in-app connection error require offline installation support;
  the current web app has no service worker or offline fallback.
- Browser tests inspect reminder records and dates. Android/iOS notification
  delivery, permission prompts, sound, and timing require device testing.
