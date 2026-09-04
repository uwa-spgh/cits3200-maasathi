<template>
  <div class="home-bar-footer">
    <button class="home-btn" :aria-label="$t('common.home')" @click="goHome">
      <IonIcon :icon="homeOutline" />
    </button>
  </div>
</template>

<script setup lang="ts">
import { IonIcon } from '@ionic/vue';
import { homeOutline } from 'ionicons/icons';
import { useIonRouter } from '@ionic/vue';
import { homePath } from '../config/app';

const ionRouter = useIonRouter();

function goHome(): void {
  // Slide back to home, replacing the current entry so the
  // stack resets to the root screen.
  ionRouter.navigate(homePath(), 'back', 'replace');
}
</script>

<style scoped>
.home-bar-footer {
  display: flex;
  justify-content: center;
  padding: 10px 0 14px 0;
}

.home-btn {
  height: 48px;
  width: 48px;
  border-radius: 50%;
  border: 2px solid var(--color-card-text, #1a1a1a);
  background-color: var(--color-card-bg, #eaeaea);
  color: var(--color-card-text, #1a1a1a);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  box-shadow: 0 3px 8px rgba(0, 0, 0, 0.15);
  transition: transform 0.15s ease;
}

.home-btn:active {
  transform: scale(0.94);
}

.home-btn ion-icon {
  font-size: 1.5rem;
}
</style>
