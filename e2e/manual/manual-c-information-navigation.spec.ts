import { expect, test } from '@playwright/test';
import { completeOnboardingMvp } from '../support/onboarding';
import { visiblePage } from '../support/visiblePage';

/**
 * Manual Test C asks people to interpret icons and find maternal care information.
 * These browser checks cover the observable navigation and guidance only. Whether
 * a person understands an icon still needs the participant study in the manual.
 */
test.describe('Manual Test C — information navigation and content', () => {
  test.beforeEach(async ({ page }) => {
    await completeOnboardingMvp(page);
  });

  test('bottom navigation opens maternal danger signs and returns home', async ({ page }) => {
    const navigation = visiblePage(page).getByRole('navigation', { name: 'Main navigation' });
    await navigation.getByRole('button', { name: 'Danger signs' }).click();

    await expect(page).toHaveURL(/\/information\/danger-signs$/);
    await expect(visiblePage(page).getByText('If you are experiencing any danger signs, please go to a health care facility as soon as possible.')).toBeVisible();
    await visiblePage(page).getByRole('button', { name: 'During pregnancy' }).click();
    await expect(visiblePage(page).getByText('Vaginal bleeding', { exact: true })).toBeVisible();

    await visiblePage(page)
      .getByRole('navigation', { name: 'Main navigation' })
      .getByRole('button', { name: 'Home' })
      .click();
    await expect(page).toHaveURL(/\/home$/);
    await expect(visiblePage(page).locator('.home-card').filter({ hasText: 'Information' })).toBeVisible();
  });

  test('Home information card leads to ANC advice and its Birth Plan', async ({ page }) => {
    await visiblePage(page)
      .locator('.home-card')
      .filter({ hasText: 'Information' })
      .getByRole('button', { name: 'Learn more' })
      .click();
    await expect(page).toHaveURL(/\/information$/);

    await visiblePage(page)
      .locator('.browse-section')
      .getByRole('button', { name: 'Antenatal care (ANC)' })
      .click();
    await expect(page).toHaveURL(/\/information\/anc$/);
    await visiblePage(page).getByRole('button', { name: 'Early ANC care' }).click();
    await expect(visiblePage(page).getByText('Start antenatal care early (before 12 weeks if possible).', { exact: true })).toBeVisible();

    await visiblePage(page).getByRole('button', { name: 'Birth preparedness' }).click();
    await expect(visiblePage(page).getByText('Plan where you will give birth and how you will reach the facility.', { exact: true })).toBeVisible();
    await visiblePage(page).getByRole('button', { name: 'Go to your Birth Plan for more guidance' }).click();
    await expect(page).toHaveURL(/\/profile\/plan$/);
    await expect(visiblePage(page).getByRole('heading', { name: 'Make Your Plan' })).toBeVisible();
  });

  test('PNC routine care provides concrete newborn guidance', async ({ page }) => {
    await page.goto('/information');
    await visiblePage(page)
      .locator('.browse-section')
      .getByRole('button', { name: 'Postnatal care (PNC)' })
      .click();
    await expect(page).toHaveURL(/\/information\/pnc$/);
    await visiblePage(page).getByRole('button', { name: 'Routine care' }).click();
    await expect(page).toHaveURL(/\/information\/pnc\/routine-care$/);

    await visiblePage(page).getByRole('button', { name: 'Keep your baby warm' }).click();
    await expect(visiblePage(page).getByText('Use skin-to-skin contact to keep your baby warm.', { exact: true })).toBeVisible();
  });

  test('vaccination hub reaches child vaccine advice', async ({ page }) => {
    await page.goto('/information');
    await visiblePage(page)
      .locator('.browse-section')
      .getByRole('button', { name: 'Vaccination', exact: true })
      .click();
    await expect(page).toHaveURL(/\/information\/vaccination$/);
    await visiblePage(page).getByRole('button', { name: 'About child vaccinations' }).click();
    await expect(page).toHaveURL(/\/information\/vaccination\/child$/);

    await visiblePage(page).getByRole('button', { name: 'Vaccines just after birth' }).click();
    await expect(visiblePage(page).getByText('Vaccines help protect your newborn from serious diseases.', { exact: true })).toBeVisible();
  });

  test('nutrition topic displays its practical diet advice', async ({ page }) => {
    await page.goto('/information');
    await visiblePage(page)
      .locator('.browse-section')
      .getByRole('button', { name: 'Nutrition' })
      .click();
    await expect(page).toHaveURL(/\/information\/nutrition$/);

    await visiblePage(page).getByRole('button', { name: 'Healthy diet' }).click();
    await expect(visiblePage(page).getByText(/Eat a balanced diet using affordable local foods/)).toBeVisible();
  });
});
