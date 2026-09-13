<template>
  <div :id="`tl-item-${item.id}`" class="timeline-item" :class="[typeClass, statusClass]">
    <div class="marker-col">
      <span class="dot"></span>
      <span v-if="!isLast" class="line"></span>
    </div>
    <div class="content-col">
      <div class="item-card" :class="{ done: item.status === 'completed', overdue: isOverdue, today: isDueToday }">
        <div class="item-main" @click="$emit('select', item)">
          <div class="item-text">
            <span class="item-title">{{ title }}</span>
            <span class="item-date">{{ dateDisplay }} · {{ relativeLabel }}</span>
          </div>
          <span v-if="dueLabel" class="due-chip" :class="{ 'due-today': isDueToday, 'due-overdue': isOverdue, 'due-done': item.status === 'completed' }">{{ dueLabel }}</span>
          <IonIcon
            v-if="item.status === 'completed'"
            :icon="checkmarkCircle"
            class="done-icon"
          />
        </div>
        <div v-if="expanded" class="item-detail">
          <div v-if="infoTitle" class="prep-box">
            <p class="prep-title">{{ infoTitle }}</p>
            <ContentText :text="infoBody || ''" />
          </div>
          <div v-if="articleKey" class="prep-box">
            <button
              v-if="collapsibleArticle"
              class="prep-toggle"
              @click="showArticle = !showArticle"
              :aria-expanded="showArticle"
            >
              <span class="prep-title">{{ $t(articleTitleKey) }}</span>
              <IonIcon :icon="showArticle ? chevronUpOutline : chevronDownOutline" />
            </button>
            <p v-else class="prep-title">{{ $t(articleTitleKey) }}</p>
            <ContentText v-if="!collapsibleArticle || showArticle" :text="$t(articleKey) || $t('content.empty')" />
          </div>
          <div v-if="prepKey" class="prep-box">
            <p class="prep-title">{{ $t('timeline.prep_title') }}</p>
            <ContentText :text="$t(prepKey) || $t('content.empty')" />
          </div>
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
import { computed, ref } from 'vue';
import { IonButton, IonIcon } from '@ionic/vue';
import {
  arrowUndoOutline,
  checkmarkCircle,
  checkmarkOutline,
  chevronDownOutline,
  chevronUpOutline
} from 'ionicons/icons';
import { useI18n } from 'vue-i18n';
import ContentText from './ContentText.vue';
import type { ScheduleItem } from '../db/schemas';
import { formatDate } from '../utils/date';
import { daysBetween, todayIso } from '../utils/date';

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

const { locale, t: translate } = useI18n();

const typeClass = computed(() => `type-${props.item.type.toLowerCase()}`);

const daysDiff = computed(() => daysBetween(todayIso(), props.item.dueDate));

const isOverdue = computed(() => props.item.status !== 'completed' && daysDiff.value < 0);
const isDueToday = computed(() => props.item.status !== 'completed' && daysDiff.value === 0);

const statusClass = computed(() => {
  if (props.item.status === 'completed') return 'status-done';
  if (isOverdue.value) return 'status-overdue';
  if (isDueToday.value) return 'status-today';
  return 'status-upcoming';
});

const dateDisplay = computed(() => formatDate(props.item.dueDate, locale.value));

/** Per-visit prep notes live in the locale files (anc/pnc prep, tt prep).
 *  Shown for upcoming visits only — completed ones stay basic. */
const prepKey = computed<string | null>(() => {
  if (props.item.status === 'completed') return null;
  if (props.item.type === 'ANC') return `anc.prep.${props.item.ref}`;
  if (props.item.type === 'PNC') return `pnc.prep.${props.item.ref}`;
  if (props.item.type === 'TT') return 'tt.prep';
  return null;
});

/** Visit/vaccine article (authored content) — shown on ANC/PNC/TT reminders. */
const articleKey = computed<string | null>(() => {
  if (props.item.type === 'ANC') return `anc.visit_body.${props.item.ref}`;
  if (props.item.type === 'PNC') return `pnc.contact_body.${props.item.ref}`;
  if (props.item.type === 'TT') return 'tt.about_body';
  return null;
});

const articleTitleKey = computed(() =>
  props.item.type === 'TT' ? 'timeline.about_vaccine' : 'timeline.about_visit'
);

/** The long vaccine article starts collapsed so the reminder stays compact. */
const collapsibleArticle = computed(() => props.item.type === 'TT');
const showArticle = ref(false);

const dueLabel = computed(() => {
  if (props.item.status === 'completed') return translate('timeline.status_done');
  const days = daysDiff.value;
  if (days < 0) {
    const ago = Math.abs(days);
    return ago === 1 ? translate('timeline.overdue_1_day') : translate('timeline.overdue_days', { days: ago });
  }
  if (days === 0) return translate('timeline.due_today');
  if (days === 1) return translate('timeline.due_tomorrow');
  return translate('timeline.due_in_days', { days });
});

const relativeLabel = computed(() => {
  if (props.item.status === 'completed') return translate('timeline.status_done');
  const days = daysDiff.value;
  if (days < 0) {
    const ago = Math.abs(days);
    return ago === 1 ? translate('timeline.ago_1_day') : translate('timeline.ago_days', { days: ago });
  }
  if (days === 0) return translate('timeline.due_today');
  if (days === 1) return translate('timeline.due_tomorrow');
  return translate('timeline.in_days', { days });
});
</script>

