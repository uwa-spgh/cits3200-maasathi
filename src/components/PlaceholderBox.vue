<template>
  <div class="placeholder-box">
    <p class="placeholder-title">{{ title }}</p>
    <p v-if="hint" class="placeholder-hint">{{ hint }}</p>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  title: string;
  hint?: string;
}>();
</script>

<style scoped>
.placeholder-box {
  background-color: var(--color-card-bg, #eaeaea);
  color: var(--color-card-text, #1a1a1a);
  border-radius: 20px;
  padding: 18px 16px;
  text-align: center;
  min-height: 64px;
  display: flex;
  flex-direction: column;
  justify-content: center;
  gap: 6px;
}

.placeholder-title {
  margin: 0;
  font-weight: 700;
  font-size: 0.95rem;
}

.placeholder-hint {
  margin: 0;
  font-size: 0.8rem;
  opacity: 0.7;
  font-style: italic;
}
</style>
