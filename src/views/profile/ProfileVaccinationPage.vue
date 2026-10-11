<!--
  ProfileVaccinationPage — record tetanus (TT) status and doses, optionally log a new dose with its date and facility, and view the dose list. Saving regenerates the reminder schedule.
-->
<template>
  <PageShell
    nav="profile"
    :title="$t('profile.title')"
    :breadcrumb="$t('profile.menu_vaccination')"
    :icon="personOutline"
    color="blue"
  >
    <div class="profile-stack">
      <section class="profile-card">
        <h2 class="profile-card-title">{{ $t('profile.tt_section') }}</h2>
        <IonItem lines="full">
          <IonLabel position="stacked">{{ $t('profile.tt_question') }}</IonLabel>
          <IonSelect v-model="ttForm.status" interface="popover" :interface-options="{ cssClass: 'profile-select-popover' }">
            <IonSelectOption value="known">{{ $t('profile.tt_known_count') }}</IonSelectOption>
            <IonSelectOption value="unknown">{{ $t('profile.tt_known_unsure') }}</IonSelectOption>
            <IonSelectOption value="never">{{ $t('profile.tt_never') }}</IonSelectOption>
            <IonSelectOption value="not_asked">{{ $t('profile.tt_answer_later') }}</IonSelectOption>
          </IonSelect>
        </IonItem>
        <IonItem v-if="ttForm.status === 'known'" lines="full">
          <IonLabel position="stacked">{{ $t('profile.tt_dose_count_label') }}</IonLabel>
          <IonInput v-model.number="ttForm.dosesReceived" type="number" min="0" max="5" />
        </IonItem>
        <IonItem v-if="ttForm.status === 'known'" lines="none">
          <IonLabel position="stacked">{{ $t('profile.tt_last_dose_label') }}</IonLabel>
          <IonInput v-model="ttForm.lastDoseDate" type="date" />
        </IonItem>
        <template v-if="ttForm.status === 'unknown'">
          <p class="profile-hint">{{ $t('profile.tt_unknown_hint') }}</p>
          <div class="profile-hint-listen">
            <ListenButton size="sm" accent="blue" :text="$t('profile.tt_unknown_hint')" />
          </div>
        </template>

        <IonButton expand="block" class="profile-action" @click="saveTt">
          {{ $t('common.save') }}
        </IonButton>
      </section>

      <section v-if="activePregnancy && !ttIsComplete && !ttIsUnknown" class="profile-card">
        <h2 class="profile-card-title">{{ $t('profile.record_dose_label') }}</h2>
        <IonItem lines="full">
          <IonLabel position="stacked">{{ $t('profile.record_dose_label') }}</IonLabel>
          <IonInput v-model="recordDoseDate" type="date" />
        </IonItem>
        <IonItem lines="none">
          <IonLabel position="stacked">{{ $t('timeline.facility') }}</IonLabel>
          <IonInput v-model="recordFacility" :placeholder="$t('profile.optional')" />
        </IonItem>
        <IonButton
          expand="block"
          class="profile-action profile-action--secondary"
          :disabled="!recordDoseDate"
          @click="saveDose"
        >
          {{ $t('profile.record_dose_btn') }}
        </IonButton>
      </section>

      <section class="profile-card">
        <h2 class="profile-card-title">{{ $t('tt.schedule_title') }}</h2>
        <p v-if="doseCount === 0" class="profile-hint">{{ $t('tt.no_doses') }}</p>
        <div v-for="dose in sortedDoses" :key="dose.id" class="profile-dose-row">
          <span>{{ $t('tt.dose_item', { n: dose.doseNumber, date: dose.dateGiven ? formatDate(dose.dateGiven) : $t('tt.date_unknown') }) }}</span>
        </div>
      </section>
    </div>
  </PageShell>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import {
  IonButton,
  IonInput,
  IonItem,
  IonLabel,
  IonSelect,
  IonSelectOption,
  toastController
} from '@ionic/vue';
import { personOutline } from 'ionicons/icons';
import PageShell from '../../components/PageShell.vue';
import ListenButton from '../../components/ListenButton.vue';
import { useTt } from '../../composables/useTt';
import { usePregnancy } from '../../composables/usePregnancy';
import { regenerateSchedule } from '../../composables/useSchedule';
import { pregnancyRepo } from '../../db/database';
import { formatDate } from '../../utils/date';
import type { TtStatus } from '../../db/schemas';

const { t } = useI18n();
const { activePregnancy } = usePregnancy();
const {
  history: ttHistory,
  doses,
  setRegistration,
  recordDose,
  isComplete: ttIsComplete,
  isUnknown: ttIsUnknown
} = useTt();

const ttForm = ref({
  status: 'not_asked' as TtStatus,
  dosesReceived: null as number | null,
  lastDoseDate: ''
});

const recordDoseDate = ref('');
const recordFacility = ref('');

const sortedDoses = computed(() => [...doses.value].sort((a, b) => a.doseNumber - b.doseNumber));
const doseCount = computed(() => doses.value.length);

// Pre-fill the form with the saved TT answer (from onboarding or an earlier
// save), and keep it in step when doses are recorded elsewhere.
watch(
  ttHistory,
  (h) => {
    if (!h) return;
    ttForm.value.status = h.status;
    ttForm.value.dosesReceived = h.dosesReceived;
    ttForm.value.lastDoseDate = h.lastDoseDate ?? '';
  },
  { immediate: true }
);

async function showSaved(): Promise<void> {
  const toast = await toastController.create({
    message: t('common.saved'),
    duration: 1500,
    position: 'bottom'
  });
  await toast.present();
}

async function saveTt(): Promise<void> {
  const status = ttForm.value.status;
  await setRegistration({
    status,
    dosesReceived: status === 'known' ? ttForm.value.dosesReceived : null,
    lastDoseDate: status === 'known' ? ttForm.value.lastDoseDate || null : null,
    cardAvailable: status === 'known'
  });
  await regenerateActive();
  await showSaved();
}

async function saveDose(): Promise<void> {
  if (!recordDoseDate.value) return;
  await recordDose(recordDoseDate.value, recordFacility.value);
  recordDoseDate.value = '';
  recordFacility.value = '';
  await regenerateActive();
  await showSaved();
}

async function regenerateActive(): Promise<void> {
  const active = await pregnancyRepo.active();
  if (active) await regenerateSchedule(active);
}
</script>
