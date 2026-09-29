import { test, expect } from '@playwright/test';
import { completeOnboardingMvp } from '../support/onboarding';

/**
 * MVP-02 — Reminders timeline shows at least one item
 * Source: docs/e2e-p0-acceptance-journeys.md
 *
 * Entry: Home yellow Reminder card → Learn more (BottomNav has no Reminders tab).
 */
test.describe('MVP-02 reminders', () => {
  test('timeline lists at least one schedule item after onboarding', async ({ page }) => {
    await completeOnboardingMvp(page);

    const reminderCard = page.locator('.home-card').filter({ hasText: 'Reminder' }).first();
    await expect(reminderCard).toBeVisible();
    await reminderCard.getByRole('button', { name: 'Learn more' }).click();

    await expect(page).toHaveURL(/reminders/i);
    await expect(page.getByText('Reminders', { exact: true }).first()).toBeVisible();

    const items = page.locator('.timeline-item');
    await expect(items.first()).toBeVisible();
    expect(await items.count()).toBeGreaterThan(0);
  });
});
