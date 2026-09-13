<template>
  <PageShell
    :title="$t('information.title')"
    :icon="informationCircleOutline"
    color="green"
  >
    <div class="info-hub">
      <section v-if="nowTopics.length" class="now-section">
        <div class="now-header">
          <IonIcon :icon="sparklesOutline" class="now-icon" />
          <h2 class="now-title">{{ $t('information.now_title') }}</h2>
        </div>
        <ExpandableCard
          v-for="topic in nowTopics"
          :key="`${topic.ns}.${topic.key}`"
          :title="$t(`${topic.ns}.${topic.key}_title`)"
        >
          <ul class="sign-list">
            <li v-for="n in topic.points" :key="n">{{ $t(`${topic.ns}.${topic.key}.point${n}`) }}</li>
          </ul>
        </ExpandableCard>
      </section>

      <section class="browse-section">
        <h2 class="section-title">{{ $t('information.browse_title') }}</h2>
        <button
          v-for="topic in topics"
          :key="topic.route"
          class="topic-btn"
          :class="{ danger: topic.key === 'danger_signs' }"
          @click="ionRouter.push({ name: topic.route })"
        >
          <span>{{ $t(`information.topics.${topic.key}`) }}</span>
          <IonIcon :icon="chevronForwardOutline" class="arrow-icon" />
        </button>
      </section>
    </div>
  </PageShell>
</template>

<script setup lang="ts">
import { computed, onMounted } from 'vue';
import { useIonRouter } from '@ionic/vue';
import { IonIcon } from '@ionic/vue';
import {
  chevronForwardOutline,
  informationCircleOutline,
  sparklesOutline
} from 'ionicons/icons';
import PageShell from '../components/PageShell.vue';
import ExpandableCard from '../components/ExpandableCard.vue';
import { usePregnancy } from '../composables/usePregnancy';
import { useSchedule } from '../composables/useSchedule';
import { currentStageRef, STAGE_NOW_TOPICS } from '../utils/stageArticle';

const ionRouter = useIonRouter();
const { mode } = usePregnancy();
const { items, load: loadSchedule } = useSchedule();

onMounted(() => {
  void loadSchedule();
});

const currentStage = computed(() => currentStageRef(items.value, mode.value));

const nowTopics = computed(() => {
  if (!currentStage.value) return [];
  return STAGE_NOW_TOPICS[currentStage.value.stageKey] ?? [];
});

const topics = computed(() => {
  const base = [
    { key: 'anc', route: 'Anc' },
    { key: 'pnc', route: 'Pnc' },
    { key: 'nutrition', route: 'Nutrition' },
    { key: 'vaccination', route: 'Vaccination' },
    { key: 'danger_signs', route: 'DangerSigns' }
  ];
  if (mode.value === 'PNC') {
    return [...base.filter((x) => x.key === 'pnc'), ...base.filter((x) => x.key !== 'pnc')];
  }
  return base;
});
</script>

<style scoped>
.info-hub {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.now-section {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.now-header {
  display: flex;
  align-items: center;
  gap: 8px;
}

.now-icon {
  font-size: 1.25rem;
  color: var(--color-information-bg, #7bc62d);
}

.now-title {
  margin: 0;
  font-size: 1.1rem;
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

.browse-section {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.section-title {
  margin: 0 0 4px 0;
  font-size: 1rem;
  font-weight: 800;
  color: var(--color-card-text, #1a1a1a);
  opacity: 0.85;
}

.topic-btn {
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

.topic-btn:active {
  transform: scale(0.98);
}

.topic-btn.danger {
  border-color: var(--color-emergency-bg, #ff5c5c);
}

.arrow-icon {
  font-size: 1.2rem;
  opacity: 0.6;
}
</style>
