<template>
  <PageShell
    :title="$t('profile.title')"
    :breadcrumb="$t('profile.menu_personal')"
    :icon="personOutline"
    color="blue"
  >
    <div class="form-card">
      <IonItem lines="full">
        <IonLabel position="stacked">{{ $t('profile.name_label') }}</IonLabel>
        <IonInput v-model="form.name" :placeholder="$t('profile.name_placeholder')" />
      </IonItem>
      <IonItem lines="none">
        <IonLabel position="stacked">{{ $t('profile.age_label') }}</IonLabel>
        <IonInput v-model.number="form.age" type="number" :placeholder="$t('profile.age_placeholder')" />
      </IonItem>
      <IonButton expand="block" class="primary-action" @click="save">
        {{ $t('common.save') }}
      </IonButton>
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
import { useUser } from '../../composables/useUser';
import { settingsRepo } from '../../db/database';

const AGE_KEY = 'maasathi_user_age';

const { t } = useI18n();
const { userName, setUserName } = useUser();

const form = ref<{ name: string; age: number | null }>({ name: '', age: null });

onMounted(async () => {
  form.value.name = userName();
  form.value.age = await settingsRepo.getNumber(AGE_KEY);
});

async function save(): Promise<void> {
  setUserName(form.value.name);
  await settingsRepo.setNumber(AGE_KEY, form.value.age);
  const toast = await toastController.create({
    message: t('common.saved'),
    duration: 1500,
    position: 'bottom'
  });
  await toast.present();
}
</script>

<style scoped>
.form-card {
  background-color: var(--color-card-bg, #eaeaea);
  border-radius: 20px;
  padding: 16px 14px 18px 14px;
}

.primary-action {
  margin: 14px 4px 0 4px;
  --background: var(--color-profile-bg, #33a1de);
  --color: var(--color-profile-text, #000);
  --border-radius: 999px;
  font-weight: 700;
}
</style>
