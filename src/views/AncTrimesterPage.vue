<template>
  <PageShell
    :title="$t('information.title')"
    :breadcrumb="breadcrumb"
    :icon="informationCircleOutline"
    color="blue"
  >
    <div class="anc-trimester">
      <ExpandableCard
        v-for="visit in visits"
        :key="visit"
        :title="$t(`anc.visits.${visit}`)"
      >
        <ListenText :title="$t(`anc.visits.${visit}`)" :text="$t(`anc.visit_body.${visit}`)" />
      </ExpandableCard>

      <ExpandableCard :title="$t('danger_signs.section_title')">
        <ListenList :title="$t('danger_signs.section_title')" :points="dangerSigns" />
      </ExpandableCard>

      <ExpandableCard :title="$t('nutrition.section_title')">
        <ListenText :title="$t('nutrition.section_title')" :text="$t('anc.nutrition_body')" />
      </ExpandableCard>

      <!-- Only shown once tests content exists; the empty placeholder is not worth a card. -->
      <ExpandableCard v-if="hasTests" :title="$t('anc.tests_title')">
        <ListenText :title="$t('anc.tests_title')" :text="$t('anc.tests_body')" />
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
import ListenList from '../components/ListenList.vue';
import ListenText from '../components/ListenText.vue';

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

/** The first five danger signs shown on this page. */
const dangerSigns = computed(() =>
  Array.from({ length: 5 }, (_, i) => t(`danger_signs.pregnancy.signs.sign${i + 1}`))
);

const hasTests = computed(() => t('anc.tests_body').trim() !== '');
</script>

<style scoped>
.anc-trimester {
  display: flex;
  flex-direction: column;
  gap: 14px;
}
</style>
