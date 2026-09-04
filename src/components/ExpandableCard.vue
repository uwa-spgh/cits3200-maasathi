<template>
  <div class="expandable-card" :class="{ open: isOpen }">
    <button class="card-head" @click="toggle" :aria-expanded="isOpen">
      <span class="card-head-title">{{ title }}</span>
      <IonIcon :icon="isOpen ? chevronUpOutline : chevronDownOutline" class="chevron" />
    </button>
    <div v-if="isOpen" class="card-body">
      <slot />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { IonIcon } from '@ionic/vue';
import { chevronDownOutline, chevronUpOutline } from 'ionicons/icons';

defineProps<{
  title: string;
  startOpen?: boolean;
}>();

const isOpen = ref(false);

function toggle(): void {
  isOpen.value = !isOpen.value;
}
</script>

<style scoped>
.expandable-card {
  border-radius: 20px;
  background-color: var(--color-card-bg, #eaeaea);
  box-shadow: 0 3px 10px rgba(0, 0, 0, 0.08);
  overflow: hidden;
}

.card-head {
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 14px 16px;
  border: none;
  background: transparent;
  color: var(--color-card-text, #1a1a1a);
  font-size: 1rem;
  font-weight: 700;
  cursor: pointer;
  text-align: left;
}

.chevron {
  font-size: 1.2rem;
  flex-shrink: 0;
}

.card-body {
  padding: 0 16px 16px 16px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}
</style>
