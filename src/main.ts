import { createApp } from 'vue';
import { IonicVue } from '@ionic/vue';
import App from './App.vue';
import { createRouter } from './router';
import { i18n } from './i18n';

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

const app = createApp(App);

const router = createRouter();

app.use(IonicVue);
app.use(router);
app.use(i18n);

const { applyThemeToDOM } = useTheme();
applyThemeToDOM();

void router.isReady().then(() => {
  app.mount('#app');
});
