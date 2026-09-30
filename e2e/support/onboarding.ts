import { expect, type Page } from '@playwright/test';
import { clearAppStorage } from './storage';

/** Sample data from docs/e2e-p0-acceptance-journeys.md */
export const MVP_SAMPLE = {
  name: 'Ayesha Rahman',
  lmp: '2026-03-01'
} as const;

/**
 * Completes the shortest onboarding path (EN → name → LMP known → TT never → Start).
 * Leaves the app on Home.
 */
export async function completeOnboardingMvp(page: Page): Promise<void> {
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
  await page.locator('ion-input input[type="date"]').fill(MVP_SAMPLE.lmp);
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
