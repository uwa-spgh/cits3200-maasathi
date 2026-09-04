<template>
  <PageShell
    :title="$t('information.title')"
    :breadcrumb="$t('information.topics.anc')"
    :icon="informationCircleOutline"
    color="green"
  >
    <div class="anc-page">
      <button
        v-for="trimester in [1, 2, 3]"
        :key="trimester"
        class="trimester-btn"
        @click="openTrimester(trimester)"
      >
        {{ $t('anc.trimester', { n: trimester }) }}
      </button>
    </div>
  </PageShell>
</template>

<script setup lang="ts">
import { useIonRouter } from '@ionic/vue';
import { informationCircleOutline } from 'ionicons/icons';
import PageShell from '../components/PageShell.vue';

const ionRouter = useIonRouter();

function openTrimester(n: number): void {
  ionRouter.push({ name: 'AncTrimester', params: { trimester: String(n) } });
}
</script>

<style scoped>
.anc-page {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.trimester-btn {
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

.trimester-btn:active {
  transform: scale(0.97);
}
</style>
