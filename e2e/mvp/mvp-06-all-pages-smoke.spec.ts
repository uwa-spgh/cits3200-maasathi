import { test, expect } from '@playwright/test';
import { completeOnboardingMvp } from '../support/onboarding';

/**
 * Full route smoke: every named app page loads without a blank crash.
 * HistorySummary is covered when an active pregnancy id is found in localStorage.
 */
const STATIC_ROUTES: { path: string; label: string }[] = [
  { path: '/home', label: 'Home' },
  { path: '/week-info', label: 'WeekInfo' },
  { path: '/emergency', label: 'Emergency' },
  { path: '/reminders', label: 'Reminders' },
  { path: '/information', label: 'Information' },
  { path: '/information/anc', label: 'Anc' },
  { path: '/information/anc/trimester/1', label: 'AncTrimester' },
  { path: '/information/pnc', label: 'Pnc' },
  { path: '/information/pnc/breastfeeding', label: 'PncBreastfeeding' },
  { path: '/information/vaccination', label: 'Vaccination' },
  { path: '/information/vaccination/tetanus', label: 'VaccinationTetanus' },
  { path: '/information/danger-signs', label: 'DangerSigns' },
  { path: '/information/nutrition', label: 'Nutrition' },
  { path: '/profile', label: 'Profile' },
  { path: '/profile/personal', label: 'ProfilePersonal' },
  { path: '/profile/pregnancy', label: 'ProfilePregnancy' },
  { path: '/profile/vaccination', label: 'ProfileVaccination' },
  { path: '/profile/contacts', label: 'ProfileContacts' },
  { path: '/profile/settings', label: 'ProfileSettings' }
];

test.describe('All pages smoke', () => {
  test('PNC page renders expandable information topics', async ({ page }) => {
    await completeOnboardingMvp(page);
    await page.goto('/information/pnc');
    await expect(page).toHaveURL(/information\/pnc/i);
    await expect(page.locator('.pnc-page')).toBeVisible();

    const firstTopic = page.locator('.pnc-page .card-head').first();
    await expect(firstTopic).toBeVisible();
    await firstTopic.click();
    await expect(page.locator('.pnc-page .card-body').first()).toBeVisible();
  });

  test('every static route renders after onboarding', async ({ page }) => {
    await completeOnboardingMvp(page);

    for (const route of STATIC_ROUTES) {
      await page.goto(route.path);
      await expect(page, `route ${route.label}`).not.toHaveURL(/onboarding/i);
      await expect(page, `route ${route.label}`).toHaveURL(new RegExp(route.path.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));
      await expect(page.locator('ion-app')).toBeVisible();
    }
  });

  test('history summary loads for active pregnancy when present', async ({ page }) => {
    await completeOnboardingMvp(page);
    await page.goto('/home');

    const pregnancyId = await page.evaluate(() => {
      try {
        const raw = localStorage.getItem('maasathi_db_v2_pregnancy');
        if (!raw) return null;
        const rows = JSON.parse(raw) as { id?: string; status?: string }[];
        const active = rows.find((r) => r.status === 'active') ?? rows[0];
        return active?.id ?? null;
      } catch {
        return null;
      }
    });

    test.skip(!pregnancyId, 'No pregnancy id in localStorage');
    await page.goto(`/profile/history/${pregnancyId}`);
    await expect(page).not.toHaveURL(/onboarding/i);
    await expect(page.locator('ion-router-outlet, ion-app').first()).toBeVisible();
  });
});
