import { test, expect } from '@playwright/test';
import { clearAppStorage } from '../support/storage';

/**
 * Framework health check only — not an MVP journey.
 * Confirms Playwright + Vite + onboarding gate wire up.
 */
test.describe('E2E framework', () => {
  test('fresh profile is sent to onboarding', async ({ page }) => {
    await clearAppStorage(page);
    await page.goto('/');
    await expect(page).toHaveURL(/onboarding/i);
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
  });
});
