import { test, expect } from '@playwright/test';
import { completeOnboardingMvp, MVP_SAMPLE } from '../support/onboarding';
import { selectAppLanguage } from '../support/language';

/** Ionic keeps prior pages in the stack — prefer the visible page chrome. */
function visiblePage(page: import('@playwright/test').Page) {
  return page.locator('ion-router-outlet > .ion-page:not(.ion-page-hidden)').last();
}

/**
 * MVP-04 — Language switch EN ↔ BN via Profile
 * Source: docs/e2e-p0-acceptance-journeys.md
 */
test.describe('MVP-04 language switch', () => {
  test('EN → BN → Reminders still works → back to EN', async ({ page }) => {
    await completeOnboardingMvp(page);

    await page.getByRole('button', { name: 'Profile' }).last().click();
    await expect(page).toHaveURL(/profile/i);
    await expect(visiblePage(page).getByText('Profile & Settings')).toBeVisible();

    await selectAppLanguage(page, 'bn');
    await expect(visiblePage(page).getByText('প্রোফাইল ও সেটিংস')).toBeVisible();

    await visiblePage(page).getByRole('button', { name: 'হোম' }).click();
    await expect(
      visiblePage(page).getByRole('heading', { name: `হ্যালো, ${MVP_SAMPLE.name}` })
    ).toBeVisible();

    const reminderCard = visiblePage(page).locator('.home-card').filter({ hasText: 'রিমাইন্ডার' }).first();
    await reminderCard.getByRole('button', { name: 'আরও জানুন' }).click();
    await expect(page).toHaveURL(/reminders/i);
    await expect(visiblePage(page).getByText('স্মারক', { exact: true }).first()).toBeVisible();
    await expect(visiblePage(page).locator('.timeline-item').first()).toBeVisible();

    await visiblePage(page).getByRole('button', { name: 'প্রোফাইল' }).click();
    await selectAppLanguage(page, 'en');
    await expect(visiblePage(page).getByText('Profile & Settings')).toBeVisible();
  });
});
