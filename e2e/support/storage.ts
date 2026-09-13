import type { Page } from '@playwright/test';

/** Clears browser storage so onboarding runs as a first-time user. */
export async function clearAppStorage(page: Page): Promise<void> {
  await page.goto('/');
  await page.evaluate(() => {
    try {
      localStorage.clear();
      sessionStorage.clear();
    } catch {
      // ignore
    }
  });
  await page.reload();
}
