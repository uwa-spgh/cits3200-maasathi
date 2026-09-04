<template>
  <PageShell
    :title="$t('reminders.title')"
    :icon="timeOutline"
    color="yellow"
  >
    <div class="reminders-page">
      <div class="date-card">
        <p class="today-label">{{ $t('reminders.today') }}</p>
        <p class="today-date">{{ todayDisplay }}</p>
        <p v-if="stageLabel" class="stage-note">{{ stageLabel }}</p>
      </div>

      <!-- Interactive journey: where-am-I + Past/Now/Future focus + scrub rail -->
      <PregnancyJourney
        :items="items"
        v-model:focus="focus"
        :selected-id="expandedId"
        :past-count="counts.past"
        :now-count="counts.now"
        :future-count="counts.future"
        @select="focusItem"
      />

      <div v-if="ttNotice" class="notice-card">
        {{ $t('timeline.tt_unknown_notice') }}
      </div>

      <!-- Section header for the current focus -->
      <div class="section-head">
        <h3 class="section-title">{{ sectionTitle }}</h3>
        <p class="section-sub">{{ sectionSub }}</p>
      </div>

      <!-- Unified "all" view: past above, NOW divider, future below -->
      <template v-if="focus === 'all'">
        <TimelineList
          :items="pastItems"
          :expanded-id="expandedId"
          @toggle="toggleExpand"
          @complete="onComplete"
          @undo="onUndo"
        />
        <div class="now-divider" aria-hidden="false">
          <span class="now-line"></span>
          <span class="now-pill">● {{ $t('timeline.journey.now') }} · {{ $t('timeline.progress.you') }}</span>
          <span class="now-line"></span>
        </div>
        <TimelineList
          :items="futureItemsAll"
          :expanded-id="expandedId"
          @toggle="toggleExpand"
          @complete="onComplete"
          @undo="onUndo"
        />
        <p v-if="items.length === 0" class="empty-note">{{ $t('timeline.empty') }}</p>
      </template>

      <template v-else>
        <TimelineList
          :items="filtered"
          :expanded-id="expandedId"
          @toggle="toggleExpand"
          @complete="onComplete"
          @undo="onUndo"
        />
      </template>
    </div>
  </PageShell>
</template>

<script setup lang="ts">
import { computed, nextTick, onMounted, ref } from 'vue';
import { timeOutline } from 'ionicons/icons';
import PageShell from '../components/PageShell.vue';
import TimelineList from '../components/TimelineList.vue';
import PregnancyJourney, { type JourneyFocus } from '../components/PregnancyJourney.vue';
import { useI18n } from 'vue-i18n';
import { usePregnancy } from '../composables/usePregnancy';
import { useSchedule } from '../composables/useSchedule';
import { useTt } from '../composables/useTt';
import type { ScheduleItem } from '../db/schemas';
import { daysBetween, todayIso } from '../utils/date';

const { t, locale } = useI18n();
const { activePregnancy, mode, currentWeek, postpartumDay } = usePregnancy();
const { items, markCompleted, markUpcoming } = useSchedule();
const { isUnknown } = useTt();

// Default to "now" so the timeline opens focused on what needs attention.
const focus = ref<JourneyFocus>('now');
const expandedId = ref<string | null>(null);

const todayDisplay = computed(() => {
  const now = new Date();
  return now.toLocaleDateString(locale.value === 'bn' ? 'bn-BD' : 'en-GB', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });
});

const stageLabel = computed(() => {
  if (!activePregnancy.value) return '';
  if (mode.value === 'ANC') {
    const week = currentWeek.value;
    return week !== null ? t('home.status_anc', { week }) : '';
  }
  const day = postpartumDay.value;
  return day !== null ? t('home.status_pnc', { day }) : '';
});

const ttNotice = computed(() => isUnknown.value && activePregnancy.value !== null);

const notCompleted = computed(() => items.value.filter((i) => i.status !== 'completed'));

// "Now" = overdue + due today + the single next upcoming item.
const nowItems = computed(() => {
  const today = todayIso();
  const due = notCompleted.value.filter((i) => i.dueDate <= today);
  const nextFuture = notCompleted.value.filter((i) => i.dueDate > today)[0] ?? null;
  const list = nextFuture ? [...due, nextFuture] : [...due];
  return list.sort((a, b) => a.dueDate.localeCompare(b.dueDate));
});

const upcomingItems = computed(() =>
  notCompleted.value
    .filter((i) => i.dueDate > todayIso())
    .sort((a, b) => a.dueDate.localeCompare(b.dueDate))
);

const pastItems = computed(() =>
  items.value
    .filter((i) => i.status === 'completed' || i.dueDate < todayIso())
    .sort((a, b) => b.dueDate.localeCompare(a.dueDate))
);

// For the unified "all" view, the lower half is everything not in the past
// (i.e. due today + future), sorted oldest-first so the NOW divider reads naturally.
const futureItemsAll = computed(() =>
  items.value
    .filter((i) => !(i.status === 'completed' || i.dueDate < todayIso()))
    .sort((a, b) => a.dueDate.localeCompare(b.dueDate))
);

