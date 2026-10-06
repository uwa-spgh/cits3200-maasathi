<template>
  <PageShell
    :title="$t('information.title')"
    :breadcrumb="breadcrumb"
    :icon="informationCircleOutline"
    color="blue"
  >
    <div class="child-vaccines">
      <ExpandableCard
        v-for="topic in infoTopics"
        :key="topic.key"
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
    </div>
  </PageShell>
</template>

<script setup lang="ts">
import { computed, nextTick, onMounted } from 'vue';
import { useRoute } from 'vue-router';
import { IonIcon } from '@ionic/vue';
import { useI18n } from 'vue-i18n';
import { informationCircleOutline, volumeMediumOutline } from 'ionicons/icons';
import PageShell from '../components/PageShell.vue';
import ExpandableCard from '../components/ExpandableCard.vue';
import { useSpeech } from '../composables/useSpeech';

const route = useRoute();
const { t, locale } = useI18n();
const { speak } = useSpeech();

interface Topic {
  key: string;
  points: number;
}

// Child vaccination topics (moved here from the PNC page; text lives under `pnc.*`)
const infoTopics: Topic[] = [
  { key: 'vaccines_after_birth', points: 6 },
  { key: 'childhood_immunisation', points: 9 }
];

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

function listenTopic(topic: Topic): void {
  const lines: string[] = [t(`pnc.${topic.key}_title`)];
  for (let i = 1; i <= topic.points; i++) {
    lines.push(t(`pnc.${topic.key}.point${i}`));
  }
  speak(lines.join('. '), locale.value);
}

const breadcrumb = computed(() => `${t('information.topics.vaccination')} - ${t('tt.child_vaccines_title')}`);
</script>

<style scoped>
.child-vaccines {
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
