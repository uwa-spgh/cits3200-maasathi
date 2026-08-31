<template>
  <div class="timeline-list">
    <TimelineItem
      v-for="(item, idx) in items"
      :key="item.id"
      :item="item"
      :title="resolveTitle(item)"
      :expanded="expandedId === item.id"
      :is-last="idx === items.length - 1"
      @select="$emit('toggle', $event.id)"
      @complete="$emit('complete', $event)"
      @undo="$emit('undo', $event)"
    />
    <p v-if="items.length === 0" class="empty-note">{{ $t('timeline.empty') }}</p>
  </div>
</template>

<script setup lang="ts">
import TimelineItem from './TimelineItem.vue';
import type { ScheduleItem } from '../db/schemas';
import { t } from '../i18n';

defineProps<{
  items: ScheduleItem[];
  expandedId?: string | null;
}>();

defineEmits<{
  (e: 'toggle', id: string): void;
  (e: 'complete', item: ScheduleItem): void;
  (e: 'undo', item: ScheduleItem): void;
}>();

function resolveTitle(item: ScheduleItem): string {
  return t(item.titleKey);
}
</script>

<style scoped>
.timeline-list {
  display: flex;
  flex-direction: column;
}

.empty-note {
  text-align: center;
  font-size: 0.9rem;
  opacity: 0.6;
  font-style: italic;
  color: var(--color-card-text, #1a1a1a);
}
</style>