<style scoped>
.timeline-item {
  display: flex;
  gap: 10px;
  scroll-margin: 96px;
}

.item-card.done {
  opacity: 0.7;
}

.item-card.done .item-title {
  text-decoration: line-through;
}

.due-chip.due-today {
  background-color: var(--color-emergency-bg, #ff5c5c);
  color: #fff;
  animation: chip-pulse 1.8s ease-in-out infinite;
}

.due-chip.due-overdue {
  background-color: #1a1a1a;
  color: #ffd9d9;
  border: 1.5px solid var(--color-emergency-bg, #ff5c5c);
  animation: chip-pulse 1.8s ease-in-out infinite;
}

.due-chip.due-done {
  background-color: rgba(123, 198, 45, 0.2);
  color: var(--color-card-text, #1a1a1a);
}

.item-card.overdue {
  border-left: 5px solid var(--color-emergency-bg, #ff5c5c);
}

.item-card.today {
  border-left: 5px solid var(--color-emergency-bg, #ff5c5c);
  box-shadow: 0 4px 14px rgba(255, 92, 92, 0.25);
}

.status-overdue .dot {
  background-color: var(--color-emergency-bg, #ff5c5c) !important;
  animation: chip-pulse 1.8s ease-in-out infinite;
}

.status-today .dot {
  background-color: var(--color-emergency-bg, #ff5c5c) !important;
}

.status-done .dot {
  background-color: var(--color-btn-more-bg, #7bc62d) !important;
}

@keyframes chip-pulse {
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.08); }
}

.marker-col {
  display: flex;
  flex-direction: column;
  align-items: center;
  width: 20px;
}

.dot {
  height: 14px;
  width: 14px;
  border-radius: 50%;
  margin-top: 18px;
  flex-shrink: 0;
  border: 3px solid #fff;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.25);
}

.line {
  width: 3px;
  flex: 1;
  border-radius: 2px;
  margin: 4px 0;
  opacity: 0.5;
}

.type-anc .dot, .type-anc .line { background-color: var(--color-reminders-bg, #f6c945); }
.type-tt .dot, .type-tt .line { background-color: var(--color-emergency-bg, #ff5c5c); }
.type-pnc .dot, .type-pnc .line { background-color: var(--color-information-bg, #7bc62d); }
.type-milestone .dot, .type-milestone .line { background-color: var(--color-profile-bg, #33a1de); }

.content-col {
  flex: 1;
  display: flex;
  flex-direction: column;
  padding-bottom: 14px;
}

.item-card {
  background-color: #fff;
  border: 1.5px solid rgba(0, 0, 0, 0.1);
  border-radius: 16px;
  padding: 12px 14px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  border-left: 5px solid transparent;
  transition: box-shadow 0.2s ease, transform 0.15s ease, border-color 0.2s ease;
}

.item-card:active {
  transform: scale(0.99);
}

.item-main {
  display: flex;
  align-items: center;
  gap: 10px;
  cursor: pointer;
}

.item-text {
  display: flex;
  flex-direction: column;
  flex: 1;
}

.item-title {
  font-weight: 700;
  font-size: 0.95rem;
  color: var(--color-card-text, #1a1a1a);
}

.item-date {
  font-size: 0.8rem;
  opacity: 0.75;
  color: var(--color-card-text, #1a1a1a);
}

.due-chip {
  background-color: var(--color-app-bg, #fbf7f5);
  color: var(--color-card-text, #1a1a1a);
  font-size: 0.72rem;
  font-weight: 700;
  border-radius: 999px;
  padding: 4px 10px;
  white-space: nowrap;
}

.done-icon {
  font-size: 1.4rem;
  color: var(--color-btn-more-bg, #7bc62d);
}

.item-detail {
  margin-top: 12px;
  border-top: 1px dashed rgba(0, 0, 0, 0.15);
  padding-top: 10px;
  animation: expand-in 0.22s ease;
}

@keyframes expand-in {
  from { opacity: 0; transform: translateY(-4px); }
  to { opacity: 1; transform: translateY(0); }
}

.detail-actions {
  display: flex;
  justify-content: flex-end;
}

.prep-box {
  background-color: var(--color-app-bg, #fbf7f5);
  border-radius: 12px;
  padding: 10px 12px;
  margin-bottom: 10px;
}

.prep-title {
  margin: 0 0 4px 0;
  font-size: 0.82rem;
  font-weight: 800;
  color: var(--color-card-text, #1a1a1a);
}

.prep-toggle {
  border: none;
  background: transparent;
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0;
  margin: 0 0 4px 0;
  cursor: pointer;
  color: var(--color-card-text, #1a1a1a);
  font-size: 1rem;
}

.prep-toggle .prep-title {
  margin: 0;
}

.action-btn {
  --border-radius: 999px;
  font-weight: 700;
}

.complete-btn {
  --background: var(--color-btn-more-bg, #7bc62d);
  --color: var(--color-btn-more-text, #000);
}

.undo-btn {
  --border-color: var(--color-card-text, #1a1a1a);
  --color: var(--color-card-text, #1a1a1a);
}
</style>
