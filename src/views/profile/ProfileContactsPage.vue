<template>
  <PageShell
    :title="$t('profile.title')"
    :breadcrumb="$t('profile.menu_contacts')"
    :icon="personOutline"
    color="blue"
  >
    <div class="stack">
      <p class="page-hint">{{ $t('profile.contacts_hint') }}</p>

      <section v-for="(contact, idx) in contacts" :key="contact.labelKey" class="form-card">
        <h2 class="form-title">{{ $t(contact.labelKey) }}</h2>
        <IonItem lines="none">
          <IonInput
            v-model="contacts[idx].phone"
            type="tel"
            :placeholder="$t('profile.contacts_number_placeholder')"
          />
        </IonItem>
      </section>

      <IonButton expand="block" class="primary-action" @click="save">
        {{ $t('common.save') }}
      </IonButton>
    </div>
  </PageShell>
</template>

<script setup lang="ts">
import { onMounted } from 'vue';
import { useI18n } from 'vue-i18n';
import { IonButton, IonInput, IonItem, toastController } from '@ionic/vue';
import { personOutline } from 'ionicons/icons';
import PageShell from '../../components/PageShell.vue';
import { useEmergencyContacts } from '../../composables/useEmergencyContacts';

const { t } = useI18n();
const { contacts, load, save: saveContacts } = useEmergencyContacts();

onMounted(() => {
  void load();
});

async function save(): Promise<void> {
  await saveContacts();
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

.page-hint {
  margin: 0 4px;
  font-size: 0.85rem;
  opacity: 0.7;
  color: var(--color-card-text, #1a1a1a);
}

.form-card {
  background-color: var(--color-card-bg, #eaeaea);
  border-radius: 20px;
  padding: 12px 14px 14px 14px;
}

.form-title {
  margin: 0 4px 4px 4px;
  font-size: 0.95rem;
  font-weight: 800;
  color: var(--color-card-text, #1a1a1a);
}

.primary-action {
  --background: var(--color-profile-bg, #33a1de);
  --color: var(--color-profile-text, #000);
  --border-radius: 999px;
  font-weight: 700;
}
</style>
