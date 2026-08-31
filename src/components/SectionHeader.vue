<template>
  <div class="section-header-wrap">
    <div class="section-header" :class="`section-header--${color}`">
      <IonButton
        class="back-btn"
        :fill="undefined"
        :default-href="undefined"
        @click="goBack"
        :aria-label="$t('common.back')"
      >
        <IonIcon :icon="arrowBackOutline" />
      </IonButton>
      <div class="header-titles">
        <div class="header-title-row">
          <IonIcon v-if="icon" :icon="icon" class="header-icon" />
          <span class="header-title">{{ title }}</span>
        </div>
      </div>
    </div>
    <div
      v-if="breadcrumb"
      class="breadcrumb-pill"
      :class="`breadcrumb-pill--${color}`"
    >
      {{ breadcrumb }}
    </div>
  </div>
</template>

<script setup lang="ts">
import { IonButton, IonIcon } from '@ionic/vue';
import { arrowBackOutline } from 'ionicons/icons';
import { useIonRouter } from '@ionic/vue';
import { homePath } from '../config/app';

const props = defineProps<{
  title: string;
  icon?: object;
  color: 'red' | 'yellow' | 'green' | 'blue';
  breadcrumb?: string;
}>();

const ionRouter = useIonRouter();

function goBack(): void {
  if (ionRouter.canGoBack()) {
    ionRouter.back();
  } else {
    ionRouter.replace(homePath());
  }
}

void props;
</script>

<style scoped>
.section-header-wrap {
  display: flex;
  flex-direction: column;
}

.section-header {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 16px 16px 24px 16px;
  border-radius: 0 0 24px 24px;
  box-shadow: 0 4px 14px rgba(0, 0, 0, 0.12);
}

.section-header--red {
  background-color: var(--color-emergency-bg, #ff5c5c);
  color: var(--color-emergency-text, #000);
}

.section-header--yellow {
  background-color: var(--color-reminders-bg, #f6c945);
  color: var(--color-reminders-text, #000);
}

.section-header--green {
  background-color: var(--color-information-bg, #7bc62d);
  color: var(--color-information-text, #000);
}

.section-header--blue {
  background-color: var(--color-profile-bg, #33a1de);
  color: var(--color-profile-text, #000);
}

/* Breadcrumb "tab" hanging under the coloured header, per the mockups */
.breadcrumb-pill {
  align-self: center;
  margin-top: -16px;
  padding: 12px 36px;
  border-radius: 0 0 20px 20px;
  font-size: 1rem;
  font-weight: 700;
  max-width: 92%;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  text-align: center;
  position: relative;
  z-index: 2;
  box-shadow: 0 4px 10px rgba(0, 0, 0, 0.1);
}

.breadcrumb-pill--red {
  background-color: var(--color-emergency-bg, #ff5c5c);
  color: var(--color-emergency-text, #000);
}

.breadcrumb-pill--yellow {
  background-color: var(--color-reminders-bg, #f6c945);
  color: var(--color-reminders-text, #000);
}

.breadcrumb-pill--green {
  background-color: var(--color-information-bg, #7bc62d);
  color: var(--color-information-text, #000);
}

.breadcrumb-pill--blue {
  background-color: var(--color-profile-bg, #33a1de);
  color: var(--color-profile-text, #000);
}

.back-btn {
  --background: rgba(255, 255, 255, 0.85);
  --background-activated: rgba(255, 255, 255, 1);
  --border-radius: 50%;
  --padding-start: 8px;
  --padding-end: 8px;
  height: 36px;
  width: 36px;
  min-height: 36px;
  min-width: 36px;
  color: #1a1a1a;
  margin: 0;
  flex-shrink: 0;
}

.header-titles {
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
}

.header-title-row {
  display: flex;
  align-items: center;
  gap: 8px;
}

.header-icon {
  font-size: 1.4rem;
  flex-shrink: 0;
}

.header-title {
  font-size: 1.2rem;
  font-weight: 800;
}
</style>
