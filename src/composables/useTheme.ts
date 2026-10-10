import { ref } from 'vue';
import { settingsRepo } from '../db/database';

export type ThemeMode = 'normal' | 'contrast' | 'dark';

export const THEME_MODES: ThemeMode[] = ['normal', 'contrast', 'dark'];

export const THEME_STORAGE_KEY = 'maasathi_theme_mode';

export function isThemeMode(value: unknown): value is ThemeMode {
  return typeof value === 'string' && (THEME_MODES as string[]).includes(value);
}

function loadInitialMode(): ThemeMode {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      const saved = localStorage.getItem(THEME_STORAGE_KEY);
      if (isThemeMode(saved)) return saved;
    }
  } catch (e) {
    console.error('Failed to load theme from localStorage', e);
  }
  return 'normal';
}

const mode = ref<ThemeMode>(loadInitialMode());

export function useTheme() {
  // The palettes live in theme/variables.css, keyed on this attribute.
  const applyThemeToDOM = () => {
    if (typeof document === 'undefined') return;
    const root = document.documentElement;
    if (!root) return;
    if (mode.value === 'normal') {
      root.removeAttribute('data-theme');
    } else {
      root.setAttribute('data-theme', mode.value);
    }
  };

  const setMode = (next: ThemeMode) => {
    mode.value = next;
    applyThemeToDOM();
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        localStorage.setItem(THEME_STORAGE_KEY, next);
      }
    } catch (e) {
      console.error('Failed to save theme to localStorage', e);
    }
    // Mirror into SQLite so the choice survives WebView storage wipes.
    void settingsRepo.set(THEME_STORAGE_KEY, next);
  };

  return { mode, setMode, applyThemeToDOM };
}
