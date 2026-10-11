<template>
  <div class="listen-list">
    <section v-for="(chunk, ci) in chunks" :key="ci" class="listen-list-chunk">
      <p v-if="multi" class="listen-list-part">
        {{ t('common.part_of', { current: ci + 1, total: chunks.length }) }}
      </p>
      <ol v-if="ordered" class="listen-list-items" :start="starts[ci]">
        <li v-for="(point, pi) in chunk" :key="pi">{{ point }}</li>
      </ol>
      <ul v-else class="listen-list-items">
        <li v-for="(point, pi) in chunk" :key="pi">{{ point }}</li>
      </ul>
      <div class="listen-list-action">
        <ListenButton size="sm" :accent="accent" :text="chunkTexts[ci]" />
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';
import ListenButton from './ListenButton.vue';
import type { ListenAccent } from './ListenButton.vue';
import { chunkPoints, speechText } from '../utils/speechChunks';

const props = withDefaults(
  defineProps<{
    /** Bullet points to display. Blank entries are skipped. */
    points: string[];
    /** Spoken before the first part only. Not displayed (render the heading yourself). */
    title?: string;
    /** Approximate word budget per listen part. */
    maxWords?: number;
    /** Colour of each part's Listen button. */
    accent?: ListenAccent;
    /** Render a numbered list instead of bullets. Numbering continues across parts. */
    ordered?: boolean;
  }>(),
  { maxWords: 45, accent: 'neutral', ordered: false }
);

const { t } = useI18n();

const chunks = computed(() => chunkPoints(props.points, props.maxWords));
const multi = computed(() => chunks.value.length > 1);

/** The text each part's Listen button reads. The title is prepended to the first part only. */
const chunkTexts = computed(() =>
  chunks.value.map((chunk, i) => speechText(i === 0 ? props.title : undefined, chunk))
);

/** `<ol start>` value for each part, so numbering carries over between parts. */
const starts = computed(() => {
  let next = 1;
  return chunks.value.map((chunk) => {
    const start = next;
    next += chunk.length;
    return start;
  });
});
</script>

<style scoped>
.listen-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

/* Parts after the first are separated from the previous part by a thin rule. */
.listen-list-chunk {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.listen-list-chunk + .listen-list-chunk {
  padding-top: 12px;
  border-top: 1px solid var(--color-border);
}

.listen-list-part {
  margin: 0;
  font-size: 0.78rem;
  font-weight: 700;
  color: var(--color-text-muted);
}

/* Matches the bullet styling used by topic cards (formerly .sign-list in AncPage). */
.listen-list-items {
  margin: 0;
  padding-left: 20px;
  display: flex;
  flex-direction: column;
  gap: 6px;
  font-size: 0.9rem;
  color: var(--color-surface-text);
  line-height: 1.45;
}

.listen-list-items li {
  white-space: pre-line;
}

.listen-list-action {
  align-self: flex-start;
}
</style>
