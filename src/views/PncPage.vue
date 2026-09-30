<template>
  <PageShell
    :title="$t('information.title')"
    :breadcrumb="$t('information.topics.pnc')"
    :icon="informationCircleOutline"
    color="blue"
  >
    <div class="pnc-page">
      <template v-for="topic in infoTopics" :key="topic.key">
        <button
          v-if="topic.route"
          class="topic-link-btn"
          @click="ionRouter.push({ name: topic.route })"
        >
          <span>{{ $t(`pnc.${topic.key}_title`) }}</span>
          <IonIcon :icon="chevronForwardOutline" class="arrow-icon" />
        </button>
        <ExpandableCard
          v-else
          :ref="(el) => setTopicCardRef(topic.key, el)"
          :title="$t(`pnc.${topic.key}_title`)"
          :start-open="topic.key === targetTopic"
        >
          <ul class="sign-list">
            <li v-for="n in topic.points" :key="n">{{ $t(`pnc.${topic.key}.point${n}`) }}</li>
          </ul>
          <button class="topic-listen-btn" @click.stop="listenTopic(topic)">
            <IonIcon :icon="volumeMediumOutline" />
            <span>{{ $t('home.cards.listen') }}</span>
          </button>
        </ExpandableCard>
      </template>
    </div>
  </PageShell>
</template>

<script setup lang="ts">
import { computed, nextTick, onMounted } from 'vue';
import { useRoute } from 'vue-router';
import { IonIcon, useIonRouter } from '@ionic/vue';
import { chevronForwardOutline, informationCircleOutline, volumeMediumOutline } from 'ionicons/icons';
import { useI18n } from 'vue-i18n';
import PageShell from '../components/PageShell.vue';
import ExpandableCard from '../components/ExpandableCard.vue';
import { useSpeech } from '../composables/useSpeech';

const route = useRoute();
const ionRouter = useIonRouter();
const { t, locale } = useI18n();
const { speak } = useSpeech();

/** Set via ?topic=key (e.g. from the Home page's "What to know right now"
 *  widget) to auto-expand and scroll to that specific card. */
const targetTopic = computed(() => {
  const q = route.query.topic;
  return typeof q === 'string' ? q : null;
});

const topicCardEls = new Map<string, { $el?: Element } | null>();
function setTopicCardRef(key: string, el: { $el?: Element } | null): void {
  topicCardEls.set(key, el);
}

onMounted(async () => {
  if (!targetTopic.value) return;
  await nextTick();
  const el = topicCardEls.get(targetTopic.value)?.$el;
  if (el instanceof Element) {
    el.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }
});

interface Topic {
  key: string;
  points: number;
  route?: string;
}

// Layla's authored PNC topics (nutrition is separate in Nutrition section)
const infoTopics: Topic[] = [
  { key: 'routine_care', points: 0, route: 'PncRoutineCare' },
  { key: 'rest', points: 1 },
  { key: 'bleeding', points: 1 },
  { key: 'pain', points: 1 },
  { key: 'cleanliness', points: 1 },
  { key: 'cord_healing', points: 10 },
  { key: 'vaccines_after_birth', points: 6 },
  { key: 'childhood_immunisation', points: 9 },
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

.sign-list li {
  white-space: pre-line;
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

.topic-link-btn {
  background-color: #fff;
  color: var(--color-card-text, #1a1a1a);
  border: 2px solid var(--color-information-bg, #7bc62d);
  border-radius: 18px;
  padding: 14px 18px;
  font-size: 0.98rem;
  font-weight: 700;
  cursor: pointer;
  box-shadow: 0 3px 10px rgba(0, 0, 0, 0.06);
  transition: transform 0.15s ease;
  display: flex;
  align-items: center;
  justify-content: space-between;
  text-align: left;
}

.topic-link-btn:active {
  transform: scale(0.98);
}

.arrow-icon {
  font-size: 1.2rem;
  opacity: 0.6;
}
</style>
