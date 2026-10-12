import { expect, test, type Locator, type Page } from '@playwright/test';
import { clearAppStorage } from '../support/storage';
import { visiblePage } from '../support/visiblePage';

test.use({ timezoneId: 'Asia/Dhaka' });
const TODAY = '2026-10-12';
const CLOCK = new Date('2026-10-12T06:00:00Z'); // Noon in Bangladesh.
type DateEntry = 'LMP' | 'EDD';

interface RegistrationCase {
  label: string;
  lmp: string;
  edd: string;
  visitDates: readonly [string, string, string, string];
}

// Fixed examples are independent of the app's scheduling functions. Visit 1
// uses registration day through LMP + 16 weeks, then keeps that historical date.
// Visits 2/3/4 retain their 26/32/36-week dates; missed visits remain incomplete.
// At an exact due date the label is Due today, rather than overdue.
const CASES: RegistrationCase[] = [
  { label: '12 weeks: early registration', lmp: '2026-07-20', edd: '2027-04-26',
    visitDates: [TODAY, '2027-01-18', '2027-03-01', '2027-03-29'] },
  { label: '16 weeks: Visit 1 boundary', lmp: '2026-06-22', edd: '2027-03-29',
    visitDates: [TODAY, '2026-12-21', '2027-02-01', '2027-03-01'] },
  { label: '24 weeks: Visit 2 still upcoming', lmp: '2026-04-27', edd: '2027-02-01',
    visitDates: ['2026-08-17', '2026-10-26', '2026-12-07', '2027-01-04'] },
  { label: '26 weeks: Visit 2 due today', lmp: '2026-04-13', edd: '2027-01-18',
    visitDates: ['2026-08-03', TODAY, '2026-11-23', '2026-12-21'] },
  { label: '28 weeks: Visit 2 overdue', lmp: '2026-03-30', edd: '2027-01-04',
    visitDates: ['2026-07-20', '2026-09-28', '2026-11-09', '2026-12-07'] },
  { label: '32 weeks: Visit 3 due today', lmp: '2026-03-02', edd: '2026-12-07',
    visitDates: ['2026-06-22', '2026-08-31', TODAY, '2026-11-09'] },
  { label: '36 weeks: Visit 4 due today', lmp: '2026-02-02', edd: '2026-11-09',
    visitDates: ['2026-05-25', '2026-08-03', '2026-09-14', TODAY] },
  { label: '38 weeks: all four visits overdue', lmp: '2026-01-19', edd: '2026-10-26',
    visitDates: ['2026-05-11', '2026-07-20', '2026-08-31', '2026-09-28'] }
];

const VISITS = [
  { title: 'ANC Visit 1 (before 16 weeks)', preparation: 'Note the date of your last period' },
  { title: 'ANC Visit 2 (24–28 weeks)', preparation: 'headaches, blurred vision, or swelling' },
  { title: 'ANC Visit 3 (32 weeks)', preparation: 'birth plan, emergency transport, and family support' },
  { title: 'ANC Visit 4 (36 weeks)', preparation: 'pack clean baby clothes' }
];

interface ExpectedReminder {
  title: string;
  date: string;
}

function displayedDate(iso: string): string {
  return new Intl.DateTimeFormat('en-GB', {
    day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC'
  }).format(new Date(`${iso}T12:00:00Z`));
}

function dueBadge(iso: string): string {
  const days = (Date.parse(`${iso}T00:00:00Z`) - Date.parse(`${TODAY}T00:00:00Z`)) / 86_400_000;
  if (days < 0) return `${-days} ${days === -1 ? 'day' : 'days'} overdue`;
  if (days === 0) return 'Due today';
  if (days === 1) return 'Due tomorrow';
  return `In ${days} days`;
}

function expectedTimeline(scenario: RegistrationCase): ExpectedReminder[] {
  // No previous TT doses: dose 1 is due on registration day, and birth keeps
  // its EDD. Equal-date items may appear in either order; neither may disappear.
  return [
    ...VISITS.map((visit, index) => ({ title: visit.title, date: scenario.visitDates[index] })),
    { title: 'Give Birth', date: scenario.edd },
    { title: 'Tetanus (TT) vaccination — dose 1 of 5', date: TODAY }
  ].sort((a, b) => a.date.localeCompare(b.date));
}

