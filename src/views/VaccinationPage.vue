<template>
  <PageShell
    :title="$t('information.title')"
    :breadcrumb="$t('information.topics.vaccination')"
    :icon="informationCircleOutline"
    color="blue"
  >
    <div class="vaccination-page">
      <div class="tt-card">
        <div class="tt-card-head">
          <p class="tt-title">{{ $t('tt.tracker_title') }}</p>
          <span class="tt-chip" :class="statusClass">{{ statusLabel }}</span>
        </div>
        <p class="tt-doses">{{ trackerDosesLine }}</p>
        <p v-if="trackerNextLine" class="tt-next">{{ trackerNextLine }}</p>
        <ListenButton class="tt-listen" accent="blue" :text="trackerSpeech" />
      </div>

      <button class="section-btn" @click="openTetanusInfo">
        <span>{{ $t('tt.education_title') }}</span>
        <IonIcon :icon="chevronForwardOutline" class="chevron" />
      </button>

      <button class="section-btn" @click="openChildVaccines">
        <span>{{ $t('tt.child_vaccines_title') }}</span>
        <IonIcon :icon="chevronForwardOutline" class="chevron" />
      </button>

      <ExpandableCard :title="$t('tt.schedule_title')">
        <ul class="dose-list">
          <li v-for="dose in sortedDoses" :key="dose.id">
            {{ $t('tt.dose_item', { n: dose.doseNumber, date: dose.dateGiven ? formatDate(dose.dateGiven, locale) : $t('tt.date_unknown') }) }}
          </li>
          <li v-if="sortedDoses.length === 0" class="empty">{{ $t('tt.no_doses') }}</li>
        </ul>
      </ExpandableCard>

      <ExpandableCard :title="$t('tt.epi_card_title')">
        <p class="card-text">{{ epiText }}</p>
        <ListenButton class="card-listen" accent="blue" :text="epiText" />
      </ExpandableCard>
    </div>
  </PageShell>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { IonIcon, useIonRouter } from '@ionic/vue';
import { chevronForwardOutline, informationCircleOutline } from 'ionicons/icons';
import PageShell from '../components/PageShell.vue';
import ExpandableCard from '../components/ExpandableCard.vue';
import ListenButton from '../components/ListenButton.vue';
import { useTt } from '../composables/useTt';
import { useI18n } from 'vue-i18n';
import { formatDate } from '../utils/date';
import { speechText } from '../utils/speechChunks';

const { t, locale } = useI18n();
const ionRouter = useIonRouter();
const { history, doses, lifetimeDoseCount, isComplete, isUnknown } = useTt();

function openTetanusInfo(): void {
  ionRouter.push({ name: 'VaccinationTetanus' });
}

function openChildVaccines(): void {
  ionRouter.push({ name: 'VaccinationChild' });
}

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

const trackerDosesLine = computed(() => t('tt.doses_count', { count: lifetimeDoseCount.value, max: 5 }));

const trackerNextLine = computed(() => {
  if (nextDueDisplay.value) return t('tt.next_due', { date: nextDueDisplay.value });
  if (isUnknown.value) return t('tt.unknown_notice');
  if (isComplete.value) return t('tt.complete_notice');
  return '';
});

/** Reads the tracker exactly as displayed: title, status, doses, then the next-due/notice line. */
const trackerSpeech = computed(() =>
  speechText(t('tt.tracker_title'), [statusLabel.value, trackerDosesLine.value, trackerNextLine.value])
);

const epiText = computed(() => t('tt.bring_epi_card.point1'));
</script>

<style scoped>
.vaccination-page {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.tt-card {
  background-color: var(--color-card-bg, #eaeaea);
  border: 1px solid var(--color-border, rgba(0, 0, 0, 0.1));
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

.chip-progress {
  background: var(--color-reminders-bg, #f6c945);
  color: var(--color-reminders-text, #000);
}
.chip-complete {
  background: var(--color-btn-more-bg, #7bc62d);
  color: var(--color-btn-more-text, #000);
}
.chip-unknown {
  background: var(--color-profile-bg, #33a1de);
  color: var(--color-profile-text, #000);
}

.tt-doses {
  margin: 10px 0 0 0;
  font-weight: 700;
}

.tt-next {
  margin: 6px 0 0 0;
  font-size: 0.9rem;
  opacity: 0.85;
}

.tt-listen {
  margin-top: 14px;
}

.section-btn {
  background-color: var(--color-surface, #fff);
  color: var(--color-surface-text, #1a1a1a);
  border: 2px solid var(--color-profile-bg, #33a1de);
  border-radius: 18px;
  padding: 14px 18px;
  font-size: 0.98rem;
  font-weight: 700;
  cursor: pointer;
  box-shadow: 0 3px 10px var(--color-shadow, rgba(0, 0, 0, 0.06));
  transition: transform 0.15s ease;
  display: flex;
  align-items: center;
  justify-content: space-between;
  text-align: left;
}

.section-btn:active {
  transform: scale(0.98);
}

.section-btn .chevron {
  font-size: 1.2rem;
  color: var(--color-text-muted, #5c5c5c);
}

.dose-list {
  margin: 0;
  padding-left: 20px;
  display: flex;
  flex-direction: column;
  gap: 6px;
  font-size: 0.9rem;
  color: var(--color-surface-text, #1a1a1a);
}

.dose-list .empty {
  list-style: none;
  margin-left: -20px;
  font-style: italic;
  color: var(--color-text-muted, #5c5c5c);
}

.card-text {
  margin: 0;
  font-size: 0.9rem;
  line-height: 1.45;
  color: var(--color-surface-text, #1a1a1a);
}

.card-listen {
  align-self: flex-start;
}
</style>
