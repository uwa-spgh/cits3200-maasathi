import { expect, type Page } from '@playwright/test';

/** Ionic keeps prior pages in the stack — prefer the visible page chrome. */
export function visiblePage(page: Page) {
  return page.locator('ion-router-outlet > .ion-page:not(.ion-page-hidden)').last();
}
