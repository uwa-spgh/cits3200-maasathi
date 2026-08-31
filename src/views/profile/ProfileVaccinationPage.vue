<template>
  <PageShell
    :title="$t('profile.title')"
    :breadcrumb="$t('profile.menu_vaccination')"
    :icon="personOutline"
    color="blue"
  >
    <div class="stack">
      <section class="form-card">
        <h2 class="form-title">{{ $t('profile.tt_section') }}</h2>
        <IonItem lines="full">
          <IonLabel position="stacked">{{ $t('profile.tt_question') }}</IonLabel>
          <IonSelect v-model="ttForm.status" interface="popover">
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
        <p v-if="ttForm.status === 'unknown'" class="field-hint">{{ $t('profile.tt_unknown_hint') }}</p>

        <IonButton expand="block" class="primary-action" @click="saveTt">
          {{ $t('common.save') }}
        </IonButton>
      </section>

      <section v-if="activePregnancy && !ttIsComplete && !ttIsUnknown" class="form-card">
        <h2 class="form-title">{{ $t('profile.record_dose_label') }}</h2>
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
          class="secondary-action"
          :disabled="!recordDoseDate"
          @click="saveDose"
        >
          {{ $t('profile.record_dose_btn') }}
        </IonButton>
      </section>

      <section class="form-card">
        <h2 class="form-title">{{ $t('tt.schedule_title') }}</h2>
        <p v-if="doseCount === 0" class="field-hint">{{ $t('tt.no_doses') }}</p>
        <div v-for="dose in sortedDoses" :key="dose.id" class="dose-row">
          <span>{{ $t('tt.dose_item', { n: dose.doseNumber, date: dose.dateGiven ? formatDate(dose.dateGiven) : $t('tt.date_unknown') }) }}</span>
        </div>
      </section>
    </div>
  </PageShell>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
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
import { useTt } from '../../composables/useTt';
import { formatDate } from '../../utils/date';
import type { TtStatus } from '../../db/schemas';

const { t } = useI18n();
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

onMounted(() => {
  const h = history.value;
  if (h) {
    ttForm.value.status = h.status;
    ttForm.value.dosesReceived = h.dosesReceived;
    ttForm.value.lastDoseDate = h.lastDoseDate ?? '';
  }
});

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
  await showSaved();
}

async function saveDose(): Promise<void> {
  if (!recordDoseDate.value) return;
  await recordDose(recordDoseDate.value, recordFacility.value);
  recordDoseDate.value = '';
  recordFacility.value = '';
  await showSaved();
}
</script>

<style scoped>
.stack {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.form-card {
  background-color: var(--color-card-bg, #eaeaea);
  border-radius: 20px;
  padding: 16px 14px 18px 14px;
}

.form-title {
  margin: 0 4px 8px 4px;
  font-size: 1.05rem;
  font-weight: 800;
  color: var(--color-card-text, #1a1a1a);
}

.field-hint {
  margin: 4px 8px 8px 8px;
  font-size: 0.8rem;
  opacity: 0.7;
  color: var(--color-card-text, #1a1a1a);
}

.primary-action {
  margin: 12px 4px 0 4px;
  --background: var(--color-profile-bg, #33a1de);
  --color: var(--color-profile-text, #000);
  --border-radius: 999px;
  font-weight: 700;
}

.secondary-action {
  margin: 8px 4px 0 4px;
  --background: var(--color-btn-more-bg, #7bc62d);
  --color: var(--color-btn-more-text, #000);
  --border-radius: 999px;
  font-weight: 700;
}

.dose-row {
  display: flex;
  justify-content: space-between;
  padding: 8px 8px;
  font-size: 0.9rem;
  color: var(--color-card-text, #1a1a1a);
  border-bottom: 1px dashed rgba(0, 0, 0, 0.1);
}

.dose-row:last-child {
  border-bottom: none;
}
</style>
