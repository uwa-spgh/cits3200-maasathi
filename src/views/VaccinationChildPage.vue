<!--
  VaccinationChildPage — childhood immunisation information: vaccines after birth and the childhood schedule, as expandable cards. Opens one card when given ?topic=.
-->
<template>
  <PageShell
    :title="$t('information.title')"
    :breadcrumb="breadcrumb"
    :icon="informationCircleOutline"
    color="blue"
  >
    <div class="child-vaccines">
      <ExpandableCard
        v-for="topic in infoTopics"
        :key="topic.key"
        :ref="(el) => setTopicCardRef(topic.key, el)"
        :title="$t(`pnc.${topic.key}_title`)"
        :start-open="topic.key === targetTopic"
      >
        <ListenList
          :title="$t(`pnc.${topic.key}_title`)"
          :points="topicPoints(topic)"
          accent="blue"
        />
      </ExpandableCard>
    </div>
  </PageShell>
</template>

<script setup lang="ts">
import { computed, nextTick, onMounted } from 'vue';
import { useRoute } from 'vue-router';
import { useI18n } from 'vue-i18n';
import { informationCircleOutline } from 'ionicons/icons';
import PageShell from '../components/PageShell.vue';
import ExpandableCard from '../components/ExpandableCard.vue';
import ListenList from '../components/ListenList.vue';

const route = useRoute();
const { t } = useI18n();

interface Topic {
  key: string;
  points: number;
}

// Child vaccination topics (moved here from the PNC page; text lives under `pnc.*`)
const infoTopics: Topic[] = [
  { key: 'vaccines_after_birth', points: 6 },
  { key: 'childhood_immunisation', points: 9 }
];

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

/** The displayed points for a topic, in order. ListenList reads these exact strings. */
function topicPoints(topic: Topic): string[] {
  return Array.from({ length: topic.points }, (_, i) => t(`pnc.${topic.key}.point${i + 1}`));
}

const breadcrumb = computed(() => `${t('information.topics.vaccination')} - ${t('tt.child_vaccines_title')}`);
</script>

<style scoped>
.child-vaccines {
  display: flex;
  flex-direction: column;
  gap: 14px;
}
</style>