async function registerThroughUi(page: Page, entry: DateEntry, scenario: RegistrationCase): Promise<void> {
  await clearAppStorage(page);
  await expect(page.getByRole('heading', { name: 'Welcome to MaaSathi' })).toBeVisible();
  await page.getByRole('button', { name: 'Next', exact: true }).click();
  await page.locator('ion-input input').fill('Ayesha Rahman');
  await page.getByRole('button', { name: 'Next', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Do you know when your last period started?' })).toBeVisible();
  await page.getByRole('button', { name: entry === 'LMP' ? 'Yes' : 'No', exact: true }).click();
  if (entry === 'EDD') {
    await expect(page.getByRole('heading', { name: 'Do you know your expected delivery date?' })).toBeVisible();
    await page.getByRole('button', { name: 'Yes', exact: true }).click();
  }
  await expect(page.getByRole('heading', {
    name: entry === 'LMP' ? 'When did your last period start?' : 'When is your expected delivery date?'
  })).toBeVisible();
  await page.locator('ion-input input[type="date"]').fill(entry === 'LMP' ? scenario.lmp : scenario.edd);
  await page.getByRole('button', { name: 'Next', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Have you received a tetanus (TT) vaccine before?' })).toBeVisible();
  await page.getByRole('button', { name: 'No', exact: true }).click();
  await page.getByRole('button', { name: 'Start using MaaSathi', exact: true }).click();
  await expect(page).toHaveURL(/\/home$/);

  // Confirm EDD entry derives the same LMP through visible profile fields.
  await visiblePage(page).getByRole('button', { name: 'Profile', exact: true }).click();
  await visiblePage(page).getByRole('button', { name: /^My pregnancy\b/ }).click();
  const dates = visiblePage(page).locator('ion-input input[type="date"]');
  await expect(dates.nth(0)).toHaveValue(scenario.lmp);
  await expect(dates.nth(1)).toHaveValue(scenario.edd);

  // A direct Reminders URL has no Home-card focus query: it tests the default
  // three-item limit, rather than the intentional automatic reveal of a focus.
  await page.goto('/reminders');
  await expect(visiblePage(page).locator('.section-header')).toContainText('Reminders');
}

async function expectFullTimeline(page: Page, expected: ExpectedReminder[]): Promise<void> {
  const reminders = visiblePage(page).locator('.timeline-item');
  await expect(reminders).toHaveCount(expected.length);
  await expect(visiblePage(page).getByRole('button', { name: /Past visits/ })).toHaveCount(0);
  for (const item of expected) {
    const card = reminders.filter({ has: page.locator('.item-title', { hasText: item.title }) });
    await expect(card).toHaveCount(1);
    await expect(card.locator('.item-title')).toHaveText(item.title);
    await expect(card.locator('.date-chip')).toHaveText(displayedDate(item.date));
    await expect(card.locator('.due-badge')).toHaveText(dueBadge(item.date));
  }
  const renderedDates = await reminders.locator('.date-chip').allTextContents();
  expect(renderedDates).toEqual(expected.map((item) => displayedDate(item.date)));
  // ANC numbering and titles stay intact even when dates are in the past.
  await expect(visiblePage(page).locator('.type-anc .item-title')).toHaveText(VISITS.map((visit) => visit.title));
}

async function expectPreparation(card: Locator, snippet: string): Promise<void> {
  await card.locator('.item-card').click();
  await expect(card.locator('.prep-box')).toContainText(snippet);
  await expect(card.getByRole('button', { name: 'View visit guidance & information', exact: true })).toBeVisible();
  await expect(card.getByRole('button', { name: 'Mark completed', exact: true })).toBeVisible();
}

test.describe('Registration timing — rendered ANC reminders', () => {
  test.beforeEach(async ({ page }) => {
    await page.clock.setFixedTime(CLOCK);
  });

  for (const scenario of CASES) {
    for (const entry of ['LMP', 'EDD'] as const) {
      test(`${scenario.label} using ${entry}: dates, badges, order and reload`, async ({ page }) => {
        await registerThroughUi(page, entry, scenario);
        const expected = expectedTimeline(scenario);
        const reminders = visiblePage(page);

        await expect(reminders.locator('.timeline-item')).toHaveCount(3);
        await expect(reminders.locator('.date-chip')).toHaveText(
          expected.slice(0, 3).map((item) => displayedDate(item.date))
        );
        if (scenario.visitDates[0] < TODAY) {
          await expect(reminders.locator('.item-title').first()).toHaveText(VISITS[0].title);
        }
        await reminders.getByRole('button', { name: 'See all upcoming (6)', exact: true }).click();
        await expectFullTimeline(page, expected);

        // This includes Visit 4, which is overdue at 38 weeks but initially
        // behind the three-row limit. It must be available when the list opens.
        for (const visit of VISITS) {
          const card = reminders.locator('.timeline-item').filter({ hasText: visit.title });
          await expectPreparation(card, visit.preparation);
        }

        await reminders.getByRole('button', { name: 'Show fewer', exact: true }).click();
        await expect(reminders.locator('.timeline-item')).toHaveCount(3);
        await reminders.getByRole('button', { name: 'See all upcoming (6)', exact: true }).click();
        await expectFullTimeline(page, expected);

        // Reload resets the view's expansion. Dates, statuses and accessible
        // visits must survive, without inventing completed visits at onboarding.
        await page.reload();
        await expect(visiblePage(page).locator('.timeline-item')).toHaveCount(3);
        await visiblePage(page).getByRole('button', { name: 'See all upcoming (6)', exact: true }).click();
        await expectFullTimeline(page, expected);
        await expectPreparation(
          visiblePage(page).locator('.timeline-item').filter({ hasText: VISITS[3].title }),
          VISITS[3].preparation
        );
      });
    }
  }
});
