<template>
  <div v-if="hasData" class="progress-card">
    <div class="progress-head">
      <p class="progress-title">{{ titleLine }}</p>
      <p v-if="subLine" class="progress-sub">{{ subLine }}</p>
    </div>
    <div class="track-wrap">
      <div class="track" :class="{ pnc: isPnc }">
        <div v-for="seg in segments" :key="seg.key" class="segment" :style="seg.style"></div>
        <div class="fill" :style="{ width: todayPct + '%' }"></div>
        <div class="now-pin" :style="{ left: todayPct + '%' }">
          <span class="now-label">{{ t('timeline.progress.you') }}</span>
          <span class="now-dot"></span>
        </div>
        <button
          v-for="m in markers"
          :key="m.id"
          class="marker"
          :class="{ done: m.done }"
          :style="{ left: m.pct + '%' }"
          :title="m.title"
          :aria-label="m.title"
          @click="$emit('select', m.item)"
        >
          <span class="marker-dot"></span>
          <span class="marker-label">{{ m.short }}</span>
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';
import { usePregnancy } from '../composables/usePregnancy';
import { daysBetween, formatDate, todayIso } from '../utils/date';
import type { ScheduleItem } from '../db/schemas';

const props = defineProps<{ items: ScheduleItem[] }>();

defineEmits<{
  (e: 'select', item: ScheduleItem): void;
}>();

const { t } = useI18n();
const { activePregnancy, mode, currentWeek, postpartumDay } = usePregnancy();

const isPnc = computed(() => mode.value === 'PNC' && !!activePregnancy.value?.deliveryDate);
const lmp = computed(() => activePregnancy.value?.lmp ?? null);
const delivery = computed(() => activePregnancy.value?.deliveryDate ?? null);
const hasData = computed(() => (isPnc.value ? !!delivery.value : !!lmp.value));

const totalDays = computed(() => (isPnc.value ? 42 : 280));

function clampPct(fraction: number): number {
  return Math.min(100, Math.max(0, fraction * 100));
}

const todayPct = computed(() => {
  const base = isPnc.value ? delivery.value : lmp.value;
  if (!base) return 0;
  return clampPct(daysBetween(base, todayIso()) / totalDays.value);
});

function shortLabel(item: ScheduleItem): string {
  const n = item.ref.replace(/^visit|^contact/, '');
  if (item.type === 'ANC') return `V${n}`;
  if (item.type === 'PNC') return `C${n}`;
  if (item.type === 'TT') return 'TT';
  if (item.ref === 'edd') return 'EDD';
  return 'EPI';
}

const markers = computed(() => {
  const base = isPnc.value ? delivery.value : lmp.value;
  if (!base) return [];
  return props.items
    .filter((i) =>
      isPnc.value
        ? i.type === 'PNC' || i.type === 'MILESTONE'
        : i.type === 'ANC' || i.type === 'MILESTONE' || i.type === 'TT'
    )
    .map((i) => ({
      id: i.id,
      item: i,
      pct: Math.min(97, Math.max(3, clampPct(daysBetween(base, i.dueDate) / totalDays.value))),
      done: i.status === 'completed',
      short: shortLabel(i),
      title: `${t(i.titleKey)} · ${formatDate(i.dueDate)}`
    }))
    .sort((a, b) => a.pct - b.pct);
});

const segments = computed(() => {
  if (isPnc.value) {
    return [{ key: 'full', style: { left: '0%', width: '100%' } }];
  }
  const a = (91 / 280) * 100;
  const b = (189 / 280) * 100;
  return [
    { key: 't1', style: { left: '0%', width: `${a}%` } },
    { key: 't2', style: { left: `${a}%`, width: `${b - a}%` } },
    { key: 't3', style: { left: `${b}%`, width: `${100 - b}%` } }
  ];
});

