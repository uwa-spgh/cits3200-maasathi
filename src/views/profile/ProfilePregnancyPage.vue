<template>
  <PageShell
    :title="$t('profile.title')"
    :breadcrumb="$t('profile.menu_pregnancy')"
    :icon="personOutline"
    color="blue"
  >
    <div class="stack">
      <section class="form-card">
        <div class="form-title-row">
          <h2 class="form-title">{{ $t('profile.pregnancy_info') }}</h2>
          <span v-if="activePregnancy" class="mode-chip" :class="mode === 'PNC' ? 'chip-pnc' : 'chip-anc'">
            {{ mode === 'PNC' ? $t('common.mode_pnc') : $t('common.mode_anc') }}
          </span>
        </div>

        <template v-if="mode === 'ANC'">
          <IonItem lines="full">
            <IonLabel position="stacked">{{ $t('profile.lmp_label') }}</IonLabel>
            <IonInput v-model="form.lmp" type="date" />
          </IonItem>
          <IonItem lines="full">
            <IonLabel position="stacked">{{ $t('profile.edd_label') }}</IonLabel>
            <IonInput v-model="form.edd" type="date" />
          </IonItem>
          <p class="field-hint">{{ $t('profile.date_pair_hint') }}</p>
        </template>

        <template v-else>
          <IonItem lines="full">
            <IonLabel position="stacked">{{ $t('profile.delivery_date_label') }}</IonLabel>
            <IonInput v-model="form.deliveryDate" type="date" />
          </IonItem>
          <IonItem lines="full">
            <IonLabel position="stacked">{{ $t('profile.delivery_place_label') }}</IonLabel>
            <IonInput v-model="form.deliveryPlace" :placeholder="$t('profile.optional')" />
          </IonItem>
          <IonItem lines="full">
            <IonLabel position="stacked">{{ $t('profile.delivery_mode_label') }}</IonLabel>
            <IonSelect v-model="form.deliveryMode" interface="popover">
              <IonSelectOption value="vaginal">{{ $t('profile.mode_vaginal') }}</IonSelectOption>
              <IonSelectOption value="caesarean">{{ $t('profile.mode_caesarean') }}</IonSelectOption>
            </IonSelect>
          </IonItem>
          <IonItem lines="full">
            <IonLabel position="stacked">{{ $t('profile.birth_outcome_label') }}</IonLabel>
            <IonSelect v-model="form.birthOutcome" interface="popover">
              <IonSelectOption value="live_birth">{{ $t('profile.outcome_live_birth') }}</IonSelectOption>
              <IonSelectOption value="stillbirth">{{ $t('profile.outcome_stillbirth') }}</IonSelectOption>
            </IonSelect>
          </IonItem>
          <IonItem lines="full">
            <IonLabel position="stacked">{{ $t('profile.baby_sex_label') }}</IonLabel>
            <IonSelect v-model="form.babySex" interface="popover">
              <IonSelectOption value="female">{{ $t('profile.sex_female') }}</IonSelectOption>
              <IonSelectOption value="male">{{ $t('profile.sex_male') }}</IonSelectOption>
            </IonSelect>
          </IonItem>
          <IonItem lines="full">
            <IonLabel>{{ $t('profile.breastfeeding_label') }}</IonLabel>
            <IonToggle v-model="form.breastfeedingInitiated" />
          </IonItem>
          <IonItem lines="full">
            <IonLabel position="stacked">{{ $t('profile.post_complications_label') }}</IonLabel>
            <IonTextarea v-model="form.complications" :auto-grow="true" rows="1" :placeholder="$t('profile.optional')" />
          </IonItem>
          <IonItem lines="none">
            <IonLabel position="stacked">{{ $t('profile.post_danger_signs_label') }}</IonLabel>
            <IonTextarea v-model="form.postnatalDangerSigns" :auto-grow="true" rows="1" :placeholder="$t('profile.optional')" />
          </IonItem>
        </template>

        <IonItem lines="full">
          <IonLabel position="stacked">{{ $t('profile.gravida_label') }}</IonLabel>
          <IonInput v-model.number="form.gravida" type="number" :placeholder="$t('profile.optional')" />
        </IonItem>
        <IonItem lines="full">
          <IonLabel position="stacked">{{ $t('profile.parity_label') }}</IonLabel>
          <IonInput v-model.number="form.parity" type="number" :placeholder="$t('profile.optional')" />
        </IonItem>
        <IonItem lines="full">
          <IonLabel position="stacked">{{ $t('profile.prev_outcomes_label') }}</IonLabel>
          <IonSelect v-model="form.previousOutcomes" :placeholder="$t('profile.optional')" interface="popover">
            <IonSelectOption value="none">{{ $t('profile.outcome_none') }}</IonSelectOption>
            <IonSelectOption value="miscarriage">{{ $t('profile.outcome_miscarriage') }}</IonSelectOption>
            <IonSelectOption value="stillbirth">{{ $t('profile.outcome_stillbirth') }}</IonSelectOption>
            <IonSelectOption value="complications">{{ $t('profile.outcome_complications') }}</IonSelectOption>
          </IonSelect>
        </IonItem>
        <IonItem lines="full">
          <IonLabel>{{ $t('profile.prev_cs_label') }}</IonLabel>
          <IonToggle v-model="form.previousCaesarean" />
        </IonItem>
        <IonItem lines="full">
          <IonLabel position="stacked">{{ $t('profile.pregnancy_type_label') }}</IonLabel>
          <IonSelect v-model="form.pregnancyType" :placeholder="$t('profile.optional')" interface="popover">
            <IonSelectOption value="single">{{ $t('profile.type_single') }}</IonSelectOption>
            <IonSelectOption value="multiple">{{ $t('profile.type_multiple') }}</IonSelectOption>
          </IonSelect>
        </IonItem>
        <IonItem lines="none">
          <IonLabel>{{ $t('profile.high_risk_label') }}</IonLabel>
          <IonToggle v-model="form.highRisk" />
        </IonItem>

        <IonButton expand="block" class="primary-action" @click="savePregnancy">
          {{ activePregnancy ? $t('common.save') : $t('profile.new_pregnancy_btn') }}
        </IonButton>
      </section>

      <!-- Birth registration -->
      <section v-if="activePregnancy && mode === 'ANC'" class="form-card">
        <h2 class="form-title">{{ $t('profile.birth_registration') }}</h2>
        <p class="field-hint">{{ $t('profile.birth_registration_hint') }}</p>
        <IonItem lines="full">
          <IonLabel position="stacked">{{ $t('profile.delivery_date_label') }}</IonLabel>
          <IonInput v-model="birth.deliveryDate" type="date" />
        </IonItem>
        <IonItem lines="full">
          <IonLabel position="stacked">{{ $t('profile.delivery_place_label') }}</IonLabel>
          <IonInput v-model="birth.deliveryPlace" :placeholder="$t('profile.optional')" />
        </IonItem>
        <IonItem lines="full">
          <IonLabel position="stacked">{{ $t('profile.delivery_mode_label') }}</IonLabel>
          <IonSelect v-model="birth.deliveryMode" interface="popover">
            <IonSelectOption value="vaginal">{{ $t('profile.mode_vaginal') }}</IonSelectOption>
            <IonSelectOption value="caesarean">{{ $t('profile.mode_caesarean') }}</IonSelectOption>
          </IonSelect>
        </IonItem>
        <IonItem lines="full">
          <IonLabel position="stacked">{{ $t('profile.birth_outcome_label') }}</IonLabel>
          <IonSelect v-model="birth.birthOutcome" interface="popover">
            <IonSelectOption value="live_birth">{{ $t('profile.outcome_live_birth') }}</IonSelectOption>
            <IonSelectOption value="stillbirth">{{ $t('profile.outcome_stillbirth') }}</IonSelectOption>
          </IonSelect>
        </IonItem>
        <IonItem lines="full">
          <IonLabel position="stacked">{{ $t('profile.baby_sex_label') }}</IonLabel>
          <IonSelect v-model="birth.babySex" interface="popover">
            <IonSelectOption value="female">{{ $t('profile.sex_female') }}</IonSelectOption>
            <IonSelectOption value="male">{{ $t('profile.sex_male') }}</IonSelectOption>
          </IonSelect>
        </IonItem>
        <IonItem lines="full">
          <IonLabel>{{ $t('profile.breastfeeding_label') }}</IonLabel>
          <IonToggle v-model="birth.breastfeedingInitiated" />
        </IonItem>
        <IonItem lines="full">
          <IonLabel position="stacked">{{ $t('profile.post_complications_label') }}</IonLabel>
          <IonTextarea v-model="birth.complications" :auto-grow="true" rows="1" :placeholder="$t('profile.optional')" />
        </IonItem>
        <IonItem lines="none">
          <IonLabel position="stacked">{{ $t('profile.post_danger_signs_label') }}</IonLabel>
          <IonTextarea v-model="birth.postnatalDangerSigns" :auto-grow="true" rows="1" :placeholder="$t('profile.optional')" />
        </IonItem>
        <IonButton
          expand="block"
          class="primary-action"
          :disabled="!birth.deliveryDate"
          @click="saveBirth"
        >
          {{ $t('profile.register_birth_btn') }}
        </IonButton>
      </section>

      <IonButton
        v-if="activePregnancy"
        expand="block"
        fill="outline"
        class="danger-action"
        @click="confirmClosePregnancy"
      >
        {{ $t('profile.close_pregnancy_btn') }}
      </IonButton>
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
  IonTextarea,
  IonToggle,
  alertController,
  toastController
} from '@ionic/vue';
import { personOutline } from 'ionicons/icons';
import PageShell from '../../components/PageShell.vue';
import { usePregnancy } from '../../composables/usePregnancy';
import { lmpFromEdd, eddFromLmp, formatDate } from '../../utils/date';
import type { DeliveryMode, BirthOutcome } from '../../db/schemas';

