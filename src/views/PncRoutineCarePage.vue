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
  { key: 'keep_baby_warm', points: 4 },
  { key: 'routine_breastfeed', points: 4 },
  { key: 'keep_baby_clean', points: 4 },
  { key: 'keep_baby_safe', points: 3 },
  { key: 'baby_checkups', points: 3 }
];

const breadcrumb = computed(() => `${t('information.topics.pnc')} - ${t('pnc.routine_care_title')}`);
</script>

<style scoped>
.pnc-routine-care {
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
  color: var(--color-surface-text, #1a1a1a);
}
</style>
