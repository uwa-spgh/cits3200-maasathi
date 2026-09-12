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
          <p class="detail-note">{{ $t('timeline.detail_placeholder') }}</p>
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

          <!-- Per-visit care record (requirements doc Table 2) -->
          <div v-if="isCareVisit" class="visit-tracking">
            <p class="tracking-title">{{ $t('timeline.visit_details_title') }}</p>
            <IonItem lines="full" class="tracking-input">
              <IonInput
                v-model="tracking.facility"
                :label="$t('timeline.facility')"
                label-placement="stacked"
              />
            </IonItem>
            <div class="tracking-row">
              <IonItem lines="none" class="tracking-input half">
                <IonInput
                  v-model="tracking.bloodPressure"
                  :label="$t('timeline.bp')"
                  label-placement="stacked"
                  placeholder="120/80"
                />
              </IonItem>
              <IonItem lines="none" class="tracking-input half">
                <IonInput
                  v-model="tracking.weightKg"
                  :label="$t('timeline.weight')"
                  label-placement="stacked"
                  inputmode="decimal"
                />
              </IonItem>
            </div>
            <IonItem lines="full">
              <IonCheckbox v-model="tracking.urineTestDone" :label="$t('timeline.urine_test')" />
            </IonItem>
            <IonItem lines="full">
              <IonCheckbox v-model="tracking.bloodTestDone" :label="$t('timeline.blood_test')" />
            </IonItem>
            <IonItem lines="full" class="tracking-input">
              <IonInput
                v-model="tracking.ultrasoundDate"
                type="date"
                :label="$t('timeline.ultrasound')"
                label-placement="stacked"
              />
            </IonItem>
            <IonItem lines="full" class="tracking-input">
              <IonTextarea
                v-model="tracking.dangerSigns"
                :label="$t('timeline.danger_signs_reported')"
                label-placement="stacked"
                :auto-grow="true"
                rows="1"
              />
            </IonItem>
            <IonItem v-if="item.ref === 'visit3'" lines="full">
              <IonCheckbox v-model="tracking.birthPlanCompleted" :label="$t('timeline.birth_plan')" />
            </IonItem>
            <div class="detail-actions">
              <IonButton size="small" class="action-btn save-btn" @click="saveTracking">
                <IonIcon slot="start" :icon="saveOutline" />
                {{ $t('common.save') }}
              </IonButton>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, reactive, watch } from 'vue';
import { IonButton, IonCheckbox, IonIcon, IonInput, IonItem, IonTextarea, toastController } from '@ionic/vue';
import {
  arrowUndoOutline,
  checkmarkCircle,
  checkmarkOutline,
  saveOutline
} from 'ionicons/icons';
import { useI18n } from 'vue-i18n';
import type { ScheduleItem, VisitTracking } from '../db/schemas';
import { formatDate } from '../utils/date';
import { daysBetween, todayIso } from '../utils/date';
import { usePregnancy } from '../composables/usePregnancy';
import { visitTrackingRepo } from '../db/database';
import { uuid } from '../db/schemas';
import { t } from '../i18n';

const props = withDefaults(
  defineProps<{
    item: ScheduleItem;
    title: string;
    expanded?: boolean;
    isLast?: boolean;
  }>(),
  {
    expanded: false,
    isLast: false
  }
);

defineEmits<{
  (e: 'select', item: ScheduleItem): void;
  (e: 'complete', item: ScheduleItem): void;
  (e: 'undo', item: ScheduleItem): void;
}>();

const { locale, t: translate } = useI18n();
const { activePregnancy } = usePregnancy();

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

const isCareVisit = computed(() => props.item.type === 'ANC' || props.item.type === 'PNC');

const emptyTracking = (): VisitTracking => ({
  id: '',
  pregnancyId: props.item.pregnancyId,
  ref: props.item.ref,
  facility: '',
  bloodPressure: '',
  weightKg: '',
  urineTestDone: false,
  bloodTestDone: false,
  ultrasoundDate: null,
  dangerSigns: '',
  birthPlanCompleted: false,
  updatedAt: new Date().toISOString()
});

const tracking = reactive<VisitTracking>(emptyTracking());

watch(
  () => props.expanded,
  async (open) => {
    if (!open || !isCareVisit.value) return;
    const existing = await visitTrackingRepo.byPregnancyAndRef(props.item.pregnancyId, props.item.ref);
    Object.assign(tracking, existing ?? emptyTracking());
  },
  { immediate: true }
);

async function saveTracking(): Promise<void> {
  const id = tracking.id || `${props.item.pregnancyId}:track:${props.item.ref}`;
  await visitTrackingRepo.save({
    ...tracking,
    id,
    pregnancyId: props.item.pregnancyId,
    ref: props.item.ref,
    updatedAt: new Date().toISOString()
  });
  const toast = await toastController.create({
    message: t('common.saved'),
    duration: 1500,
    position: 'bottom'
  });
  await toast.present();
}

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

.detail-note {
  margin: 0 0 10px 0;
  font-size: 0.85rem;
  opacity: 0.75;
  font-style: italic;
  color: var(--color-card-text, #1a1a1a);
}

.detail-actions {
  display: flex;
  justify-content: flex-end;
}

.visit-tracking {
  margin-top: 10px;
  border-top: 1px dashed rgba(0, 0, 0, 0.15);
  padding-top: 8px;
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.tracking-title {
  margin: 0 0 4px 0;
  font-size: 0.85rem;
  font-weight: 800;
  color: var(--color-card-text, #1a1a1a);
}

.tracking-input {
  --background: transparent;
  min-height: 40px;
}

.tracking-row {
  display: flex;
  gap: 8px;
}

.tracking-input.half {
  flex: 1;
}

.visit-tracking ion-checkbox {
  margin: 6px 8px;
}

.save-btn {
  --background: var(--color-profile-bg, #33a1de);
  --color: var(--color-profile-text, #000);
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
