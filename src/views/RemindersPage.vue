<template>
  <PageShell
    :title="$t('reminders.title')"
    :icon="timeOutline"
    color="yellow"
  >
    <div class="reminders-page">
      <!-- Unscheduled TT prompt if status is still unknown -->
      <div v-if="ttNotice" class="tt-banner">
        <p class="tt-banner-text">{{ $t('tt.status_unknown') }}</p>
        <button
          class="tt-banner-link"
          @click="ionRouter.push({ name: 'ProfileVaccination' })"
        >
          {{ $t('profile.vaccination_title') }} &rarr;
        </button>
      </div>

      <!-- Active / Upcoming / Overdue visits -->
      <section class="section">
        <TimelineList
          :items="displayedUpcoming"
          :expanded-id="expandedId"
          :info-for-item="infoForItem"
          @toggle="toggleExpand"
          @complete="onComplete"
          @undo="onUndo"
        />

        <button
          v-if="upcomingAll.length > 3 && !showAllUpcoming"
          class="see-more-btn"
          @click="showAllUpcoming = true"
        >
          {{ $t('reminders.see_all_upcoming', { count: upcomingAll.length }) }}
        </button>
        <button
          v-else-if="upcomingAll.length > 3 && showAllUpcoming"
          class="see-more-btn"
          @click="showAllUpcoming = false"
        >
          {{ $t('reminders.show_fewer_upcoming') }}
        </button>
      </section>

      <!-- Completed visits only -->
      <section v-if="pastItems.length" class="section past-section">
        <button
          class="past-toggle"
          @click="showPast = !showPast"
        >
          <span>{{ $t('reminders.past_visits') }} ({{ pastItems.length }})</span>
          <span>{{ showPast ? '▲' : '▼' }}</span>
        </button>
      </section>

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
import { useIonRouter } from '@ionic/vue';
import { timeOutline } from 'ionicons/icons';
import PageShell from '../components/PageShell.vue';
import TimelineList from '../components/TimelineList.vue';
import { useSchedule } from '../composables/useSchedule';
import { useTt, TT_MAX_DOSES } from '../composables/useTt';
import { usePregnancy } from '../composables/usePregnancy';
import { useI18n } from 'vue-i18n';
import type { ScheduleItem } from '../db/schemas';
import type { ItemInfo } from '../components/TimelineList.vue';

const route = useRoute();
const ionRouter = useIonRouter();
const { t } = useI18n();
const { activePregnancy } = usePregnancy();
const { items, markCompleted, markUpcoming } = useSchedule();
const { isUnknown, nextDoseNumber } = useTt();

const expandedId = ref<string | null>(null);
const showPast = ref(false);
const showAllUpcoming = ref(false);

const ttNotice = computed(() => isUnknown.value && activePregnancy.value !== null);

/** Dose-specific info for the TT reminder (no "coming soon" placeholder). */
function infoForItem(item: ScheduleItem): ItemInfo | null {
  if (item.type !== 'TT') return null;
  const n = nextDoseNumber.value;
  if (n === null) return null;
  const rawBody = t(`tt.dose_info.dose${n}`);
  const body = rawBody && rawBody !== `tt.dose_info.dose${n}` ? rawBody.trim() : '';
  return {
    title: t('tt.dose_title', { n, max: TT_MAX_DOSES }),
    body
  };
}

/**
 * All incomplete items (both upcoming and overdue) belong here.
 * Overdue items naturally sit at the top because of earlier due dates.
 */
const upcomingAll = computed(() =>
  items.value
    .filter((i) => i.status !== 'completed')
    .sort((a, b) => a.dueDate.localeCompare(b.dueDate))
);

const displayedUpcoming = computed(() =>
  showAllUpcoming.value ? upcomingAll.value : upcomingAll.value.slice(0, 3)
);

/**
 * Only completed visits belong in the past section.
 * Overdue items never go here while incomplete.
 */
const pastItems = computed(() =>
  items.value
    .filter((i) => i.status === 'completed')
    .sort((a, b) => (b.completedAt ?? b.dueDate).localeCompare(a.completedAt ?? a.dueDate))
);

function toggleExpand(id: string): void {
  expandedId.value = expandedId.value === id ? null : id;
}

async function onComplete(item: ScheduleItem): Promise<void> {
  await markCompleted(item);
  expandedId.value = null;
}

async function onUndo(item: ScheduleItem): Promise<void> {
  await markUpcoming(item);
}

// Deep-link handling: if ?focus=<id> is provided, expand that item
watch(
  () => route.query.focus,
  (focusId) => {
    if (typeof focusId === 'string' && focusId) {
      expandedId.value = focusId;
      void nextTick(() => {
        const el = document.querySelector('.timeline-item.expanded');
        el?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      });
    }
  },
  { immediate: true }
);

onMounted(() => {
  const focusId = route.query.focus;
  if (typeof focusId === 'string' && focusId) {
    expandedId.value = focusId;
  }
});
</script>

<style scoped>
.reminders-page {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.tt-banner {
  background: #fff7ed;
  border: 1px solid #fdba74;
  border-radius: 12px;
  padding: 12px 14px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 8px;
}

.tt-banner-text {
  margin: 0;
  font-size: 0.85rem;
  font-weight: 600;
  color: #9a3412;
}

.tt-banner-link {
  background: none;
  border: none;
  color: #c2410c;
  font-weight: 700;
  font-size: 0.82rem;
  cursor: pointer;
  white-space: nowrap;
  padding: 0;
}

.section {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.see-more-btn {
  background: #fff;
  border: 1.5px solid #e5e7eb;
  border-radius: 12px;
  padding: 10px 14px;
  font-size: 0.88rem;
  font-weight: 700;
  color: #4b5563;
  cursor: pointer;
  align-self: center;
  margin-top: 4px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.03);
  transition: all 0.15s ease;
}

.see-more-btn:active {
  background: #f9fafb;
}

.past-section {
  margin-top: 8px;
}

.past-toggle {
  background: #f3f4f6;
  border: none;
  border-radius: 10px;
  padding: 10px 14px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 0.88rem;
  font-weight: 700;
  color: #4b5563;
  cursor: pointer;
}
</style>
