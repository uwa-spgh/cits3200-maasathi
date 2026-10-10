<template>
  <div
    class="timeline-item"
    :class="[
      `type-${item.type.toLowerCase()}`,
      statusClass,
      { expanded, 'is-last': isLast }
    ]"
  >
    <div class="item-track">
      <span class="track-dot" />
      <span v-if="!isLast" class="track-line" />
    </div>

    <div class="item-card" @click="$emit('select', item)">
      <div class="item-main">
        <div class="item-header">
          <div class="header-left">
            <span class="due-badge">{{ dueLabel }}</span>
            <span class="date-chip">{{ dateDisplay }}</span>
          </div>
          <IonIcon
            v-if="item.status === 'completed'"
            :icon="checkmarkCircle"
            class="done-icon"
          />
        </div>

        <h3 class="item-title">{{ title }}</h3>
        <p class="item-subtitle">{{ relativeLabel }}</p>

        <!-- Expanded visit details with button to full information page -->
        <div v-if="expanded" class="item-detail" @click.stop>
          <!-- What to prepare (ANC/PNC) -->
          <div v-if="prepText" class="prep-box">
            <p class="prep-title">{{ $t('timeline.prep_title') }}</p>
            <ContentText :text="prepText" />
            <ListenButton size="sm" class="panel-listen" :text="prepSpeech" />
          </div>

          <!-- Yellow EPI card reminder placed in the expanded content area (no coming-soon placeholder) -->
          <div v-if="item.type === 'TT'" class="epi-reminder-box">
            <p v-if="infoTitle" class="epi-dose-title">{{ infoTitle }}</p>
            <div class="epi-reminder-inner">
              <IonIcon :icon="cardOutline" class="epi-icon" />
              <span class="epi-text">{{ $t('tt.bring_epi_card_banner') }}</span>
            </div>
            <ContentText v-if="infoBody" :text="infoBody" class="epi-dose-body" />
            <ListenButton size="sm" class="panel-listen" :text="epiSpeech" />
          </div>

          <!-- Natural button to full information page -->
          <div class="info-action-container">
            <button
              v-if="item.type === 'TT'"
              class="open-page-btn natural-btn"
              @click="openTetanusPage"
            >
              <IonIcon :icon="cardOutline" class="btn-main-icon" />
              <span class="btn-label">{{ $t('timeline.view_tt_page') }}</span>
              <IonIcon :icon="chevronForwardOutline" class="btn-arrow" />
            </button>

            <button
              v-else-if="item.type === 'ANC'"
              class="open-page-btn natural-btn"
              @click="openAncVisitPage"
            >
              <IonIcon :icon="informationCircleOutline" class="btn-main-icon" />
              <span class="btn-label">{{ $t('timeline.view_visit_page') }}</span>
              <IonIcon :icon="chevronForwardOutline" class="btn-arrow" />
            </button>

            <button
              v-else-if="item.type === 'PNC'"
              class="open-page-btn natural-btn"
              @click="openPncContactPage"
            >
              <IonIcon :icon="informationCircleOutline" class="btn-main-icon" />
              <span class="btn-label">{{ $t('timeline.view_contact_page') }}</span>
              <IonIcon :icon="chevronForwardOutline" class="btn-arrow" />
            </button>
          </div>

          <!-- Action buttons (Mark completed / Undo) -->
          <div class="detail-actions">
            <IonButton
              v-if="item.status !== 'completed'"
              size="small"
              class="action-btn complete-btn"
              @click="$emit('complete', item)"
            >
              <IonIcon slot="start" :icon="checkmarkOutline" />
              {{ $t('timeline.mark_completed') }}
            </IonButton>
            <IonButton
              v-else-if="canUndo"
              size="small"
              fill="outline"
              class="action-btn undo-btn"
              @click="$emit('undo', item)"
            >
              <IonIcon slot="start" :icon="arrowUndoOutline" />
              {{ $t('timeline.mark_upcoming') }}
            </IonButton>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { IonButton, IonIcon, useIonRouter } from '@ionic/vue';
