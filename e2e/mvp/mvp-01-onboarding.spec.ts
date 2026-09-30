import { test, expect } from '@playwright/test';
import { clearAppStorage } from '../support/storage';
import { completeOnboardingMvp, MVP_SAMPLE } from '../support/onboarding';

/**
 * MVP-01 — First-run onboarding completes and lands on Home
 * Source: docs/e2e-p0-acceptance-journeys.md
 */
test.describe('MVP-01 onboarding', () => {
  test('incomplete user cannot open Home', async ({ page }) => {
    await clearAppStorage(page);
    await page.goto('/home');
    await expect(page).toHaveURL(/onboarding/i);
  });

  test('happy path reaches Home and blocks onboarding revisit', async ({ page }) => {
    await completeOnboardingMvp(page);

    await expect(page.getByText('MaaSathi app')).toBeVisible();
    await expect(page.getByRole('heading', { name: `Hello, ${MVP_SAMPLE.name}` })).toBeVisible();

    await page.goto('/onboarding');
    await expect(page).toHaveURL(/\/home/i);
  });
});
