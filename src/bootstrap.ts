import { settingsRepo } from './db/database';
import { useEmergencyContacts } from './composables/useEmergencyContacts';
import { usePregnancy } from './composables/usePregnancy';
import { useTt } from './composables/useTt';
import { useSchedule } from './composables/useSchedule';
import { useUser } from './composables/useUser';
import { useTheme, type ThemeColors } from './composables/useTheme';
import { i18n } from './i18n';
import { getNavMode, setNavMode } from './config/app';

let appData: Promise<void> | null = null;

function mirrorToLocalStorage(key: string, value: string): void {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      localStorage.setItem(key, value);
    }
  } catch (e) {
    console.error('Failed to mirror setting to localStorage', e);
  }
}

/**
 * Restores settings that also live as localStorage mirrors (used for
 * synchronous startup reads). SQLite is the source of truth on device:
 * if the WebView storage was cleared, values are recovered from the
 * database before the first screen renders.
 */
async function restoreSettings(): Promise<void> {
  // Name
  const { userName, loadFromDb } = useUser();
  await loadFromDb();
  void userName;

  // Language
  const savedLang = await settingsRepo.get('maasathi_language');
  if (savedLang === 'en' || savedLang === 'bn') {
    if (i18n.global.locale.value !== savedLang) {
      i18n.global.locale.value = savedLang;
    }
    mirrorToLocalStorage('maasathi_language', savedLang);
  }

  // Theme
  const savedTheme = await settingsRepo.getJson<ThemeColors | null>('maasathi_theme_colors', null);
  if (savedTheme && typeof savedTheme === 'object' && 'appBg' in savedTheme) {
    const { theme, applyThemeToDOM } = useTheme();
    Object.assign(theme, savedTheme);
    applyThemeToDOM();
    mirrorToLocalStorage('maasathi_theme_colors', JSON.stringify(savedTheme));
  }

  // Navigation mode (applies from next launch if it differs)
  const savedNav = await settingsRepo.get('maasathi_nav_mode');
  if (savedNav === 'homeBar' || savedNav === 'tabBar') {
    if (savedNav !== getNavMode()) {
      setNavMode(savedNav);
    }
  }
}

/**
 * Runs once per app start: initialises storage, loads the active pregnancy,
 * TT history, emergency contacts and regenerates the schedule (which also
 * applies auto-archiving and re-schedules reminders).
 */
export function ensureAppData(): Promise<void> {
  if (!appData) {
    appData = (async () => {
      const pregnancy = usePregnancy();
      const tt = useTt();
      const emergency = useEmergencyContacts();

      await pregnancy.load();
      await tt.load();
      await emergency.load();
      await restoreSettings();

      const active = pregnancy.activePregnancy.value;
      if (active) {
        const { regenerateSchedule } = useSchedule();
        await regenerateSchedule(active);
      }
    })().catch((e) => {
      console.error('MaaSathi: app data bootstrap failed', e);
      appData = null;
      throw e;
    });
  }
  return appData;
}

export async function completeOnboarding(): Promise<void> {
  await settingsRepo.set('maasathi_onboarding_done', new Date().toISOString());
}

export async function onboardingDone(): Promise<boolean> {
  return (await settingsRepo.get('maasathi_onboarding_done')) !== null;
}
