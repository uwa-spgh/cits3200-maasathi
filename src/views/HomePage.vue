<template>
  <IonPage>
    <IonHeader class="ion-no-border">
      <IonToolbar class="custom-toolbar">
        <IonTitle class="app-title">{{ $t('app.title') }}</IonTitle>
        <IonButtons slot="end">
          <LanguageSwitcher />
        </IonButtons>
      </IonToolbar>
    </IonHeader>

    <IonContent class="home-content ion-padding">
      <div class="content-wrapper">
        <!-- Header Greeting -->
        <div class="greeting-container">
          <h1 class="greeting-text">
            {{ $t('greeting', { name: userName && userName.trim() ? userName : $t('user_default') }) }}
          </h1>
          <p v-if="statusChip" class="status-chip">{{ statusChip }}</p>
        </div>

        <!-- Information Card (Placeholders for dynamic data) -->
        <div class="info-card">
          <p class="info-intro">{{ $t('info_card.title') }}</p>
          <p class="info-body">
            {{ infoMessage }}
          </p>
          <button class="know-more-btn" @click="go('WeekInfo')">
            <IonIcon :icon="informationCircleOutline" class="btn-icon" />
            <span>{{ $t('info_card.know_more') }}</span>
          </button>
        </div>

        <!-- 2x2 Grid of Main Action Tiles -->
        <div class="action-grid">
          <!-- Emergency Button -->
          <button
            class="tile-btn emergency-tile"
            @click="go('Emergency')"
            :aria-label="$t('buttons.emergency')"
          >
            <IonIcon :icon="warningOutline" class="tile-icon" />
            <span class="tile-label">{{ $t('buttons.emergency') }}</span>
          </button>

          <!-- Reminders Button -->
          <button
            class="tile-btn reminders-tile"
            @click="go('Reminders')"
            :aria-label="$t('buttons.reminders')"
          >
            <IonIcon :icon="timeOutline" class="tile-icon" />
            <span class="tile-label">{{ $t('buttons.reminders') }}</span>
          </button>

          <!-- Information Button -->
          <button
            class="tile-btn information-tile"
            @click="go('Information')"
            :aria-label="$t('buttons.information')"
          >
            <IonIcon :icon="informationCircleOutline" class="tile-icon" />
            <span class="tile-label">{{ $t('buttons.information') }}</span>
          </button>

          <!-- Profile Button -->
          <button
            class="tile-btn profile-tile"
            @click="go('Profile')"
            :aria-label="$t('buttons.profile')"
          >
            <IonIcon :icon="personOutline" class="tile-icon" />
            <span class="tile-label">{{ $t('buttons.profile') }}</span>
          </button>
        </div>
      </div>
    </IonContent>

    <IonFooter v-if="isHomeBar" class="ion-no-border">
      <HomeBarFooter />
    </IonFooter>
  </IonPage>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import {
  IonContent,
  IonFooter,
  IonHeader,
  IonIcon,
  IonButtons,
  IonPage,
  IonTitle,
  IonToolbar
} from '@ionic/vue';
import { useI18n } from 'vue-i18n';
import {
  informationCircleOutline,
  personOutline,
  timeOutline,
  warningOutline
} from 'ionicons/icons';

import LanguageSwitcher from '../components/LanguageSwitcher.vue';
import HomeBarFooter from '../components/HomeBarFooter.vue';
import { useUser } from '../composables/useUser';
import { usePregnancy } from '../composables/usePregnancy';
import { getNavMode } from '../config/app';
import { useIonRouter } from '@ionic/vue';

const ionRouter = useIonRouter();
const { t } = useI18n();
const { userName } = useUser();
const { activePregnancy, mode, currentWeek, postpartumDay } = usePregnancy();

const isHomeBar = computed(() => getNavMode() === 'homeBar');

function go(routeName: string): void {
  ionRouter.push({ name: routeName });
}

const statusChip = computed(() => {
  if (!activePregnancy.value) return '';
  if (mode.value === 'ANC') {
    const week = currentWeek.value;
    return week !== null ? t('home.status_anc', { week }) : t('home.status_anc_unknown');
  }
  const day = postpartumDay.value;
  return day !== null ? t('home.status_pnc', { day }) : '';
});

