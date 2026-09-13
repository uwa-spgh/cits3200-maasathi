<template>
  <PageShell
    :title="$t('week_info.title')"
    :icon="informationCircleOutline"
    color="blue"
  >
    <div class="information-page">
      <!-- Stage Info Card (mode-scoped: ANC if ANC, PNC if PNC) -->
      <div class="stage-card">
        <div class="stage-header">
          <span class="stage-badge">{{ modeBadgeText }}</span>
          <span v-if="stageTimingText" class="timing-badge">{{ stageTimingText }}</span>
        </div>

        <h2 class="stage-title">{{ stageHeading }}</h2>

        <p v-if="stageOverview" class="stage-summary">
          {{ stageOverview }}
        </p>

        <div v-if="stageOverview" class="stage-actions">
          <button class="listen-btn" @click="listen(stageOverview)">
            <IonIcon :icon="volumeMediumOutline" />
            <span>{{ $t('home.cards.listen') }}</span>
          </button>
        </div>
      </div>

      <!-- Stage guidance cards for this visit (without nutrition) -->
      <section v-if="stageTopics.length" class="stage-topics-section">
        <h3 class="topics-heading">{{ $t('stage_nav.topics_heading') }}</h3>

        <ExpandableCard
          v-for="topic in stageTopics"
          :key="`${topic.ns}.${topic.key}`"
          :title="$t(`${topic.ns}.${topic.key}_title`)"
        >
          <ul class="point-list">
            <li v-for="n in topic.points" :key="n">
              {{ $t(`${topic.ns}.${topic.key}.point${n}`) }}
            </li>
          </ul>
        </ExpandableCard>
      </section>

      <!-- Fallback if no topic cards mapped for this stage -->
      <ExpandableCard v-else-if="fallbackText" :title="$t('week_info.current_stage_info')">
        <ContentText :text="fallbackText" />
      </ExpandableCard>
    </div>
  </PageShell>
</template>

<script setup lang="ts">
import { computed, onMounted } from 'vue';
import { useRoute } from 'vue-router';
import { IonIcon } from '@ionic/vue';
import { informationCircleOutline, volumeMediumOutline } from 'ionicons/icons';
import PageShell from '../components/PageShell.vue';
import ExpandableCard from '../components/ExpandableCard.vue';
import ContentText from '../components/ContentText.vue';
import { usePregnancy } from '../composables/usePregnancy';
import { useSchedule } from '../composables/useSchedule';
import { useSpeech } from '../composables/useSpeech';
import { currentStageRef, getStageSummary, STAGE_NOW_TOPICS } from '../utils/stageArticle';
import { useI18n } from 'vue-i18n';

const route = useRoute();
const { t, locale } = useI18n();
const { activePregnancy, mode, currentWeek, postpartumDay } = usePregnancy();
const { items, load: loadSchedule } = useSchedule();
const { speak } = useSpeech();

onMounted(() => {
  void loadSchedule();
});

const targetMode = computed<'ANC' | 'PNC'>(() => {
  const m = route.query.mode;
  if (m === 'ANC' || m === 'PNC') return m;
  return mode.value;
});

const isAnc = computed(() => targetMode.value === 'ANC');

const modeBadgeText = computed(() => {
  return isAnc.value ? t('stage_nav.tab_anc') : t('stage_nav.tab_pnc');
});

const targetRef = computed<string>(() => {
  const r = route.query.ref;
  if (typeof r === 'string' && r) return r;
  const current = currentStageRef(items.value, mode.value);
  return current?.ref ?? 'visit1';
});

const currentStage = computed(() => {
  const m = targetMode.value;
  const ref = targetRef.value;
  const ns = (m === 'PNC' ? 'pnc' : 'anc') as 'anc' | 'pnc';
  return {
    mode: m,
    ref,
    ns,
    stageKey: `${m}:${ref}`
  };
});

const stageTimingText = computed(() => {
  const ref = targetRef.value;
  const key = `stage_nav.timing_${ref}`;
  const val = t(key);
  if (val && val !== key) return val;
  if (isAnc.value) {
    const week = currentWeek.value;
    return week !== null ? t('week_info.week_of', { week }) : '';
  }
  const day = postpartumDay.value;
  return day !== null ? t('week_info.day_after_birth', { day }) : '';
});

const stageHeading = computed(() => {
  const stage = currentStage.value;
  const key = `timeline.${stage.ns}.${stage.ref}`;
  const val = t(key);
  if (val && val !== key) return val;
  return stageTimingText.value || t('week_info.title');
});

const stageOverview = computed(() => {
  const stage = currentStage.value;
  return getStageSummary(stage.mode, stage.ref, t);
});

const stageTopics = computed(() => {
  const stage = currentStage.value;
  // STAGE_NOW_TOPICS has nutrition excluded
  return STAGE_NOW_TOPICS[stage.stageKey] ?? [];
});

const fallbackText = computed(() => {
  const override = t('week_info.body_stage');
  if (override) return override;
  if (!activePregnancy.value) return t('week_info.no_pregnancy');
  const stage = currentStage.value;
  const key = stage.ns === 'pnc' ? `pnc.contact_body.${stage.ref}` : `anc.visit_body.${stage.ref}`;
  return t(key) || t('content.empty');
});

function listen(text: string): void {
  speak(text, locale.value);
}
</script>

<style scoped>
.information-page {
  display: flex;
  flex-direction: column;
  gap: 16px;
  padding-bottom: 24px;
}

.stage-card {
  background: #fff;
  border: 1.5px solid rgba(43, 123, 196, 0.2);
  border-radius: 20px;
  padding: 18px;
  text-align: left;
  box-shadow: 0 4px 14px rgba(43, 123, 196, 0.06);
}

.stage-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 8px;
  flex-wrap: wrap;
}

.stage-badge {
  font-size: 0.74rem;
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  background: #2b7bc4;
  color: #fff;
  padding: 3px 8px;
  border-radius: 6px;
}

.timing-badge {
  font-size: 0.74rem;
  font-weight: 700;
  background: #f1f5f9;
  color: #475569;
  padding: 3px 8px;
  border-radius: 6px;
}

.stage-title {
  margin: 4px 0 10px 0;
  font-weight: 800;
  font-size: 1.25rem;
  color: #1a1a1a;
  line-height: 1.3;
}

.stage-summary {
  margin: 0 0 14px 0;
  font-size: 0.95rem;
  line-height: 1.5;
  color: #374151;
}

.stage-actions {
  display: flex;
  gap: 10px;
}

.listen-btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  background: #f1f5f9;
  border: 1px solid #cbd5e1;
  color: #334155;
  padding: 6px 12px;
  border-radius: 10px;
  font-size: 0.84rem;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.15s ease;
}

.listen-btn:active {
  background: #e2e8f0;
}

.stage-topics-section {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.topics-heading {
  font-size: 0.96rem;
  font-weight: 800;
  color: #1e293b;
  margin: 4px 0 2px 4px;
}

.point-list {
  margin: 0;
  padding-left: 20px;
  line-height: 1.5;
}

.point-list li {
  margin-bottom: 6px;
  color: #374151;
  font-size: 0.92rem;
}

.point-list li:last-child {
  margin-bottom: 0;
}
</style>
