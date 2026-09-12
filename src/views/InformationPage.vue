<template>
  <PageShell
    :title="$t('information.title')"
    :icon="informationCircleOutline"
    color="green"
  >
    <div class="info-hub">
      <section v-if="nowTopics.length" class="now-section">
        <h2 class="now-title">{{ $t('information.now_title') }}</h2>
        <ExpandableCard
          v-for="topic in nowTopics"
          :key="`${topic.ns}.${topic.key}`"
          :title="$t(`${topic.ns}.${topic.key}_title`)"
        >
          <PlaceholderBox
            v-if="topic.placeholder"
            :title="$t(`${topic.ns}.${topic.key}_title`)"
            :hint="$t('placeholder.hint')"
          />
          <ul v-else class="sign-list">
            <li v-for="n in topic.points" :key="n">{{ $t(`${topic.ns}.${topic.key}.point${n}`) }}</li>
          </ul>
        </ExpandableCard>
      </section>

      <button
        v-for="topic in topics"
        :key="topic.route"
        class="topic-btn"
        @click="ionRouter.push({ name: topic.route })"
      >
        {{ $t(`information.topics.${topic.key}`) }}
      </button>
    </div>
  </PageShell>
</template>

<script setup lang="ts">
import { computed, onMounted } from 'vue';
import { useIonRouter } from '@ionic/vue';
import { informationCircleOutline } from 'ionicons/icons';
import PageShell from '../components/PageShell.vue';
import ExpandableCard from '../components/ExpandableCard.vue';
import PlaceholderBox from '../components/PlaceholderBox.vue';
import { usePregnancy } from '../composables/usePregnancy';
import { useSchedule } from '../composables/useSchedule';

const ionRouter = useIonRouter();
const { mode } = usePregnancy();
const { upcoming, load } = useSchedule();

onMounted(() => {
  void load();
});

const topics = computed(() => {
  const base = [
    { key: 'anc', route: 'Anc' },
    { key: 'pnc', route: 'Pnc' },
    { key: 'danger_signs', route: 'DangerSigns' },
    { key: 'vaccination', route: 'Vaccination' }
  ];
  if (mode.value === 'PNC') {
    return [...base.filter((x) => x.key === 'pnc'), ...base.filter((x) => x.key !== 'pnc')];
  }
  return base;
});

interface NowTopic {
  ns: 'anc' | 'pnc';
  key: string;
  points: number;
  placeholder?: boolean;
}

const NOW_TOPICS: Record<string, NowTopic[]> = {
  'ANC:visit1': [
    { ns: 'anc', key: 'iron_folic_acid', points: 2 },
    { ns: 'anc', key: 'healthy_diet', points: 2 },
    { ns: 'anc', key: 'hydration_rest', points: 2 }
  ],
  'ANC:visit2': [
    { ns: 'anc', key: 'iron_folic_acid', points: 2 },
    { ns: 'anc', key: 'calcium_supplementation', points: 2 },
    { ns: 'anc', key: 'pre_eclampsia_monitoring', points: 1 }
  ],
  'ANC:visit3': [
    { ns: 'anc', key: 'iron_folic_acid', points: 2 },
    { ns: 'anc', key: 'calcium_supplementation', points: 2 },
    { ns: 'anc', key: 'birth_preparedness', points: 2 },
    { ns: 'anc', key: 'mental_wellbeing', points: 2 }
  ],
  'ANC:visit4': [
    { ns: 'anc', key: 'visit4_placeholder', points: 0, placeholder: true }
  ]
};

const currentStateKey = computed(() => {
  const current = upcoming.value.find((item) => item.type === 'ANC' || item.type === 'PNC');
  return current ? `${current.type}:${current.ref}` : null;
});

const nowTopics = computed(() => (currentStateKey.value ? NOW_TOPICS[currentStateKey.value] ?? [] : []));
</script>

<style scoped>
.info-hub {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.now-section {
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin-bottom: 4px;
}

.now-title {
  margin: 0;
  font-size: 1.05rem;
  font-weight: 800;
  color: var(--color-card-text, #1a1a1a);
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

.topic-btn {
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

.topic-btn:active {
  transform: scale(0.97);
}
</style>
