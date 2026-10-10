<template>
  <PageShell
    nav="danger"
    :title="$t('information.title')"
    :breadcrumb="$t('information.topics.danger_signs')"
    :icon="informationCircleOutline"
    color="red"
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

      <p class="seek-care-note">{{ $t('danger_signs.seek_care_note') }}</p>
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
  color: var(--color-surface-text, #1a1a1a);
}

.seek-care-note {
  margin: 0;
  padding: 14px 16px;
  border-radius: 18px;
  background: var(--color-surface, #fff);
  border: 2px solid var(--color-emergency-bg, #ff5c5c);
  color: var(--color-surface-text, #1a1a1a);
  font-size: 0.95rem;
  font-weight: 700;
  line-height: 1.4;
  text-align: center;
}
</style>
