import { expect, test } from '@playwright/test';
import { completeOnboardingMvp } from '../support/onboarding';
import { visiblePage } from '../support/visiblePage';

test.describe('Profile data and preferences', () => {
  test.beforeEach(async ({ page }) => {
    await completeOnboardingMvp(page);
    await page.goto('/profile');
  });

  test('saved name is used by Home after a reload', async ({ page }) => {
    await visiblePage(page).getByRole('button', { name: 'Personal information' }).click();
    await expect(page).toHaveURL(/\/profile\/personal$/);

    const name = visiblePage(page).locator('ion-item').filter({ hasText: 'Your name' }).locator('ion-input input');
    const age = visiblePage(page).locator('ion-item').filter({ hasText: 'Age' }).locator('ion-input input');
    await name.fill('Ayesha Begum');
    await age.fill('29');
    await visiblePage(page).getByRole('button', { name: 'Save', exact: true }).click();
    await expect(page.locator('ion-toast').last()).toContainText('Saved');

    await page.reload();
    await page.goto('/home');
    await expect(visiblePage(page).getByRole('heading', { name: 'Hello, Ayesha Begum' })).toBeVisible();
  });

  test('saved personal fields prefill the edit form after a reload', async ({ page }) => {
    await visiblePage(page).getByRole('button', { name: 'Personal information' }).click();
    const personal = visiblePage(page);
    await personal.locator('ion-item').filter({ hasText: 'Your name' }).locator('ion-input input').fill('Ayesha Begum');
    await personal.locator('ion-item').filter({ hasText: 'Age' }).locator('ion-input input').fill('29');
    await personal.getByRole('button', { name: 'Save', exact: true }).click();
    await expect(page.locator('ion-toast').last()).toContainText('Saved');

    await page.reload();
    await expect(visiblePage(page).locator('ion-item').filter({ hasText: 'Your name' }).locator('ion-input input')).toHaveValue('Ayesha Begum');
    await expect(visiblePage(page).locator('ion-item').filter({ hasText: 'Age' }).locator('ion-input input')).toHaveValue('29');
  });

  test('Birth Plan fields are saved and restored after a reload', async ({ page }) => {
    await visiblePage(page).getByRole('button', { name: 'My Birth Plan' }).click();
    await expect(page).toHaveURL(/\/profile\/plan$/);

    const fields = [
      { label: 'Place of Delivery', value: 'Community Health Centre' },
      { label: 'Birth Care Provider', value: 'Midwife team' },
      { label: 'Transport Plan', value: 'Family car' },
      { label: 'Emergency Contact', value: '0412345678' }
    ];

    for (const field of fields) {
      await visiblePage(page).locator('ion-item').filter({ hasText: field.label }).locator('ion-input input').fill(field.value);
    }
    await visiblePage(page).getByRole('button', { name: 'Save', exact: true }).click();
    await expect(page.locator('ion-toast').last()).toContainText('Saved');

    await page.reload();
    for (const field of fields) {
      await expect(
        visiblePage(page).locator('ion-item').filter({ hasText: field.label }).locator('ion-input input')
      ).toHaveValue(field.value);
    }
  });

  test('appearance choice is applied and retained after a reload', async ({ page }) => {
    const appearance = visiblePage(page).getByRole('radiogroup', { name: 'Appearance' });
    await appearance.getByRole('radio', { name: 'Dark' }).click();
    await expect(appearance.getByRole('radio', { name: 'Dark' })).toHaveAttribute('aria-checked', 'true');
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');

    await page.reload();
    await expect(visiblePage(page).getByRole('radiogroup', { name: 'Appearance' }).getByRole('radio', { name: 'Dark' })).toHaveAttribute('aria-checked', 'true');
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
  });

  test('pregnancy history detail is retained after saving', async ({ page }) => {
    await visiblePage(page).getByRole('button', { name: /My pregnancy/ }).click();
    await expect(page).toHaveURL(/\/profile\/pregnancy$/);

    const previousPregnancies = visiblePage(page)
      .locator('ion-item')
      .filter({ hasText: 'Number of previous pregnancies' })
      .locator('ion-input input');
    await previousPregnancies.fill('2');
    await visiblePage(page).getByRole('button', { name: 'Save', exact: true }).click();
    await expect(page.locator('ion-toast').last()).toContainText('Saved');

    await page.reload();
    await expect(
      visiblePage(page).locator('ion-item').filter({ hasText: 'Number of previous pregnancies' }).locator('ion-input input')
    ).toHaveValue('2');
  });
});
