<template>
  <div v-if="hasData" class="journey-card">
    <!-- Where-am-I hero -->
    <div class="journey-hero">
      <div class="hero-top">
        <div class="hero-main">
          <p class="hero-eyebrow">{{ eyebrow }}</p>
          <h2 class="hero-title">{{ titleLine }}</h2>
          <p v-if="subLine" class="hero-sub">{{ subLine }}</p>
        </div>
        <div class="hero-badge" :class="{ pnc: isPnc }">
          <span class="badge-big">{{ badgeBig }}</span>
          <span class="badge-small">{{ badgeSmall }}</span>
        </div>
      </div>

      <!-- Gradient progress bar with trimester zones -->
      <div class="bar-wrap">
        <div class="bar" :class="{ pnc: isPnc }">
          <div v-for="seg in segments" :key="seg.key" class="bar-seg" :style="seg.style">
            <span class="seg-label">{{ seg.label }}</span>
          </div>
          <div class="bar-fill" :style="{ width: todayPct + '%' }"></div>
          <div class="bar-now" :style="{ left: todayPct + '%' }">
            <span class="now-flag">{{ t('timeline.journey.you') }}</span>
            <span class="now-dot"></span>
          </div>
        </div>
        <div class="bar-scale">
          <span>{{ scaleStart }}</span>
          <span class="scale-pct">{{ Math.round(todayPct) }}%</span>
          <span>{{ scaleEnd }}</span>
        </div>
      </div>
    </div>

    <!-- Focus control: Past / Now / Future -->
    <div class="focus-row" role="tablist" :aria-label="t('timeline.journey.focus_label')">
      <button
        v-for="f in focusOptions"
        :key="f.key"
        class="focus-btn"
        :class="{ active: focus === f.key }"
        role="tab"
        :aria-selected="focus === f.key"
        @click="setFocus(f.key)"
      >
        <span class="focus-dot" :class="`dot-${f.key}`"></span>
        {{ t(f.label) }}
        <span v-if="f.count !== null" class="focus-count">{{ f.count }}</span>
      </button>
      <button class="today-btn" @click="recenter" :title="t('timeline.journey.recenter')">
        ◎ {{ t('timeline.journey.today') }}
      </button>
    </div>

    <!-- Interactive scrub rail -->
    <div class="rail-wrap">
      <div ref="railEl" class="rail" @scroll.passive="onRailScroll">
        <div class="rail-inner" :style="{ width: railWidthPx + 'px' }">
          <!-- week ticks -->
          <div v-for="tick in ticks" :key="tick.key" class="tick" :style="{ left: tick.pct + '%' }">
            <span class="tick-line" :class="{ major: tick.major }"></span>
            <span v-if="tick.major" class="tick-label">{{ tick.label }}</span>
          </div>
          <!-- trimester dividers -->
          <div v-for="div in dividers" :key="div.key" class="divider" :style="{ left: div.pct + '%' }">
            <span class="divider-label">{{ div.label }}</span>
          </div>
          <!-- today line -->
          <div class="today-line" :style="{ left: todayPct + '%' }">
            <span class="today-pin">{{ t('timeline.journey.now') }}</span>
          </div>
          <!-- event nodes -->
          <button
            v-for="m in markers"
            :key="m.id"
            class="node"
            :class="[`node-${m.kind}`, { done: m.done, selected: m.id === selectedId, dimmed: isDimmed(m) }]"
            :style="{ left: m.pct + '%' }"
            :title="m.title"
            :aria-label="m.title"
            @click="$emit('select', m.item)"
          >
            <span class="node-dot">
              <span v-if="m.done" class="node-check">✓</span>
            </span>
            <span class="node-label">{{ m.short }}</span>
            <span v-if="m.id === selectedId" class="node-preview">{{ m.title }}</span>
          </button>
        </div>
      </div>
      <p class="rail-hint">{{ t('timeline.journey.scrub_hint') }}</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, nextTick, onMounted, ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import { usePregnancy } from '../composables/usePregnancy';
import { daysBetween, formatDate, todayIso } from '../utils/date';
import type { ScheduleItem } from '../db/schemas';

export type JourneyFocus = 'past' | 'now' | 'future' | 'all';

