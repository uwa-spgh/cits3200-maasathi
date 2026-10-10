import { reactive, ref } from 'vue';
import { settingsRepo } from '../db/database';

export interface ThemeColors {
  appBg: string;
  cardBg: string;
  cardText: string;
  cardBorder: string;
  cardSubtext: string;
  navBg: string;
  shadow: string;
  btnMoreBg: string;
  btnMoreText: string;
  emergencyBg: string;
  emergencyText: string;
  remindersBg: string;
  remindersText: string;
  informationBg: string;
  informationText: string;
  profileBg: string;
  profileText: string;
}

export type PresetKey = 'original' | 'dark' | 'contrast';

export const THEME_PRESETS: Record<PresetKey, ThemeColors> = {
  original: {
    appBg: '#FBF7F5',
    cardBg: '#FFFFFF',
    cardText: '#1A1A1A',
    cardBorder: 'rgba(0, 0, 0, 0.08)',
    cardSubtext: '#6B7280',
    navBg: '#FFFFFF',
    shadow: 'rgba(0, 0, 0, 0.06)',
    btnMoreBg: '#7BC62D',
    btnMoreText: '#000000',
    emergencyBg: '#FF5C5C',
    emergencyText: '#FFFFFF',
    remindersBg: '#F6C945',
    remindersText: '#1A1A1A',
    informationBg: '#7BC62D',
    informationText: '#000000',
    profileBg: '#33A1DE',
    profileText: '#FFFFFF'
  },
  dark: {
    appBg: '#121214',
    cardBg: '#1E1E24',
    cardText: '#F3F4F6',
    cardBorder: 'rgba(255, 255, 255, 0.12)',
    cardSubtext: '#9CA3AF',
    navBg: '#18181C',
    shadow: 'rgba(0, 0, 0, 0.45)',
    btnMoreBg: '#4ADE80',
    btnMoreText: '#000000',
    emergencyBg: '#EF4444',
    emergencyText: '#FFFFFF',
    remindersBg: '#FBBF24',
    remindersText: '#1A1A1A',
    informationBg: '#22C55E',
    informationText: '#000000',
    profileBg: '#38BDF8',
    profileText: '#000000'
  },
  contrast: {
    appBg: '#000000',
    cardBg: '#0D0D0D',
    cardText: '#FFFFFF',
    cardBorder: '#FFFFFF',
    cardSubtext: '#E5E7EB',
    navBg: '#000000',
    shadow: 'none',
    btnMoreBg: '#00FF66',
    btnMoreText: '#000000',
    emergencyBg: '#FF1744',
    emergencyText: '#FFFFFF',
    remindersBg: '#FFD600',
    remindersText: '#000000',
    informationBg: '#00E676',
    informationText: '#000000',
    profileBg: '#00B0FF',
    profileText: '#000000'
  }
};

const STORAGE_KEY = 'maasathi_theme_colors';
const PRESET_STORAGE_KEY = 'maasathi_theme_preset';

function normalizePresetKey(key: string | null): PresetKey {
  if (key === 'dark') return 'dark';
  if (key === 'contrast') return 'contrast';
  return 'original';
}

function loadInitialPreset(): PresetKey {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      const saved = localStorage.getItem(PRESET_STORAGE_KEY);
      if (saved) return normalizePresetKey(saved);
    }
  } catch (e) {
    console.error('Failed to load theme preset from localStorage', e);
  }
  return 'original';
}

function loadInitialTheme(): ThemeColors {
  const initialPreset = loadInitialPreset();
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        // Ensure all required fields exist
        return { ...THEME_PRESETS[initialPreset], ...parsed };
      }
    }
  } catch (e) {
    console.error('Failed to load theme from localStorage', e);
  }
  return { ...THEME_PRESETS[initialPreset] };
}

const currentPresetKey = ref<PresetKey>(loadInitialPreset());
const currentTheme = reactive<ThemeColors>(loadInitialTheme());

export function useTheme() {
  const applyThemeToDOM = () => {
    if (typeof document === 'undefined') return;
    const root = document.documentElement;
    if (!root) return;
    root.style.setProperty('--color-app-bg', currentTheme.appBg);
    root.style.setProperty('--color-card-bg', currentTheme.cardBg);
    root.style.setProperty('--color-card-text', currentTheme.cardText);
    root.style.setProperty('--color-card-border', currentTheme.cardBorder);
    root.style.setProperty('--color-subtext', currentTheme.cardSubtext);
    root.style.setProperty('--color-nav-bg', currentTheme.navBg);
    root.style.setProperty('--color-shadow', currentTheme.shadow);
    root.style.setProperty('--color-btn-more-bg', currentTheme.btnMoreBg);
    root.style.setProperty('--color-btn-more-text', currentTheme.btnMoreText);
    root.style.setProperty('--color-emergency-bg', currentTheme.emergencyBg);
    root.style.setProperty('--color-emergency-text', currentTheme.emergencyText);
    root.style.setProperty('--color-reminders-bg', currentTheme.remindersBg);
    root.style.setProperty('--color-reminders-text', currentTheme.remindersText);
    root.style.setProperty('--color-information-bg', currentTheme.informationBg);
    root.style.setProperty('--color-information-text', currentTheme.informationText);
    root.style.setProperty('--color-profile-bg', currentTheme.profileBg);
    root.style.setProperty('--color-profile-text', currentTheme.profileText);

    if (currentPresetKey.value === 'dark' || currentPresetKey.value === 'contrast') {
      root.classList.add('dark');
      if (currentPresetKey.value === 'contrast') {
        root.classList.add('high-contrast');
      } else {
        root.classList.remove('high-contrast');
      }
      root.style.colorScheme = 'dark';
    } else {
      root.classList.remove('dark');
      root.classList.remove('high-contrast');
      root.style.colorScheme = 'light';
    }
  };

  const saveTheme = () => {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(currentTheme));
        localStorage.setItem(PRESET_STORAGE_KEY, currentPresetKey.value);
      }
    } catch (e) {
      console.error('Failed to save theme to localStorage', e);
    }
    // Mirror into SQLite so the choice survives WebView storage wipes.
    void settingsRepo.setJson(STORAGE_KEY, { ...currentTheme });
    void settingsRepo.set(PRESET_STORAGE_KEY, currentPresetKey.value);
  };

  const applyPreset = (presetKey: PresetKey) => {
    const preset = THEME_PRESETS[presetKey];
    if (preset) {
      currentPresetKey.value = presetKey;
      Object.assign(currentTheme, preset);
      applyThemeToDOM();
      saveTheme();
    }
  };

  const updateColor = (key: keyof ThemeColors, value: string) => {
    currentTheme[key] = value;
    applyThemeToDOM();
    saveTheme();
  };

  const resetToDefault = () => {
    applyPreset('original');
  };

  return {
    theme: currentTheme,
    currentPresetKey,
    applyThemeToDOM,
    applyPreset,
    updateColor,
    resetToDefault,
    presets: THEME_PRESETS
  };
}
