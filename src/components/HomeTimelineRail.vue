<template>
  <div class="timeline-rail-wrap">
    <button
      class="rail-chevron left"
      :class="{ disabled: !canScrollLeft }"
      :aria-label="$t('home.timeline.scroll_left')"
      @click="scrollBy(-160)"
    >
      <IonIcon :icon="arrowBackCircleOutline" />
    </button>

    <div ref="trackRef" class="rail-track" @scroll="onScroll">
      <div class="nodes-row" :class="{ spread: items.length <= 4 }">
        <div class="rail-line" />
        <div
          v-for="item in items"
          :key="item.id"
          class="node-slot"
        >
          <span class="node-date">{{ formatDayMonthShort(item.dueDate) }}</span>
          <button
            class="node"
            :class="{
              done: item.status === 'done',
              current: item.id === currentId,
              selected: item.id === selectedId
            }"
            :aria-label="ariaLabel(item)"
            @click="onSelect(item)"
          >
            <IonIcon :icon="nodeIcon(item)" />
          </button>
        </div>
      </div>
    </div>

    <button
      class="rail-chevron right"
      :class="{ disabled: !canScrollRight }"
      :aria-label="$t('home.timeline.scroll_right')"
      @click="scrollBy(160)"
    >
      <IonIcon :icon="arrowForwardCircleOutline" />
    </button>
  </div>
</template>

<script setup lang="ts">
import { nextTick, onMounted, ref, watch } from 'vue';
import { IonIcon } from '@ionic/vue';
import {
  arrowBackCircleOutline,
  arrowForwardCircleOutline,
  checkmarkOutline
} from 'ionicons/icons';
import { useI18n } from 'vue-i18n';
import { homeIcons } from '../config/icons';
import type { ScheduleItem } from '../db/schemas';
import { formatDayMonthShort } from '../utils/date';

const props = defineProps<{
  items: ScheduleItem[];
  currentId?: string | null;
}>();

const emit = defineEmits<{
  (e: 'select', item: ScheduleItem): void;
}>();

const { t } = useI18n();

const trackRef = ref<HTMLElement | null>(null);
const canScrollLeft = ref(false);
const canScrollRight = ref(false);
const selectedId = ref<string | null>(props.currentId ?? null);

watch(
  () => props.currentId,
  (id) => {
    if (id) selectedId.value = id;
  }
);

watch(
  () => props.items,
  async () => {
    await nextTick();
    updateScrollState();
    scrollToCurrent();
  },
  { deep: true }
);

onMounted(async () => {
  await nextTick();
  updateScrollState();
  scrollToCurrent();
});

function nodeIcon(item: ScheduleItem): string {
  if (item.status === 'done') return checkmarkOutline;
  if (item.type === 'tt') return homeIcons.reminderTt;
  if (item.type === 'pnc') return homeIcons.reminderPnc;
  return homeIcons.reminderAnc;
}

function ariaLabel(item: ScheduleItem): string {
  const status = item.status === 'done' ? t('schedule.status_done') : t('schedule.status_pending');
  return `${t(`schedule.${item.titleKey}`)} - ${status}`;
}

function onSelect(item: ScheduleItem): void {
  selectedId.value = item.id;
  emit('select', item);
}

function onScroll(): void {
  updateScrollState();
}

function updateScrollState(): void {
  const el = trackRef.value;
  if (!el) return;
  canScrollLeft.value = el.scrollLeft > 4;
  canScrollRight.value = el.scrollLeft + el.clientWidth < el.scrollWidth - 4;
}

function scrollBy(delta: number): void {
  const el = trackRef.value;
  if (!el) return;
  el.scrollBy({ left: delta, behavior: 'smooth' });
}

function scrollToCurrent(): void {
  const el = trackRef.value;
  if (!el) return;
  const target = el.querySelector('.node.current, .node.selected') as HTMLElement | null;
  if (target) {
    const left = target.offsetLeft - el.clientWidth / 2 + target.clientWidth / 2;
    el.scrollTo({ left: Math.max(0, left), behavior: 'smooth' });
  }
}
</script>

<style scoped>
.timeline-rail-wrap {
  display: flex;
  align-items: center;
  gap: 4px;
  width: 100%;
}

.rail-chevron {
  background: transparent;
  border: none;
  color: var(--color-card-text, #1a1a1a);
  cursor: pointer;
  padding: 4px;
  flex-shrink: 0;
  display: flex;
  /* optically align with the node row below the date-label space */
  margin-top: 22px;
}

.rail-chevron:active {
  transform: scale(0.9);
}

.rail-chevron ion-icon {
  font-size: 1.7rem;
}

.rail-track {
  flex: 1;
  overflow-x: auto;
  padding: 28px 4px 6px 4px;
  scrollbar-width: none;
  scroll-behavior: smooth;
  min-width: 0;
}

.rail-track::-webkit-scrollbar {
  display: none;
}

.nodes-row {
  position: relative;
  display: flex;
  align-items: center;
  gap: 10px;
  width: max-content;
  min-width: 100%;
}

.nodes-row.spread {
  width: 100%;
  justify-content: space-between;
}

.rail-line {
  position: absolute;
  left: 0;
  right: 0;
  top: 50%;
  height: 2px;
  transform: translateY(-50%);
  background: var(--color-card-border, rgba(0, 0, 0, 0.2));
  border-radius: 2px;
}

.node-slot {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  flex-shrink: 0;
}

.node-date {
  position: absolute;
  bottom: calc(100% + 6px);
  font-size: 0.72rem;
  font-weight: 800;
  white-space: nowrap;
  color: var(--color-card-text, #1a1a1a);
}

.node.done ion-icon {
  filter: invert(1);
}

.node {
  border: 2.5px solid var(--color-card-text, #1a1a1a);
  background: var(--color-card-bg, #fff);
  color: var(--color-card-text, #1a1a1a);
  border-radius: 50%;
  padding: 0;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  height: 34px;
  width: 34px;
  transition: transform 0.15s ease;
}

.node:active {
  transform: scale(0.88);
}

.node ion-icon {
  font-size: 1.15rem;
}

.node.done {
  background: var(--color-card-text, #1a1a1a);
  color: var(--color-card-bg, #fff);
}

.node.current {
  color: var(--color-card-text, #1a1a1a);
  outline: 3px solid var(--color-reminders-bg, #f6c945);
  outline-offset: 2px;
}

.node.selected {
  transform: scale(1.15);
}
</style>