const props = defineProps<{
  items: ScheduleItem[];
  focus: JourneyFocus;
  selectedId?: string | null;
  pastCount?: number;
  nowCount?: number;
  futureCount?: number;
}>();

const emit = defineEmits<{
  (e: 'select', item: ScheduleItem): void;
  (e: 'update:focus', value: JourneyFocus): void;
}>();

const { t, locale } = useI18n();
const { activePregnancy, mode, currentWeek, postpartumDay } = usePregnancy();

const railEl = ref<HTMLElement | null>(null);
const railWidthPx = 760;

const isPnc = computed(() => mode.value === 'PNC' && !!activePregnancy.value?.deliveryDate);
const baseIso = computed(() => (isPnc.value ? activePregnancy.value?.deliveryDate : activePregnancy.value?.lmp) ?? null);
const totalDays = computed(() => (isPnc.value ? 42 : 280));
const hasData = computed(() => !!baseIso.value);

function clampPct(fraction: number): number {
  return Math.min(100, Math.max(0, fraction * 100));
}

const elapsedDays = computed(() => (baseIso.value ? daysBetween(baseIso.value, todayIso()) : 0));

const todayPct = computed(() => {
  if (!baseIso.value) return 0;
  return clampPct(elapsedDays.value / totalDays.value);
});

// ---- Hero text: "where in the pregnancy am I" ----
const eyebrow = computed(() => {
  if (isPnc.value) return t('timeline.journey.eyebrow_pnc');
  const trimester = trimesterOf(currentWeek.value ?? 1);
  return `${t('timeline.journey.eyebrow_anc')} · ${t('timeline.progress.trimester', { n: trimester })}`;
});

