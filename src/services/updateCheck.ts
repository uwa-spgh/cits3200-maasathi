/**
 * Minimal update check against server/update_server.py.
 *
 * At most once a day, on a native release build, the app sends only its build
 * number (Android versionCode). If the server reports a newer stable build, the
 * user is asked; "Download" opens the release page in the system browser.
 * Nothing is downloaded automatically, and an update is never required.
 *
 * Disabled until UPDATE_CHECK_URL is set: the server is not hosted yet.
 * See server/README.md.
 */
import { App } from '@capacitor/app';
import { Capacitor } from '@capacitor/core';
import { alertController } from '@ionic/vue';
import { settingsRepo } from '../db/database';
import { i18n } from '../i18n';

/** e.g. 'https://updates.example.org/v1/check'. Empty turns the check off. */
export const UPDATE_CHECK_URL = '';

const CHECK_INTERVAL_MS = 24 * 60 * 60 * 1000;
const TIMEOUT_MS = 5000;
const LAST_CHECK_KEY = 'maasathi_update_last_check';
const DISMISSED_CODE_KEY = 'maasathi_update_dismissed_code';

export interface UpdateInfo {
  code: number;
  name: string;
  url: string;
  size_mb: number;
  notes?: Record<string, string>;
}

/** Asks the server about `currentCode`. Null when up to date or the reply is unusable; throws when offline. */
export async function fetchUpdate(currentCode: number, url: string = UPDATE_CHECK_URL): Promise<UpdateInfo | null> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    const res = await fetch(`${url}?code=${encodeURIComponent(currentCode)}`, { signal: controller.signal });
    if (res.status !== 200) return null;
    const body = (await res.json()) as Partial<UpdateInfo>;
    const valid =
      typeof body.code === 'number' && body.code > currentCode &&
      typeof body.name === 'string' &&
      typeof body.url === 'string' && body.url.startsWith('https://') &&
      typeof body.size_mb === 'number';
    return valid ? (body as UpdateInfo) : null;
  } finally {
    clearTimeout(timer);
  }
}

/** Runs in the background after startup; never throws. */
export async function checkForUpdate(): Promise<void> {
  if (!UPDATE_CHECK_URL || !Capacitor.isNativePlatform()) return;
  try {
    const info = await App.getInfo();
    if (info.id.endsWith('.debug')) return;
    if (!(await settingsRepo.get('maasathi_onboarding_done'))) return;

    const lastCheck = Number(await settingsRepo.get(LAST_CHECK_KEY)) || 0;
    if (Date.now() - lastCheck < CHECK_INTERVAL_MS) return;

    const update = await fetchUpdate(Number(info.build));
    // Only count checks the server answered, so an offline phone tries again next launch.
    await settingsRepo.set(LAST_CHECK_KEY, String(Date.now()));
    if (!update) return;
    if (Number(await settingsRepo.get(DISMISSED_CODE_KEY)) === update.code) return;
    await promptForUpdate(update);
  } catch (e) {
    // Offline, slow network or server down: not something to show the user.
    console.info('MaaSathi: update check skipped', e);
  }
}

async function promptForUpdate(update: UpdateInfo): Promise<void> {
  // Same cast as src/i18n/index.ts: vue-i18n's message-key types are too deep for tsc here.
  const composer = i18n.global as unknown as {
    t: (key: string, values?: Record<string, unknown>) => string;
    locale: { value: string };
  };
  const t = (key: string, values?: Record<string, unknown>) => composer.t(key, values);
  const locale = composer.locale.value;
  const notes = update.notes?.[locale] || update.notes?.en || '';
  const alert = await alertController.create({
    header: t('update.title'),
    message: [t('update.message', { version: update.name, size: update.size_mb }), notes].filter(Boolean).join(' '),
    buttons: [
      {
        text: t('update.later'),
        role: 'cancel',
        handler: () => {
          void settingsRepo.set(DISMISSED_CODE_KEY, String(update.code));
        }
      },
      {
        text: t('update.download'),
        handler: () => {
          // Capacitor opens links to other hosts in the system browser.
          window.location.href = update.url;
        }
      }
    ]
  });
  await alert.present();
}
