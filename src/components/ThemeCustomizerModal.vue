<template>
  <IonModal :is-open="isOpen" @didDismiss="onClose">
    <IonHeader>
      <IonToolbar color="primary">
        <IonTitle>{{ $t('theme.title') }}</IonTitle>
        <IonButtons slot="end">
          <IonButton @click="onClose">
            <IonIcon :icon="closeOutline" />
          </IonButton>
        </IonButtons>
      </IonToolbar>
    </IonHeader>

    <IonContent class="ion-padding">
      <!-- Theme Presets -->
      <section class="section">
        <h3>{{ $t('theme.presets') }}</h3>
        <div class="preset-grid">
          <IonButton
            fill="outline"
            size="small"
            class="preset-btn"
            @click="applyPreset('vibrant')"
          >
            {{ $t('theme.preset_vibrant') }}
          </IonButton>
          <IonButton
            fill="outline"
            size="small"
            class="preset-btn"
            @click="applyPreset('pastel')"
          >
            {{ $t('theme.preset_pastel') }}
          </IonButton>
          <IonButton
            fill="outline"
            size="small"
            class="preset-btn"
            @click="applyPreset('contrast')"
          >
            {{ $t('theme.preset_contrast') }}
          </IonButton>
          <IonButton
            fill="outline"
            size="small"
            class="preset-btn"
            @click="applyPreset('dark')"
          >
            {{ $t('theme.preset_dark') }}
          </IonButton>
        </div>
      </section>

      <div class="divider"></div>

      <!-- Individual Color Customization -->
      <section class="section">
        <h3>{{ $t('theme.customize_colors') }}</h3>

        <div class="color-picker-item">
          <label>{{ $t('theme.emergency_color') }}</label>
          <input
            type="color"
            :value="theme.emergencyBg"
            @input="updateColor('emergencyBg', ($event.target as HTMLInputElement).value)"
            class="color-input"
          />
        </div>

        <div class="color-picker-item">
          <label>{{ $t('theme.reminders_color') }}</label>
          <input
            type="color"
            :value="theme.remindersBg"
            @input="updateColor('remindersBg', ($event.target as HTMLInputElement).value)"
            class="color-input"
          />
        </div>

        <div class="color-picker-item">
          <label>{{ $t('theme.information_color') }}</label>
          <input
            type="color"
            :value="theme.informationBg"
            @input="updateColor('informationBg', ($event.target as HTMLInputElement).value)"
            class="color-input"
          />
        </div>

        <div class="color-picker-item">
          <label>{{ $t('theme.profile_color') }}</label>
          <input
            type="color"
            :value="theme.profileBg"
            @input="updateColor('profileBg', ($event.target as HTMLInputElement).value)"
            class="color-input"
          />
        </div>

        <div class="color-picker-item">
          <label>{{ $t('theme.card_color') }}</label>
          <input
            type="color"
            :value="theme.cardBg"
            @input="updateColor('cardBg', ($event.target as HTMLInputElement).value)"
            class="color-input"
          />
        </div>

        <div class="color-picker-item">
          <label>{{ $t('theme.background_color') }}</label>
          <input
            type="color"
            :value="theme.appBg"
            @input="updateColor('appBg', ($event.target as HTMLInputElement).value)"
            class="color-input"
          />
        </div>
      </section>

      <div class="reset-container">
        <IonButton color="medium" fill="clear" expand="block" @click="resetToDefault">
          <IonIcon :icon="refreshOutline" slot="start" />
          {{ $t('theme.reset') }}
        </IonButton>
      </div>
    </IonContent>
  </IonModal>
</template>

<script setup lang="ts">
import {
  IonModal,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonButtons,
  IonButton,
  IonContent,
  IonIcon
} from '@ionic/vue';
import { closeOutline, refreshOutline } from 'ionicons/icons';
import { useTheme } from '../composables/useTheme';

defineProps<{
  isOpen: boolean;
}>();

const emit = defineEmits<{
  (e: 'close'): void;
}>();

const { theme, applyPreset, updateColor, resetToDefault } = useTheme();

const onClose = () => {
  emit('close');
};
</script>

<style scoped>
.section {
  margin-bottom: 20px;
}

.section h3 {
  font-size: 1.1rem;
  font-weight: 600;
  margin-bottom: 12px;
  color: var(--ion-text-color, #111);
}

.preset-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 10px;
}

.preset-btn {
  --border-radius: 12px;
  font-size: 0.85rem;
  text-transform: none;
}

.divider {
  height: 1px;
  background-color: rgba(0, 0, 0, 0.1);
  margin: 16px 0;
}

.color-picker-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px 0;
  border-bottom: 1px solid rgba(0, 0, 0, 0.08);
}

.color-picker-item label {
  font-size: 0.95rem;
  font-weight: 500;
  color: var(--ion-text-color, #333);
}

.color-input {
  -webkit-appearance: none;
  -moz-appearance: none;
  appearance: none;
  width: 44px;
  height: 36px;
  background-color: transparent;
  border: none;
  cursor: pointer;
  border-radius: 8px;
}

.color-input::-webkit-color-swatch-wrapper {
  padding: 0;
}

.color-input::-webkit-color-swatch {
  border: 2px solid rgba(0, 0, 0, 0.15);
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.reset-container {
  margin-top: 24px;
}
</style>
