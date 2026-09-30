<template>
  <div class="content-text">
    <p v-for="(paragraph, idx) in paragraphs" :key="idx">{{ paragraph }}</p>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';

const props = defineProps<{
  text: string;
}>();

const paragraphs = computed(() =>
  props.text
    .split('\n')
    .map((p) => p.trim())
    .filter((p) => p.length > 0)
);
</script>

<style scoped>
.content-text p {
  margin: 0;
  font-size: 0.9rem;
  line-height: 1.5;
  color: var(--color-card-text, #1a1a1a);
}

.content-text p + p {
  margin-top: 8px;
}
</style>
