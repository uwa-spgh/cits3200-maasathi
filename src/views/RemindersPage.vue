<template>
  <PageShell
    :title="$t('reminders.title')"
    :icon="timeOutline"
    color="yellow"
  >
    <div class="reminders-page">
      <!-- Zoomed out: where am I in the whole journey -->
      <PregnancyJourney
        :items="items"
        :selected-id="expandedId"
        @select="focusItem"
      />

      <div v-if="ttNotice" class="notice-card">
        {{ $t('timeline.tt_unknown_notice') }}
      </div>

      <!-- Close in: what needs me next -->
      <h3 class="section-title">{{ $t('timeline.journey.up_next') }}</h3>
      <TimelineList
        :items="upNext"
        :expanded-id="expandedId"
        @toggle="toggleExpand"
        @complete="onComplete"
        @undo="onUndo"
      />

      <button
        v-if="upcomingRest.length > 0 && !showAllUpcoming"
        class="plain-btn"
        @click="showAllUpcoming = true"
      >
        {{ $t('timeline.journey.show_more', { count: upcomingRest.length }) }}
      </button>
      <TimelineList
        v-if="showAllUpcoming"
        :items="upcomingRest"
        :expanded-id="expandedId"
        @toggle="toggleExpand"
        @complete="onComplete"
        @undo="onUndo"
      />

      <!-- The only other option: past, hidden until asked for -->
      <button class="plain-btn" @click="showPast = !showPast">
        {{
          showPast
            ? $t('timeline.journey.hide_past')
            : $t('timeline.journey.show_past', { count: pastItems.length })
        }}
      </button>
      <TimelineList
        v-if="showPast"
        :items="pastItems"
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
import PregnancyJourney from '../components/PregnancyJourney.vue';
import { useSchedule } from '../composables/useSchedule';
import { useTt } from '../composables/useTt';
import { usePregnancy } from '../composables/usePregnancy';
import type { ScheduleItem } from '../db/schemas';
import { todayIso } from '../utils/date';

const { activePregnancy } = usePregnancy();
const { items, markCompleted, markUpcoming } = useSchedule();
const { isUnknown } = useTt();

const expandedId = ref<string | null>(null);
const showPast = ref(false);
const showAllUpcoming = ref(false);

const ttNotice = computed(() => isUnknown.value && activePregnancy.value !== null);

const upcomingAll = computed(() =>
  items.value
    .filter((i) => i.status !== 'completed' && i.dueDate >= todayIso())
    .sort((a, b) => a.dueDate.localeCompare(b.dueDate))
);

// Overdue items come first — they need attention most.
const overdue = computed(() =>
  items.value
    .filter((i) => i.status !== 'completed' && i.dueDate < todayIso())
    .sort((a, b) => a.dueDate.localeCompare(b.dueDate))
);

const upNext = computed<ScheduleItem[]>(() => [...overdue.value, ...upcomingAll.value].slice(0, 3));

const upcomingRest = computed<ScheduleItem[]>(() => [...overdue.value, ...upcomingAll.value].slice(3));

const pastItems = computed(() =>
  items.value
    .filter((i) => i.status === 'completed')
    .sort((a, b) => (b.completedAt ?? b.dueDate).localeCompare(a.completedAt ?? a.dueDate))
);

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
  // Tapping a dot on the overview reveals that task below.
  if (item.status === 'completed') showPast.value = true;
  expandedId.value = item.id;
  await nextTick();
  document.getElementById(`tl-item-${item.id}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' });
}
</script>

<style scoped>
.reminders-page {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.notice-card {
  background-color: var(--color-reminders-bg, #f6c945);
  color: var(--color-reminders-text, #000);
  border-radius: 16px;
  padding: 12px 16px;
  font-size: 0.9rem;
  font-weight: 600;
}

.section-title {
  margin: 4px 0 0 4px;
  font-size: 1.05rem;
  font-weight: 800;
  color: var(--color-card-text, #1a1a1a);
}

.plain-btn {
  border: none;
  background: transparent;
  color: var(--color-card-text, #1a1a1a);
  font-size: 0.88rem;
  font-weight: 700;
  text-decoration: underline;
  cursor: pointer;
  padding: 4px;
  opacity: 0.75;
  align-self: flex-start;
}

.plain-btn:active {
  opacity: 1;
}
</style>
