<!--
  ProfilePage — profile menu: links to personal details, pregnancy, vaccination and birth plan; language and appearance settings; archived pregnancies; and a reset-all-data action behind a confirmation.
-->
<template>
  <PageShell
    nav="profile"
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

      <button class="menu-item" @click="router.push({ name: 'ProfilePlan' })">
        <IonIcon :icon="bookmarkOutline" class="menu-icon" />
        <span>{{ $t('profile.menu_birth_plan') }}</span>
        <IonIcon :icon="chevronForwardOutline" class="chev" />
      </button>

      <div class="menu-item lang-row">
        <IonIcon :icon="languageOutline" class="menu-icon" />
        <span>{{ $t('language.select') }}</span>
        <LanguageSwitcher class="lang-inline" />
      </div>

      <div class="menu-item appearance-row" role="radiogroup" :aria-label="$t('theme.title')">
        <IonIcon :icon="colorPaletteOutline" class="menu-icon" />
        <span class="appearance-label">{{ $t('theme.title') }}</span>
        <div class="appearance-options">
          <button
            v-for="option in themeOptions"
            :key="option"
            type="button"
            role="radio"
            class="appearance-option"
            :class="{ active: themeMode === option }"
            :aria-checked="themeMode === option"
            @click="setThemeMode(option)"
          >
            {{ $t(`theme.${option}`) }}
          </button>
        </div>
      </div>

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

      <button class="menu-item reset-row" @click="confirmReset">
        <IonIcon :icon="trashOutline" class="menu-icon" />
        <span>{{ $t('profile.reset_data_btn') }}</span>
      </button>
    </div>
  </PageShell>
</template>

<script setup lang="ts">
import { computed, onMounted } from 'vue';
import { useIonRouter } from '@ionic/vue';
import { useI18n } from 'vue-i18n';
import { IonIcon, alertController, toastController } from '@ionic/vue';
import {
  archiveOutline,
  bookmarkOutline,
  colorPaletteOutline,
  chevronForwardOutline,
  languageOutline,
  medkitOutline,
  personOutline,
  shieldCheckmarkOutline,
  trashOutline
} from 'ionicons/icons';

import PageShell from '../components/PageShell.vue';
import LanguageSwitcher from '../components/LanguageSwitcher.vue';
import { usePregnancy } from '../composables/usePregnancy';
import { useTt } from '../composables/useTt';
import { useTheme, THEME_MODES } from '../composables/useTheme';
import { useHistory, type PregnancySummary } from '../composables/useHistory';
import { clearAllData } from '../db/database';
import { forceCancelAllReminders } from '../services/notifications.js';

const router = useIonRouter();
const { mode: themeMode, setMode: setThemeMode } = useTheme();
const themeOptions = THEME_MODES;
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
}

async function confirmReset(): Promise<void> {
  const alert = await alertController.create({
    header: t('profile.reset_confirm_title'),
    message: t('profile.reset_confirm_message'),
    buttons: [
      { text: t('common.cancel'), role: 'cancel' },
      {
        text: t('common.confirm'),
        role: 'destructive',
        handler: () => {
          void clearAllData()
            .then(async () => {
              try {
                localStorage.clear();
                await forceCancelAllReminders();
              } catch (e) {
                console.error('reset failed', e);
              }
              window.location.href = '/onboarding';
            })
            .catch(async (e) => {
              console.error('reset failed', e);
              const toast = await toastController.create({
                message: t('profile.reset_failed'),
                duration: 3000,
                position: 'bottom'
              });
              await toast.present();
            });
        }
      }
    ]
  });
  await alert.present();
}

onMounted(() => {
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
  background-color: var(--color-surface, #fff);
  color: var(--color-surface-text, #1a1a1a);
  border: 1.5px solid var(--color-border, rgba(0, 0, 0, 0.1));
  border-radius: 18px;
  padding: 16px;
  font-size: 1rem;
  font-weight: 700;
  text-align: left;
  cursor: pointer;
  box-shadow: 0 2px 8px var(--color-shadow, rgba(0, 0, 0, 0.08));
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
  color: var(--color-text-muted, #5c5c5c);
}

.chev {
  margin-left: auto;
  color: color-mix(in srgb, var(--color-surface-text, #1a1a1a) 50%, var(--color-surface, #fff));
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
  color: var(--color-text-muted, #5c5c5c);
}

.history-row .menu-icon {
  color: color-mix(in srgb, var(--color-surface-text, #1a1a1a) 40%, var(--color-surface, #fff));
}

.lang-row {
  cursor: default;
}

.lang-row .lang-inline {
  margin-left: auto;
}

.appearance-row {
  flex-wrap: wrap;
  cursor: default;
}

.appearance-label {
  flex: 1;
}

.appearance-options {
  display: flex;
  width: 100%;
  gap: 8px;
}

.appearance-option {
  flex: 1;
  padding: 10px 6px;
  border-radius: 12px;
  border: 1.5px solid var(--color-border);
  background: transparent;
  color: var(--color-surface-text);
  font-size: 0.85rem;
  font-weight: 700;
  cursor: pointer;
}

.appearance-option.active {
  background: var(--color-profile-bg);
  border-color: var(--color-profile-bg);
  color: var(--color-profile-text);
}

.reset-row {
  margin-top: 8px;
  color: var(--color-danger, #c0392b);
}

.reset-row .menu-icon {
  color: var(--color-danger, #c0392b);
}
</style>
