<template>
  <IonPage>
    <IonHeader class="ion-no-border">
      <SectionHeader
        :title="title"
        :icon="icon"
        :color="color"
        :breadcrumb="breadcrumb"
      />
    </IonHeader>

    <IonContent class="page-content" :class="{ 'ion-padding': padded }">
      <div class="page-inner" :class="{ 'max-width': maxWidth }">
        <slot />
      </div>
    </IonContent>

    <IonFooter v-if="getNavMode() === 'homeBar'" class="ion-no-border">
      <HomeBarFooter />
    </IonFooter>
  </IonPage>
</template>

<script setup lang="ts">
import { IonContent, IonFooter, IonHeader, IonPage } from '@ionic/vue';
import SectionHeader from './SectionHeader.vue';
import HomeBarFooter from './HomeBarFooter.vue';
import { getNavMode } from '../config/app';

withDefaults(
  defineProps<{
    title: string;
    icon?: object;
    color?: 'red' | 'yellow' | 'green' | 'blue';
    breadcrumb?: string;
    padded?: boolean;
    maxWidth?: boolean;
  }>(),
  {
    color: 'green',
    breadcrumb: undefined,
    padded: true,
    maxWidth: true
  }
);
</script>

<style scoped>
.page-content {
  --background: var(--color-app-bg, #fbf7f5);
}

.page-inner {
  padding-bottom: 24px;
}

.max-width {
  max-width: 480px;
  margin: 0 auto;
}
</style>
