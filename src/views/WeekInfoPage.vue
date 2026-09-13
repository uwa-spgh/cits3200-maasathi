<template>
  <PageShell
    :title="$t('week_info.title')"
    :icon="calendarOutline"
    color="blue"
  >
    <div class="week-info">
      <div class="stage-card">
        <p class="stage-label">{{ stageLabel }}</p>
      </div>

      <ExpandableCard :title="$t('week_info.current_stage_info')">
        <ContentText :text="stageText" />
      </ExpandableCard>

      <ExpandableCard :title="$t('week_info.upcoming_milestones')">
        <ContentText :text="$t('week_info.body_milestones') || $t('content.empty')" />
      </ExpandableCard>

      <div class="browse-section">
        <button
          v-for="link in infoLinks"
          :key="link.route"
          class="browse-btn"
          :class="{ danger: link.danger }"
          @click="ionRouter.push({ name: link.route })"
        >
          {{ $t(link.label) }}
        </button>
      </div>

      <IonButton expand="block" class="goto-btn" @click="goReminders">
        <IonIcon slot="start" :icon="timeOutline" />
        {{ $t('week_info.see_timeline') }}
      </IonButton>
    </div>
  </PageShell>
</template>

<script setup lang="ts">
import { computed, onMounted } from 'vue';
import { useIonRouter } from '@ionic/vue';
import { IonButton, IonIcon } from '@ionic/vue';
import { calendarOutline, timeOutline } from 'ionicons/icons';
import PageShell from '../components/PageShell.vue';
import ExpandableCard from '../components/ExpandableCard.vue';
import ContentText from '../components/ContentText.vue';
import { usePregnancy } from '../composables/usePregnancy';
import { useSchedule } from '../composables/useSchedule';
import { currentStageRef } from '../utils/stageArticle';
import { useI18n } from 'vue-i18n';

const ionRouter = useIonRouter();
const { t } = useI18n();
const { activePregnancy, mode, currentWeek, postpartumDay } = usePregnancy();
const { items, load: loadSchedule } = useSchedule();

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

onMounted(() => {
  void loadSchedule();
});

/** Stage article text; a hand-written week_info.body_stage value wins if present. */
const stageText = computed(() => {
  const override = t('week_info.body_stage');
  if (override) return override;
  if (!activePregnancy.value) return t('week_info.no_pregnancy');
  const stage = currentStageRef(items.value, mode.value);
  if (!stage) return t('content.empty');
  const key = stage.ns === 'pnc' ? `pnc.contact_body.${stage.ref}` : `anc.visit_body.${stage.ref}`;
  return t(key) || t('content.empty');
});

const infoLinks = [
  { route: 'Anc', label: 'information.topics.anc', danger: false },
  { route: 'Pnc', label: 'information.topics.pnc', danger: false },
  { route: 'Nutrition', label: 'information.topics.nutrition', danger: false },
  { route: 'Vaccination', label: 'information.topics.vaccination', danger: false },
  { route: 'DangerSigns', label: 'information.topics.danger_signs', danger: true }
];
</script>

<style scoped>
.week-info {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.stage-card {
  background-color: #fff;
  border: 1.5px solid rgba(0, 0, 0, 0.1);
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

.browse-section {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.browse-btn {
  background-color: #fff;
  color: var(--color-card-text, #1a1a1a);
  border: 2px solid var(--color-information-bg, #7bc62d);
  border-radius: 20px;
  padding: 14px 20px;
  font-size: 1rem;
  font-weight: 700;
  cursor: pointer;
  box-shadow: 0 3px 10px rgba(0, 0, 0, 0.08);
  text-align: left;
}

.browse-btn:active {
  transform: scale(0.97);
}

.browse-btn.danger {
  border-color: var(--color-emergency-bg, #ff5c5c);
}
</style>
