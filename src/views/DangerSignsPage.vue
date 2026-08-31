<template>
  <PageShell
    :title="$t('information.title')"
    :breadcrumb="$t('information.topics.danger_signs')"
    :icon="informationCircleOutline"
    color="green"
  >
    <div class="danger-signs-page">
      <ExpandableCard
        v-for="group in groups"
        :key="group.key"
        :title="$t(`danger_signs.${group.key}.title`)"
      >
        <ul class="sign-list">
          <li v-for="n in group.count" :key="n">
            {{ $t(`danger_signs.${group.key}.signs.sign${n}`) }}
          </li>
        </ul>
      </ExpandableCard>
    </div>
  </PageShell>
</template>

<script setup lang="ts">
import { informationCircleOutline } from 'ionicons/icons';
import PageShell from '../components/PageShell.vue';
import ExpandableCard from '../components/ExpandableCard.vue';

const groups = [
  { key: 'pregnancy', count: 11 },
  { key: 'labour', count: 7 },
  { key: 'postpartum', count: 9 },
  { key: 'newborn', count: 6 }
];
</script>

<style scoped>
.danger-signs-page {
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
</style>
