<template>
  <PageShell
    :title="$t('reminders.title')"
    :icon="timeOutline"
    color="yellow"
  >
    <div class="reminders-page">
      <!-- Unscheduled TT prompt if status is still unknown -->
      <div v-if="ttNotice" class="tt-banner">
        <!-- The button floats right at the end of the text, so it shares the
             last line when there is room and drops below when there is not -->
        <p class="tt-banner-text">
          {{ $t('tt.unknown_banner') }}
          <button
            class="tt-banner-link"
            @click="ionRouter.push({ name: 'ProfileVaccination' })"
          >
            {{ $t('profile.menu_vaccination') }}
          </button>
        </p>
        <ListenButton size="sm" class="tt-banner-listen" :text="ttNoticeText" />
      </div>

      <!-- Active / Upcoming / Overdue visits -->
      <section class="section">
        <TimelineList
          :items="displayedUpcoming"
          :expanded-id="expandedId"
          :info-for-item="infoForItem"
          :can-undo-item="canUndoItem"
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
        :can-undo-item="canUndoItem"
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
import ListenButton from '../components/ListenButton.vue';
import PageShell from '../components/PageShell.vue';
import TimelineList from '../components/TimelineList.vue';
import { ttDoseNumber, useSchedule } from '../composables/useSchedule';
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
const { isUnknown, nextDoseNumber, lifetimeDoseCount } = useTt();

const expandedId = ref<string | null>(null);
const showPast = ref(false);
const showAllUpcoming = ref(false);

const ttNotice = computed(() => isUnknown.value && activePregnancy.value !== null);
const ttNoticeText = computed(() => t('tt.unknown_banner'));

/** Dose-specific info for the TT reminder (no "coming soon" placeholder). */
function infoForItem(item: ScheduleItem): ItemInfo | null {
  if (item.type !== 'TT') return null;
  const n = ttDoseNumber(item) ?? nextDoseNumber.value;
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

/** Only the most recent TT dose can be undone, so the dose count stays in order. */
function canUndoItem(item: ScheduleItem): boolean {
  const dose = ttDoseNumber(item);
  return dose === null || dose === lifetimeDoseCount.value;
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

/* TT notice: same card as the timeline rows, with the reminders accent border */
.tt-banner {
  background: var(--color-surface, #fff);
  color: var(--color-surface-text, #1a1a1a);
  border: 2px solid var(--color-reminders-bg, #f6c945);
  border-radius: 20px;
  box-shadow: 0 3px 10px var(--color-shadow, rgba(0, 0, 0, 0.08));
  padding: 14px 14px 14px 16px;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.tt-banner-text {
  display: flow-root;
  margin: 0;
  font-size: 0.88rem;
  font-weight: 700;
  line-height: 1.45;
  color: var(--color-surface-text, #1a1a1a);
}

.tt-banner-listen {
  align-self: flex-start;
}

/* Primary pill, same height as the other action buttons */
.tt-banner-link {
  float: right;
  margin: 0 0 0 12px;
  background: var(--color-reminders-bg, #f6c945);
  color: var(--color-reminders-text, #000);
  border: none;
  border-radius: 999px;
  padding: 0 16px;
  height: 40px;
  min-height: 40px;
  font-family: inherit;
  font-weight: 800;
  font-size: 0.88rem;
  cursor: pointer;
  white-space: nowrap;
}

.tt-banner-link:active {
  transform: scale(0.96);
}

.section {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

/* Secondary pill: outlined, 44px touch height */
.see-more-btn {
  align-self: center;
  min-height: 44px;
  padding: 0 18px;
  background: var(--color-surface, #fff);
  color: var(--color-surface-text, #1a1a1a);
  border: 1.5px solid var(--color-text-muted, #5c5c5c);
  border-radius: 999px;
  font-family: inherit;
  font-size: 0.9rem;
  font-weight: 700;
  cursor: pointer;
  box-shadow: 0 2px 6px var(--color-shadow, rgba(0, 0, 0, 0.08));
  transition: transform 0.15s ease;
}

.see-more-btn:active {
  transform: scale(0.97);
}

.past-section {
  margin-top: 4px;
}

/* Collapsible header styled like the app's expandable cards */
.past-toggle {
  width: 100%;
  min-height: 52px;
  padding: 0 16px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: var(--color-surface, #fff);
  color: var(--color-surface-text, #1a1a1a);
  border: 1.5px solid var(--color-border, rgba(0, 0, 0, 0.1));
  border-radius: 20px;
  box-shadow: 0 3px 10px var(--color-shadow, rgba(0, 0, 0, 0.08));
  font-family: inherit;
  font-size: 1rem;
  font-weight: 700;
  cursor: pointer;
  transition: transform 0.15s ease;
}

.past-toggle:active {
  transform: scale(0.99);
}
</style>