import {
  arrowUndoOutline,
  cardOutline,
  checkmarkCircle,
  checkmarkOutline,
  chevronForwardOutline,
  informationCircleOutline
} from 'ionicons/icons';
import { useI18n } from 'vue-i18n';
import ContentText from './ContentText.vue';
import ListenButton from './ListenButton.vue';
import type { ScheduleItem } from '../db/schemas';
import { daysBetween, formatDate, todayIso } from '../utils/date';
import { speechText } from '../utils/speechChunks';

const ionRouter = useIonRouter();

const props = withDefaults(
  defineProps<{
    item: ScheduleItem;
    title: string;
    expanded?: boolean;
    isLast?: boolean;
    /** Optional extra info box (e.g. dose-specific TT information). */
    infoTitle?: string | null;
    infoBody?: string | null;
    /** Whether a completed item offers "Move back to upcoming". */
    canUndo?: boolean;
  }>(),
  {
    expanded: false,
    isLast: false,
    infoTitle: null,
    infoBody: null,
    canUndo: true
  }
);

defineEmits<{
  (e: 'select', item: ScheduleItem): void;
  (e: 'complete', item: ScheduleItem): void;
  (e: 'undo', item: ScheduleItem): void;
}>();

const { t: translate, locale } = useI18n();

function openTetanusPage(): void {
  ionRouter.push({ name: 'VaccinationTetanus' });
}

function openAncVisitPage(): void {
  ionRouter.push({
    name: 'WeekInfo',
    query: { ref: props.item.ref, mode: 'ANC' }
  });
}

function openPncContactPage(): void {
  ionRouter.push({
    name: 'WeekInfo',
    query: { ref: props.item.ref, mode: 'PNC' }
  });
}

const daysDiff = computed(() => daysBetween(todayIso(), props.item.dueDate));

const isOverdue = computed(
  () => props.item.status !== 'completed' && daysDiff.value < 0
);
const isDueToday = computed(
  () => props.item.status !== 'completed' && daysDiff.value === 0
);

const statusClass = computed(() => {
  if (props.item.status === 'completed') return 'status-done';
  if (isOverdue.value) return 'status-overdue';
  if (isDueToday.value) return 'status-today';
  return 'status-upcoming';
});

const dueLabel = computed(() => {
  if (props.item.status === 'completed') return translate('timeline.status_completed');
  if (isOverdue.value) {
    const days = Math.abs(daysDiff.value);
    return days === 1
      ? translate('timeline.overdue_1_day')
      : translate('timeline.overdue_days', { days });
  }
  if (isDueToday.value) return translate('timeline.due_today');
  if (daysDiff.value === 1) return translate('timeline.due_tomorrow');
  return translate('timeline.due_in_days', { days: daysDiff.value });
});

const relativeLabel = computed(() => {
  if (props.item.status === 'completed') {
    const date = props.item.completedAt ?? props.item.dueDate;
    return translate('timeline.completed_on', { date: formatDate(date, locale.value) });
  }
  if (isOverdue.value) {
    const days = Math.abs(daysDiff.value);
    return days === 1
      ? translate('timeline.ago_1_day')
      : translate('timeline.ago_days', { days });
  }
  if (isDueToday.value) return translate('timeline.today');
  if (daysDiff.value === 1) return translate('timeline.tomorrow');
  return translate('timeline.in_days', { days: daysDiff.value });
});

const dateDisplay = computed(() => formatDate(props.item.dueDate, locale.value));

const prepKey = computed(() => {
  if (props.item.type === 'ANC') return `anc.prep.${props.item.ref}`;
  if (props.item.type === 'PNC') return `pnc.prep.${props.item.ref}`;
  return null;
});

const prepText = computed(() => {
  if (!prepKey.value) return '';
  const text = translate(prepKey.value);
  return text && text !== prepKey.value ? text.trim() : '';
});

/** Splits text into the same paragraphs ContentText shows, so spoken text matches the screen. */
function paragraphsOf(text: string): string[] {
  return text
    .split('\n')
    .map((p) => p.trim())
    .filter((p) => p.length > 0);
}

const prepSpeech = computed(() =>
  speechText(translate('timeline.prep_title'), paragraphsOf(prepText.value))
);

