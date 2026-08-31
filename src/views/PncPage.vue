<template>
  <PageShell
    :title="$t('information.title')"
    :breadcrumb="$t('information.topics.pnc')"
    :icon="informationCircleOutline"
    color="green"
  >
    <div class="pnc-page">
      <ExpandableCard
        v-for="contact in contacts"
        :key="contact"
        :title="$t(`pnc.contacts.${contact}`)"
      >
        <PlaceholderBox :title="$t('pnc.contact_content')" :hint="$t('placeholder.hint')" />
      </ExpandableCard>

      <ExpandableCard :title="$t('danger_signs.newborn_title')">
        <ul class="sign-list">
          <li v-for="n in 6" :key="n">{{ $t(`danger_signs.newborn.signs.sign${n}`) }}</li>
        </ul>
      </ExpandableCard>

      <ExpandableCard :title="$t('pnc.breastfeeding_title')">
        <PlaceholderBox :title="$t('pnc.breastfeeding_placeholder')" :hint="$t('placeholder.hint')" />
      </ExpandableCard>
    </div>
  </PageShell>
</template>

<script setup lang="ts">
import { informationCircleOutline } from 'ionicons/icons';
import PageShell from '../components/PageShell.vue';
import ExpandableCard from '../components/ExpandableCard.vue';
import PlaceholderBox from '../components/PlaceholderBox.vue';

const contacts = ['contact1', 'contact2', 'contact3', 'contact4'] as const;
</script>

<style scoped>
.pnc-page {
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
