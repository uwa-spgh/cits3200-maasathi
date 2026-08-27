<template>
  <IonPage>
    <IonHeader>
      <IonToolbar color="primary">
        <IonButtons slot="start">
          <IonBackButton default-href="/home" />
        </IonButtons>
        <IonTitle>{{ $t('profile_settings.title') }}</IonTitle>
      </IonToolbar>
    </IonHeader>

    <IonContent class="ion-padding">
      <IonList>
        <!-- Personal Information Section -->
        <IonItemGroup>
          <IonItemDivider>
            <IonLabel>{{ $t('profile_settings.personal_info') }}</IonLabel>
          </IonItemDivider>
          <IonItem lines="full">
            <IonLabel position="stacked">{{ $t('profile_settings.name_label') }}</IonLabel>
            <IonInput
              :value="userName"
              @ionInput="onNameInput($event.detail.value)"
              :placeholder="$t('profile_settings.name_placeholder')"
              clear-input
            />
          </IonItem>
        </IonItemGroup>

        <!-- Language Settings Section -->
        <IonItemGroup class="ion-margin-top">
          <IonItemDivider>
            <IonLabel>{{ $t('language.select') }}</IonLabel>
          </IonItemDivider>
          <IonItem lines="full">
            <LanguageSwitcher />
          </IonItem>
        </IonItemGroup>
      </IonList>
    </IonContent>
  </IonPage>
</template>

<script setup lang="ts">
import {
  IonPage,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonButtons,
  IonBackButton,
  IonContent,
  IonList,
  IonItemGroup,
  IonItemDivider,
  IonItem,
  IonLabel,
  IonInput
} from '@ionic/vue';
import LanguageSwitcher from '../components/LanguageSwitcher.vue';
import { useUser } from '../composables/useUser';

const { userName, setUserName } = useUser();

const onNameInput = (val: string | null | undefined) => {
  setUserName(val || '');
};
</script>
