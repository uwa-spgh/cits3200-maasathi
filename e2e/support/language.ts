import type { Page } from '@playwright/test';

function visiblePage(page: Page) {
  return page.locator('ion-router-outlet > .ion-page:not(.ion-page-hidden)').last();
}

/**
 * Changes language via the Profile LanguageSwitcher (IonSelect popover).
 * Page must already show a LanguageSwitcher (Profile menu).
 */
export async function selectAppLanguage(page: Page, lang: 'en' | 'bn'): Promise<void> {
  const optionLabel = lang === 'bn' ? 'বাংলা (Bengali)' : 'English';

  await visiblePage(page).locator('.language-switcher ion-select').first().click();

  const radio = page.getByRole('radio', { name: optionLabel });
  if (await radio.count()) {
    await radio.click();
    return;
  }

  await page.locator('ion-popover, ion-select-popover').getByText(optionLabel, { exact: true }).click();
}
