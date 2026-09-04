<template>
  <PageShell
    :title="$t('profile.title')"
    :breadcrumb="`${$t('profile.menu_history')} · ${summary?.deliveryDisplay ?? $t('profile.history_item')}`"
    :icon="personOutline"
    color="blue"
  >
    <div v-if="summary" class="history-summary">
      <section class="card">
        <h2 class="card-title">{{ $t('history.pregnancy_details') }}</h2>
        <div class="row"><span>{{ $t('history.registered_weeks') }}</span><strong>{{ weeksAtRegistrationDisplay }}</strong></div>
        <div class="row"><span>{{ $t('history.date_source') }}</span><strong>{{ dateSourceDisplay }}</strong></div>
        <div class="row"><span>{{ $t('profile.lmp_label') }}</span><strong>{{ summary.lmpDisplay || $t('common.not_set') }}</strong></div>
        <div class="row"><span>{{ $t('profile.edd_label') }}</span><strong>{{ summary.eddDisplay || $t('common.not_set') }}</strong></div>
        <div class="row"><span>{{ $t('profile.delivery_date_label') }}</span><strong>{{ summary.deliveryDisplay || $t('common.not_set') }}</strong></div>
        <div class="row"><span>{{ $t('profile.delivery_place_label') }}</span><strong>{{ summary.pregnancy.deliveryPlace || $t('common.not_set') }}</strong></div>
        <div class="row"><span>{{ $t('profile.delivery_mode_label') }}</span><strong>{{ modeDisplay }}</strong></div>
        <div class="row"><span>{{ $t('profile.birth_outcome_label') }}</span><strong>{{ outcomeDisplay }}</strong></div>
        <div class="row"><span>{{ $t('profile.baby_sex_label') }}</span><strong>{{ sexDisplay }}</strong></div>
        <div class="row"><span>{{ $t('profile.breastfeeding_label') }}</span><strong>{{ summary.pregnancy.breastfeedingInitiated ? $t('common.yes') : $t('common.no') }}</strong></div>
        <div class="row"><span>{{ $t('profile.post_complications_label') }}</span><strong>{{ summary.pregnancy.complications || $t('common.not_set') }}</strong></div>
        <div class="row"><span>{{ $t('profile.post_danger_signs_label') }}</span><strong>{{ summary.pregnancy.postnatalDangerSigns || $t('common.not_set') }}</strong></div>
        <div class="row"><span>{{ $t('history.archived_on') }}</span><strong>{{ summary.archivedDisplay || $t('common.not_set') }}</strong></div>
      </section>

      <section v-if="summary.child" class="card">
        <h2 class="card-title">{{ $t('history.child_details') }}</h2>
        <div class="row"><span>{{ $t('history.child_dob') }}</span><strong>{{ formatDate(summary.child.dob, locale) }}</strong></div>
      </section>

      <section v-if="summary.visitTracking.length > 0" class="card">
        <h2 class="card-title">{{ $t('history.visit_tracking') }}</h2>
        <div v-for="vt in summary.visitTracking" :key="vt.id" class="visit-block">
          <p class="visit-title">{{ visitTitle(vt.ref) }}</p>
          <div class="row"><span>{{ $t('timeline.facility') }}</span><strong>{{ vt.facility || $t('common.not_set') }}</strong></div>
          <div class="row"><span>{{ $t('timeline.bp') }}</span><strong>{{ vt.bloodPressure || $t('common.not_set') }}</strong></div>
          <div class="row"><span>{{ $t('timeline.weight') }}</span><strong>{{ vt.weightKg || $t('common.not_set') }}</strong></div>
          <div class="row"><span>{{ $t('timeline.urine_test') }}</span><strong>{{ vt.urineTestDone ? $t('common.yes') : $t('common.no') }}</strong></div>
          <div class="row"><span>{{ $t('timeline.blood_test') }}</span><strong>{{ vt.bloodTestDone ? $t('common.yes') : $t('common.no') }}</strong></div>
          <div class="row"><span>{{ $t('timeline.ultrasound') }}</span><strong>{{ vt.ultrasoundDate ? formatDate(vt.ultrasoundDate, locale) : $t('common.not_set') }}</strong></div>
          <div class="row"><span>{{ $t('timeline.danger_signs_reported') }}</span><strong>{{ vt.dangerSigns || $t('common.not_set') }}</strong></div>
          <div v-if="vt.birthPlanCompleted" class="row"><span>{{ $t('timeline.birth_plan') }}</span><strong>{{ $t('common.yes') }}</strong></div>
        </div>
      </section>

      <section class="card">
        <h2 class="card-title">{{ $t('history.care_summary') }}</h2>
        <div class="row"><span>{{ $t('history.anc_completed') }}</span><strong>{{ summary.ancCompleted }} / 4</strong></div>
        <div class="row"><span>{{ $t('history.pnc_completed') }}</span><strong>{{ summary.pncCompleted }} / 4</strong></div>
        <div class="row"><span>{{ $t('history.tt_doses') }}</span><strong>{{ summary.ttDoses }}</strong></div>
      </section>

      <section class="card">
        <h2 class="card-title">{{ $t('history.schedule_record') }}</h2>
        <ul class="schedule-list">
          <li v-for="item in summary.schedule" :key="item.id" :class="{ done: item.status === 'completed' }">
            <span>{{ t(item.titleKey) }}</span>
            <span class="schedule-date">{{ formatDate(item.dueDate, locale) }}<IonIcon v-if="item.status === 'completed'" :icon="checkmarkCircle" /></span>
          </li>
        </ul>
      </section>

      <section class="card">
        <h2 class="card-title">{{ $t('history.notes') }}</h2>
        <p class="notes-text">{{ summary.pregnancy.notes || $t('history.no_notes') }}</p>
      </section>
    </div>

    <PlaceholderBox v-else :title="$t('history.not_found')" />
  </PageShell>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import { useRoute } from 'vue-router';
