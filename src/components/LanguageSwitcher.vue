<template>
  <div class="language-switcher">
    <IonItem lines="none" class="lang-item">
      <IonIcon :icon="languageOutline" slot="start" class="lang-icon" />
      <IonSelect
        :value="currentLocale"
        @ionChange="changeLanguage($event.detail.value)"
        interface="popover"
        :aria-label="$t('language.select')"
        class="lang-select"
      >
        <IonSelectOption value="en">{{ $t('language.en') }}</IonSelectOption>
        <IonSelectOption value="bn">{{ $t('language.bn') }}</IonSelectOption>
      </IonSelect>
    </IonItem>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';
import { IonItem, IonSelect, IonSelectOption, IonIcon } from '@ionic/vue';
import { languageOutline } from 'ionicons/icons';

const { locale } = useI18n({ useScope: 'global' });

const currentLocale = computed(() => locale.value);

const changeLanguage = (newLang: string) => {
  if (newLang) {
    locale.value = newLang;
    try {
      localStorage.setItem('maasathi_language', newLang);
    } catch (e) {
      console.error('Failed to save language setting', e);
    }
  }
};
</script>

<style scoped>
.language-switcher {
  display: inline-block;
}

.lang-item {
  --background: transparent;
  --min-height: 36px;
  --padding-start: 4px;
  --padding-end: 4px;
  --inner-padding-end: 4px;
  font-size: 0.9rem;
}

.lang-icon {
  font-size: 1.2rem;
  margin-right: 4px;
  color: var(--ion-color-dark, #333);
}

.lang-select {
  --placeholder-color: var(--ion-color-dark, #333);
  font-weight: 500;
}
</style>
