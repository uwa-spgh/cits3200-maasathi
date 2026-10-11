import { test, expect } from '@playwright/test';
import { completeOnboardingMvp } from '../support/onboarding';

/**
 * A table payload that parses as JSON but is not an array (e.g. `{}`) must not
 * blank the app. The table is quarantined to `<key>.corrupt` and starts empty.
 */
test.describe('storage resilience', () => {
  test('non-array table payload is quarantined and the app still renders', async ({ page }) => {
    await completeOnboardingMvp(page);

    await page.evaluate(() => {
      localStorage.setItem('maasathi_db_v2_pregnancy', '{}');
    });
    await page.reload();

    await expect(page).toHaveURL(/\/home/i);
    await expect(page.getByText(/No active pregnancy/i)).toBeVisible();

    const backup = await page.evaluate(() => localStorage.getItem('maasathi_db_v2_pregnancy.corrupt'));
    expect(backup).toBe('{}');
  });
});
