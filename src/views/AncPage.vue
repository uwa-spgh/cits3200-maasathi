<template>
  <PageShell
    :title="$t('information.title')"
    :breadcrumb="$t('information.topics.anc')"
    :icon="informationCircleOutline"
    color="green"
  >
    <div class="anc-page">
      <ExpandableCard
        v-for="topic in infoTopics"
        :key="topic.key"
        :title="$t(`anc.${topic.key}_title`)"
      >
        <ul class="sign-list">
          <li v-for="n in topic.points" :key="n">{{ $t(`anc.${topic.key}.point${n}`) }}</li>
        </ul>
      </ExpandableCard>
    </div>
  </PageShell>
</template>

<script setup lang="ts">
import { informationCircleOutline } from 'ionicons/icons';
import PageShell from '../components/PageShell.vue';
import ExpandableCard from '../components/ExpandableCard.vue';

const infoTopics: { key: string; points: number }[] = [
  { key: 'early_care', points: 2 },
  { key: 'anc_visits', points: 2 },
  { key: 'healthy_diet', points: 2 },
  { key: 'iron_folic_acid', points: 2 },
  { key: 'calcium_supplementation', points: 2 },
  { key: 'physical_activity', points: 2 },
  { key: 'hydration_rest', points: 2 },
  { key: 'mental_wellbeing', points: 2 },
  { key: 'danger_signs_note', points: 1 },
  { key: 'birth_preparedness', points: 2 },
  { key: 'skilled_birth_care', points: 2 },
  { key: 'maternal_immunisation', points: 2 },
  { key: 'avoid_harmful_substances', points: 2 },
  { key: 'hygiene_infection_prevention', points: 2 },
  { key: 'preparing_baby_care', points: 2 }
];
</script>

<style scoped>
.anc-page {
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
