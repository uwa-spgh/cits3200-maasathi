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
        <ContentText :text="$t(`nutrition.body.${topic}`) || $t('content.empty')" />
      </ExpandableCard>
    </div>
  </PageShell>
</template>

<script setup lang="ts">
import { computed, nextTick, onMounted } from 'vue';
import { useRoute } from 'vue-router';
import { informationCircleOutline } from 'ionicons/icons';
import PageShell from '../components/PageShell.vue';
import ExpandableCard from '../components/ExpandableCard.vue';
import ContentText from '../components/ContentText.vue';

const route = useRoute();

const topics = ['healthy_diet', 'ifa', 'calcium', 'hydration', 'activity'] as const;

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
</style>
