<template>
  <PageShell
    :title="$t('information.title')"
    :breadcrumb="breadcrumb"
    :icon="informationCircleOutline"
    color="blue"
  >
    <div class="tt-education">
      <ExpandableCard
        v-for="topic in infoTopics"
        :key="topic.key"
        :title="$t(`tt.${topic.key}_title`)"
      >
        <ListenList
          :title="$t(`tt.${topic.key}_title`)"
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
  { key: 'what_is_tetanus', points: 1 },
  { key: 'newborn_risk', points: 2 },
  { key: 'tt_protection', points: 1 },
  { key: 'five_dose_schedule', points: 2 },
  { key: 'bring_epi_card', points: 1 },
  { key: 'previous_doses', points: 1 }
];

/** The displayed points for a topic, in order. ListenList reads these exact strings. */
function topicPoints(topic: Topic): string[] {
  return Array.from({ length: topic.points }, (_, i) => t(`tt.${topic.key}.point${i + 1}`));
}

const breadcrumb = computed(() => `${t('information.topics.vaccination')} - ${t('tt.education_title')}`);
</script>

<style scoped>
.tt-education {
  display: flex;
  flex-direction: column;
  gap: 14px;
}
</style>
