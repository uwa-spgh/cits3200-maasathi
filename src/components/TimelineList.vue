<template>
  <div class="timeline-list">
    <TimelineItem
      v-for="(item, idx) in items"
      :key="item.id"
      :item="item"
      :title="resolveTitle(item)"
      :expanded="expandedId === item.id"
      :is-last="idx === items.length - 1"
      :info-title="resolveInfo(item)?.title ?? null"
      :info-body="resolveInfo(item)?.body ?? null"
      :can-undo="canUndoItem ? canUndoItem(item) : true"
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

export interface ItemInfo {
  title: string;
  body: string;
}

const props = defineProps<{
  items: ScheduleItem[];
  expandedId?: string | null;
  infoForItem?: ((item: ScheduleItem) => ItemInfo | null) | null;
  canUndoItem?: ((item: ScheduleItem) => boolean) | null;
}>();

defineEmits<{
  (e: 'toggle', id: string): void;
  (e: 'complete', item: ScheduleItem): void;
  (e: 'undo', item: ScheduleItem): void;
}>();

function resolveTitle(item: ScheduleItem): string {
  return t(item.titleKey);
}

function resolveInfo(item: ScheduleItem): ItemInfo | null {
  return props.infoForItem?.(item) ?? null;
}
</script>

<style scoped>
.timeline-list {
  display: flex;
  flex-direction: column;
}

.empty-note {
  margin: 0;
  padding: 12px 0;
  text-align: center;
  font-size: 0.9rem;
  font-weight: 600;
  font-style: italic;
  color: var(--color-text-muted, #5c5c5c);
}
</style>
