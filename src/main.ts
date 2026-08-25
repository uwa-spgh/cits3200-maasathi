import { createApp } from 'vue';
import { IonicVue } from '@ionic/vue';
import { createI18n } from 'vue-i18n';
import App from './App.vue';
import router from './router';
import en from './locales/en.json';

// Core Ionic CSS
import '@ionic/vue/css/core.css';
import '@ionic/vue/css/normalize.css';
import '@ionic/vue/css/structure.css';
import '@ionic/vue/css/typography.css';

const i18n = createI18n({
    locale: 'en',
    legacy: false, // Required for Vue 3 Composition API
    messages: { en }
});

const app = createApp(App)
    .use(IonicVue)
    .use(router)
    .use(i18n);

router.isReady().then(() => {
    app.mount('#app');
});