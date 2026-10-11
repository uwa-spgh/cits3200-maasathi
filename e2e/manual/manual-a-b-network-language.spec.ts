import { expect, test } from '@playwright/test';
import { selectAppLanguage } from '../support/language';
import { completeOnboardingMvp, MVP_SAMPLE } from '../support/onboarding';
import { visiblePage } from '../support/visiblePage';

/**
 * Manual Test A (network): exercise an already loaded, local-data app while the
 * browser has slow or no network. The Vite development server is not an offline
 * install, so a cold offline page load is outside this browser test's scope.
 */
test.describe('Manual A — degraded network', () => {
  test('loaded app remains responsive on Slow 4G, 3G and offline', async ({ page, context }) => {
    await completeOnboardingMvp(page);

    const cdp = await context.newCDPSession(page);
    try {
      for (const condition of [
        { name: 'Slow 4G', latency: 150, bytesPerSecond: 200_000 },
        { name: '3G', latency: 400, bytesPerSecond: 50_000 }
      ]) {
        await cdp.send('Network.emulateNetworkConditions', {
          offline: false,
          latency: condition.latency,
          downloadThroughput: condition.bytesPerSecond,
          uploadThroughput: condition.bytesPerSecond
        });

        await test.step(`${condition.name}: information appears within 10 seconds`, async () => {
          await visiblePage(page)
            .locator('.home-card.accent-blue')
            .getByRole('button', { name: 'Learn more' })
            .click();
          await expect(page).toHaveURL(/\/information$/);
          await expect(visiblePage(page).getByRole('heading', { name: 'Browse all topics' })).toBeVisible();
        }, { timeout: 10_000 });

        await test.step(`${condition.name}: scrolling and navigation remain usable`, async () => {
          const vaccination = visiblePage(page).getByRole('button', { name: 'Vaccination', exact: true });
          await vaccination.scrollIntoViewIfNeeded();
          await expect(vaccination).toBeInViewport();
          await visiblePage(page).getByRole('button', { name: 'Home' }).click();
          await expect(visiblePage(page).getByRole('heading', {
            name: `Hello, ${MVP_SAMPLE.name}`
          })).toBeVisible();
        }, { timeout: 10_000 });
      }
    } finally {
      await cdp.send('Network.emulateNetworkConditions', {
        offline: false,
        latency: 0,
        downloadThroughput: -1,
        uploadThroughput: -1
      });
      await cdp.detach();
    }

    await context.setOffline(true);
    try {
      await test.step('Offline: local information appears within 10 seconds', async () => {
        await visiblePage(page)
          .locator('.home-card.accent-blue')
          .getByRole('button', { name: 'Learn more' })
          .click();
        await expect(page).toHaveURL(/\/information$/);
        await expect(visiblePage(page).getByRole('heading', { name: 'Browse all topics' })).toBeVisible();
      }, { timeout: 10_000 });

      await test.step('Offline: scrolling and saved profile remain usable', async () => {
        const vaccination = visiblePage(page).getByRole('button', { name: 'Vaccination', exact: true });
        await vaccination.scrollIntoViewIfNeeded();
        await expect(vaccination).toBeInViewport();
        await visiblePage(page).getByRole('button', { name: 'Profile' }).click();
        await expect(visiblePage(page).getByText('Profile & Settings')).toBeVisible();
        await visiblePage(page).getByRole('button', { name: 'Personal information' }).click();
        await expect(page).toHaveURL(/\/profile\/personal$/);
        expect(await page.evaluate(() => localStorage.getItem('maasathi_user_name')))
          .toBe(MVP_SAMPLE.name);
      }, { timeout: 10_000 });
    } finally {
      await context.setOffline(false);
    }
  });
});

/**
 * Manual Test B names Nepali, but the current app offers English and Bengali.
 * Verify the two implemented languages, persistence, and continued navigation.
 * Human review is still needed for the meaning and fluency of the translations.
 */
test.describe('Manual B — supported languages', () => {
  test('English → Bengali → reload → English updates key screens without stale labels', async ({ page }) => {
    await completeOnboardingMvp(page);

    await visiblePage(page).getByRole('button', { name: 'Profile' }).click();
    await expect(visiblePage(page).getByText('Profile & Settings')).toBeVisible();
    await expect(visiblePage(page).getByRole('button', { name: 'Personal information' })).toBeVisible();

    await selectAppLanguage(page, 'bn');
    await expect(visiblePage(page).getByText('প্রোফাইল ও সেটিংস')).toBeVisible();
    await expect(visiblePage(page).getByRole('button', { name: 'ব্যক্তিগত তথ্য' })).toBeVisible();
    await expect(visiblePage(page).getByText('Profile & Settings')).toHaveCount(0);

    await visiblePage(page).getByRole('button', { name: 'হোম', exact: true }).click();
    await expect(visiblePage(page).getByRole('heading', {
      name: `হ্যালো, ${MVP_SAMPLE.name}`
    })).toBeVisible();
    await expect(visiblePage(page).locator('.home-card.accent-blue .title-row strong')).toHaveText('তথ্য');
    await expect(visiblePage(page).locator('.home-card.accent-blue')).not.toContainText('Learn more');

    await visiblePage(page)
      .locator('.home-card.accent-blue')
      .getByRole('button', { name: 'আরও জানুন' })
      .click();
    await expect(page).toHaveURL(/\/information$/);
    await expect(visiblePage(page).getByRole('heading', { name: 'সব বিষয় দেখুন' })).toBeVisible();
    await expect(visiblePage(page).getByRole('button', { name: 'প্রসবপূর্ব সেবা (ANC)' })).toBeVisible();
    await expect(visiblePage(page).getByText('Browse all topics')).toHaveCount(0);

    await page.reload();
    await expect(visiblePage(page).getByRole('heading', { name: 'সব বিষয় দেখুন' })).toBeVisible();
    expect(await page.evaluate(() => localStorage.getItem('maasathi_language'))).toBe('bn');

    await visiblePage(page).getByRole('button', { name: 'প্রোফাইল', exact: true }).click();
    await selectAppLanguage(page, 'en');
    await expect(visiblePage(page).getByText('Profile & Settings')).toBeVisible();
    await expect(visiblePage(page).getByRole('button', { name: 'Personal information' })).toBeVisible();
    await expect(visiblePage(page).getByText('প্রোফাইল ও সেটিংস')).toHaveCount(0);

    await visiblePage(page).getByRole('button', { name: 'Home', exact: true }).click();
    await expect(visiblePage(page).getByRole('heading', {
      name: `Hello, ${MVP_SAMPLE.name}`
    })).toBeVisible();
  });
});
