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
          </div>

          <!-- Yellow EPI card reminder placed in the expanded content area (no coming-soon placeholder) -->
          <div v-if="item.type === 'TT'" class="epi-reminder-box">
            <p v-if="infoTitle" class="epi-dose-title">{{ infoTitle }}</p>
            <div class="epi-reminder-inner">
              <IonIcon :icon="cardOutline" class="epi-icon" />
              <span class="epi-text">{{ $t('tt.bring_epi_card_banner') }}</span>
            </div>
            <ContentText v-if="infoBody" :text="infoBody" class="epi-dose-body" />
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
              v-else
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
import type { ScheduleItem } from '../db/schemas';
import { daysBetween, formatDate, todayIso } from '../utils/date';

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
  }>(),
  {
    expanded: false,
    isLast: false,
    infoTitle: null,
    infoBody: null
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
</script>

<style scoped>
.timeline-item {
  display: flex;
  position: relative;
  min-height: 80px;
}

.item-track {
  width: 32px;
  display: flex;
  flex-direction: column;
  align-items: center;
  flex-shrink: 0;
}

.track-dot {
  width: 14px;
  height: 14px;
  border-radius: 50%;
  background-color: #d1d5db;
  border: 3px solid #fff;
  box-shadow: 0 0 0 2px #d1d5db;
  margin-top: 18px;
  z-index: 1;
}

.track-line {
  flex: 1;
  width: 2px;
  background-color: #e5e7eb;
}

.item-card {
  flex: 1;
  background-color: #fff;
  border-radius: 16px;
  padding: 14px 16px;
  margin: 6px 0 6px 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
  border: 1.5px solid transparent;
  cursor: pointer;
  transition: all 0.15s ease;
}

.item-card:hover {
  transform: translateY(-1px);
}

.type-anc .track-dot {
  background-color: #2b7bc4;
  box-shadow: 0 0 0 2px #2b7bc4;
}

.type-tt .track-dot {
  background-color: #b78103;
  box-shadow: 0 0 0 2px #b78103;
}

.type-pnc .track-dot {
  background-color: #10b981;
  box-shadow: 0 0 0 2px #10b981;
}

.status-done .track-dot {
  background-color: #10b981;
  box-shadow: 0 0 0 2px #10b981;
}

.status-done .item-card {
  opacity: 0.75;
  background-color: #f9fafb;
}

.status-overdue .item-card {
  border-color: #fca5a5;
  background-color: #fff5f5;
}

.status-overdue .due-badge {
  background-color: #ef4444;
  color: #fff;
}

.status-today .item-card {
  border-color: #93c5fd;
  background-color: #eff6ff;
}

.status-today .due-badge {
  background-color: #2563eb;
  color: #fff;
}

.item-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 6px;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 8px;
}

.due-badge {
  font-size: 0.72rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  padding: 3px 8px;
  border-radius: 8px;
  background-color: #e5e7eb;
  color: #4b5563;
}

.date-chip {
  font-size: 0.78rem;
  color: #6b7280;
  font-weight: 600;
}

.done-icon {
  font-size: 1.3rem;
  color: #10b981;
}

.item-title {
  margin: 0;
  font-size: 1.02rem;
  font-weight: 700;
  color: #1a1a1a;
}

.item-subtitle {
  margin: 4px 0 0 0;
  font-size: 0.84rem;
  color: #6b7280;
}

.item-detail {
  margin-top: 14px;
  padding-top: 12px;
  border-top: 1px solid #e5e7eb;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.prep-box {
  background-color: #f9fafb;
  border-radius: 12px;
  padding: 10px 12px;
}

.prep-title {
  margin: 0 0 4px 0;
  font-size: 0.8rem;
  font-weight: 700;
  text-transform: uppercase;
  color: #6b7280;
  letter-spacing: 0.03em;
}

/* Yellow EPI card reminder placed in the expanded content area */
.epi-reminder-box {
  background: #fffbe6;
  border: 1.5px solid #ffd591;
  border-radius: 12px;
  padding: 12px 14px;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.epi-dose-title {
  margin: 0;
  font-size: 0.78rem;
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  color: #873800;
}

.epi-reminder-inner {
  display: flex;
  align-items: flex-start;
  gap: 8px;
}

.epi-icon {
  font-size: 1.15rem;
  color: #d46b08;
  flex-shrink: 0;
  margin-top: 1px;
}

.epi-text {
  font-size: 0.88rem;
  font-weight: 600;
  color: #873800;
  line-height: 1.4;
}

.epi-dose-body {
  margin-top: 4px;
  font-size: 0.85rem;
  color: #595959;
}

.info-action-container {
  display: flex;
  margin-top: 2px;
}

/* Natural-looking button for viewing full information */
.open-page-btn {
  display: flex;
  align-items: center;
  gap: 10px;
  width: 100%;
  padding: 12px 14px;
  border-radius: 12px;
  font-size: 0.88rem;
  font-weight: 700;
  cursor: pointer;
  border: 1.5px solid #e2e8f0;
  background: #f8fafc;
  color: #1e293b;
  text-align: left;
  transition: all 0.15s ease;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.03);
}

.open-page-btn:hover {
  background: #f1f5f9;
  border-color: #cbd5e1;
}

.open-page-btn:active {
  background: #e2e8f0;
}

.open-page-btn .btn-main-icon {
  font-size: 1.25rem;
  color: #475569;
  flex-shrink: 0;
}

.open-page-btn .btn-label {
  flex: 1;
  color: #1e293b;
  line-height: 1.35;
}

.open-page-btn .btn-arrow {
  font-size: 1.15rem;
  color: #94a3b8;
  flex-shrink: 0;
}

.detail-actions {
  display: flex;
  gap: 8px;
  margin-top: 4px;
}

.action-btn {
  font-weight: 700;
  --border-radius: 10px;
}

.complete-btn {
  --background: #10b981;
  --background-hover: #059669;
}

.undo-btn {
  --color: #6b7280;
  --border-color: #d1d5db;
}
</style>
