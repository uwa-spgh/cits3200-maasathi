<template>
  <PageShell
    nav="profile"
    :title="$t('profile.title')"
    :breadcrumb="$t('profile.menu_birth_plan')"
    :icon="personOutline"
    color="blue"
  >
    <div class="stack">
      <div class="form-card">
        <h2 class="form-title">{{ $t('profile.plan_form_title') }}</h2>
        <IonItem lines="full">
          <IonLabel position="stacked">{{ $t('profile.plan_facility_label') }}</IonLabel>
          <IonInput v-model="form.facility" :placeholder="$t('profile.plan_facility_placeholder')" />
        </IonItem>
        <IonItem lines="full">
          <IonLabel position="stacked">{{ $t('profile.plan_attendant_label') }}</IonLabel>
          <IonInput v-model="form.attendant" :placeholder="$t('profile.plan_attendant_placeholder')" />
        </IonItem>
        <IonItem lines="full">
          <IonLabel position="stacked">{{ $t('profile.plan_transport_label') }}</IonLabel>
          <IonInput v-model="form.transport" :placeholder="$t('profile.plan_transport_placeholder')" />
        </IonItem>
        <IonItem lines="none">
          <IonLabel position="stacked">{{ $t('profile.plan_emergency_contact_label') }}</IonLabel>
          <IonInput v-model="form.emergencyContact" type="tel" :placeholder="$t('profile.plan_emergency_contact_placeholder')" />
        </IonItem>
        <IonButton expand="block" class="primary-action" @click="save">
          {{ $t('common.save') }}
        </IonButton>
      </div>

      <section class="form-card">
        <h2 class="form-title">{{ $t('profile.plan_bag_title') }}</h2>
        <h3 class="bag-subtitle first">{{ $t('profile.plan_bag_mother_title') }}</h3>
        <ListenList
          :title="$t('profile.plan_bag_mother_title')"
          :points="bagTexts('plan_bag_items', 7)"
          accent="blue"
        />
        <h3 class="bag-subtitle">{{ $t('profile.plan_bag_baby_title') }}</h3>
        <ListenList
          :title="$t('profile.plan_bag_baby_title')"
          :points="bagTexts('plan_bag_baby_items', 4)"
          accent="blue"
        />
      </section>

      <section class="advice-card">
        <p class="advice-text">{{ $t('profile.plan_advice_text') }}</p>
        <div class="advice-listen">
          <ListenButton size="sm" accent="blue" :text="$t('profile.plan_advice_text')" />
        </div>
      </section>
    </div>
  </PageShell>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue';
import { useI18n } from 'vue-i18n';
import {
  IonButton,
  IonInput,
  IonItem,
  IonLabel,
  toastController
} from '@ionic/vue';
import { personOutline } from 'ionicons/icons';
import PageShell from '../../components/PageShell.vue';
import ListenButton from '../../components/ListenButton.vue';
import ListenList from '../../components/ListenList.vue';
import { settingsRepo } from '../../db/database';

const FACILITY_KEY = 'maasathi_birth_plan_facility';
const ATTENDANT_KEY = 'maasathi_birth_plan_attendant';
const TRANSPORT_KEY = 'maasathi_birth_plan_transport';
const EMERGENCY_CONTACT_KEY = 'maasathi_birth_plan_emergency_contact';

const { t } = useI18n();

const form = ref<{ facility: string; attendant: string; transport: string; emergencyContact: string }>({
  facility: '',
  attendant: '',
  transport: '',
  emergencyContact: ''
});

/** Translated bag items for one list, in display order (item1 .. itemN). */
function bagTexts(key: string, count: number): string[] {
  return Array.from({ length: count }, (_, i) => t(`profile.${key}.item${i + 1}`));
}

onMounted(async () => {
  form.value.facility = (await settingsRepo.get(FACILITY_KEY)) ?? '';
  form.value.attendant = (await settingsRepo.get(ATTENDANT_KEY)) ?? '';
  form.value.transport = (await settingsRepo.get(TRANSPORT_KEY)) ?? '';
  form.value.emergencyContact = (await settingsRepo.get(EMERGENCY_CONTACT_KEY)) ?? '';
});

async function save(): Promise<void> {
  await settingsRepo.set(FACILITY_KEY, form.value.facility);
  await settingsRepo.set(ATTENDANT_KEY, form.value.attendant);
  await settingsRepo.set(TRANSPORT_KEY, form.value.transport);
  await settingsRepo.set(EMERGENCY_CONTACT_KEY, form.value.emergencyContact);
  const toast = await toastController.create({
    message: t('common.saved'),
    duration: 1500,
    position: 'bottom'
  });
  await toast.present();
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
  outline: 1.5px solid var(--color-card-border, transparent);
}

/* Ionic field placeholders: readable in every theme. */
.form-card ion-input,
.form-card ion-select,
.form-card ion-textarea {
  --placeholder-color: var(--color-text-muted, #5c5c5c);
  --placeholder-opacity: 1;
}

.form-title {
  margin: 4px 4px 12px 4px;
  font-size: 1rem;
  font-weight: 800;
  color: var(--color-card-text, #1a1a1a);
}

.advice-card {
  background: var(--color-surface, #fff);
  border: 2px solid var(--color-profile-bg, #33a1de);
  border-radius: 20px;
  padding: 14px 16px 12px 16px;
  box-shadow: 0 3px 10px var(--color-shadow, rgba(0, 0, 0, 0.08));
}

.advice-text {
  margin: 0;
  font-size: 0.88rem;
  font-weight: 600;
  line-height: 1.4;
  color: var(--color-surface-text, #1a1a1a);
  text-align: center;
}

.advice-listen {
  display: flex;
  justify-content: center;
  margin-top: 10px;
}

.bag-subtitle {
  margin: 14px 4px 8px 4px;
  font-size: 0.92rem;
  font-weight: 700;
  color: var(--color-card-text, #1a1a1a);
}

.bag-subtitle.first {
  margin-top: 0;
}

.primary-action {
  margin: 14px 4px 0 4px;
  --background: var(--color-profile-bg, #33a1de);
  --color: var(--color-profile-text, #000);
  --border-radius: 999px;
  font-weight: 700;
}
</style>