const infoMessage = computed(() => {
  if (!activePregnancy.value) {
    return t('home.no_pregnancy');
  }
  if (mode.value === 'ANC') {
    const week = currentWeek.value;
    return week !== null
      ? t('home.info_anc', { week })
      : t('home.info_anc_unknown');
  }
  const day = postpartumDay.value;
  return t('home.info_pnc', { day });
});
</script>

<style scoped>
.custom-toolbar {
  --background: transparent;
  --color: var(--color-card-text, #1a1a1a);
  --border-width: 0;
  padding-left: 8px;
  padding-right: 8px;
}

.app-title {
  font-weight: 700;
  font-size: 1.25rem;
}

.home-content {
  --background: var(--color-app-bg, #fbf7f5);
}

.content-wrapper {
  max-width: 480px;
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 24px;
  padding-top: 10px;
  padding-bottom: 20px;
}

/* Greeting */
.greeting-container {
  width: 100%;
  text-align: center;
  margin-top: 8px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.greeting-text {
  font-size: 2.2rem;
  font-weight: 800;
  color: var(--color-card-text, #111111);
  margin: 0;
  letter-spacing: -0.5px;
}

.status-chip {
  align-self: center;
  margin: 0;
  background-color: var(--color-card-bg, #eaeaea);
  color: var(--color-card-text, #1a1a1a);
  font-size: 0.85rem;
  font-weight: 700;
  border-radius: 999px;
  padding: 6px 14px;
}

/* Info Card */
.info-card {
  width: 100%;
  background-color: var(--color-card-bg, #eaeaea);
  color: var(--color-card-text, #1a1a1a);
  border-radius: 28px;
  padding: 24px 20px 20px 20px;
  text-align: center;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.06);
  display: flex;
  flex-direction: column;
  align-items: center;
  transition: background-color 0.3s ease, color 0.3s ease;
}

.info-intro {
  font-size: 1.05rem;
  font-weight: 700;
  margin: 0 0 12px 0;
  line-height: 1.35;
}

.info-body {
  font-size: 0.95rem;
  font-weight: 600;
  line-height: 1.45;
  margin: 0 0 20px 0;
  color: inherit;
  opacity: 0.9;
}

.know-more-btn {
  background-color: var(--color-btn-more-bg, #7bc62d);
  color: var(--color-btn-more-text, #000000);
  border: none;
  border-radius: 24px;
  padding: 10px 20px;
  font-size: 0.95rem;
  font-weight: 700;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  cursor: pointer;
  box-shadow: 0 3px 8px rgba(0, 0, 0, 0.15);
  transition: transform 0.15s ease, filter 0.15s ease, background-color 0.3s ease;
}

.know-more-btn:active {
  transform: scale(0.97);
}

.btn-icon {
  font-size: 1.25rem;
}

/* 2x2 Grid of Action Buttons */
.action-grid {
  width: 100%;
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 18px;
  margin-top: 4px;
}

.tile-btn {
  border: none;
  border-radius: 28px;
  aspect-ratio: 1.15;
  padding: 16px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 10px;
  cursor: pointer;
  box-shadow: 0 6px 16px rgba(0, 0, 0, 0.12);
  transition: transform 0.15s ease, box-shadow 0.15s ease, background-color 0.3s ease, color 0.3s ease;
}

.tile-btn:active {
  transform: scale(0.96);
  box-shadow: 0 3px 8px rgba(0, 0, 0, 0.15);
}

.tile-icon {
  font-size: 3rem;
}

.tile-label {
  font-size: 1.1rem;
  font-weight: 700;
}

/* Tile Dynamic Colors */
.emergency-tile {
  background-color: var(--color-emergency-bg, #ff5c5c);
  color: var(--color-emergency-text, #000000);
}

.reminders-tile {
  background-color: var(--color-reminders-bg, #f6c945);
  color: var(--color-reminders-text, #000000);
}

.information-tile {
  background-color: var(--color-information-bg, #7bc62d);
  color: var(--color-information-text, #000000);
}

.profile-tile {
  background-color: var(--color-profile-bg, #33a1de);
  color: var(--color-profile-text, #000000);
}
</style>
