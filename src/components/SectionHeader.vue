<template>
  <div class="section-header-wrap">
    <div class="section-header">
      <button
        class="back-btn"
        @click="goBack"
        :aria-label="$t('common.back')"
      >
        <IonIcon :icon="arrowBackCircleOutline" />
      </button>
      <div class="header-titles">
        <div class="header-title-row">
          <IonIcon v-if="icon" :icon="icon" class="header-icon" :class="`tint-${color}`" />
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
import { IonIcon } from '@ionic/vue';
import { arrowBackCircleOutline } from 'ionicons/icons';
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
  background: transparent;
}

.section-header {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 16px 6px 16px;
}

.back-btn {
  border: none;
  background: transparent;
  color: var(--color-card-text, #1a1a1a);
  cursor: pointer;
  padding: 2px;
  display: flex;
  flex-shrink: 0;
}

.back-btn:active {
  transform: scale(0.9);
}

.back-btn ion-icon {
  font-size: 1.7rem;
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
  color: var(--color-card-text, #1a1a1a);
}

.header-icon {
  font-size: 1.35rem;
  flex-shrink: 0;
}

.header-icon.tint-red { color: var(--color-emergency-bg, #ff5c5c); }
.header-icon.tint-yellow { color: #d9a521; }
.header-icon.tint-green { color: var(--color-information-bg, #7bc62d); }
.header-icon.tint-blue { color: var(--color-profile-bg, #33a1de); }

.header-title {
  font-size: 1.35rem;
  font-weight: 800;
}

/* Small hanging tab under the title, per the mockups */
.breadcrumb-pill {
  align-self: center;
  margin-top: 6px;
  padding: 5px 22px;
  border-radius: 999px;
  font-size: 0.85rem;
  font-weight: 800;
  max-width: 92%;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  text-align: center;
  background: #fff;
  color: var(--color-card-text, #1a1a1a);
  border: 2px solid transparent;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
}

.breadcrumb-pill--red { border-color: var(--color-emergency-bg, #ff5c5c); }
.breadcrumb-pill--yellow { border-color: var(--color-reminders-bg, #f6c945); }
.breadcrumb-pill--green { border-color: var(--color-information-bg, #7bc62d); }
.breadcrumb-pill--blue { border-color: var(--color-profile-bg, #33a1de); }
</style>