const epiSpeech = computed(() =>
  speechText(props.infoTitle ?? undefined, [
    translate('tt.bring_epi_card_banner'),
    ...paragraphsOf(props.infoBody ?? '')
  ])
);
</script>

<style scoped>
/* One row per visit: a narrow track (dot + line) beside a single card.
   Every card shares the same radius, border width, padding and shadow;
   only the border and dot take the status colour. */
.timeline-item {
  display: flex;
  position: relative;
  padding-bottom: 12px;
}

.timeline-item.is-last {
  padding-bottom: 0;
}

.item-track {
  position: relative;
  width: 24px;
  flex-shrink: 0;
}

/* Line runs through the full row height so consecutive dots are joined */
.track-line {
  position: absolute;
  top: 0;
  bottom: 0;
  left: 50%;
  width: 2px;
  margin-left: -1px;
  background-color: var(--color-border, rgba(0, 0, 0, 0.1));
}

/* First row starts its line at its own dot */
.timeline-item:first-child .track-line {
  top: 26px;
}

/* Every dot is the same size; the ring masks the line behind it.
   Dot centre sits on the centre of the due pill (card padding 14px + 12px). */
.track-dot {
  position: absolute;
  top: 20px;
  left: 50%;
  width: 12px;
  height: 12px;
  margin-left: -6px;
  border-radius: 50%;
  background-color: var(--color-text-muted, #5c5c5c);
  box-shadow: 0 0 0 3px var(--color-app-bg, #fbf7f5);
  z-index: 1;
}

.item-card {
  flex: 1;
  min-width: 0;
  margin-left: 10px;
  padding: 14px 16px;
  background-color: var(--color-surface, #fff);
  color: var(--color-surface-text, #1a1a1a);
  border: 2px solid var(--color-border, rgba(0, 0, 0, 0.1));
  border-radius: 20px;
  box-shadow: 0 3px 10px var(--color-shadow, rgba(0, 0, 0, 0.08));
  cursor: pointer;
  transition: transform 0.15s ease;
}

.item-card:active {
  transform: scale(0.99);
}

/* Status system: overdue = emergency, due today = reminders,
   upcoming = neutral, completed = success (with muted text). */
.status-overdue .item-card { border-color: var(--color-emergency-bg, #ff5c5c); }
.status-today .item-card { border-color: var(--color-reminders-bg, #f6c945); }
.status-upcoming .item-card { border-color: var(--color-border, rgba(0, 0, 0, 0.1)); }
.status-done .item-card { border-color: var(--color-success, #10b981); }

.status-overdue .track-dot { background-color: var(--color-emergency-bg, #ff5c5c); }
.status-today .track-dot { background-color: var(--color-reminders-bg, #f6c945); }
.status-upcoming .track-dot { background-color: var(--color-text-muted, #5c5c5c); }
.status-done .track-dot { background-color: var(--color-success, #10b981); }

.status-done .item-title {
  color: var(--color-text-muted, #5c5c5c);
}

.item-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 8px;
  margin-bottom: 8px;
}

.header-left {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 6px;
  min-width: 0;
}

/* Pills: all share one height, radius and type scale */
.due-badge,
.date-chip {
  display: inline-flex;
  align-items: center;
  height: 24px;
  padding: 0 10px;
  border-radius: 999px;
  border: 1.5px solid var(--color-border, rgba(0, 0, 0, 0.1));
  font-size: 0.72rem;
  font-weight: 800;
  line-height: 1;
  white-space: nowrap;
}

.due-badge {
  text-transform: uppercase;
  letter-spacing: 0.04em;
  background-color: var(--color-card-bg, #eaeaea);
  color: var(--color-card-text, #1a1a1a);
}

.date-chip {
  background-color: transparent;
  color: var(--color-text-muted, #5c5c5c);
  font-size: 0.75rem;
  letter-spacing: 0;
  text-transform: none;
}

.status-overdue .due-badge {
  background-color: var(--color-emergency-bg, #ff5c5c);
  color: var(--color-emergency-text, #000);
  border-color: transparent;
}

.status-today .due-badge {
  background-color: var(--color-reminders-bg, #f6c945);
  color: var(--color-reminders-text, #000);
  border-color: transparent;
}

.status-done .due-badge {
  background-color: var(--color-success, #10b981);
  color: var(--color-success-text, #000);
  border-color: transparent;
}

.done-icon {
  flex-shrink: 0;
  font-size: 1.4rem;
  color: var(--color-success, #10b981);
}

.item-title {
  margin: 0;
  font-size: 1rem;
  font-weight: 700;
  line-height: 1.3;
  color: var(--color-surface-text, #1a1a1a);
}

.item-subtitle {
  margin: 4px 0 0 0;
  font-size: 0.85rem;
  font-weight: 600;
  color: var(--color-text-muted, #5c5c5c);
}

.item-detail {
  margin-top: 14px;
  padding-top: 14px;
  border-top: 1px solid var(--color-border, rgba(0, 0, 0, 0.1));
  display: flex;
  flex-direction: column;
  gap: 12px;
}

/* Shared inner panel for the prep box, EPI box and open-page buttons */
.prep-box,
.epi-reminder-box,
.open-page-btn {
  background-color: var(--color-card-bg, #eaeaea);
  color: var(--color-card-text, #1a1a1a);
  border: 1.5px solid var(--color-border, rgba(0, 0, 0, 0.1));
  border-radius: 14px;
}

/* Prep and EPI panels: stacked content with the Listen button last */
.prep-box,
.epi-reminder-box {
  padding: 12px 14px;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.prep-title,
.epi-dose-title {
  margin: 0;
  font-size: 0.72rem;
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  color: var(--color-text-muted, #5c5c5c);
}

.panel-listen {
  align-self: flex-start;
  margin-top: 4px;
}

.epi-reminder-inner {
  display: flex;
  align-items: flex-start;
  gap: 8px;
}

.epi-icon {
  font-size: 1.15rem;
  color: var(--color-card-text, #1a1a1a);
  flex-shrink: 0;
  margin-top: 1px;
}

.epi-text {
  font-size: 0.88rem;
  font-weight: 700;
  color: var(--color-card-text, #1a1a1a);
  line-height: 1.4;
}

.epi-dose-body {
  margin-top: 4px;
  font-size: 0.85rem;
  color: var(--color-text-muted, #5c5c5c);
}

.info-action-container {
  display: flex;
}

.open-page-btn {
  display: flex;
  align-items: center;
  gap: 10px;
  width: 100%;
  min-height: 48px;
  padding: 12px 14px;
  font-size: 0.88rem;
  font-weight: 700;
  text-align: left;
  cursor: pointer;
  transition: transform 0.15s ease;
}

.open-page-btn:active {
  transform: scale(0.98);
}

.open-page-btn .btn-main-icon {
  font-size: 1.25rem;
  color: var(--color-card-text, #1a1a1a);
  flex-shrink: 0;
}

.open-page-btn .btn-label {
  flex: 1;
  color: inherit;
  line-height: 1.35;
}

.open-page-btn .btn-arrow {
  font-size: 1.15rem;
  color: var(--color-text-muted, #5c5c5c);
  flex-shrink: 0;
}

/* Action buttons: same 44px height and full pill radius */
.detail-actions {
  display: flex;
  gap: 10px;
  margin-top: 2px;
}

.action-btn {
  flex: 1;
  height: 44px;
  min-height: 44px;
  margin: 0;
  --border-radius: 999px;
  --padding-start: 18px;
  --padding-end: 18px;
  --box-shadow: none;
  font-size: 0.9rem;
  font-weight: 800;
  letter-spacing: 0;
  text-transform: none;
}

/* Primary: filled with success */
.complete-btn {
  --background: var(--color-success, #10b981);
  --background-hover: color-mix(in srgb, var(--color-success, #10b981) 85%, #000);
  --color: var(--color-success-text, #000);
}

/* Secondary: outlined */
.undo-btn {
  --background: transparent;
  --background-hover: var(--color-card-bg, #eaeaea);
  --color: var(--color-card-text, #1a1a1a);
  --border-color: var(--color-text-muted, #5c5c5c);
  --border-width: 1.5px;
  --border-style: solid;
}
</style>
