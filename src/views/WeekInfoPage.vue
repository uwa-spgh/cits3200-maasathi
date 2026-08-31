<template>
  <PageShell
    :title="$t('week_info.title')"
    :icon="calendarOutline"
    color="green"
  >
    <div class="week-info">
      <div class="stage-card">
        <p class="stage-label">{{ stageLabel }}</p>
      </div>

      <PlaceholderBox
        :title="$t('week_info.current_stage_info')"
        :hint="$t('placeholder.hint')"
      />

      <PlaceholderBox
        :title="$t('week_info.upcoming_milestones')"
        :hint="$t('placeholder.hint')"
      />

      <IonButton expand="block" class="goto-btn" @click="goReminders">
        <IonIcon slot="start" :icon="timeOutline" />
        {{ $t('week_info.see_timeline') }}
      </IonButton>
    </div>
  </PageShell>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useIonRouter } from '@ionic/vue';
import { IonButton, IonIcon } from '@ionic/vue';
import { calendarOutline, timeOutline } from 'ionicons/icons';
import PageShell from '../components/PageShell.vue';
import PlaceholderBox from '../components/PlaceholderBox.vue';
import { usePregnancy } from '../composables/usePregnancy';
import { useI18n } from 'vue-i18n';

const ionRouter = useIonRouter();
const { t } = useI18n();
const { activePregnancy, mode, currentWeek, postpartumDay } = usePregnancy();

const stageLabel = computed(() => {
  if (!activePregnancy.value) return t('week_info.no_pregnancy');
  if (mode.value === 'ANC') {
    const week = currentWeek.value;
    return week !== null ? t('week_info.week_of', { week }) : t('week_info.week_unknown');
  }
  const day = postpartumDay.value;
  return day !== null ? t('week_info.day_after_birth', { day }) : t('week_info.week_unknown');
});

function goReminders(): void {
  ionRouter.push({ name: 'Reminders' });
}
</script>

<style scoped>
.week-info {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.stage-card {
  background-color: var(--color-card-bg, #eaeaea);
  border-radius: 20px;
  padding: 20px;
  text-align: center;
}

.stage-label {
  margin: 0;
  font-weight: 800;
  font-size: 1.2rem;
  color: var(--color-card-text, #1a1a1a);
}

.goto-btn {
  --background: var(--color-reminders-bg, #f6c945);
  --color: var(--color-reminders-text, #000);
  --border-radius: 999px;
  font-weight: 700;
}
</style>
