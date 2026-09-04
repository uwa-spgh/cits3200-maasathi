<template>
  <PageShell
    :title="$t('profile.title')"
    :icon="personOutline"
    color="blue"
  >
    <div class="profile-menu">
      <button class="menu-item" @click="router.push({ name: 'ProfilePersonal' })">
        <IonIcon :icon="personOutline" class="menu-icon" />
        <span>{{ $t('profile.menu_personal') }}</span>
        <IonIcon :icon="chevronForwardOutline" class="chev" />
      </button>

      <button class="menu-item" @click="router.push({ name: 'ProfilePregnancy' })">
        <IonIcon :icon="medkitOutline" class="menu-icon" />
        <span class="menu-label">
          {{ $t('profile.menu_pregnancy') }}
          <span v-if="activePregnancy" class="menu-sub">
            {{ mode === 'PNC' ? $t('common.mode_pnc') : $t('common.mode_anc') }}
          </span>
        </span>
        <IonIcon :icon="chevronForwardOutline" class="chev" />
      </button>

      <button class="menu-item" @click="router.push({ name: 'ProfileVaccination' })">
        <IonIcon :icon="shieldCheckmarkOutline" class="menu-icon" />
        <span class="menu-label">
          {{ $t('profile.menu_vaccination') }}
          <span v-if="ttShortStatus" class="menu-sub">{{ ttShortStatus }}</span>
        </span>
        <IonIcon :icon="chevronForwardOutline" class="chev" />
      </button>

      <button class="menu-item" @click="router.push({ name: 'ProfileContacts' })">
        <IonIcon :icon="callOutline" class="menu-icon" />
        <span>{{ $t('profile.menu_contacts') }}</span>
        <IonIcon :icon="chevronForwardOutline" class="chev" />
      </button>

      <button class="menu-item" @click="router.push({ name: 'ProfileSettings' })">
        <IonIcon :icon="settingsOutline" class="menu-icon" />
        <span>{{ $t('profile.menu_settings') }}</span>
        <IonIcon :icon="chevronForwardOutline" class="chev" />
      </button>

      <section class="history-block">
        <h2 class="history-title">{{ $t('profile.history_section') }}</h2>
        <p v-if="historyList.length === 0" class="history-empty">{{ $t('profile.history_empty') }}</p>
        <button
          v-for="summary in historyList"
          :key="summary.pregnancy.id"
          class="menu-item history-row"
          @click="openHistory(summary.pregnancy.id)"
        >
          <IonIcon :icon="archiveOutline" class="menu-icon" />
          <span>{{ historyTitle(summary) }}</span>
          <IonIcon :icon="chevronForwardOutline" class="chev" />
        </button>
      </section>
    </div>
  </PageShell>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import { useIonRouter } from '@ionic/vue';
import { useI18n } from 'vue-i18n';
import { IonIcon } from '@ionic/vue';
import {
  archiveOutline,
  callOutline,
  chevronForwardOutline,
  medkitOutline,
  personOutline,
  settingsOutline,
  shieldCheckmarkOutline
} from 'ionicons/icons';

import PageShell from '../components/PageShell.vue';
import { usePregnancy } from '../composables/usePregnancy';
import { useTt } from '../composables/useTt';
import { useHistory, type PregnancySummary } from '../composables/useHistory';

const router = useIonRouter();
const { t } = useI18n();
const { activePregnancy, mode } = usePregnancy();
const { isComplete, isUnknown } = useTt();
const { historyList, loadAll } = useHistory();

const ttShortStatus = computed(() => {
  if (isComplete.value) return t('tt.status_complete');
  if (isUnknown.value) return t('tt.status_unknown');
  return '';
});

function historyTitle(summary: PregnancySummary): string {
  return summary.deliveryDisplay || summary.eddDisplay || summary.lmpDisplay || t('profile.history_item');
}

function openHistory(pregnancyId: string): void {
  router.push({ name: 'HistorySummary', params: { pregnancyId } });
}onMounted(() => {
  void loadAll();
});
</script>

<style scoped>
.profile-menu {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.menu-item {
  display: flex;
  align-items: center;
  gap: 14px;
  width: 100%;
  background-color: var(--color-card-bg, #eaeaea);
  color: var(--color-card-text, #1a1a1a);
  border: none;
  border-radius: 18px;
  padding: 16px;
  font-size: 1rem;
  font-weight: 700;
  text-align: left;
  cursor: pointer;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  transition: transform 0.15s ease;
}

.menu-item:active {
  transform: scale(0.98);
}

.menu-icon {
  font-size: 1.5rem;
  color: var(--color-profile-bg, #33a1de);
  flex-shrink: 0;
}

.menu-label {
  display: flex;
  flex-direction: column;
  gap: 2px;
  flex: 1;
}

.menu-item > span:first-of-type {
  flex: 1;
}

.menu-sub {
  font-size: 0.78rem;
  font-weight: 600;
  opacity: 0.65;
}

.chev {
  margin-left: auto;
  opacity: 0.5;
}

.history-block {
  background-color: transparent;
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-top: 8px;
}

.history-title {
  margin: 0 4px;
  font-size: 1rem;
  font-weight: 800;
  color: var(--color-card-text, #1a1a1a);
}

.history-empty {
  margin: 0 4px;
  font-size: 0.85rem;
  font-style: italic;
  opacity: 0.6;
  color: var(--color-card-text, #1a1a1a);
}

.history-row .menu-icon {
  color: rgba(0, 0, 0, 0.4);
}
</style>
