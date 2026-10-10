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
        <ListenList
          :title="$t(`danger_signs.${group.key}.title`)"
          :points="signTexts(group)"
          accent="red"
        />
      </ExpandableCard>

      <p class="seek-care-note">{{ $t('danger_signs.seek_care_note') }}</p>
      <div class="seek-care-listen">
        <ListenButton size="sm" accent="red" :text="$t('danger_signs.seek_care_note')" />
      </div>
    </div>
  </PageShell>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n';
import { informationCircleOutline } from 'ionicons/icons';
import PageShell from '../components/PageShell.vue';
import ExpandableCard from '../components/ExpandableCard.vue';
import ListenButton from '../components/ListenButton.vue';
import ListenList from '../components/ListenList.vue';

const { t } = useI18n();

const groups = [
  { key: 'pregnancy', count: 11 },
  { key: 'labour', count: 7 },
  { key: 'postpartum', count: 9 },
  { key: 'newborn', count: 6 }
];

/** The translated signs for one group, in display order. */
function signTexts(group: { key: string; count: number }): string[] {
  return Array.from({ length: group.count }, (_, i) => t(`danger_signs.${group.key}.signs.sign${i + 1}`));
}
</script>

<style scoped>
.danger-signs-page {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.seek-care-listen {
  display: flex;
  justify-content: center;
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
