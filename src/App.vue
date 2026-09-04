<template>
  <IonApp>
    <IonRouterOutlet />
  </IonApp>
</template>

<script setup lang="ts">
import { onMounted } from 'vue';
import { IonApp, IonRouterOutlet } from '@ionic/vue';
import { useIonRouter } from '@ionic/vue';
import { App as CapApp } from '@capacitor/app';
import { useTheme } from './composables/useTheme';
import { consumeBackHandler } from './utils/backHandler';

const ionRouter = useIonRouter();

onMounted(() => {
  const { applyThemeToDOM } = useTheme();
  applyThemeToDOM();

  // Android hardware / gesture back. Runs at a higher priority than
  // Ionic's default handler so it fully owns the behaviour:
  // 1. Screens with internal back state (e.g. the onboarding wizard)
  //    consume the press first.
  // 2. Otherwise Ionic's view stack pops with the back animation.
  // 3. At the root of the stack the app closes.
  document.addEventListener('ionBackButton', (ev) => {
    const detail = (ev as CustomEvent).detail as {
      register: (priority: number, handler: () => void) => void;
    };
    detail.register(100, () => {
      if (consumeBackHandler()) return;
      if (ionRouter.canGoBack()) {
        ionRouter.back();
      } else {
        void CapApp.exitApp();
      }
    });
  });
});
</script>
