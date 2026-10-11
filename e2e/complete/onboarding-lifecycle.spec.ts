import { expect, test, type Page } from '@playwright/test';
import { clearAppStorage } from '../support/storage';
import { visiblePage } from '../support/visiblePage';

test.use({ timezoneId: 'UTC' });

const TODAY = new Date('2026-10-10T12:00:00.000Z');

async function answerName(page: Page): Promise<void> {
  await expect(page).toHaveURL(/\/onboarding$/);
  await page.getByRole('button', { name: 'Next' }).click();
  await expect(page.getByRole('heading', { name: 'What is your name?' })).toBeVisible();
  await page.locator('ion-input input').fill('Ayesha Rahman');
  await page.getByRole('button', { name: 'Next' }).click();
  await expect(page.getByRole('heading', { name: 'Do you know when your last period started?' })).toBeVisible();
}

async function finishOnboarding(page: Page, ttAnswer: 'No' | "I'm not sure"): Promise<void> {
  await expect(page.getByRole('heading', { name: 'Have you received a tetanus (TT) vaccine before?' })).toBeVisible();
  await page.getByRole('button', { name: ttAnswer, exact: true }).click();
  await expect(page.getByRole('heading', { name: 'You are all set' })).toBeVisible();
  await page.getByRole('button', { name: 'Start using MaaSathi' }).click();
  await expect(page).toHaveURL(/\/home$/);
  await expect(visiblePage(page).getByRole('heading', { name: 'Hello, Ayesha Rahman' })).toBeVisible();
}

test.describe('Onboarding dates and pregnancy lifecycle', () => {
  test.beforeEach(async ({ page }) => {
    // Fix Date without pausing Ionic's UI timers. All date math runs in UTC.
    await page.clock.setFixedTime(TODAY);
    await clearAppStorage(page);
    await answerName(page);
  });

  test('month estimate calculates dates and keeps unknown TT history', async ({ page }) => {
    await page.getByRole('button', { name: 'No', exact: true }).click();
    await expect(page.getByRole('heading', { name: 'Do you know your expected delivery date?' })).toBeVisible();
    await page.getByRole('button', { name: 'No', exact: true }).click();
    await expect(page.getByRole('heading', { name: 'About how many months pregnant are you?' })).toBeVisible();
    await page.getByRole('button', { name: '5', exact: true }).click();
    await page.getByRole('button', { name: 'Next' }).click();
    await finishOnboarding(page, "I'm not sure");

    // Five estimated months means 150 days before the fixed 10 Oct 2026 date.
    await page.goto('/profile/pregnancy');
    await expect(visiblePage(page).locator('ion-input input[type="date"]').first()).toHaveValue('2026-05-13');
    await expect(visiblePage(page).locator('ion-input input[type="date"]').nth(1)).toHaveValue('2027-02-17');

    await page.goto('/profile/vaccination');
    await expect(visiblePage(page).getByText('Your history will be recorded as unknown. Do not worry — confirm with your health worker at your next ANC visit.')).toBeVisible();
    await page.reload();
    await expect(visiblePage(page).getByText('Your history will be recorded as unknown. Do not worry — confirm with your health worker at your next ANC visit.')).toBeVisible();
  });

  test('known EDD derives LMP, and closing the pregnancy creates a readable archive', async ({ page }) => {
    await page.getByRole('button', { name: 'No', exact: true }).click();
    await expect(page.getByRole('heading', { name: 'Do you know your expected delivery date?' })).toBeVisible();
    await page.getByRole('button', { name: 'Yes', exact: true }).click();
    await expect(page.getByRole('heading', { name: 'When is your expected delivery date?' })).toBeVisible();
    await page.locator('ion-input input[type="date"]').fill('2027-04-01');
    await page.getByRole('button', { name: 'Next' }).click();
    await finishOnboarding(page, 'No');

    await page.goto('/profile/pregnancy');
    await expect(visiblePage(page).locator('ion-input input[type="date"]').first()).toHaveValue('2026-06-25');
    await expect(visiblePage(page).locator('ion-input input[type="date"]').nth(1)).toHaveValue('2027-04-01');

    await visiblePage(page).getByRole('button', { name: 'Close current pregnancy early' }).click();
    const confirm = page.locator('ion-alert');
    await expect(confirm).toBeVisible();
    await confirm.getByRole('button', { name: 'Confirm' }).click();
    await expect(visiblePage(page).getByRole('button', { name: 'Close current pregnancy early' })).toHaveCount(0);

    await page.goto('/profile');
    await expect(visiblePage(page).getByRole('heading', { name: 'Past pregnancies' })).toBeVisible();
    await visiblePage(page).locator('.history-row').filter({ hasText: '1 Apr 2027' }).click();
    await expect(page).toHaveURL(/\/profile\/history\/[^/]+$/);
    await expect(visiblePage(page).getByRole('heading', { name: 'Pregnancy details' })).toBeVisible();
    await expect(visiblePage(page).locator('.history-summary')).toContainText('25 Jun 2026');
    await expect(visiblePage(page).locator('.history-summary')).toContainText('1 Apr 2027');
    await expect(visiblePage(page).locator('.history-summary')).toContainText('10 Oct 2026');
  });
});
