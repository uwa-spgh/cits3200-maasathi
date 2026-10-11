<template>
  <div class="listen-text">
    <template v-if="groups.length">
      <section v-for="(group, gi) in groups" :key="gi" class="listen-text-chunk">
        <p v-if="multi" class="listen-text-part">
          {{ t('common.part_of', { current: gi + 1, total: groups.length }) }}
        </p>
        <ContentText :text="group" />
        <div class="listen-text-action">
          <ListenButton size="sm" :accent="accent" :text="speechTexts[gi]" />
        </div>
      </section>
    </template>
    <!-- Nothing to read: show the placeholder without a Listen button. -->
    <ContentText v-else :text="t('content.empty')" />
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';
import ContentText from './ContentText.vue';
import ListenButton from './ListenButton.vue';
import type { ListenAccent } from './ListenButton.vue';
import { chunkSentences, speechText } from '../utils/speechChunks';

const props = withDefaults(
  defineProps<{
    /** Prose to display and read aloud. Paragraphs are separated by newlines. */
    text: string;
    /** Spoken before the first part only. Not displayed (render the heading yourself). */
    title?: string;
    /** Approximate word budget per listen part. */
    maxWords?: number;
    /** Colour of each part's Listen button. */
    accent?: ListenAccent;
  }>(),
  { maxWords: 45, accent: 'neutral' }
);

const { t } = useI18n();

/** Each group is one part: sentences joined by spaces, paragraphs joined by newlines. */
const groups = computed(() => chunkSentences(props.text, props.maxWords));
const multi = computed(() => groups.value.length > 1);

/** Bullet markers are shown on screen but should not be read aloud. */
const BULLET = /^[•◦▪*-]\s*/;

/** The text each part's Listen button reads, matching what is displayed for that part. */
const speechTexts = computed(() =>
  groups.value.map((group, i) =>
    speechText(
      i === 0 ? props.title : undefined,
      group.split('\n').map((line) => line.replace(BULLET, ''))
    )
  )
);
</script>

<style scoped>
.listen-text {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

/* Parts after the first are separated from the previous part by a thin rule. */
.listen-text-chunk {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.listen-text-chunk + .listen-text-chunk {
  padding-top: 12px;
  border-top: 1px solid var(--color-border);
}

.listen-text-part {
  margin: 0;
  font-size: 0.78rem;
  font-weight: 700;
  color: var(--color-text-muted);
}

.listen-text-action {
  align-self: flex-start;
}
</style>
