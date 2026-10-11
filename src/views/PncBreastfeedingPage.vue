<!--
  PncBreastfeedingPage — postnatal breastfeeding guidance (starting early, feeding often, positioning, milk supply, help) as expandable cards with listen buttons.
-->
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
import { PNC_BREASTFEEDING_TOPICS as infoTopics, type TopicDef as Topic } from '../content/topics';

const { t } = useI18n();

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
