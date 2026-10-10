<!--
  AncPage — antenatal care information: expandable cards for each ANC topic, with listen buttons. Opens one card when given ?topic=, and the birth preparedness card links to the birth plan.
-->
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
        :ref="(el) => setTopicCardRef(topic.key, el)"
        :title="$t(`anc.${topic.key}_title`)"
        :start-open="topic.key === targetTopic"
      >
        <ListenList
          :title="$t(`anc.${topic.key}_title`)"
          :points="topicPoints(topic)"
          accent="blue"
        />
        <button
          v-if="topic.key === 'birth_preparedness'"
          class="birth-plan-link-btn"
          @click.stop="ionRouter.push({ name: 'ProfilePlan' })"
        >
          <span>{{ $t('anc.birth_preparedness_plan_link') }}</span>
          <IonIcon :icon="chevronForwardOutline" class="arrow-icon" />
        </button>
      </ExpandableCard>
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
}

// Layla's authored ANC topics (nutrition is separate in Nutrition section)
const infoTopics: Topic[] = [
  { key: 'early_care', points: 2 },
  { key: 'anc_visits', points: 2 },
  { key: 'iron_folic_acid', points: 2 },
  { key: 'calcium_supplementation', points: 2 },
  { key: 'pre_eclampsia_monitoring', points: 4 },
  { key: 'physical_activity', points: 2 },
  { key: 'hydration_rest', points: 2 },
  { key: 'mental_wellbeing', points: 2 },
  { key: 'danger_signs_note', points: 1 },
  { key: 'birth_preparedness', points: 2 },
  { key: 'skilled_birth_care', points: 2 },
  { key: 'signs_of_labour', points: 5 },
  { key: 'labour_go_to_facility', points: 12 },
  { key: 'maternal_immunisation', points: 2 },
  { key: 'avoid_harmful_substances', points: 2 },
  { key: 'hygiene_infection_prevention', points: 2 },
  { key: 'preparing_baby_care', points: 2 }
];

/** The translated bullet points for a topic, in order. */
function topicPoints(topic: Topic): string[] {
  return Array.from({ length: topic.points }, (_, i) => t(`anc.${topic.key}.point${i + 1}`));
}
</script>

<style scoped>
.anc-page {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.birth-plan-link-btn {
  background-color: var(--color-surface, #fff);
  color: var(--color-surface-text, #1a1a1a);
  border: 1.5px solid var(--color-profile-bg, #33a1de);
  border-radius: 14px;
  padding: 10px 14px;
  font-size: 0.86rem;
  font-weight: 700;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: space-between;
  text-align: left;
  margin-top: 12px;
  margin-bottom: 10px;
}

.birth-plan-link-btn:active {
  transform: scale(0.98);
}

.birth-plan-link-btn .arrow-icon {
  font-size: 1.1rem;
  color: var(--color-text-muted, #5c5c5c);
  flex-shrink: 0;
}
</style>
