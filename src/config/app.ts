export type NavMode = 'homeBar' | 'tabBar';

export const NAV_MODE: NavMode = 'homeBar';

// Layout is no longer user-selectable; the home bar layout is always used.
export function getNavMode(): NavMode {
  return NAV_MODE;
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

