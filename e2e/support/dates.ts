import type { Page } from '@playwright/test';

/** Adds days to an ISO date using UTC arithmetic, so the result does not depend on the runner's timezone. */
export function addDays(iso: string, days: number): string {
  const d = new Date(`${iso}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

/**
 * Today's local date (YYYY-MM-DD) as the app sees it. Reads the page's clock, so it follows
 * page.clock and the test's timezoneId. Test dates are built from this rather than written
 * as literals, which would drift outside the app's LMP/EDD bounds as time passes.
 */
export async function browserToday(page: Page): Promise<string> {
  return page.evaluate(() => {
    const d = new Date();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${d.getFullYear()}-${m}-${day}`;
  });
}
