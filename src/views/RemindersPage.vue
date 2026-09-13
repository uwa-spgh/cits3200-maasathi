<template>
  <PageShell
    :title="$t('reminders.title')"
    :icon="timeOutline"
    color="yellow"
  >
    <div class="reminders-page">
      <div v-if="ttNotice" class="notice-card">
        {{ $t('timeline.tt_unknown_notice') }}
      </div>

      <!-- Close in: what needs me next -->
      <h3 class="section-title">{{ $t('timeline.journey.up_next') }}</h3>
      <TimelineList
        :items="upNext"
        :expanded-id="expandedId"
        :info-for-item="infoForItem"
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
        :info-for-item="infoForItem"
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
        :info-for-item="infoForItem"
        @toggle="toggleExpand"
        @complete="onComplete"
        @undo="onUndo"
      />
    </div>
  </PageShell>
</template>

<script setup lang="ts">
import { computed, nextTick, onMounted, ref, watch } from 'vue';
import { useRoute } from 'vue-router';
import { timeOutline } from 'ionicons/icons';
import PageShell from '../components/PageShell.vue';
import TimelineList from '../components/TimelineList.vue';
import { useSchedule } from '../composables/useSchedule';
import { useTt, TT_MAX_DOSES } from '../composables/useTt';
import { usePregnancy } from '../composables/usePregnancy';
import { useI18n } from 'vue-i18n';
import type { ScheduleItem } from '../db/schemas';
import type { ItemInfo } from '../components/TimelineList.vue';
import { todayIso } from '../utils/date';

const route = useRoute();
const { t } = useI18n();
const { activePregnancy } = usePregnancy();
const { items, markCompleted, markUpcoming } = useSchedule();
const { isUnknown, nextDoseNumber } = useTt();

const expandedId = ref<string | null>(null);
const showPast = ref(false);
const showAllUpcoming = ref(false);

const ttNotice = computed(() => isUnknown.value && activePregnancy.value !== null);

/** Dose-specific info for the TT reminder (locale: tt.dose_info.dose1..5). */
function infoForItem(item: ScheduleItem): ItemInfo | null {
  if (item.type !== 'TT') return null;
  const n = nextDoseNumber.value;
  if (n === null) return null;
  return {
    title: t('tt.dose_title', { n, max: TT_MAX_DOSES }),
    body: t(`tt.dose_info.dose${n}`) || t('content.empty')
  };
}

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

onMounted(async () => {
  await useSchedule().load();
  await applyFocusQuery();
});

watch(
  () => route.query.focus,
  () => {
    void applyFocusQuery();
  }
);

/** Deep link from Home (?focus=<itemId>): reveal that item and scroll to it. */
async function applyFocusQuery(): Promise<void> {
  const id = route.query.focus;
  if (typeof id !== 'string' || id === '') return;
  const item = items.value.find((i) => i.id === id);
  if (!item) return;
  if (upcomingRest.value.some((i) => i.id === id)) showAllUpcoming.value = true;
  if (pastItems.value.some((i) => i.id === id)) showPast.value = true;
  expandedId.value = id;
  await nextTick();
  document.getElementById(`tl-item-${id}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' });
}

function toggleExpand(id: string): void {
  expandedId.value = expandedId.value === id ? null : id;
}

async function onComplete(item: ScheduleItem): Promise<void> {
  await markCompleted(item);
}

async function onUndo(item: ScheduleItem): Promise<void> {
  await markUpcoming(item);
}
</script>

<style scoped>
.reminders-page {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.notice-card {
  background-color: #fff;
  border: 2px solid var(--color-reminders-bg, #f6c945);
  color: var(--color-card-text, #1a1a1a);
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
