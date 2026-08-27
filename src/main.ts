import { createApp } from 'vue';
import { IonicVue } from '@ionic/vue';
import { createI18n } from 'vue-i18n';
import App from './App.vue';
import router from './router';

import en from './locales/en.json';
import bn from './locales/bn.json';

// Core Ionic CSS
import '@ionic/vue/css/core.css';
import '@ionic/vue/css/normalize.css';
import '@ionic/vue/css/structure.css';
import '@ionic/vue/css/typography.css';

// Optional CSS utils for Ionic
import '@ionic/vue/css/padding.css';
import '@ionic/vue/css/float-elements.css';
import '@ionic/vue/css/text-alignment.css';
import '@ionic/vue/css/text-transformation.css';
import '@ionic/vue/css/flex-utils.css';
import '@ionic/vue/css/display.css';

import './theme/variables.css';
import { useTheme } from './composables/useTheme';

let savedLocale = 'en';
try {
  if (typeof window !== 'undefined' && window.localStorage) {
    savedLocale = localStorage.getItem('maasathi_language') || 'en';
  }
} catch (e) {
  console.error('Failed to access localStorage', e);
}

const enMessages = (en as any).default || en;
const bnMessages = (bn as any).default || bn;

const i18n = createI18n({
  locale: savedLocale,
  fallbackLocale: 'en',
  legacy: false, // Required for Vue 3 Composition API
  globalInjection: true, // Enables $t globally in template expressions
  messages: {
    en: enMessages,
    bn: bnMessages
  }
});

const app = createApp(App);

app.use(IonicVue);
app.use(router);
app.use(i18n);

const { applyThemeToDOM } = useTheme();
applyThemeToDOM();

app.mount('#app');