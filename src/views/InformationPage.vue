<template>
  <PageShell
    :title="$t('information.title')"
    :icon="informationCircleOutline"
    color="green"
  >
    <div class="info-hub">
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
import { computed } from 'vue';
import { useIonRouter } from '@ionic/vue';
import { informationCircleOutline } from 'ionicons/icons';
import PageShell from '../components/PageShell.vue';
import { usePregnancy } from '../composables/usePregnancy';

const ionRouter = useIonRouter();
const { mode } = usePregnancy();

const topics = computed(() => {
  const base = [
    { key: 'anc', route: 'Anc' },
    { key: 'pnc', route: 'Pnc' },
    { key: 'danger_signs', route: 'DangerSigns' },
    { key: 'nutrition', route: 'Nutrition' },
    { key: 'vaccination', route: 'Vaccination' }
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
  gap: 14px;
}

.topic-btn {
  background-color: #fff;
  color: var(--color-card-text, #1a1a1a);
  border: 2px solid var(--color-information-bg, #7bc62d);
  border-radius: 20px;
  padding: 14px 20px;
  font-size: 1rem;
  font-weight: 700;
  cursor: pointer;
  box-shadow: 0 3px 10px rgba(0, 0, 0, 0.08);
  transition: transform 0.15s ease;
  text-align: left;
}

.topic-btn:active {
  transform: scale(0.97);
}
</style>