import { IonIcon } from '@ionic/vue';
import { checkmarkCircle, personOutline } from 'ionicons/icons';
import PageShell from '../components/PageShell.vue';
import PlaceholderBox from '../components/PlaceholderBox.vue';
import { useHistory, type PregnancySummary } from '../composables/useHistory';
import { useI18n } from 'vue-i18n';
import { formatDate } from '../utils/date';

const route = useRoute();
const { t, locale } = useI18n();
const { loadOne } = useHistory();

const summary = ref<PregnancySummary | null>(null);

const modeDisplay = computed(() => {
  const mode = summary.value?.pregnancy.deliveryMode;
  if (mode === 'vaginal') return t('profile.mode_vaginal');
  if (mode === 'caesarean') return t('profile.mode_caesarean');
  return t('common.not_set');
});

const outcomeDisplay = computed(() => {
  const outcome = summary.value?.pregnancy.birthOutcome;
  if (outcome === 'live_birth') return t('profile.outcome_live_birth');
  if (outcome === 'stillbirth') return t('profile.outcome_stillbirth');
  return t('common.not_set');
});

const sexDisplay = computed(() => {
  const sex = summary.value?.child?.sex;
  if (sex === 'female') return t('profile.sex_female');
  if (sex === 'male') return t('profile.sex_male');
  return t('common.not_set');
});

const weeksAtRegistrationDisplay = computed(() => {
  const weeks = summary.value?.pregnancy.pregnancyWeeksAtRegistration;
  return weeks !== null && weeks !== undefined ? t('week_info.week_of', { week: weeks }) : t('common.not_set');
});

const dateSourceDisplay = computed(() => {
  const source = summary.value?.pregnancy.dateSource;
  if (source === 'lmp') return t('profile.lmp_label');
  if (source === 'edd') return t('profile.edd_label');
  return t('common.not_set');
});

const visitTitles: Record<string, string> = {
  visit1: t('timeline.anc.visit1'),
  visit2: t('timeline.anc.visit2'),
  visit3: t('timeline.anc.visit3'),
  visit4: t('timeline.anc.visit4'),
  contact1: t('timeline.pnc.contact1'),
  contact2: t('timeline.pnc.contact2'),
  contact3: t('timeline.pnc.contact3'),
  contact4: t('timeline.pnc.contact4')
};

function visitTitle(ref: string): string {
  return visitTitles[ref] ?? ref;
}

onMounted(async () => {
  const id = route.params.pregnancyId as string;
  summary.value = await loadOne(id);
});
</script>

<style scoped>
.history-summary {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.card {
  background-color: var(--color-card-bg, #eaeaea);
  border-radius: 20px;
  padding: 16px;
  color: var(--color-card-text, #1a1a1a);
}

.card-title {
  margin: 0 0 10px 0;
  font-size: 1rem;
  font-weight: 800;
}

.row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
  padding: 6px 0;
  font-size: 0.9rem;
}

.row span:first-child {
  opacity: 0.75;
}

.schedule-list {
  margin: 0;
  padding: 0;
  list-style: none;
  display: flex;
  flex-direction: column;
  gap: 8px;
  font-size: 0.9rem;
}

.schedule-list li {
  display: flex;
  justify-content: space-between;
  gap: 10px;
  opacity: 0.8;
}

.schedule-list li.done {
  opacity: 1;
  font-weight: 700;
}

.schedule-date {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  white-space: nowrap;
}

.visit-block {
  border-bottom: 1px dashed rgba(0, 0, 0, 0.12);
  padding-bottom: 8px;
  margin-bottom: 8px;
}

.visit-block:last-child {
  border-bottom: none;
  margin-bottom: 0;
}

.visit-title {
  margin: 4px 0 2px 0;
  font-weight: 800;
  font-size: 0.92rem;
}

.notes-text {
  margin: 0;
  font-size: 0.9rem;
  font-style: italic;
  opacity: 0.8;
}
</style>
