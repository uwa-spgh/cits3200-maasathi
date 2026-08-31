<template>
  <PageShell
    :title="$t('information.title')"
    :breadcrumb="$t('information.topics.vaccination')"
    :icon="informationCircleOutline"
    color="green"
  >
    <div class="vaccination-page">
      <div class="tt-card">
        <div class="tt-card-head">
          <p class="tt-title">{{ $t('tt.tracker_title') }}</p>
          <span class="tt-chip" :class="statusClass">{{ statusLabel }}</span>
        </div>
        <p class="tt-doses">
          {{ $t('tt.doses_count', { count: lifetimeDoseCount, max: 5 }) }}
        </p>
        <p v-if="nextDueDisplay" class="tt-next">{{ $t('tt.next_due', { date: nextDueDisplay }) }}</p>
        <p v-else-if="isUnknown" class="tt-next">{{ $t('tt.unknown_notice') }}</p>
        <p v-else-if="isComplete" class="tt-next">{{ $t('tt.complete_notice') }}</p>
      </div>

      <ExpandableCard :title="$t('tt.schedule_title')">
        <ul class="dose-list">
          <li v-for="dose in sortedDoses" :key="dose.id">
            {{ $t('tt.dose_item', { n: dose.doseNumber, date: dose.dateGiven ? formatDate(dose.dateGiven, locale) : $t('tt.date_unknown') }) }}
          </li>
          <li v-if="sortedDoses.length === 0" class="empty">{{ $t('tt.no_doses') }}</li>
        </ul>
      </ExpandableCard>

      <ExpandableCard :title="$t('tt.education_title')">
        <PlaceholderBox :title="$t('tt.education_placeholder')" :hint="$t('placeholder.hint')" />
      </ExpandableCard>

      <ExpandableCard :title="$t('tt.epi_card_title')">
        <PlaceholderBox :title="$t('tt.epi_card_placeholder')" :hint="$t('placeholder.hint')" />
      </ExpandableCard>
    </div>
  </PageShell>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { informationCircleOutline } from 'ionicons/icons';
import PageShell from '../components/PageShell.vue';
import ExpandableCard from '../components/ExpandableCard.vue';
import PlaceholderBox from '../components/PlaceholderBox.vue';
import { useTt } from '../composables/useTt';
import { useI18n } from 'vue-i18n';
import { formatDate } from '../utils/date';

const { t, locale } = useI18n();
const { history, doses, lifetimeDoseCount, isComplete, isUnknown } = useTt();

const statusLabel = computed(() => {
  if (!history.value || history.value.status === 'not_asked') return t('tt.status_not_asked');
  if (isUnknown.value) return t('tt.status_unknown');
  if (isComplete.value) return t('tt.status_complete');
  return t('tt.status_in_progress');
});

const statusClass = computed(() => {
  if (isComplete.value) return 'chip-complete';
  if (isUnknown.value) return 'chip-unknown';
  return 'chip-progress';
});

const nextDueDisplay = computed(() => {
  const due = history.value?.nextDueDate;
  return due ? formatDate(due, locale.value) : '';
});

const sortedDoses = computed(() => [...doses.value].sort((a, b) => a.doseNumber - b.doseNumber));
</script>

<style scoped>
.vaccination-page {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.tt-card {
  background-color: var(--color-card-bg, #eaeaea);
  border-radius: 20px;
  padding: 16px 18px;
  color: var(--color-card-text, #1a1a1a);
}

.tt-card-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
}

.tt-title {
  margin: 0;
  font-weight: 800;
  font-size: 1.05rem;
}

.tt-chip {
  font-size: 0.72rem;
  font-weight: 700;
  border-radius: 999px;
  padding: 4px 10px;
  white-space: nowrap;
}

.chip-progress { background: var(--color-reminders-bg, #f6c945); }
.chip-complete { background: var(--color-btn-more-bg, #7bc62d); }
.chip-unknown { background: var(--color-profile-bg, #33a1de); }

.tt-doses {
  margin: 10px 0 0 0;
  font-weight: 700;
}

.tt-next {
  margin: 6px 0 0 0;
  font-size: 0.9rem;
  opacity: 0.85;
}

.dose-list {
  margin: 0;
  padding-left: 20px;
  display: flex;
  flex-direction: column;
  gap: 6px;
  font-size: 0.9rem;
  color: var(--color-card-text, #1a1a1a);
}

.dose-list .empty {
  list-style: none;
  margin-left: -20px;
  font-style: italic;
  opacity: 0.7;
}
</style>
