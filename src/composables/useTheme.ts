import { reactive } from 'vue';

export interface ThemeColors {
  appBg: string;
  cardBg: string;
  cardText: string;
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

export type PresetKey = 'vibrant' | 'pastel' | 'contrast' | 'dark';

export const THEME_PRESETS: Record<PresetKey, ThemeColors> = {
  vibrant: {
    appBg: '#FBF7F5',
    cardBg: '#EAEAEA',
    cardText: '#1A1A1A',
    btnMoreBg: '#7BC62D',
    btnMoreText: '#000000',
    emergencyBg: '#FF5C5C',
    emergencyText: '#000000',
    remindersBg: '#F6C945',
    remindersText: '#000000',
    informationBg: '#7BC62D',
    informationText: '#000000',
    profileBg: '#33A1DE',
    profileText: '#000000'
  },
  pastel: {
    appBg: '#FDFBF7',
    cardBg: '#F3EFEA',
    cardText: '#2D2D2D',
    btnMoreBg: '#A8E6CF',
    btnMoreText: '#1A3326',
    emergencyBg: '#FFB3BA',
    emergencyText: '#4A151B',
    remindersBg: '#FFDFBA',
    remindersText: '#4A3215',
    informationBg: '#BAFFC9',
    informationText: '#154A21',
    profileBg: '#BAE1FF',
    profileText: '#152E4A'
  },
  contrast: {
    appBg: '#FFFFFF',
    cardBg: '#000000',
    cardText: '#FFFFFF',
    btnMoreBg: '#00FF00',
    btnMoreText: '#000000',
    emergencyBg: '#D32F2F',
    emergencyText: '#FFFFFF',
    remindersBg: '#F57F17',
    remindersText: '#000000',
    informationBg: '#1B5E20',
    informationText: '#FFFFFF',
    profileBg: '#0D47A1',
    profileText: '#FFFFFF'
  },
  dark: {
    appBg: '#121212',
    cardBg: '#1E1E1E',
    cardText: '#E0E0E0',
    btnMoreBg: '#66BB6A',
    btnMoreText: '#000000',
    emergencyBg: '#EF5350',
    emergencyText: '#FFFFFF',
    remindersBg: '#FFCA28',
    remindersText: '#000000',
    informationBg: '#26A69A',
    informationText: '#FFFFFF',
    profileBg: '#42A5F5',
    profileText: '#FFFFFF'
  }
};

const STORAGE_KEY = 'maasathi_theme_colors';

function loadInitialTheme(): ThemeColors {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        return JSON.parse(saved);
      }
    }
  } catch (e) {
    console.error('Failed to load theme from localStorage', e);
  }
  return { ...THEME_PRESETS.vibrant };
}

const currentTheme = reactive<ThemeColors>(loadInitialTheme());

export function useTheme() {
  const applyThemeToDOM = () => {
    if (typeof document === 'undefined') return;
    const root = document.documentElement;
    if (!root) return;
    root.style.setProperty('--color-app-bg', currentTheme.appBg);
    root.style.setProperty('--color-card-bg', currentTheme.cardBg);
    root.style.setProperty('--color-card-text', currentTheme.cardText);
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
  };

  const saveTheme = () => {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(currentTheme));
      }
    } catch (e) {
      console.error('Failed to save theme to localStorage', e);
    }
  };

  const applyPreset = (presetKey: PresetKey) => {
    const preset = THEME_PRESETS[presetKey];
    if (preset) {
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
    applyPreset('vibrant');
  };

  return {
    theme: currentTheme,
    applyThemeToDOM,
    applyPreset,
    updateColor,
    resetToDefault,
    presets: THEME_PRESETS
  };
}