const titleLine = computed(() => {
  if (isPnc.value) {
    const day = postpartumDay.value ?? 0;
    return t('timeline.journey.pnc_title', { day });
  }
  const week = currentWeek.value ?? 1;
  const dayOfWeek = ((elapsedDays.value % 7) + 7) % 7 + 1;
  return t('timeline.journey.anc_title', { week, day: dayOfWeek });
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

const badgeBig = computed(() => {
  if (isPnc.value) return `${Math.min(6, Math.floor((postpartumDay.value ?? 0) / 7) + 1)}/6`;
  return `${currentWeek.value ?? '–'}/40`;
});
const badgeSmall = computed(() => (isPnc.value ? t('timeline.journey.badge_weeks') : t('timeline.journey.badge_weeks')));

const scaleStart = computed(() => (isPnc.value ? t('timeline.journey.birth') : t('timeline.journey.lmp')));
const scaleEnd = computed(() => (isPnc.value ? t('timeline.journey.day42') : t('timeline.journey.edd_short')));

function trimesterOf(week: number): number {
  return week <= 13 ? 1 : week <= 27 ? 2 : 3;
}

const segments = computed(() => {
  if (isPnc.value) return [{ key: 'full', label: '', style: { left: '0%', width: '100%' } }];
  const a = (91 / 280) * 100;
  const b = (189 / 280) * 100;
  return [
    { key: 't1', label: 'T1', style: { left: '0%', width: `${a}%` } },
    { key: 't2', label: 'T2', style: { left: `${a}%`, width: `${b - a}%` } },
    { key: 't3', label: 'T3', style: { left: `${b}%`, width: `${100 - b}%` } }
  ];
});

// ---- Rail ticks / dividers ----
const ticks = computed(() => {
  const list: { key: string; pct: number; label: string; major: boolean }[] = [];
  if (isPnc.value) {
    for (let d = 0; d <= 42; d += 1) {
      const major = d % 7 === 0;
      list.push({ key: `d${d}`, pct: clampPct(d / 42), label: d % 14 === 0 ? `D${d}` : '', major });
    }
    return list;
  }
  for (let w = 0; w <= 40; w += 1) {
    const major = w % 4 === 0;
    list.push({ key: `w${w}`, pct: clampPct((w * 7) / 280), label: major ? `W${w}` : '', major });
  }
  return list;
});

const dividers = computed(() => {
  if (isPnc.value) return [];
  return [
    { key: 't1t2', pct: (91 / 280) * 100, label: 'T1▸T2' },
    { key: 't2t3', pct: (189 / 280) * 100, label: 'T2▸T3' }
  ];
});

// ---- Event markers on the rail ----
type MarkerKind = 'anc' | 'pnc' | 'tt' | 'milestone';

function shortLabel(item: ScheduleItem): string {
  const n = item.ref.replace(/^visit|^contact/, '');
  if (item.type === 'ANC') return `V${n}`;
  if (item.type === 'PNC') return `C${n}`;
  if (item.type === 'TT') return 'TT';
  if (item.ref === 'edd') return 'EDD';
  return 'EPI';
}

function kindOf(item: ScheduleItem): MarkerKind {
  if (item.type === 'ANC') return 'anc';
  if (item.type === 'PNC') return 'pnc';
  if (item.type === 'TT') return 'tt';
  return 'milestone';
}

const markers = computed(() => {
  const base = baseIso.value;
  if (!base) return [];
  return props.items
    .map((i) => ({
      id: i.id,
      item: i,
      kind: kindOf(i),
      pct: Math.min(98, Math.max(2, clampPct(daysBetween(base, i.dueDate) / totalDays.value))),
      done: i.status === 'completed',
      short: shortLabel(i),
      title: `${t(i.titleKey)} · ${formatDate(i.dueDate, locale.value)}`
    }))
    .sort((a, b) => a.pct - b.pct);
});

function isDimmed(m: { pct: number; done: boolean }): boolean {
  if (props.focus === 'all') return false;
  if (props.focus === 'past') return m.pct >= todayPct.value && !m.done;
  if (props.focus === 'future') return m.pct < todayPct.value;
  // now: dim things far from today
  return Math.abs(m.pct - todayPct.value) > 22 && !m.done;
}

// ---- Focus control ----
const focusOptions = computed(() => [
  { key: 'past' as JourneyFocus, label: 'timeline.journey.focus_past', count: props.pastCount ?? null },
  { key: 'now' as JourneyFocus, label: 'timeline.journey.focus_now', count: props.nowCount ?? null },
  { key: 'future' as JourneyFocus, label: 'timeline.journey.focus_future', count: props.futureCount ?? null },
  { key: 'all' as JourneyFocus, label: 'timeline.filter.all', count: props.items.length }
]);

function setFocus(v: JourneyFocus): void {
  emit('update:focus', v);
}

function scrollRailToPct(pct: number): void {
  const el = railEl.value;
  if (!el) return;
  const maxScroll = el.scrollWidth - el.clientWidth;
  const target = (pct / 100) * maxScroll;
  el.scrollTo({ left: Math.max(0, target - el.clientWidth / 2), behavior: 'smooth' });
}

function recenter(): void {
  emit('update:focus', 'now');
  nextTick(() => scrollRailToPct(todayPct.value));
}

function onRailScroll(): void {
  // reserved for future: could update a "scrub week" readout
}

watch(
  () => props.focus,
  (f) => {
    nextTick(() => {
      if (f === 'now') scrollRailToPct(todayPct.value);
      else if (f === 'past') scrollRailToPct(Math.max(0, todayPct.value - 30));
      else if (f === 'future') scrollRailToPct(Math.min(100, todayPct.value + 30));
      else scrollRailToPct(todayPct.value);
    });
  }
);

onMounted(() => {
  nextTick(() => {
    // Start centred on "now" so the user immediately sees where they are.
    scrollRailToPct(todayPct.value);
  });
});
</script>

<style scoped>
.journey-card {
  background-color: var(--color-card-bg, #eaeaea);
  border-radius: 22px;
  padding: 16px 16px 12px 16px;
  color: var(--color-card-text, #1a1a1a);
  display: flex;
  flex-direction: column;
  gap: 12px;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.06);
}

.journey-hero {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.hero-top {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
}

.hero-eyebrow {
  margin: 0;
  font-size: 0.72rem;
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: 1.2px;
  opacity: 0.6;
}

.hero-title {
  margin: 2px 0 0 0;
  font-size: 1.25rem;
  font-weight: 800;
  line-height: 1.2;
}

.hero-sub {
  margin: 4px 0 0 0;
  font-size: 0.85rem;
  font-weight: 700;
  color: var(--color-btn-more-bg, #7bc62d);
}

.hero-badge {
  flex-shrink: 0;
  min-width: 76px;
  text-align: center;
  background: var(--color-reminders-bg, #f6c945);
  border-radius: 18px;
  padding: 8px 12px;
  display: flex;
  flex-direction: column;
}

.hero-badge.pnc {
  background: var(--color-information-bg, #7bc62d);
}

.badge-big {
  font-size: 1.15rem;
  font-weight: 800;
}

.badge-small {
  font-size: 0.68rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.8px;
  opacity: 0.7;
}

.bar-wrap {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.bar {
  position: relative;
  height: 30px;
  border-radius: 999px;
  background: rgba(0, 0, 0, 0.08);
  overflow: visible;
}

.bar-seg {
  position: absolute;
  top: 0;
  height: 100%;
  background: rgba(246, 201, 69, 0.3);
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
}

.bar-seg:first-child {
  border-radius: 999px 0 0 999px;
}

.bar-seg:last-child {
  border-radius: 0 999px 999px 0;
}

.bar-seg + .bar-seg {
  border-left: 2px solid rgba(255, 255, 255, 0.9);
}

.bar.pnc .bar-seg {
  background: rgba(123, 198, 45, 0.3);
}

.seg-label {
  font-size: 0.65rem;
  font-weight: 800;
  opacity: 0.55;
}

.bar-fill {
  position: absolute;
  left: 0;
  top: 0;
  height: 100%;
  border-radius: 999px;
  background: linear-gradient(90deg, #f6c945, #f0a832);
  opacity: 0.95;
  pointer-events: none;
}

.bar.pnc .bar-fill {
  background: linear-gradient(90deg, #7bc62d, #4da316);
}

.bar-now {
  position: absolute;
  top: -6px;
  bottom: -6px;
  width: 0;
  z-index: 3;
  pointer-events: none;
}

.now-flag {
  position: absolute;
  top: -20px;
  left: 0;
  transform: translateX(-50%);
  font-size: 0.62rem;
  font-weight: 800;
  white-space: nowrap;
  background: #1a1a1a;
  color: #fff;
  border-radius: 999px;
  padding: 2px 8px;
}

.now-dot {
  position: absolute;
  top: 50%;
  left: 0;
  transform: translate(-50%, -50%);
  height: 16px;
  width: 16px;
  border-radius: 50%;
  background: #fff;
  border: 4px solid #1a1a1a;
  box-shadow: 0 0 0 3px rgba(255, 255, 255, 0.9), 0 2px 6px rgba(0, 0, 0, 0.3);
  animation: now-pulse 2s ease-in-out infinite;
}

@keyframes now-pulse {
  0%, 100% { transform: translate(-50%, -50%) scale(1); }
  50% { transform: translate(-50%, -50%) scale(1.2); }
}

.bar-scale {
  display: flex;
  justify-content: space-between;
  font-size: 0.7rem;
  font-weight: 700;
  opacity: 0.6;
}

.scale-pct {
  opacity: 1;
  background: rgba(0, 0, 0, 0.08);
  border-radius: 999px;
  padding: 0 8px;
}

.focus-row {
  display: flex;
  gap: 6px;
  align-items: center;
  flex-wrap: wrap;
  background: rgba(0, 0, 0, 0.05);
  border-radius: 999px;
  padding: 4px;
}

.focus-btn {
  flex: 1;
  border: none;
  background: transparent;
  border-radius: 999px;
  padding: 8px 10px;
  font-size: 0.82rem;
  font-weight: 800;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  color: inherit;
  opacity: 0.65;
  transition: background 0.18s ease, opacity 0.18s ease, transform 0.1s ease;
  white-space: nowrap;
}

.focus-btn:active {
  transform: scale(0.96);
}

.focus-btn.active {
  background: #1a1a1a;
  color: #fff;
  opacity: 1;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.25);
}

.focus-dot {
  height: 8px;
  width: 8px;
  border-radius: 50%;
}

.dot-past { background: #9aa0a6; }
.dot-now { background: #ff5c5c; }
.dot-future { background: #33a1de; }
.dot-all { background: #7bc62d; }

.focus-btn.active .focus-dot {
  box-shadow: 0 0 0 2px rgba(255, 255, 255, 0.5);
}

.focus-count {
  background: rgba(0, 0, 0, 0.12);
  border-radius: 999px;
  font-size: 0.7rem;
  padding: 1px 7px;
}

.focus-btn.active .focus-count {
  background: rgba(255, 255, 255, 0.25);
}

.today-btn {
  border: none;
  background: transparent;
  font-size: 0.78rem;
  font-weight: 800;
  cursor: pointer;
  padding: 8px 10px;
  border-radius: 999px;
  color: inherit;
  opacity: 0.8;
  white-space: nowrap;
}

.today-btn:active {
  transform: scale(0.95);
}

.rail-wrap {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.rail {
  overflow-x: auto;
  overflow-y: visible;
  border-radius: 16px;
  background: rgba(0, 0, 0, 0.04);
  padding: 26px 0 30px 0;
  scrollbar-width: thin;
  scroll-behavior: smooth;
}

.rail-inner {
  position: relative;
  height: 64px;
  margin: 0 16px;
}

.tick {
  position: absolute;
  top: 0;
  bottom: 0;
  width: 0;
}

.tick-line {
  position: absolute;
  top: 28px;
  left: 0;
  width: 1px;
  height: 8px;
  background: rgba(0, 0, 0, 0.18);
}

.tick-line.major {
  height: 14px;
  width: 2px;
  background: rgba(0, 0, 0, 0.3);
}

.tick-label {
  position: absolute;
  top: 0;
  left: 0;
  transform: translateX(-50%);
  font-size: 0.6rem;
  font-weight: 800;
  opacity: 0.5;
}

.divider {
  position: absolute;
  top: 6px;
  bottom: 22px;
  width: 0;
  border-left: 2px dashed rgba(0, 0, 0, 0.25);
}

.divider-label {
  position: absolute;
  bottom: -18px;
  left: 0;
  transform: translateX(-50%);
  font-size: 0.6rem;
  font-weight: 800;
  opacity: 0.5;
  white-space: nowrap;
}

.today-line {
  position: absolute;
  top: -8px;
  bottom: -6px;
  width: 0;
  border-left: 2px solid #ff5c5c;
  z-index: 2;
}

.today-pin {
  position: absolute;
  top: -22px;
  left: 0;
  transform: translateX(-50%);
  font-size: 0.62rem;
  font-weight: 800;
  background: #ff5c5c;
  color: #fff;
  border-radius: 999px;
  padding: 1px 8px;
  white-space: nowrap;
  animation: chip-pulse 1.8s ease-in-out infinite;
}

@keyframes chip-pulse {
  0%, 100% { transform: translateX(-50%) scale(1); }
  50% { transform: translateX(-50%) scale(1.08); }
}

.node {
  position: absolute;
  top: 30px;
  transform: translate(-50%, 0);
  background: transparent;
  border: none;
  cursor: pointer;
  display: flex;
  flex-direction: column;
  align-items: center;
  z-index: 3;
  padding: 0;
  transition: opacity 0.2s ease;
}

.node.dimmed {
  opacity: 0.35;
}

.node-dot {
  height: 26px;
  width: 26px;
  border-radius: 50%;
  background: #fff;
  border: 3px solid #9aa0a6;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.75rem;
  font-weight: 800;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.2);
  transition: transform 0.15s ease, border-color 0.15s ease;
}

.node-anc .node-dot { border-color: #f0a832; }
.node-pnc .node-dot { border-color: #4da316; }
.node-tt .node-dot { border-color: #ff5c5c; }
.node-milestone .node-dot { border-color: #33a1de; }

.node.done .node-dot {
  background: #1a1a1a;
  border-color: #1a1a1a;
  color: #fff;
}

.node.selected .node-dot {
  transform: scale(1.3);
  box-shadow: 0 0 0 4px rgba(255, 255, 255, 0.9), 0 2px 8px rgba(0, 0, 0, 0.3);
}

.node:active .node-dot {
  transform: scale(1.2);
}

.node-label {
  margin-top: 3px;
  font-size: 0.62rem;
  font-weight: 800;
  opacity: 0.8;
  white-space: nowrap;
}

.node-preview {
  position: absolute;
  bottom: calc(100% + 10px);
  left: 50%;
  transform: translateX(-50%);
  background: #1a1a1a;
  color: #fff;
  font-size: 0.68rem;
  font-weight: 700;
  border-radius: 10px;
  padding: 4px 10px;
  white-space: nowrap;
  z-index: 5;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
}

.rail-hint {
  margin: 0;
  text-align: center;
  font-size: 0.7rem;
  font-weight: 600;
  opacity: 0.5;
}
</style>