const { t } = useI18n();
const { activePregnancy, mode, registerPregnancy, registerBirth, closePregnancyEarly } = usePregnancy();

const form = ref({
  lmp: '',
  edd: '',
  gravida: null as number | null,
  parity: null as number | null,
  previousOutcomes: 'none',
  previousCaesarean: false,
  pregnancyType: '',
  highRisk: false,
  deliveryDate: '',
  deliveryPlace: '',
  deliveryMode: 'unspecified' as DeliveryMode,
  birthOutcome: 'unspecified' as BirthOutcome,
  babySex: '',
  breastfeedingInitiated: false,
  complications: '',
  postnatalDangerSigns: ''
});

const birth = ref({
  deliveryDate: '',
  deliveryPlace: '',
  deliveryMode: 'vaginal' as 'vaginal' | 'caesarean',
  birthOutcome: 'live_birth' as 'live_birth' | 'stillbirth',
  babySex: '',
  breastfeedingInitiated: true,
  complications: '',
  postnatalDangerSigns: ''
});

const deliveryDisplay = computed(() =>
  activePregnancy.value?.deliveryDate
    ? formatDate(activePregnancy.value.deliveryDate)
    : ''
);

onMounted(() => {
  const p = activePregnancy.value;
  form.value.lmp = p?.lmp ?? '';
  form.value.edd = p?.edd ?? '';
  form.value.gravida = p?.gravida ?? null;
  form.value.parity = p?.parity ?? null;
  form.value.previousOutcomes = p?.previousOutcomes || 'none';
  form.value.previousCaesarean = p?.previousCaesarean ?? false;
  form.value.pregnancyType = p?.pregnancyType ?? '';
  form.value.highRisk = p?.highRisk ?? false;
  form.value.deliveryDate = p?.deliveryDate ?? '';
  form.value.deliveryPlace = p?.deliveryPlace ?? '';
  form.value.deliveryMode = (p?.deliveryMode ?? 'unspecified') as DeliveryMode;
  form.value.birthOutcome = (p?.birthOutcome ?? 'unspecified') as BirthOutcome;
  form.value.breastfeedingInitiated = p?.breastfeedingInitiated ?? false;
  form.value.complications = p?.complications ?? '';
  form.value.postnatalDangerSigns = p?.postnatalDangerSigns ?? '';
});

