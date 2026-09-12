<template>
  <div v-if="hasData" class="journey-card">
    <p class="journey-title">{{ titleLine }}</p>
    <p v-if="subLine" class="journey-sub">{{ subLine }}</p>

    <!-- Zoomed-out view: whole journey on one line -->
    <div class="journey-bar">
      <div class="journey-track"></div>
      <div class="journey-fill" :style="{ width: todayPct + '%' }"></div>
      <button
        v-for="m in markers"
        :key="m.id"
        class="journey-dot"
        :class="{ done: m.done, selected: m.id === selectedId }"
        :style="{ left: m.pct + '%' }"
        :title="m.title"
        :aria-label="m.title"
        @click="$emit('select', m.item)"
      ></button>
      <span class="journey-you" :style="{ left: todayPct + '%' }" aria-hidden="true"></span>
    </div>

    <div class="journey-ends">
      <span>{{ startLabel }}</span>
      <span>{{ endLabel }}</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';
import { usePregnancy } from '../composables/usePregnancy';
import { daysBetween, formatDate, todayIso } from '../utils/date';
import type { ScheduleItem } from '../db/schemas';

const props = defineProps<{
  items: ScheduleItem[];
  selectedId?: string | null;
}>();

defineEmits<{
  (e: 'select', item: ScheduleItem): void;
}>();

const { t, locale } = useI18n();
const { activePregnancy, mode, currentWeek, postpartumDay } = usePregnancy();

const isPnc = computed(() => mode.value === 'PNC' && !!activePregnancy.value?.deliveryDate);
const baseIso = computed(
  () => (isPnc.value ? activePregnancy.value?.deliveryDate : activePregnancy.value?.lmp) ?? null
);
const totalDays = computed(() => (isPnc.value ? 42 : 280));
const hasData = computed(() => !!baseIso.value);

function clampPct(fraction: number): number {
  return Math.min(100, Math.max(0, fraction * 100));
}

const todayPct = computed(() => {
  if (!baseIso.value) return 0;
  return clampPct(daysBetween(baseIso.value, todayIso()) / totalDays.value);
});

const titleLine = computed(() => {
  if (isPnc.value) {
    const day = postpartumDay.value ?? 0;
    return t('timeline.journey.pnc_title', { day });
  }
  const week = currentWeek.value ?? 1;
  return t('timeline.progress.week_of', { week });
});

const subLine = computed(() => {
  if (!activePregnancy.value) return '';
  if (isPnc.value) {
    const left = 42 - (postpartumDay.value ?? 0);
    return left > 0 ? t('timeline.journey.pnc_left', { days: left }) : t('timeline.journey.pnc_done');
  }
  const edd = activePregnancy.value.edd;
  if (!edd) return '';
  const days = daysBetween(todayIso(), edd);
  if (days === 0) return t('timeline.progress.edd_today');
  if (days > 0) return t('timeline.journey.edd_countdown', { days });
  return t('timeline.progress.edd_past', { days: Math.abs(days) });
});

const startLabel = computed(() => (isPnc.value ? t('timeline.journey.birth') : t('timeline.journey.lmp')));
const endLabel = computed(() => (isPnc.value ? t('timeline.journey.day42') : t('timeline.journey.edd_short')));

const markers = computed(() => {
  const base = baseIso.value;
  if (!base) return [];
  return props.items
    .map((i) => ({
      id: i.id,
      item: i,
      pct: Math.min(97, Math.max(3, clampPct(daysBetween(base, i.dueDate) / totalDays.value))),
      done: i.status === 'completed',
      title: `${t(i.titleKey)} · ${formatDate(i.dueDate, locale.value)}`
    }))
    .sort((a, b) => a.pct - b.pct);
});
</script>

<style scoped>
.journey-card {
  background-color: #fff;
  border: 1.5px solid rgba(0, 0, 0, 0.1);
  border-radius: 20px;
  padding: 16px 18px 14px 18px;
  color: var(--color-card-text, #1a1a1a);
}

.journey-title {
  margin: 0;
  font-size: 1.1rem;
  font-weight: 800;
  text-align: center;
}

.journey-sub {
  margin: 4px 0 0 0;
  font-size: 0.85rem;
  font-weight: 600;
  text-align: center;
  opacity: 0.65;
}

.journey-bar {
  position: relative;
  height: 24px;
  margin-top: 14px;
}

.journey-track {
  position: absolute;
  top: 50%;
  left: 0;
  right: 0;
  height: 8px;
  transform: translateY(-50%);
  border-radius: 999px;
  background: rgba(0, 0, 0, 0.1);
}

.journey-fill {
  position: absolute;
  top: 50%;
  left: 0;
  height: 8px;
  transform: translateY(-50%);
  border-radius: 999px;
  background: var(--color-reminders-bg, #f6c945);
}

.journey-dot {
  position: absolute;
  top: 50%;
  transform: translate(-50%, -50%);
  height: 14px;
  width: 14px;
  border-radius: 50%;
  background: #fff;
  border: 3px solid var(--color-reminders-bg, #f6c945);
  padding: 0;
  cursor: pointer;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.25);
}

.journey-dot.done {
  background: var(--color-reminders-bg, #f6c945);
}

.journey-dot.selected {
  outline: 3px solid rgba(0, 0, 0, 0.35);
  outline-offset: 2px;
}

.journey-you {
  position: absolute;
  top: 50%;
  transform: translate(-50%, -50%);
  height: 18px;
  width: 18px;
  border-radius: 50%;
  background: #fff;
  border: 4px solid #1a1a1a;
  pointer-events: none;
  box-shadow: 0 0 0 3px rgba(255, 255, 255, 0.9);
}

.journey-ends {
  display: flex;
  justify-content: space-between;
  font-size: 0.72rem;
  font-weight: 700;
  opacity: 0.55;
  margin-top: 2px;
}
</style>
