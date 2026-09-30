<template>
  <PageShell
    :title="$t('information.title')"
    :breadcrumb="breadcrumb"
    :icon="informationCircleOutline"
    color="green"
  >
    <div class="tt-education">
      <ExpandableCard
        v-for="topic in infoTopics"
        :key="topic.key"
        :title="$t(`tt.${topic.key}_title`)"
      >
        <ul class="sign-list">
          <li v-for="n in topic.points" :key="n">{{ $t(`tt.${topic.key}.point${n}`) }}</li>
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
  { key: 'what_is_tetanus', points: 1 },
  { key: 'newborn_risk', points: 2 },
  { key: 'tt_protection', points: 1 },
  { key: 'five_dose_schedule', points: 2 },
  { key: 'bring_epi_card', points: 1 },
  { key: 'previous_doses', points: 1 }
];

const breadcrumb = computed(() => `${t('information.topics.vaccination')} - ${t('tt.education_title')}`);
</script>

<style scoped>
.tt-education {
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