async function showSaved(): Promise<void> {
  const toast = await toastController.create({
    message: t('common.saved'),
    duration: 1500,
    position: 'bottom'
  });
  await toast.present();
}

async function savePregnancy(): Promise<void> {
  const patch: Parameters<typeof registerPregnancy>[0] = {
    gravida: form.value.gravida,
    parity: form.value.parity,
    previousOutcomes: form.value.previousOutcomes,
    previousCaesarean: form.value.previousCaesarean,
    pregnancyType: form.value.pregnancyType,
    highRisk: form.value.highRisk
  };
  if (form.value.lmp) {
    patch.lmp = form.value.lmp;
    patch.edd = eddFromLmp(form.value.lmp);
    form.value.edd = patch.edd;
  } else if (form.value.edd) {
    patch.edd = form.value.edd;
    patch.lmp = lmpFromEdd(form.value.edd);
    form.value.lmp = patch.lmp;
  }
  if (mode.value === 'PNC') {
    patch.deliveryDate = form.value.deliveryDate || null;
    patch.deliveryPlace = form.value.deliveryPlace;
    patch.deliveryMode = form.value.deliveryMode;
    patch.birthOutcome = form.value.birthOutcome;
    patch.breastfeedingInitiated = form.value.breastfeedingInitiated;
    patch.complications = form.value.complications;
    patch.postnatalDangerSigns = form.value.postnatalDangerSigns;
  }
  await registerPregnancy(patch);
  await showSaved();
}

