<template>
  <nav class="bottom-nav" :aria-label="$t('home.nav.label')">
    <button
      class="nav-item"
      :class="{ active: active === 'profile' }"
      @click="$emit('navigate', 'Profile')"
    >
      <IonIcon :icon="homeIcons.navProfile" />
      <span>{{ $t('buttons.profile') }}</span>
    </button>

    <button
      class="nav-home"
      :aria-label="$t('common.home')"
      @click="$emit('navigate', 'Home')"
    >
      <IonIcon :icon="homeIcons.navHome" />
    </button>

    <button
      class="nav-item"
      :class="{ active: active === 'danger' }"
      @click="$emit('navigate', 'DangerSigns')"
    >
      <IonIcon :icon="homeIcons.navDanger" />
      <span>{{ $t('information.topics.danger_signs') }}</span>
    </button>
  </nav>
</template>

<script setup lang="ts">
import { IonIcon } from '@ionic/vue';
import { homeIcons } from '../config/icons';

defineProps<{
  active: 'home' | 'profile' | 'danger';
}>();

defineEmits<{
  (e: 'navigate', routeName: string): void;
}>();
</script>

<style scoped>
.bottom-nav {
  width: 100%;
  background: #fff;
  border-radius: 24px 24px 0 0;
  box-shadow: 0 -4px 16px rgba(0, 0, 0, 0.1);
  display: flex;
  align-items: flex-end;
  justify-content: space-around;
  padding: 10px 12px calc(10px + env(safe-area-inset-bottom, 0px)) 12px;
}

.nav-item {
  border: none;
  background: transparent;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
  font-size: 0.78rem;
  font-weight: 700;
  color: var(--color-card-text, #1a1a1a);
  cursor: pointer;
  padding: 4px 12px;
  opacity: 0.85;
}

.nav-item:active {
  transform: scale(0.94);
}

.nav-item ion-icon {
  font-size: 1.5rem;
}

.nav-item.active {
  opacity: 1;
}

.nav-home {
  border: none;
  background: var(--color-reminders-bg, #f6c945);
  color: var(--color-card-text, #1a1a1a);
  height: 60px;
  width: 60px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  margin-top: -32px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
}

.nav-home:active {
  transform: scale(0.94);
}

.nav-home ion-icon {
  font-size: 1.8rem;
}
</style>