const counts = computed<Record<JourneyFocus, number>>(() => ({
  all: items.value.length,
  now: nowItems.value.length,
  past: pastItems.value.length,
  future: upcomingItems.value.length
}));

const filtered = computed<ScheduleItem[]>(() => {
  switch (focus.value) {
    case 'now':
      return nowItems.value;
    case 'future':
      return upcomingItems.value;
    case 'past':
      return pastItems.value;
    default:
      return items.value.slice().sort((a, b) => a.dueDate.localeCompare(b.dueDate));
  }
});

const sectionTitle = computed(() => {
  switch (focus.value) {
    case 'now':
      return t('timeline.journey.section_now');
    case 'future':
      return t('timeline.journey.section_future');
    case 'past':
      return t('timeline.journey.section_past');
    default:
      return t('timeline.journey.section_all');
  }
});

const sectionSub = computed(() => {
  const n = filtered.value.length;
  if (focus.value === 'all') {
    const overdue = items.value.filter(
      (i) => i.status !== 'completed' && daysBetween(todayIso(), i.dueDate) < 0
    ).length;
    if (overdue > 0) return t('timeline.journey.all_sub_overdue', { overdue });
    return t('timeline.journey.all_sub', { count: items.value.length });
  }
  if (n === 0) {
    switch (focus.value) {
      case 'now':
        return t('timeline.filter.now_empty');
      case 'future':
        return t('timeline.journey.future_empty');
      default:
        return t('timeline.journey.past_empty');
    }
  }
  switch (focus.value) {
    case 'now':
      return t('timeline.journey.now_sub', { count: n });
    case 'future':
      return t('timeline.journey.future_sub', { count: n });
    default:
      return t('timeline.journey.past_sub', { count: n });
  }
});

onMounted(() => {
  void useSchedule().load();
});

function toggleExpand(id: string): void {
  expandedId.value = expandedId.value === id ? null : id;
}

async function onComplete(item: ScheduleItem): Promise<void> {
  await markCompleted(item);
}

async function onUndo(item: ScheduleItem): Promise<void> {
  await markUpcoming(item);
}

async function focusItem(item: ScheduleItem): Promise<void> {
  // Move the focus window to where the tapped marker lives, then reveal it.
  if (item.status === 'completed' || item.dueDate < todayIso()) focus.value = 'past';
  else if (item.dueDate > todayIso()) {
    // Keep "now" focus if it's the next upcoming item, otherwise jump to future.
    const nextId = upcomingItems.value[0]?.id;
    focus.value = item.id === nextId && focus.value === 'now' ? 'now' : 'future';
    if (focus.value === 'now' && !nowItems.value.some((i) => i.id === item.id)) {
      focus.value = 'future';
    }
  } else focus.value = 'now';
  expandedId.value = item.id;
  await nextTick();
  document.getElementById(`tl-item-${item.id}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' });
}
</script>

<style scoped>
.reminders-page {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.date-card {
  background-color: var(--color-card-bg, #eaeaea);
  border-radius: 20px;
  padding: 16px 20px;
  text-align: center;
}

.today-label {
  margin: 0;
  font-size: 0.8rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 1px;
  opacity: 0.6;
  color: var(--color-card-text, #1a1a1a);
}

.today-date {
  margin: 4px 0 0 0;
  font-size: 1.15rem;
  font-weight: 800;
  color: var(--color-card-text, #1a1a1a);
}

.stage-note {
  margin: 6px 0 0 0;
  font-size: 0.85rem;
  font-weight: 700;
  color: var(--color-btn-more-bg, #7bc62d);
}

.notice-card {
  background-color: var(--color-reminders-bg, #f6c945);
  color: var(--color-reminders-text, #000);
  border-radius: 16px;
  padding: 12px 16px;
  font-size: 0.9rem;
  font-weight: 600;
}

.section-head {
  display: flex;
  flex-direction: column;
  gap: 2px;
  padding: 0 4px;
}

.section-title {
  margin: 0;
  font-size: 1.05rem;
  font-weight: 800;
  color: var(--color-card-text, #1a1a1a);
}

.section-sub {
  margin: 0;
  font-size: 0.82rem;
  font-weight: 600;
  opacity: 0.65;
  color: var(--color-card-text, #1a1a1a);
}

.now-divider {
  display: flex;
  align-items: center;
  gap: 10px;
  margin: 4px 0;
}

.now-line {
  flex: 1;
  height: 2px;
  border-radius: 2px;
  background: repeating-linear-gradient(90deg, #ff5c5c 0 8px, transparent 8px 14px);
  opacity: 0.7;
}

.now-pill {
  background-color: #ff5c5c;
  color: #fff;
  font-size: 0.75rem;
  font-weight: 800;
  border-radius: 999px;
  padding: 5px 14px;
  white-space: nowrap;
  box-shadow: 0 2px 8px rgba(255, 92, 92, 0.45);
  animation: pill-pulse 2s ease-in-out infinite;
}

@keyframes pill-pulse {
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.05); }
}

.empty-note {
  text-align: center;
  font-size: 0.9rem;
  opacity: 0.6;
  font-style: italic;
  color: var(--color-card-text, #1a1a1a);
}
</style>
