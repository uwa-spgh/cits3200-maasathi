<template>
  <div class="rail-row">
    <button
      v-if="canGoBack"
      class="rail-chevron"
      :aria-label="$t('home.rail.scroll_back')"
      @click="scrollBy(-1)"
    >
      <IonIcon :icon="homeIcons.railBack" />
    </button>

    <div ref="trackEl" class="rail-track" role="list" :aria-label="$t('home.rail.timeline_label')">
      <div class="nodes-row">
        <span class="rail-line" aria-hidden="true"></span>
        <div
          v-for="n in nodes"
          :key="n.id"
          class="node-slot"
          role="listitem"
        >
          <span v-if="n.id === currentId" class="node-date">{{ n.dateLabel }}</span>
          <button
            class="node"
            :class="{ done: n.done, current: n.id === currentId, selected: n.id === selectedId }"
            :title="n.title"
            :aria-label="n.title"
            @click="$emit('select', n.id)"
          >
            <IonIcon :icon="n.action ? homeIcons.nodeAction : n.done ? homeIcons.nodeDone : homeIcons.nodeTodo" />
          </button>
        </div>
      </div>
    </div>

    <button
      v-if="canGoForward"
      class="rail-chevron"
      :aria-label="$t('home.rail.scroll_forward')"
      @click="scrollBy(1)"
    >
      <IonIcon :icon="homeIcons.railForward" />
    </button>
  </div>
</template>

<script setup lang="ts">
import { computed, nextTick, onMounted, onUnmounted, ref, watch } from 'vue';
import { IonIcon } from '@ionic/vue';
import { useI18n } from 'vue-i18n';
import { homeIcons } from '../config/icons';
import { formatDayMonthShort, formatDate, todayIso } from '../utils/date';
import type { ScheduleItem } from '../db/schemas';

const props = defineProps<{
  items: ScheduleItem[];
  currentId?: string | null;
  selectedId?: string | null;
  /** Extra action node, e.g. confirming TT vaccination when history is unknown. */
  actionNode?: { id: string; title: string } | null;
}>();

defineEmits<{
  (e: 'select', id: string): void;
}>();

const { t, locale } = useI18n();
const trackEl = ref<HTMLElement | null>(null);

const canGoBack = ref(false);
const canGoForward = ref(false);

const nodes = computed(() => {
  const sorted = props.items
    .slice()
    .sort((a, b) => a.dueDate.localeCompare(b.dueDate));
  const list = sorted.map((i) => ({
    id: i.id,
    done: i.status === 'completed',
    action: false,
    dateLabel: formatDayMonthShort(i.dueDate, locale.value),
    title: `${t(i.titleKey)} · ${formatDate(i.dueDate, locale.value)}`
  }));
  if (props.actionNode) {
    // No due date is known, so it sits at the "now" position in the rail.
    const at = sorted.findIndex((i) => i.dueDate > todayIso());
    const node = {
      id: props.actionNode.id,
      done: false,
      action: true,
      dateLabel: '',
      title: props.actionNode.title
    };
    if (at < 0) list.push(node);
    else list.splice(at, 0, node);
  }
  return list;
});

function updateChevrons(): void {
  const el = trackEl.value;
  if (!el) {
    canGoBack.value = false;
    canGoForward.value = false;
    return;
  }
  canGoBack.value = el.scrollLeft > 4;
  canGoForward.value = el.scrollLeft + el.clientWidth < el.scrollWidth - 4;
}

let observer: ResizeObserver | null = null;

function onTrackScroll(): void {
  updateChevrons();
}

onMounted(() => {
  void nextTick().then(() => updateChevrons());
  if (typeof ResizeObserver !== 'undefined' && trackEl.value) {
    observer = new ResizeObserver(() => updateChevrons());
    observer.observe(trackEl.value);
  }
  trackEl.value?.addEventListener('scroll', onTrackScroll, { passive: true });
});

onUnmounted(() => {
  observer?.disconnect();
  trackEl.value?.removeEventListener('scroll', onTrackScroll);
});

watch(
  () => [props.items.length, props.actionNode?.id, locale.value],
  () => {
    void nextTick().then(() => updateChevrons());
  }
);

function scrollBy(direction: 1 | -1): void {
  const el = trackEl.value;
  if (!el) return;
  el.scrollBy({ left: direction * el.clientWidth * 0.7, behavior: 'smooth' });
}
</script>

<style scoped>
.rail-row {
  width: 100%;
  display: flex;
  align-items: center;
  gap: 4px;
}

.rail-chevron {
  border: none;
  background: transparent;
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

.rail-line {
  position: absolute;
  left: 0;
  right: 0;
  top: 50%;
  height: 2px;
  transform: translateY(-50%);
  background: rgba(0, 0, 0, 0.2);
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

.node {
  border: none;
  background: var(--color-app-bg, #fbf7f5);
  border-radius: 50%;
  padding: 0;
  cursor: pointer;
  display: flex;
  color: rgba(0, 0, 0, 0.35);
  transition: transform 0.15s ease;
}

.node:active {
  transform: scale(0.88);
}

.node ion-icon {
  font-size: 1.35rem;
}

.node.done {
  color: var(--color-card-text, #1a1a1a);
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
