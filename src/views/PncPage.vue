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
          <ListenList
            :title="$t(`pnc.${topic.key}_title`)"
            :points="topicPoints(topic)"
            accent="blue"
          />
        </ExpandableCard>
      </template>
    </div>
  </PageShell>
</template>

<script setup lang="ts">
import { computed, nextTick, onMounted } from 'vue';
import { useRoute } from 'vue-router';
import { IonIcon, useIonRouter } from '@ionic/vue';
import { chevronForwardOutline, informationCircleOutline } from 'ionicons/icons';
import { useI18n } from 'vue-i18n';
import PageShell from '../components/PageShell.vue';
import ExpandableCard from '../components/ExpandableCard.vue';
import ListenList from '../components/ListenList.vue';

const route = useRoute();
const ionRouter = useIonRouter();
const { t } = useI18n();

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
  { key: 'checkup', points: 1 },
  { key: 'family_planning', points: 1 },
  { key: 'mood', points: 1 }
];

/** The displayed points for a topic, in order. ListenList reads these exact strings. */
function topicPoints(topic: Topic): string[] {
  return Array.from({ length: topic.points }, (_, i) => t(`pnc.${topic.key}.point${i + 1}`));
}
</script>

<style scoped>
.pnc-page {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.topic-link-btn {
  background-color: var(--color-surface, #fff);
  color: var(--color-surface-text, #1a1a1a);
  border: 2px solid var(--color-profile-bg, #33a1de);
  border-radius: 18px;
  padding: 14px 18px;
  font-size: 0.98rem;
  font-weight: 700;
  cursor: pointer;
  box-shadow: 0 3px 10px var(--color-shadow, rgba(0, 0, 0, 0.06));
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
  color: var(--color-text-muted, #5c5c5c);
}
</style>