const titleLine = computed(() => {
  if (isPnc.value) {
    const day = postpartumDay.value ?? 0;
    const week = Math.min(6, Math.floor(day / 7) + 1);
    return `${t('timeline.progress.pnc_day', { day })} · ${t('timeline.progress.pnc_week', { n: week })}`;
  }
  const week = currentWeek.value;
  if (week === null) return '';
  const trimester = week <= 13 ? 1 : week <= 27 ? 2 : 3;
  return `${t('timeline.progress.week_of', { week })} · ${t('timeline.progress.trimester', { n: trimester })}`;
});

const subLine = computed(() => {
  if (isPnc.value || !activePregnancy.value?.lmp) return '';
  const edd = activePregnancy.value.edd;
  if (!edd) return '';
  const days = daysBetween(todayIso(), edd);
  if (days === 0) return t('timeline.progress.edd_today');
  if (days > 0) return t('timeline.progress.edd_in', { days });
  return t('timeline.progress.edd_past', { days: Math.abs(days) });
});
</script>

<style scoped>
.progress-card {
  background-color: var(--color-card-bg, #eaeaea);
  border-radius: 20px;
  padding: 14px 18px 26px 18px;
  color: var(--color-card-text, #1a1a1a);
}

.progress-head {
  text-align: center;
}

.progress-title {
  margin: 0;
  font-weight: 800;
  font-size: 1rem;
}

.progress-sub {
  margin: 4px 0 0 0;
  font-size: 0.8rem;
  font-weight: 600;
  opacity: 0.7;
}

.track-wrap {
  margin-top: 30px;
  padding: 0 6px;
}

.track {
  position: relative;
  height: 14px;
  border-radius: 999px;
  background: rgba(0, 0, 0, 0.08);
}

.segment {
  position: absolute;
  top: 0;
  height: 100%;
  background-color: var(--color-reminders-bg, #f6c945);
  opacity: 0.28;
}

.segment + .segment {
  border-left: 2px solid rgba(255, 255, 255, 0.9);
}

.track.pnc .segment {
  background-color: var(--color-information-bg, #7bc62d);
  opacity: 0.25;
}

.fill {
  position: absolute;
  left: 0;
  top: 0;
  height: 100%;
  border-radius: 999px;
  background-color: var(--color-reminders-bg, #f6c945);
  opacity: 0.95;
}

.track.pnc .fill {
  background-color: var(--color-information-bg, #7bc62d);
}

.now-pin {
  position: absolute;
  top: -20px;
  transform: translateX(-50%);
  display: flex;
  flex-direction: column;
  align-items: center;
  z-index: 3;
  pointer-events: none;
}

.now-dot {
  height: 12px;
  width: 12px;
  border-radius: 50%;
  background-color: var(--color-reminders-bg, #f6c945);
  border: 3px solid var(--color-card-text, #1a1a1a);
  box-shadow: 0 0 0 3px rgba(255, 255, 255, 0.85);
  animation: now-pulse 2s ease-in-out infinite;
}

.track.pnc .now-dot {
  background-color: var(--color-information-bg, #7bc62d);
}

.now-label {
  font-size: 0.62rem;
  font-weight: 800;
  white-space: nowrap;
  opacity: 0.75;
  margin-bottom: 2px;
}

@keyframes now-pulse {
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.25); }
}

.marker {
  position: absolute;
  top: 50%;
  transform: translate(-50%, -50%);
  background: transparent;
  border: none;
  padding: 0;
  cursor: pointer;
  z-index: 2;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.marker-dot {
  height: 13px;
  width: 13px;
  border-radius: 50%;
  background-color: #fff;
  border: 3px solid var(--color-reminders-bg, #f6c945);
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.25);
  transition: transform 0.15s ease;
}

.track.pnc .marker-dot {
  border-color: var(--color-information-bg, #7bc62d);
}

.marker.done .marker-dot {
  background-color: var(--color-reminders-bg, #f6c945);
}

.track.pnc .marker.done .marker-dot {
  background-color: var(--color-information-bg, #7bc62d);
}

.marker:active .marker-dot {
  transform: scale(1.2);
}

.marker-label {
  position: absolute;
  top: 14px;
  font-size: 0.62rem;
  font-weight: 800;
  white-space: nowrap;
  opacity: 0.75;
}
</style>
