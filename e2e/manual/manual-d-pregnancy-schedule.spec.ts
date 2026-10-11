import { expect, test, type Page } from '@playwright/test';
import { completeOnboardingMvp, FIXED_SAMPLE_LMP } from '../support/onboarding';
import { clearAppStorage } from '../support/storage';
import { visiblePage } from '../support/visiblePage';

// Manual Test D supplies no example dates. Fix the browser clock so each
// expected date and gestational week has one unambiguous answer.
test.use({ timezoneId: 'Australia/Perth' });
const TODAY = new Date('2026-10-10T04:00:00Z'); // 12:00 in Perth

type StoredRow = Record<string, unknown>;

async function rows(page: Page, table: string): Promise<StoredRow[]> {
  return page.evaluate((name) => {
    const raw = localStorage.getItem(`maasathi_db_v2_${name}`);
    return raw ? JSON.parse(raw) as StoredRow[] : [];
  }, table);
}

test.describe('Manual Test D — pregnancy dates and reminders', () => {
  test.beforeEach(async ({ page }) => {
    await page.clock.setFixedTime(TODAY);
  });

  test('LMP determines recorded week, due date, and ANC visit dates', async ({ page }) => {
    await completeOnboardingMvp(page, { lmp: FIXED_SAMPLE_LMP });

    const [pregnancy] = await rows(page, 'pregnancy');
    expect(pregnancy).toMatchObject({
      lmp: FIXED_SAMPLE_LMP,
      edd: '2026-12-06',
      pregnancy_weeks_at_registration: 32
    });

    const schedule = await rows(page, 'schedule_item');
    const due = (type: string, ref: string) =>
      schedule.find((item) => item.type === type && item.ref === ref)?.due_date;
    expect(due('ANC', 'visit1')).toBe('2026-10-10');
    expect(due('ANC', 'visit2')).toBe('2026-08-30');
    expect(due('ANC', 'visit3')).toBe('2026-10-11');
    expect(due('ANC', 'visit4')).toBe('2026-11-08');
    expect(due('MILESTONE', 'edd')).toBe('2026-12-06');

    await page.goto('/reminders');
    const reminders = visiblePage(page);
    await expect(reminders.locator('.timeline-item').filter({ hasText: 'ANC Visit 2' }))
      .toContainText('30 Aug 2026');
    await reminders.getByRole('button', { name: /See all upcoming/ }).click();
    await expect(reminders.locator('.timeline-item').filter({ hasText: 'ANC Visit 4' }))
      .toContainText('8 Nov 2026');
  });

  test('EDD entry and a known TT dose produce the correct next-dose reminder', async ({ page }) => {
    await clearAppStorage(page);
    await page.goto('/');
    await page.getByRole('button', { name: 'Next' }).click();
    await page.locator('ion-input input').first().fill('Ayesha Rahman');
    await page.getByRole('button', { name: 'Next' }).click();
    await page.getByRole('button', { name: 'No', exact: true }).click();
    await expect(page.getByRole('heading', { name: 'Do you know your expected delivery date?' }))
      .toBeVisible();
    await page.getByRole('button', { name: 'Yes', exact: true }).click();
    await page.locator('ion-input input[type="date"]').fill('2026-12-06');
    await page.getByRole('button', { name: 'Next' }).click();
    await page.getByRole('button', { name: 'Yes', exact: true }).click();
    await page.getByRole('button', { name: 'Yes', exact: true }).click();
    await page.locator('.count-chips button').filter({ hasText: /^1$/ }).click();
    await page.locator('ion-input input[type="date"]').fill('2026-09-12');
    await page.getByRole('button', { name: 'Next' }).click();
    await page.getByRole('button', { name: 'Start using MaaSathi' }).click();
    await expect(page).toHaveURL(/\/home$/);

    const [pregnancy] = await rows(page, 'pregnancy');
    expect(pregnancy).toMatchObject({
      lmp: '2026-03-01',
      edd: '2026-12-06',
      pregnancy_weeks_at_registration: 32
    });
    const schedule = await rows(page, 'schedule_item');
    const tt2 = schedule.find((item) => item.type === 'TT' && item.ref === 'dose2');
    expect(tt2?.due_date).toBe('2026-10-10');

    await page.goto('/reminders');
    await expect(visiblePage(page).locator('.timeline-item').filter({ hasText: 'dose 2 of 5' }))
      .toContainText('Due today');
  });

  test('completed ANC reminder remains completed after reload and can be undone', async ({ page }) => {
    await completeOnboardingMvp(page, { lmp: FIXED_SAMPLE_LMP });
    await page.goto('/reminders');
    let visit = visiblePage(page).locator('.timeline-item').filter({ hasText: 'ANC Visit 2' });
    await visit.locator('.item-card').click();
    await visit.getByRole('button', { name: 'Mark completed' }).click();
    await expect(visiblePage(page).getByRole('button', { name: /Past visits \(1\)/ })).toBeVisible();
    expect((await rows(page, 'schedule_item'))
      .find((item) => item.type === 'ANC' && item.ref === 'visit2')?.status).toBe('completed');

    await page.reload();
    await visiblePage(page).getByRole('button', { name: /Past visits \(1\)/ }).click();
    visit = visiblePage(page).locator('.timeline-item').filter({ hasText: 'ANC Visit 2' });
    await visit.locator('.item-card').click();
    await visit.getByRole('button', { name: 'Move back to upcoming' }).click();
    await expect(visiblePage(page).getByRole('button', { name: /Past visits/ })).toHaveCount(0);
    expect((await rows(page, 'schedule_item'))
      .find((item) => item.type === 'ANC' && item.ref === 'visit2')?.status).toBe('upcoming');
  });
});
