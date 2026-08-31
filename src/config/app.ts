import { settingsRepo } from '../db/database';

export type NavMode = 'homeBar' | 'tabBar';

export const NAV_MODE: NavMode = 'homeBar';

const NAV_MODE_KEY = 'maasathi_nav_mode';

export function getNavMode(): NavMode {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      const saved = localStorage.getItem(NAV_MODE_KEY);
      if (saved === 'homeBar' || saved === 'tabBar') return saved;
    }
  } catch (e) {
    console.error('Failed to read nav mode', e);
  }
  return NAV_MODE;
}

export function setNavMode(mode: NavMode): void {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      localStorage.setItem(NAV_MODE_KEY, mode);
    }
  } catch (e) {
    console.error('Failed to save nav mode', e);
  }
  // Mirror into SQLite so the choice survives WebView storage wipes.
  void settingsRepo.set(NAV_MODE_KEY, mode);
}

const TAB_PREFIX = '/tabs';

export function nav(path: string): string {
  const clean = path.startsWith('/') ? path : `/${path}`;
  if (getNavMode() === 'tabBar') {
    if (clean.startsWith(TAB_PREFIX)) return clean;
    return `${TAB_PREFIX}${clean}`;
  }
  return clean;
}

export function homePath(): string {
  return getNavMode() === 'tabBar' ? '/tabs/home' : '/home';
}

export const ANDROID_BOTTOM_SAFE_AREA = 'env(safe-area-inset-bottom)';
