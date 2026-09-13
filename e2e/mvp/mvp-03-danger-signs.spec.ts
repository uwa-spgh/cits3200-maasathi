import { test, expect } from '@playwright/test';
import { completeOnboardingMvp } from '../support/onboarding';

/**
 * MVP-03 — Danger signs reachable from BottomNav
 * Source: docs/e2e-p0-acceptance-journeys.md
 *
 * BottomNav right item → DangerSigns (not /emergency).
 */
test.describe('MVP-03 danger signs', () => {
  test('BottomNav opens danger-sign content', async ({ page }) => {
    await completeOnboardingMvp(page);

    await page.getByRole('button', { name: 'Danger signs' }).click();

    await expect(page).toHaveURL(/danger-signs/i);
    await expect(page.locator('.danger-signs-page')).toBeVisible();
    await expect(page.getByRole('button', { name: 'During pregnancy' })).toBeVisible();
  });
});
