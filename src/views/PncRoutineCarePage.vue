<!--
  PncRoutineCarePage — routine baby care guidance (keeping warm, routine breastfeeding, cleanliness, safety, check-ups) as expandable cards with listen buttons.
-->
<template>
  <PageShell
    :title="$t('information.title')"
    :breadcrumb="breadcrumb"
    :icon="informationCircleOutline"
    color="blue"
  >
    <div class="pnc-routine-care">
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
  { key: 'keep_baby_warm', points: 4 },
  { key: 'routine_breastfeed', points: 4 },
  { key: 'keep_baby_clean', points: 4 },
  { key: 'keep_baby_safe', points: 3 },
  { key: 'baby_checkups', points: 3 }
];

/** The displayed points for a topic, in order. ListenList reads these exact strings. */
function topicPoints(topic: Topic): string[] {
  return Array.from({ length: topic.points }, (_, i) => t(`pnc.${topic.key}.point${i + 1}`));
}

const breadcrumb = computed(() => `${t('information.topics.pnc')} - ${t('pnc.routine_care_title')}`);
</script>

<style scoped>
.pnc-routine-care {
  display: flex;
  flex-direction: column;
  gap: 14px;
}
</style>
