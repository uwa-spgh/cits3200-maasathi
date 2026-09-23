import { test, expect, type Page } from '@playwright/test';
import { completeOnboardingMvp } from '../support/onboarding';

/** Ionic keeps prior pages in the stack — prefer the visible page chrome. */
function visiblePage(page: Page) {
  return page.locator('ion-router-outlet > .ion-page:not(.ion-page-hidden)').last();
}

/**
 * MVP-05 — Birth registration switches ANC → PNC
 * Source: docs/e2e-p0-acceptance-journeys.md
 *
 * Does not assert PNC contact day offsets (owned by date unit tests).
 */
test.describe('MVP-05 birth to PNC', () => {
  test('register birth switches to PNC and Reminders still load', async ({ page }) => {
    await completeOnboardingMvp(page);

    await page.getByRole('button', { name: 'Profile' }).last().click();
    await expect(page).toHaveURL(/profile/i);

    await visiblePage(page).getByRole('button', { name: 'My pregnancy' }).click();
    await expect(page).toHaveURL(/profile\/pregnancy/i);

    const root = visiblePage(page);
    await expect(root.locator('.mode-chip')).toContainText('ANC mode');

    const birthSection = root.locator('section.form-card').filter({ hasText: 'Birth registration' });
    await expect(birthSection).toBeVisible();
    await birthSection.locator('ion-input input[type="date"]').first().fill('2026-09-01');
    await birthSection.getByRole('button', { name: 'Register birth' }).click();

    await expect(visiblePage(page).locator('.mode-chip')).toContainText('PNC mode');
    await expect(
      visiblePage(page).locator('section.form-card').filter({ hasText: 'Birth registration' })
    ).toHaveCount(0);

    await visiblePage(page).getByRole('button', { name: 'Home' }).click();
    const reminderCard = visiblePage(page).locator('.home-card').filter({ hasText: 'Reminder' }).first();
    await reminderCard.getByRole('button', { name: 'Learn more' }).click();

    await expect(page).toHaveURL(/reminders/i);
    await expect(visiblePage(page).locator('.timeline-item').first()).toBeVisible();
  });
});
