<template>
  <PageShell
    :title="$t('information.title')"
    :breadcrumb="$t('information.topics.nutrition')"
    :icon="informationCircleOutline"
    color="blue"
  >
    <div class="nutrition-page">
      <ExpandableCard
        v-for="topic in topics"
        :key="topic"
        :ref="(el) => setTopicCardRef(topic, el)"
        :title="$t(`nutrition.topics.${topic}`)"
        :start-open="topic === targetTopic"
      >
        <ContentText :text="bodyText(topic) || $t('content.empty')" />
        <ListenButton
          v-if="bodyText(topic)"
          class="card-listen"
          size="sm"
          accent="blue"
          :text="speechFor(topic)"
        />
      </ExpandableCard>
    </div>
  </PageShell>
</template>

<script setup lang="ts">
import { computed, nextTick, onMounted } from 'vue';
import { useI18n } from 'vue-i18n';
import { useRoute } from 'vue-router';
import { informationCircleOutline } from 'ionicons/icons';
import PageShell from '../components/PageShell.vue';
import ExpandableCard from '../components/ExpandableCard.vue';
import ContentText from '../components/ContentText.vue';
import ListenButton from '../components/ListenButton.vue';
import { speechText } from '../utils/speechChunks';

const route = useRoute();
const { t } = useI18n();

const topics = ['healthy_diet', 'ifa', 'calcium', 'hydration', 'activity'] as const;
type Topic = (typeof topics)[number];

/** The raw body text for a topic card; empty when no translation exists. */
function bodyText(topic: Topic): string {
  return t(`nutrition.body.${topic}`).trim();
}

/**
 * What the listen button reads: the card title, then the body paragraphs as
 * displayed. The body often repeats the title as its first line, and bullet
 * markers are dropped, so the audio reads each sentence once without symbols.
 */
function speechFor(topic: Topic): string {
  const title = t(`nutrition.topics.${topic}`).trim();
  const lines = bodyText(topic)
    .split('\n')
    .map((line) => line.trim().replace(/^[•\-*]\s*/, ''))
    .filter((line) => line.length > 0);
  if (lines[0] === title) lines.shift();
  return speechText(title, lines);
}

/** Set via ?topic=key (e.g. from the Home page's "What to know right now"
 *  widget) to auto-expand and scroll to that specific card. */
const targetTopic = computed(() => {
  const q = route.query.topic;
  return typeof q === 'string' ? q : null;
});

const topicCardEls = new Map<string, { $el?: Element } | null>();
function setTopicCardRef(key: string, el: { $el?: Element } | null): void {
  topicCardEls.set(key, el);
}

onMounted(async () => {
  if (!targetTopic.value) return;
  await nextTick();
  const el = topicCardEls.get(targetTopic.value)?.$el;
  if (el instanceof Element) {
    el.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }
});
</script>

<style scoped>
.nutrition-page {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.card-listen {
  align-self: flex-start;
}
</style>
