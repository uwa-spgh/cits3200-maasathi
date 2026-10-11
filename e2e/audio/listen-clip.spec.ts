import { expect, test } from '@playwright/test';
import { clearAppStorage } from '../support/storage';

test.describe('Pre-recorded Listen clips', () => {
  test('Listen plays the recorded clip instead of the device voice', async ({ page }) => {
    // Count calls to the device voice so the test can prove it was not used.
    await page.addInitScript(() => {
      const w = window as unknown as { __deviceSpeech: number };
      w.__deviceSpeech = 0;
      const synth = window.speechSynthesis;
      if (!synth) return;
      const speak = synth.speak.bind(synth);
      synth.speak = (utterance) => {
        w.__deviceSpeech += 1;
        speak(utterance);
      };
    });

    await clearAppStorage(page);
    await page.goto('/');
    await expect(page).toHaveURL(/onboarding/i);
    await expect(page.getByRole('heading', { name: 'Welcome to MaaSathi' })).toBeVisible();

    // The welcome hint is one of the generated clips; its id is derived from the exact text.
    const clipResponse = page.waitForResponse(
      // Browsers fetch <audio> with range requests, so a partial response (206) is as good as a full one.
      (response) => /\/audio\/en\/[0-9a-z]+\.mp3$/.test(response.url()) && [200, 206].includes(response.status())
    );
    await page.getByRole('button', { name: 'Listen' }).click();
    const response = await clipResponse;
    expect(response.headers()['content-type']).toMatch(/audio/);

    expect(await page.evaluate(() => (window as unknown as { __deviceSpeech: number }).__deviceSpeech)).toBe(0);
  });
});

test.describe('Onboarding Listen buttons', () => {
  test('every onboarding step has a Listen button that plays a recorded clip', async ({ page }) => {
    const deviceSpeech = async (): Promise<number> =>
      page.evaluate(() => (window as unknown as { __deviceSpeech: number }).__deviceSpeech);
    await page.addInitScript(() => {
      const w = window as unknown as { __deviceSpeech: number };
      w.__deviceSpeech = 0;
      const synth = window.speechSynthesis;
      if (!synth) return;
      const speak = synth.speak.bind(synth);
      synth.speak = (utterance) => {
        w.__deviceSpeech += 1;
        speak(utterance);
      };
    });

    /** Taps the visible Listen button and expects a recorded clip to be fetched for it. */
    const listenPlaysClip = async (stepName: string): Promise<void> => {
      const clip = page.waitForResponse(
        (response) => /\/audio\/en\/[0-9a-z]+\.mp3$/.test(response.url()) && [200, 206].includes(response.status()),
        { timeout: 5000 }
      );
      await page.getByRole('button', { name: 'Listen' }).click();
      await clip.catch(() => {
        throw new Error(`Onboarding step "${stepName}": Listen did not fetch a recorded clip`);
      });
    };

    await clearAppStorage(page);
    await page.goto('/');
    await expect(page).toHaveURL(/onboarding/i);

    await listenPlaysClip('language');
    await page.getByRole('button', { name: 'Next' }).click();

    await listenPlaysClip('name');
    await page.locator('ion-input input').first().fill('Test Mother');
    await page.getByRole('button', { name: 'Next' }).click();

    await listenPlaysClip('lmp_known');
    await page.getByRole('button', { name: 'No', exact: true }).click();

    await listenPlaysClip('edd_known');
    await page.getByRole('button', { name: 'No', exact: true }).click();

    await listenPlaysClip('estimate');
    await page.locator('.count-chip').first().click();
    await page.getByRole('button', { name: 'Next' }).click();

    await listenPlaysClip('tt_ever');
    await page.getByRole('button', { name: 'Yes' }).click();

    await listenPlaysClip('tt_count_known');
    await page.getByRole('button', { name: 'Yes' }).click();

    await listenPlaysClip('tt_details');
    await page.locator('.count-chip').first().click();
    await page.locator('ion-input input[type="date"]').fill(new Date().toISOString().slice(0, 10));
    await page.getByRole('button', { name: 'Next' }).click();

    await expect(page.getByRole('heading', { name: 'You are all set' })).toBeVisible();
    await listenPlaysClip('done');

    expect(await deviceSpeech()).toBe(0);
  });
});
