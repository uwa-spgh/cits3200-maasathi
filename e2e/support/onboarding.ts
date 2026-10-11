import { expect, type Page } from '@playwright/test';
import { clearAppStorage } from './storage';
import { addDays, browserToday } from './dates';

export const MVP_SAMPLE = {
  name: 'Ayesha Rahman',
  /** LMP this many days before today: about 20 weeks pregnant, inside the app's LMP bounds on any run date. */
  lmpDaysAgo: 140
} as const;

/**
 * Fixed sample LMP for tests that also fix the browser clock and expect exact dates
 * (EDD 2026-12-06). Without a fixed clock it drifts outside the app's LMP limits.
 */
export const FIXED_SAMPLE_LMP = '2026-03-01';

/**
 * Completes the shortest onboarding path (EN → name → LMP known → TT never → Start).
 * Leaves the app on Home. Pass `lmp` (e.g. FIXED_SAMPLE_LMP with page.clock) for exact dates.
 */
export async function completeOnboardingMvp(page: Page, options: { lmp?: string } = {}): Promise<void> {
  await clearAppStorage(page);
  await page.goto('/');
  await expect(page).toHaveURL(/onboarding/i);

  await expect(page.getByRole('heading', { name: 'Welcome to MaaSathi' })).toBeVisible();
  await page.getByRole('button', { name: 'Next' }).click();

  await expect(page.getByRole('heading', { name: 'What is your name?' })).toBeVisible();
  await page.locator('ion-input input').first().fill(MVP_SAMPLE.name);
  await page.getByRole('button', { name: 'Next' }).click();

  await expect(
    page.getByRole('heading', { name: 'Do you know when your last period started?' })
  ).toBeVisible();
  await page.getByRole('button', { name: 'Yes' }).click();

  await expect(
    page.getByRole('heading', { name: 'When did your last period start?' })
  ).toBeVisible();
  const lmp = options.lmp ?? addDays(await browserToday(page), -MVP_SAMPLE.lmpDaysAgo);
  await page.locator('ion-input input[type="date"]').fill(lmp);
  await page.getByRole('button', { name: 'Next' }).click();

  await expect(
    page.getByRole('heading', { name: 'Have you received a tetanus (TT) vaccine before?' })
  ).toBeVisible();
  // exact: true — otherwise "No" also matches "I'm not sure" (substring "no")
  await page.getByRole('button', { name: 'No', exact: true }).click();

  await expect(page.getByRole('heading', { name: 'You are all set' })).toBeVisible();
  await page.getByRole('button', { name: 'Start using MaaSathi' }).click();

  await expect(page).toHaveURL(/\/home/i);
  await expect(page.getByRole('heading', { name: `Hello, ${MVP_SAMPLE.name}` })).toBeVisible();
}
