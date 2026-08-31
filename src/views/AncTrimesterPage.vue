<template>
  <PageShell
    :title="$t('information.title')"
    :breadcrumb="breadcrumb"
    :icon="informationCircleOutline"
    color="green"
  >
    <div class="anc-trimester">
      <ExpandableCard
        v-for="visit in visits"
        :key="visit"
        :title="$t(`anc.visits.${visit}`)"
      >
        <PlaceholderBox :title="$t('anc.visit_content')" :hint="$t('placeholder.hint')" />
      </ExpandableCard>

      <ExpandableCard :title="$t('danger_signs.section_title')">
        <ul class="sign-list">
          <li v-for="n in 5" :key="n">{{ $t(`danger_signs.pregnancy.signs.sign${n}`) }}</li>
        </ul>
      </ExpandableCard>

      <ExpandableCard :title="$t('nutrition.section_title')">
        <PlaceholderBox :title="$t('nutrition.placeholder')" :hint="$t('placeholder.hint')" />
      </ExpandableCard>

      <ExpandableCard :title="$t('anc.tests_title')">
        <PlaceholderBox :title="$t('anc.tests_placeholder')" :hint="$t('placeholder.hint')" />
      </ExpandableCard>
    </div>
  </PageShell>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';
import { informationCircleOutline } from 'ionicons/icons';
import PageShell from '../components/PageShell.vue';
import ExpandableCard from '../components/ExpandableCard.vue';
import PlaceholderBox from '../components/PlaceholderBox.vue';

const props = defineProps<{ trimester?: string }>();

const { t } = useI18n();

const TRIMESTER_VISITS: Record<string, string[]> = {
  '1': ['visit1'],
  '2': ['visit2'],
  '3': ['visit3', 'visit4']
};

const visits = computed(() => TRIMESTER_VISITS[props.trimester ?? '1'] ?? ['visit1']);

const breadcrumb = computed(() =>
  `${t('information.topics.anc')} - ${t('anc.trimester', { n: props.trimester ?? '1' })}`
);
</script>

<style scoped>
.anc-trimester {
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
