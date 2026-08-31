<template>
  <PageShell
    :title="$t('profile.title')"
    :breadcrumb="$t('profile.menu_settings')"
    :icon="personOutline"
    color="blue"
  >
    <div class="stack">
      <section class="form-card">
        <IonItem lines="full">
          <IonLabel>{{ $t('language.select') }}</IonLabel>
          <LanguageSwitcher />
        </IonItem>
        <IonItem lines="full">
          <IonLabel>{{ $t('theme.title') }}</IonLabel>
          <IonButton slot="end" size="small" fill="outline" @click="themeOpen = true">
            {{ $t('theme.open') }}
          </IonButton>
        </IonItem>
        <IonItem lines="none">
          <IonLabel>
            <h2>{{ $t('profile.nav_mode_label') }}</h2>
            <p>{{ $t('profile.nav_mode_hint') }}</p>
          </IonLabel>
          <IonSelect
            slot="end"
            :value="getNavMode()"
            interface="popover"
            @ionChange="changeNavMode"
          >
            <IonSelectOption value="homeBar">{{ $t('profile.nav_home_bar') }}</IonSelectOption>
            <IonSelectOption value="tabBar">{{ $t('profile.nav_tab_bar') }}</IonSelectOption>
          </IonSelect>
        </IonItem>
      </section>

      <section class="form-card">
        <h2 class="form-title">{{ $t('profile.data_section') }}</h2>
        <IonButton expand="block" fill="outline" class="danger-action" @click="confirmReset">
          {{ $t('profile.reset_data_btn') }}
        </IonButton>
      </section>
    </div>

    <ThemeCustomizerModal :is-open="themeOpen" @close="themeOpen = false" />
  </PageShell>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { useI18n } from 'vue-i18n';
import {
  IonButton,
  IonItem,
  IonLabel,
  IonSelect,
  IonSelectOption,
  alertController
} from '@ionic/vue';
import { personOutline } from 'ionicons/icons';
import PageShell from '../../components/PageShell.vue';
import LanguageSwitcher from '../../components/LanguageSwitcher.vue';
import ThemeCustomizerModal from '../../components/ThemeCustomizerModal.vue';
import { clearAllData } from '../../db/database';
import { getNavMode, setNavMode } from '../../config/app';

const { t } = useI18n();

const themeOpen = ref(false);

async function confirmReset(): Promise<void> {
  const alert = await alertController.create({
    header: t('profile.reset_confirm_title'),
    message: t('profile.reset_confirm_message'),
    buttons: [
      { text: t('common.cancel'), role: 'cancel' },
      {
        text: t('common.confirm'),
        role: 'destructive',
        handler: () => {
          void clearAllData().then(() => {
            try {
              localStorage.clear();
            } catch (e) {
              console.error('reset failed', e);
            }
            window.location.href = '/onboarding';
          });
        }
      }
    ]
  });
  await alert.present();
}

function changeNavMode(event: CustomEvent): void {
  const mode = (event as CustomEvent<{ value: string }>).detail?.value;
  if (mode === 'homeBar' || mode === 'tabBar') {
    setNavMode(mode);
    window.location.reload();
  }
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
  padding: 8px 8px 12px 8px;
}

.form-title {
  margin: 8px 4px 4px 4px;
  font-size: 1rem;
  font-weight: 800;
  color: var(--color-card-text, #1a1a1a);
}

.danger-action {
  margin: 8px 4px 0 4px;
  --border-radius: 999px;
  --color: #c0392b;
  --border-color: #c0392b;
  font-weight: 700;
}
</style>
