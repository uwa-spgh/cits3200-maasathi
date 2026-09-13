<template>
  <PageShell
    :title="$t('information.title')"
    :breadcrumb="breadcrumb"
    :icon="informationCircleOutline"
    color="green"
  >
    <div class="pnc-breastfeeding">
      <ExpandableCard
        v-for="topic in infoTopics"
        :key="topic.key"
        :title="$t(`pnc.${topic.key}_title`)"
      >
        <ul class="sign-list">
          <li v-for="n in topic.points" :key="n">{{ $t(`pnc.${topic.key}.point${n}`) }}</li>
        </ul>
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

const { t } = useI18n();

const infoTopics: { key: string; points: number }[] = [
  { key: 'start_early', points: 1 },
  { key: 'only_breastmilk', points: 1 },
  { key: 'feed_often', points: 1 },
  { key: 'good_position', points: 1 },
  { key: 'enough_milk', points: 1 },
  { key: 'sore_breasts', points: 1 },
  { key: 'both_breasts', points: 1 },
  { key: 'get_help', points: 1 }
];

const breadcrumb = computed(() => `${t('information.topics.pnc')} - ${t('pnc.breastfeeding_title')}`);
</script>

<style scoped>
.pnc-breastfeeding {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.sign-list {
  margin: 0;
  padding-left: 20px;
  display: flex;
  flex-direction: column;
  gap: 6px;
  font-size: 0.9rem;
  color: var(--color-card-text, #1a1a1a);
}
</style>
