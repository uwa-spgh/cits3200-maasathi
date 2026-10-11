<!--
  ProfilePlan — birth plan form (facility, birth attendant, transport, emergency contact) saved on demand, with mother's and baby's bag checklists. Reached from the Profile menu and the ANC birth preparedness card.
-->
<template>
  <PageShell
    nav="profile"
    :title="$t('profile.title')"
    :breadcrumb="$t('profile.menu_birth_plan')"
    :icon="personOutline"
    color="blue"
  >
    <div class="profile-stack">
      <div class="profile-card">
        <h2 class="profile-card-title">{{ $t('profile.plan_form_title') }}</h2>
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
        <IonButton expand="block" class="profile-action" @click="save">
          {{ $t('common.save') }}
        </IonButton>
      </div>

      <section class="profile-card">
        <h2 class="profile-card-title">{{ $t('profile.plan_bag_title') }}</h2>
        <h3 class="profile-subtitle first">{{ $t('profile.plan_bag_mother_title') }}</h3>
        <ListenList
          :title="$t('profile.plan_bag_mother_title')"
          :points="bagTexts('plan_bag_items', 7)"
          accent="blue"
        />
        <h3 class="profile-subtitle">{{ $t('profile.plan_bag_baby_title') }}</h3>
        <ListenList
          :title="$t('profile.plan_bag_baby_title')"
          :points="bagTexts('plan_bag_baby_items', 4)"
          accent="blue"
        />
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
import ListenList from '../../components/ListenList.vue';
import { settingsRepo } from '../../db/database';
import { FAMILY_LABEL_KEY, useEmergencyContacts } from '../../composables/useEmergencyContacts';

const FACILITY_KEY = 'maasathi_birth_plan_facility';
const ATTENDANT_KEY = 'maasathi_birth_plan_attendant';
const TRANSPORT_KEY = 'maasathi_birth_plan_transport';

const { t } = useI18n();
const { load, phoneOf, setPhone } = useEmergencyContacts();

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
  await load();
  form.value.emergencyContact = phoneOf(FAMILY_LABEL_KEY);
});

async function save(): Promise<void> {
  await settingsRepo.set(FACILITY_KEY, form.value.facility);
  await settingsRepo.set(ATTENDANT_KEY, form.value.attendant);
  await settingsRepo.set(TRANSPORT_KEY, form.value.transport);
  await setPhone(FAMILY_LABEL_KEY, form.value.emergencyContact);
  const toast = await toastController.create({
    message: t('common.saved'),
    duration: 1500,
    position: 'bottom'
  });
  await toast.present();
}
</script>

