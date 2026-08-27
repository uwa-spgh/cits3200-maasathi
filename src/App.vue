<template>
  <IonApp>
    <IonRouterOutlet />
  </IonApp>
</template>

<script setup lang="ts">
import { IonApp, IonRouterOutlet } from '@ionic/vue';
import { onMounted } from 'vue';
import { useTheme } from './composables/useTheme';

onMounted(() => {
  const { applyThemeToDOM } = useTheme();
  applyThemeToDOM();
});
</script>