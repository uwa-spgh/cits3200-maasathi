<template>
  <PageShell
    :title="$t('information.title')"
    :breadcrumb="breadcrumb"
    :icon="informationCircleOutline"
    color="blue"
  >
    <div class="pnc-breastfeeding">
      <ExpandableCard
        v-for="topic in infoTopics"
        :key="topic.key"
        :title="$t(`pnc.${topic.key}_title`)"
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
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';
import { informationCircleOutline } from 'ionicons/icons';
import PageShell from '../components/PageShell.vue';
import ExpandableCard from '../components/ExpandableCard.vue';
import ListenList from '../components/ListenList.vue';

const { t } = useI18n();

interface Topic {
  key: string;
  points: number;
}

const infoTopics: Topic[] = [
  { key: 'start_early', points: 1 },
  { key: 'only_breastmilk', points: 1 },
  { key: 'feed_often', points: 1 },
  { key: 'good_position', points: 1 },
  { key: 'enough_milk', points: 1 },
  { key: 'sore_breasts', points: 1 },
  { key: 'both_breasts', points: 1 },
  { key: 'get_help', points: 1 }
];

/** The displayed points for a topic, in order. ListenList reads these exact strings. */
function topicPoints(topic: Topic): string[] {
  return Array.from({ length: topic.points }, (_, i) => t(`pnc.${topic.key}.point${i + 1}`));
}

const breadcrumb = computed(() => `${t('information.topics.pnc')} - ${t('pnc.breastfeeding_title')}`);
</script>

<style scoped>
.pnc-breastfeeding {
  display: flex;
  flex-direction: column;
  gap: 14px;
}
</style>
