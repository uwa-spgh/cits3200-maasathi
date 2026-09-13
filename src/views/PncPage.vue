<template>
  <PageShell
    :title="$t('information.title')"
    :breadcrumb="$t('information.topics.pnc')"
    :icon="informationCircleOutline"
    color="blue"
  >
    <div class="pnc-page">
      <ExpandableCard
        v-for="topic in infoTopics"
        :key="topic.key"
        :title="$t(`pnc.${topic.key}_title`)"
      >
        <ul class="sign-list">
          <li v-for="n in topic.points" :key="n">{{ $t(`pnc.${topic.key}.point${n}`) }}</li>
        </ul>
        <button class="topic-listen-btn" @click.stop="listenTopic(topic)">
          <IonIcon :icon="volumeMediumOutline" />
          <span>{{ $t('home.cards.listen') }}</span>
        </button>
      </ExpandableCard>
            
      <button
        class="breastfeeding-link"
        type="button"
        @click="ionRouter.push({ name: 'PncBreastfeeding' })"
      >
        <span>{{ $t('pnc.breastfeeding_title') }}</span>
        <IonIcon :icon="chevronForwardOutline" />
      </button>
    </div>
  </PageShell>
</template>

<script setup lang="ts">
import { IonIcon, useIonRouter } from '@ionic/vue';
import {
  informationCircleOutline,
  volumeMediumOutline,
  chevronForwardOutline
} from 'ionicons/icons';
  
import { useI18n } from 'vue-i18n';
import PageShell from '../components/PageShell.vue';
import ExpandableCard from '../components/ExpandableCard.vue';
import { useSpeech } from '../composables/useSpeech';

const { t, locale } = useI18n();
const ionRouter = useIonRouter();
const { speak } = useSpeech();

interface Topic {
  key: string;
  points: number;
}

// Layla's authored PNC topics (nutrition is separate in Nutrition section)
const infoTopics: Topic[] = [
  { key: 'rest', points: 1 },
  { key: 'bleeding', points: 1 },
  { key: 'pain', points: 1 },
  { key: 'cleanliness', points: 1 },
  { key: 'checkup', points: 1 },
  { key: 'family_planning', points: 1 },
  { key: 'mood', points: 1 }
];

function listenTopic(topic: Topic): void {
  const lines: string[] = [];
  lines.push(t(`pnc.${topic.key}_title`));
  for (let i = 1; i <= topic.points; i++) {
    lines.push(t(`pnc.${topic.key}.point${i}`));
  }
  speak(lines.join('. '), locale.value);
}
</script>

<style scoped>
.pnc-page {
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

.breastfeeding-link {
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 100%;
  padding: 14px;
  border: 1px solid #cbd5e1;
  border-radius: 10px;
  background: white;
  color: #1a1a1a;
  font-weight: 700;
  cursor: pointer;
}
</style>
