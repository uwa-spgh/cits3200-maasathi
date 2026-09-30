import { test, expect } from '@playwright/test';
import { completeOnboardingMvp, MVP_SAMPLE } from '../support/onboarding';
import { visiblePage } from '../support/visiblePage';

/**
 * Full UI coverage (not MVP-only): every page reachable via in-app navigation
 * where an entry exists; asserts load + key chrome.
 */
test.describe('Complete UI coverage', () => {
  test.beforeEach(async ({ page }) => {
    await completeOnboardingMvp(page);
  });

  test('Home cards open Reminders, current information page, and Nutrition', async ({ page }) => {
    const home = visiblePage(page);
    await home.locator('.home-card').filter({ hasText: 'Reminder' }).getByRole('button', { name: 'Learn more' }).click();
    await expect(page).toHaveURL(/reminders/i);

    await visiblePage(page).getByRole('button', { name: 'Home' }).click();
    await visiblePage(page)
      .locator('.home-card')
      .filter({ hasText: 'Information' })
      .getByRole('button', { name: 'Learn more' })
      .click();
    // The existing main branch routes this card to the current ANC/PNC page,
    // rather than to the Information hub.
    await expect(page).toHaveURL(/\/information\/anc/i);
    await expect(visiblePage(page).locator('.anc-page')).toBeVisible();

    await visiblePage(page).getByRole('button', { name: 'Home' }).click();
    await visiblePage(page)
      .locator('.home-card')
      .filter({ hasText: 'Remember to eat well' })
      .getByRole('button', { name: 'Learn more' })
      .click();
    await expect(page).toHaveURL(/nutrition/i);
  });

  test('Information hub opens every browse topic', async ({ page }) => {
    await page.goto('/information');
    const topics = [
      { name: 'Antenatal care (ANC)', url: /information\/anc/i },
      { name: 'Postnatal care (PNC)', url: /information\/pnc/i },
      { name: 'Nutrition', url: /information\/nutrition/i },
      { name: 'Vaccination', url: /information\/vaccination/i },
      { name: 'Danger signs', url: /information\/danger-signs/i }
    ];

    for (const topic of topics) {
      await page.goto('/information');
      // Prefer hub topic buttons — "Danger signs" also exists on BottomNav
      await visiblePage(page).locator('button.topic-btn', { hasText: topic.name }).click();
      await expect(page).toHaveURL(topic.url);
    }
  });

  test('ANC trimester pages load for trimester 1–3', async ({ page }) => {
    for (const n of [1, 2, 3]) {
      await page.goto(`/information/anc/trimester/${n}`);
      await expect(page).toHaveURL(new RegExp(`trimester/${n}`));
      await expect(visiblePage(page).locator('.anc-trimester')).toBeVisible();
    }
  });

  test('PNC renders its topics; Vaccination opens tetanus education', async ({ page }) => {
    await page.goto('/information/pnc');
    await expect(visiblePage(page).locator('.pnc-page')).toBeVisible();
    await expect(visiblePage(page).locator('.pnc-page .expandable-card').first()).toBeVisible();

    await page.goto('/information/vaccination');
    await visiblePage(page).getByRole('button', { name: 'About tetanus' }).click();
    await expect(page).toHaveURL(/vaccination\/tetanus/i);
    await expect(visiblePage(page).locator('.tt-education')).toBeVisible();
  });

  test('Danger signs and Emergency pages render their key content', async ({ page }) => {
    await page.goto('/information/danger-signs');
    await expect(page).toHaveURL(/danger-signs/i);
    await expect(visiblePage(page).locator('.danger-signs-page')).toBeVisible();

    await page.goto('/emergency');
    await expect(page).toHaveURL(/emergency/i);
    await expect(visiblePage(page).locator('.emergency-page')).toBeVisible();
    await expect(visiblePage(page).locator('a[href^="tel:"]').first()).toBeVisible();
  });

  test('Profile menu opens every child page', async ({ page }) => {
    await page.getByRole('button', { name: 'Profile' }).last().click();
    const items = [
      { name: 'Personal information', url: /profile\/personal/i },
      { name: 'My pregnancy', url: /profile\/pregnancy/i },
      { name: 'My vaccinations', url: /profile\/vaccination/i },
      { name: 'Emergency contacts', url: /profile\/contacts/i },
      { name: 'Settings', url: /profile\/settings/i }
    ];

    for (const item of items) {
      await page.goto('/profile');
      await visiblePage(page).getByRole('button', { name: item.name }).click();
      await expect(page).toHaveURL(item.url);
    }
  });

  test('Reminders expand opens WeekInfo guidance', async ({ page }) => {
    await page.goto('/reminders');
    const first = visiblePage(page).locator('.timeline-item').first();
    await expect(first).toBeVisible();
    await first.locator('.item-card').click();
    const guidance = visiblePage(page).getByRole('button', { name: /View visit guidance|View contact guidance|View Tetanus/i });
    if (await guidance.count()) {
      await guidance.first().click();
      await expect(page).toHaveURL(/week-info|vaccination\/tetanus/i);
    }
  });

  test('greeting still shows registered name on Home', async ({ page }) => {
    await page.goto('/home');
    await expect(
      visiblePage(page).getByRole('heading', { name: `Hello, ${MVP_SAMPLE.name}` })
    ).toBeVisible();
  });
});
