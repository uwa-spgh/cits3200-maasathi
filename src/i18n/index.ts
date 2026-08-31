import { createI18n } from 'vue-i18n';

import en from '../locales/en.json';
import bn from '../locales/bn.json';

let savedLocale = 'en';
try {
  if (typeof window !== 'undefined' && window.localStorage) {
    savedLocale = localStorage.getItem('maasathi_language') || 'en';
  }
} catch (e) {
  console.error('Failed to access localStorage', e);
}

/* eslint-disable @typescript-eslint/no-explicit-any */
const enMessages = (en as any).default || en;
const bnMessages = (bn as any).default || bn;

export const i18n = createI18n({
  locale: savedLocale,
  fallbackLocale: 'en',
  legacy: false,
  globalInjection: true,
  messages: {
    en: enMessages,
    bn: bnMessages
  }
});

export function t(key: string): string {
  const composer = i18n.global as unknown as { t: (k: string) => string };
  return composer.t(key);
}
