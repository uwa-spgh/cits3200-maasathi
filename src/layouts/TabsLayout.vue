<template>
  <IonTabs>
    <IonRouterOutlet />
    <IonTabBar slot="bottom" class="app-tab-bar">
      <IonTabButton tab="home" href="/tabs/home">
        <IonIcon :icon="homeOutline" />
        <IonLabel>{{ $t('nav.home') }}</IonLabel>
      </IonTabButton>
      <IonTabButton tab="reminders" href="/tabs/reminders">
        <IonIcon :icon="timeOutline" />
        <IonLabel>{{ $t('nav.reminders') }}</IonLabel>
      </IonTabButton>
      <IonTabButton tab="information" href="/tabs/information">
        <IonIcon :icon="informationCircleOutline" />
        <IonLabel>{{ $t('nav.information') }}</IonLabel>
      </IonTabButton>
      <IonTabButton tab="profile" href="/tabs/profile">
        <IonIcon :icon="personOutline" />
        <IonLabel>{{ $t('nav.profile') }}</IonLabel>
      </IonTabButton>
    </IonTabBar>
  </IonTabs>
</template>

<script setup lang="ts">
import {
  IonIcon,
  IonLabel,
  IonRouterOutlet,
  IonTabBar,
  IonTabButton,
  IonTabs
} from '@ionic/vue';
import {
  homeOutline,
  informationCircleOutline,
  personOutline,
  timeOutline
} from 'ionicons/icons';
</script>

<style scoped>
.app-tab-bar {
  --background: var(--color-card-bg, #eaeaea);
  border-top: 1px solid rgba(0, 0, 0, 0.08);
}

.app-tab-bar ion-tab-button {
  --color: var(--color-card-text, #1a1a1a);
  --color-selected: var(--color-btn-more-bg, #7bc62d);
  --background: transparent;
  font-weight: 600;
}
</style>
