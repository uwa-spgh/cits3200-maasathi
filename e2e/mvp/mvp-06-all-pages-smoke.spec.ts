import { test, expect } from '@playwright/test';
import { completeOnboardingMvp } from '../support/onboarding';
import { visiblePage } from '../support/visiblePage';

/**
 * Full route smoke: every named app page loads without a blank crash.
 * HistorySummary runs against the pregnancy that onboarding creates.
 */
const STATIC_ROUTES: { path: string; label: string }[] = [
  { path: '/home', label: 'Home' },
  { path: '/week-info', label: 'WeekInfo' },
  { path: '/reminders', label: 'Reminders' },
  { path: '/information', label: 'Information' },
  { path: '/information/anc', label: 'Anc' },
  { path: '/information/anc/trimester/1', label: 'AncTrimester1' },
  { path: '/information/anc/trimester/2', label: 'AncTrimester2' },
  { path: '/information/anc/trimester/3', label: 'AncTrimester3' },
  { path: '/information/pnc', label: 'Pnc' },
  { path: '/information/pnc/breastfeeding', label: 'PncBreastfeeding' },
  { path: '/information/pnc/routine-care', label: 'PncRoutineCare' },
  { path: '/information/vaccination', label: 'Vaccination' },
  { path: '/information/vaccination/tetanus', label: 'VaccinationTetanus' },
  { path: '/information/vaccination/child', label: 'VaccinationChild' },
  { path: '/information/danger-signs', label: 'DangerSigns' },
  { path: '/information/nutrition', label: 'Nutrition' },
  { path: '/profile', label: 'Profile' },
  { path: '/profile/personal', label: 'ProfilePersonal' },
  { path: '/profile/pregnancy', label: 'ProfilePregnancy' },
  { path: '/profile/vaccination', label: 'ProfileVaccination' },
  { path: '/profile/plan', label: 'ProfilePlan' },
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
      // The visible page must be rendered and non-empty, not just the app shell.
      await expect(visiblePage(page), `route ${route.label}`).toBeVisible();
      await expect(visiblePage(page), `route ${route.label}`).not.toBeEmpty();
    }
  });

  test('history summary loads for the active pregnancy', async ({ page }) => {
    await completeOnboardingMvp(page);
    await page.goto('/home');

    const pregnancyId = await page.evaluate(() => {
      const raw = localStorage.getItem('maasathi_db_v2_pregnancy');
      const rows = JSON.parse(raw ?? '[]') as { id: string; status: string }[];
      return rows.find((r) => r.status === 'active')?.id ?? null;
    });

    // Onboarding always creates an active pregnancy, so a missing id is a failure.
    expect(pregnancyId, 'onboarding should create an active pregnancy').toBeTruthy();
    await page.goto(`/profile/history/${pregnancyId}`);
    await expect(page).toHaveURL(new RegExp(`profile/history/${pregnancyId}`));
    await expect(visiblePage(page).getByText('Pregnancy details', { exact: true })).toBeVisible();
  });
});
