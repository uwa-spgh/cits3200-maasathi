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

      <div v-if="ttNotice" class="notice-card">
        {{ $t('timeline.tt_unknown_notice') }}
      </div>

      <section class="section-block">
        <h2 class="section-title">{{ $t('reminders.upcoming') }}</h2>
        <TimelineList
          :items="upcoming"
          :expanded-id="expandedId"
          @toggle="toggleExpand"
          @complete="onComplete"
          @undo="onUndo"
        />
      </section>

      <section class="section-block">
        <h2 class="section-title">{{ $t('reminders.past') }}</h2>
        <TimelineList
          :items="past"
          :expanded-id="expandedId"
          @toggle="toggleExpand"
          @complete="onComplete"
          @undo="onUndo"
        />
      </section>
    </div>
  </PageShell>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import PageShell from '../components/PageShell.vue';
import TimelineList from '../components/TimelineList.vue';
import { useI18n } from 'vue-i18n';
import { usePregnancy } from '../composables/usePregnancy';
import { useSchedule } from '../composables/useSchedule';
import { useTt } from '../composables/useTt';
import type { ScheduleItem } from '../db/schemas';
import { formatDate } from '../utils/date';

const { t, locale } = useI18n();
const { activePregnancy, mode, currentWeek, postpartumDay } = usePregnancy();
const { upcoming, past, markCompleted, markUpcoming } = useSchedule();
const { isUnknown } = useTt();

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
</script>

<style scoped>
.reminders-page {
  display: flex;
  flex-direction: column;
  gap: 20px;
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

.section-block {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.section-title {
  margin: 0;
  font-size: 1.05rem;
  font-weight: 800;
  color: var(--color-card-text, #1a1a1a);
}
</style>
