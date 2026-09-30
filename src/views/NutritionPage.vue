<template>
  <PageShell
    :title="$t('information.title')"
    :breadcrumb="$t('information.topics.nutrition')"
    :icon="informationCircleOutline"
    color="green"
  >
    <div class="nutrition-page">
      <ExpandableCard
        v-for="topic in topics"
        :key="topic"
        :title="$t(`nutrition.topics.${topic}`)"
      >
        <ContentText :text="$t(`nutrition.body.${topic}`) || $t('content.empty')" />
      </ExpandableCard>
    </div>
  </PageShell>
</template>

<script setup lang="ts">
import { informationCircleOutline } from 'ionicons/icons';
import PageShell from '../components/PageShell.vue';
import ExpandableCard from '../components/ExpandableCard.vue';
import ContentText from '../components/ContentText.vue';

const topics = ['healthy_diet', 'ifa', 'calcium', 'hydration', 'activity'] as const;
</script>

<style scoped>
.nutrition-page {
  display: flex;
  flex-direction: column;
  gap: 14px;
}
</style>
