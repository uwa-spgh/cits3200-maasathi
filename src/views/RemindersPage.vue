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

      <PregnancyProgress :items="items" @select="focusItem" />

      <div class="filter-row" role="tablist">
        <button
          v-for="f in FILTERS"
          :key="f.key"
          class="filter-chip"
          :class="{ active: filter === f.key }"
          role="tab"
          :aria-selected="filter === f.key"
          @click="filter = f.key"
        >
          {{ $t(f.label) }}
          <span v-if="counts[f.key] > 0 && f.key !== 'now'" class="count">{{ counts[f.key] }}</span>
        </button>
      </div>

      <div v-if="ttNotice" class="notice-card">
        {{ $t('timeline.tt_unknown_notice') }}
      </div>

      <TimelineList
        :items="filtered"
        :expanded-id="expandedId"
        @toggle="toggleExpand"
        @complete="onComplete"
        @undo="onUndo"
      />
    </div>
  </PageShell>
</template>

<script setup lang="ts">
import { computed, nextTick, onMounted, ref } from 'vue';
import { timeOutline } from 'ionicons/icons';
import PageShell from '../components/PageShell.vue';
import TimelineList from '../components/TimelineList.vue';
import PregnancyProgress from '../components/PregnancyProgress.vue';
import { useI18n } from 'vue-i18n';
import { usePregnancy } from '../composables/usePregnancy';
import { useSchedule } from '../composables/useSchedule';
import { useTt } from '../composables/useTt';
import type { ScheduleItem } from '../db/schemas';
import { todayIso } from '../utils/date';

const { t, locale } = useI18n();
const { activePregnancy, mode, currentWeek, postpartumDay } = usePregnancy();
const { items, markCompleted, markUpcoming } = useSchedule();
const { isUnknown } = useTt();

type FilterKey = 'all' | 'now' | 'upcoming' | 'past';

const FILTERS: { key: FilterKey; label: string }[] = [
  { key: 'all', label: 'timeline.filter.all' },
  { key: 'now', label: 'timeline.filter.now' },
  { key: 'upcoming', label: 'timeline.filter.upcoming' },
  { key: 'past', label: 'timeline.filter.past' }
];

const filter = ref<FilterKey>('all');
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

const nowItems = computed(() => {
  const due = notCompleted.value.filter((i) => i.dueDate <= todayIso());
  const nextFuture = notCompleted.value.filter((i) => i.dueDate > todayIso())[0] ?? null;
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

const counts = computed<Record<FilterKey, number>>(() => ({
  all: items.value.length,
  now: nowItems.value.length,
  upcoming: upcomingItems.value.length,
  past: pastItems.value.length
}));

const filtered = computed<ScheduleItem[]>(() => {
  switch (filter.value) {
    case 'now':
      return nowItems.value;
    case 'upcoming':
      return upcomingItems.value;
    case 'past':
      return pastItems.value;
    default:
      return items.value.slice().sort((a, b) => a.dueDate.localeCompare(b.dueDate));
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
  if (item.status === 'completed' || item.dueDate < todayIso()) filter.value = 'past';
  else if (item.dueDate > todayIso()) filter.value = 'upcoming';
  else filter.value = 'now';
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

.filter-row {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.filter-chip {
  border: 1.5px solid rgba(0, 0, 0, 0.12);
  background-color: var(--color-card-bg, #eaeaea);
  color: var(--color-card-text, #1a1a1a);
  border-radius: 999px;
  padding: 7px 14px;
  font-size: 0.85rem;
  font-weight: 700;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  transition: background-color 0.15s ease, transform 0.1s ease;
}

.filter-chip:active {
  transform: scale(0.95);
}

.filter-chip.active {
  background-color: var(--color-reminders-bg, #f6c945);
  border-color: transparent;
}

.filter-chip .count {
  background-color: rgba(0, 0, 0, 0.14);
  border-radius: 999px;
  font-size: 0.7rem;
  font-weight: 800;
  padding: 1px 7px;
}

.filter-chip.active .count {
  background-color: rgba(255, 255, 255, 0.55);
}

.notice-card {
  background-color: var(--color-reminders-bg, #f6c945);
  color: var(--color-reminders-text, #000);
  border-radius: 16px;
  padding: 12px 16px;
  font-size: 0.9rem;
  font-weight: 600;
}
</style>
