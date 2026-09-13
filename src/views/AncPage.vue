<template>
  <PageShell
    :title="$t('information.title')"
    :breadcrumb="$t('information.topics.anc')"
    :icon="informationCircleOutline"
    color="blue"
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
        <button class="topic-listen-btn" @click.stop="listenTopic(topic)">
          <IonIcon :icon="volumeMediumOutline" />
          <span>{{ $t('home.cards.listen') }}</span>
        </button>
      </ExpandableCard>
    </div>
  </PageShell>
</template>

<script setup lang="ts">
import { IonIcon } from '@ionic/vue';
import { informationCircleOutline, volumeMediumOutline } from 'ionicons/icons';
import { useI18n } from 'vue-i18n';
import PageShell from '../components/PageShell.vue';
import ExpandableCard from '../components/ExpandableCard.vue';
import { useSpeech } from '../composables/useSpeech';

const { t, locale } = useI18n();
const { speak } = useSpeech();

interface Topic {
  key: string;
  points: number;
}

// Layla's authored ANC topics (nutrition is separate in Nutrition section)
const infoTopics: Topic[] = [
  { key: 'early_care', points: 2 },
  { key: 'anc_visits', points: 2 },
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

function listenTopic(topic: Topic): void {
  const lines: string[] = [];
  lines.push(t(`anc.${topic.key}_title`));
  for (let i = 1; i <= topic.points; i++) {
    lines.push(t(`anc.${topic.key}.point${i}`));
  }
  speak(lines.join('. '), locale.value);
}
</script>

<style scoped>
.anc-page {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.sign-list {
  margin: 0 0 10px 0;
  padding-left: 20px;
  display: flex;
  flex-direction: column;
  gap: 6px;
  font-size: 0.9rem;
  color: var(--color-card-text, #1a1a1a);
  line-height: 1.45;
}

.topic-listen-btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  background: #f1f5f9;
  border: 1px solid #cbd5e1;
  color: #334155;
  padding: 5px 11px;
  border-radius: 8px;
  font-size: 0.78rem;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.15s ease;
}

.topic-listen-btn:active {
  background: #e2e8f0;
}
</style>
