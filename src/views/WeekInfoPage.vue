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

        <template v-for="topic in stageTopics" :key="`${topic.ns}.${topic.key}`">
          <button
            v-if="topic.route"
            class="topic-link-btn"
            @click="ionRouter.push({ name: topic.route })"
          >
            <span>{{ $t(`${topic.ns}.${topic.key}_title`) }}</span>
            <IonIcon :icon="chevronForwardOutline" />
          </button>
          <ExpandableCard v-else :title="$t(`${topic.ns}.${topic.key}_title`)">
            <ul class="point-list">
              <li v-for="n in topic.points" :key="n">
                {{ $t(`${topic.ns}.${topic.key}.point${n}`) }}
              </li>
            </ul>
          </ExpandableCard>
        </template>
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
import { IonIcon, useIonRouter } from '@ionic/vue';
import { chevronForwardOutline, informationCircleOutline, volumeMediumOutline } from 'ionicons/icons';
import PageShell from '../components/PageShell.vue';
import ExpandableCard from '../components/ExpandableCard.vue';
import ContentText from '../components/ContentText.vue';
import { usePregnancy } from '../composables/usePregnancy';
import { useSchedule } from '../composables/useSchedule';
import { useSpeech } from '../composables/useSpeech';
import { currentStageRef, getStageSummary, STAGE_NOW_TOPICS } from '../utils/stageArticle';
import { useI18n } from 'vue-i18n';

const route = useRoute();
const ionRouter = useIonRouter();
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
  background: var(--color-surface, #fff);
  border: 1.5px solid var(--color-profile-bg, #33a1de);
  border-radius: 20px;
  padding: 18px;
  text-align: left;
  box-shadow: 0 4px 14px var(--color-shadow, rgba(0, 0, 0, 0.08));
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
  background: var(--color-profile-bg, #33a1de);
  color: var(--color-profile-text, #000000);
  padding: 3px 8px;
  border-radius: 6px;
}

.timing-badge {
  font-size: 0.74rem;
  font-weight: 700;
  background: var(--color-card-bg, #eaeaea);
  color: var(--color-text-muted, #5c5c5c);
  padding: 3px 8px;
  border-radius: 6px;
}

.stage-title {
  margin: 4px 0 10px 0;
  font-weight: 800;
  font-size: 1.25rem;
  color: var(--color-surface-text, #1a1a1a);
  line-height: 1.3;
}

.stage-summary {
  margin: 0 0 14px 0;
  font-size: 0.95rem;
  line-height: 1.5;
  color: var(--color-surface-text, #1a1a1a);
}

.stage-actions {
  display: flex;
  gap: 10px;
}

.listen-btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  background: var(--color-card-bg, #eaeaea);
  border: 1px solid var(--color-border, rgba(0, 0, 0, 0.1));
  color: var(--color-card-text, #1a1a1a);
  padding: 6px 12px;
  border-radius: 10px;
  font-size: 0.84rem;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.15s ease;
}

.listen-btn:active {
  filter: brightness(0.94);
}

.stage-topics-section {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.topics-heading {
  font-size: 0.96rem;
  font-weight: 800;
  color: var(--color-card-text, #1a1a1a);
  margin: 4px 0 2px 4px;
}

.point-list {
  margin: 0;
  padding-left: 20px;
  line-height: 1.5;
}

.point-list li {
  margin-bottom: 6px;
  color: var(--color-surface-text, #1a1a1a);
  font-size: 0.92rem;
  white-space: pre-line;
}

.point-list li:last-child {
  margin-bottom: 0;
}

.topic-link-btn {
  background-color: var(--color-surface, #fff);
  color: var(--color-surface-text, #1a1a1a);
  border: 1.5px solid var(--color-profile-bg, #33a1de);
  border-radius: 20px;
  padding: 14px 16px;
  font-size: 1rem;
  font-weight: 700;
  cursor: pointer;
  box-shadow: 0 3px 10px var(--color-shadow, rgba(0, 0, 0, 0.06));
  display: flex;
  align-items: center;
  justify-content: space-between;
  text-align: left;
}

.topic-link-btn:active {
  transform: scale(0.98);
}
</style>
