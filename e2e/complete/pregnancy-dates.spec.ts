import { test, expect, type Page } from '@playwright/test';
import { completeOnboardingMvp } from '../support/onboarding';
import { addDays, browserToday } from '../support/dates';

/** Ionic keeps prior pages in the stack — prefer the visible page chrome. */
function visiblePage(page: Page) {
  return page.locator('ion-router-outlet > .ion-page:not(.ion-page-hidden)').last();
}

/** Reads a stored table straight from localStorage (web driver). Rows are stored with snake_case columns. */
async function readTable<T>(page: Page, table: string): Promise<T[]> {
  return page.evaluate(
    (name) => JSON.parse(localStorage.getItem(`maasathi_db_v2_${name}`) ?? '[]'),
    table
  ) as Promise<T[]>;
}

interface PregnancyRow {
  status: string;
  lmp: string;
  edd: string;
  date_source: string;
}

interface ScheduleRow {
  type: string;
  ref: string;
  due_date: string;
}

/**
 * Pregnancy date handling: the EDD/LMP pair on the profile page, birth registration,
 * and the local-date rule for the registration day.
 */
test.describe('pregnancy dates', () => {
  test('typing EDD on the pregnancy page fills LMP live and saves EDD as the source', async ({ page }) => {
    await completeOnboardingMvp(page);

    await page.getByRole('button', { name: 'Profile' }).last().click();
    await visiblePage(page).getByRole('button', { name: 'My pregnancy' }).click();
    await expect(page).toHaveURL(/profile\/pregnancy/i);

    const edd = addDays(await browserToday(page), 100);
    const expectedLmp = addDays(edd, -280);
    const card = visiblePage(page).locator('section.profile-card').first();
    const lmpInput = card.locator('ion-input input[type="date"]').nth(0);
    const eddInput = card.locator('ion-input input[type="date"]').nth(1);

    await eddInput.fill(edd);
    await expect(lmpInput).toHaveValue(expectedLmp);

    await card.getByRole('button', { name: 'Save', exact: true }).click();
    await expect
      .poll(async () => (await readTable<PregnancyRow>(page, 'pregnancy')).find((p) => p.status === 'active')?.edd)
      .toBe(edd);

    const saved = (await readTable<PregnancyRow>(page, 'pregnancy')).find((p) => p.status === 'active');
    expect(saved).toMatchObject({ lmp: expectedLmp, edd, date_source: 'edd' });

    await page.reload();
    await expect(visiblePage(page).locator('section.profile-card').first().locator('ion-input input[type="date"]').nth(1))
      .toHaveValue(edd);
  });

  test('registering a birth stores one child with the delivery date', async ({ page }) => {
    await completeOnboardingMvp(page);

    await page.getByRole('button', { name: 'Profile' }).last().click();
    await visiblePage(page).getByRole('button', { name: 'My pregnancy' }).click();
    await expect(page).toHaveURL(/profile\/pregnancy/i);

    const birthSection = visiblePage(page).locator('section.profile-card').filter({ hasText: 'Birth registration' });
    const deliveryDate = addDays(await browserToday(page), -3);
    await birthSection.locator('ion-input input[type="date"]').first().fill(deliveryDate);
    await birthSection.getByRole('button', { name: 'Register birth' }).click();
    await expect(visiblePage(page).locator('.mode-chip')).toContainText('PNC mode');

    const children = await readTable<{ pregnancy_id: string; dob: string }>(page, 'child');
    expect(children).toHaveLength(1);
    expect(children[0].dob).toBe(deliveryDate);
  });
});

/**
 * Bangladesh is UTC+6. At 19:30 UTC on 11 Oct it is already 01:30 on 12 Oct locally, so the
 * first ANC visit must be due on 12 Oct. A `.slice(0, 10)` of the UTC timestamp would say 11 Oct.
 */
test.describe('registration day in Bangladesh time', () => {
  test.use({ timezoneId: 'Asia/Dhaka' });

  test('ANC visit 1 is due on the local date of registration', async ({ page }) => {
    await page.clock.setFixedTime(new Date('2026-10-11T19:30:00Z'));
    await completeOnboardingMvp(page);

    const items = await readTable<ScheduleRow>(page, 'schedule_item');
    const visit1 = items.find((i) => i.type === 'ANC' && i.ref === 'visit1');
    expect(visit1?.due_date).toBe('2026-10-12');
  });
});
