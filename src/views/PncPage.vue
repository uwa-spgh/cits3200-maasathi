<template>
  <PageShell
    :title="$t('information.title')"
    :breadcrumb="$t('information.topics.pnc')"
    :icon="informationCircleOutline"
    color="green"
  >
    <div class="pnc-page">
      <button class="section-btn" @click="openBreastfeeding">
        {{ $t('pnc.breastfeeding_title') }}
      </button>

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
import { useIonRouter } from '@ionic/vue';
import { informationCircleOutline } from 'ionicons/icons';
import PageShell from '../components/PageShell.vue';
import ExpandableCard from '../components/ExpandableCard.vue';

const ionRouter = useIonRouter();

const infoTopics: { key: string; points: number }[] = [
  { key: 'rest', points: 1 },
  { key: 'bleeding', points: 1 },
  { key: 'pain', points: 1 },
  { key: 'eating', points: 1 },
  { key: 'cleanliness', points: 1 },
  { key: 'checkup', points: 1 },
  { key: 'family_planning', points: 1 },
  { key: 'mood', points: 1 }
];

function openBreastfeeding(): void {
  ionRouter.push({ name: 'PncBreastfeeding' });
}
</script>

<style scoped>
.pnc-page {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.section-btn {
  background-color: var(--color-btn-more-bg, #7bc62d);
  color: var(--color-btn-more-text, #000);
  border: 1px solid rgba(0, 0, 0, 0.2);
  border-radius: 999px;
  padding: 14px 20px;
  font-size: 1rem;
  font-weight: 700;
  cursor: pointer;
  box-shadow: 0 3px 10px rgba(0, 0, 0, 0.1);
  transition: transform 0.15s ease;
}

.section-btn:active {
  transform: scale(0.97);
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