async function saveBirth(): Promise<void> {
  const p = activePregnancy.value;
  if (!p || !birth.value.deliveryDate) return;
  await registerBirth(p.id, {
    deliveryDate: birth.value.deliveryDate,
    deliveryPlace: birth.value.deliveryPlace,
    deliveryMode: birth.value.deliveryMode,
    birthOutcome: birth.value.birthOutcome,
    babySex: birth.value.babySex,
    breastfeedingInitiated: birth.value.breastfeedingInitiated,
    complications: birth.value.complications,
    postnatalDangerSigns: birth.value.postnatalDangerSigns
  });
  const toast = await toastController.create({
    message: t('profile.pnc_switched'),
    duration: 2500,
    position: 'bottom'
  });
  await toast.present();
}

async function confirmClosePregnancy(): Promise<void> {
  const p = activePregnancy.value;
  if (!p) return;
  const alert = await alertController.create({
    header: t('profile.close_confirm_title'),
    message: t('profile.close_confirm_message'),
    buttons: [
      { text: t('common.cancel'), role: 'cancel' },
      {
        text: t('common.confirm'),
        role: 'destructive',
        handler: () => {
          void closePregnancyEarly(p.id);
        }
      }
    ]
  });
  await alert.present();
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

.form-title-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding-right: 8px;
}

.mode-chip {
  font-size: 0.72rem;
  font-weight: 800;
  border-radius: 999px;
  padding: 4px 12px;
}

.chip-anc { background: var(--color-reminders-bg, #f6c945); color: var(--color-reminders-text, #000); }
.chip-pnc { background: var(--color-information-bg, #7bc62d); color: var(--color-information-text, #000); }

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

.danger-action {
  --border-radius: 999px;
  --color: #c0392b;
  --border-color: #c0392b;
  font-weight: 700;
}
</style>
