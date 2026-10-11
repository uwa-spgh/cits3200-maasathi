import { expect, test, type Page } from '@playwright/test';
import { completeOnboardingMvp } from '../support/onboarding';
import { visiblePage } from '../support/visiblePage';

test.use({ timezoneId: 'Australia/Perth' });
const TODAY = new Date('2026-12-06T04:00:00Z'); // noon in Perth

type ScheduleRow = {
  type: string;
  ref: string;
  due_date: string;
  status: string;
};

async function scheduleRows(page: Page): Promise<ScheduleRow[]> {
  return page.evaluate(() => JSON.parse(
    localStorage.getItem('maasathi_db_v2_schedule_item') ?? '[]'
  ) as ScheduleRow[]);
}

test('Give Birth leads to registration, PNC dates, and completed contact can be undone', async ({ page }) => {
  await page.clock.setFixedTime(TODAY);
  await completeOnboardingMvp(page);

  await page.goto('/reminders');
  await visiblePage(page).getByRole('button', { name: /See all upcoming/ }).click();
  const birthReminder = visiblePage(page).locator('.timeline-item').filter({ hasText: 'Give Birth' });
  await expect(birthReminder).toContainText('6 Dec 2026');
  await birthReminder.locator('.item-card').click();
  await birthReminder.getByRole('button', { name: 'Mark completed' }).click();
  await expect(page).toHaveURL(/\/profile\/pregnancy\?section=birth$/);

  const pregnancy = visiblePage(page);
  const birthForm = pregnancy.locator('section.form-card').filter({ hasText: 'Birth registration' });
  await birthForm.locator('ion-input input[type="date"]').fill('2026-12-06');
  await birthForm.getByRole('button', { name: 'Register birth' }).click();
  await expect(visiblePage(page).locator('.mode-chip')).toContainText('PNC mode');

  const schedule = await scheduleRows(page);
  const due = (ref: string) => schedule.find((row) => row.ref === ref)?.due_date;
  expect(due('contact1')).toBe('2026-12-06');
  expect(due('contact2')).toBe('2026-12-08');
  expect(due('contact3')).toBe('2026-12-16');
  expect(due('contact4')).toBe('2027-01-17');
  expect(due('child_epi_start')).toBe('2027-01-17');
  expect(schedule.filter((row) => row.type === 'PNC')).toHaveLength(4);

  await page.goto('/reminders');
  let contact = visiblePage(page).locator('.timeline-item').filter({ hasText: 'PNC Contact 1' });
  await expect(contact).toContainText('6 Dec 2026');
  await contact.locator('.item-card').click();
  await contact.getByRole('button', { name: 'Mark completed' }).click();
  expect((await scheduleRows(page)).find((row) => row.ref === 'contact1')?.status).toBe('completed');

  await page.reload();
  await visiblePage(page).getByRole('button', { name: /Past visits \(1\)/ }).click();
  contact = visiblePage(page).locator('.timeline-item').filter({ hasText: 'PNC Contact 1' });
  await contact.locator('.item-card').click();
  await contact.getByRole('button', { name: 'Move back to upcoming' }).click();
  expect((await scheduleRows(page)).find((row) => row.ref === 'contact1')?.status).toBe('upcoming');
});
