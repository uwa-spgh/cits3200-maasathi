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
        <ContentText :text="$t(`pnc.contact_body.${contact}`) || $t('content.empty')" />
      </ExpandableCard>

      <ExpandableCard :title="$t('danger_signs.newborn_title')">
        <ul class="sign-list">
          <li v-for="n in 6" :key="n">{{ $t(`danger_signs.newborn.signs.sign${n}`) }}</li>
        </ul>
      </ExpandableCard>

      <ExpandableCard :title="$t('pnc.breastfeeding_title')">
        <ContentText :text="$t('pnc.breastfeeding_body') || $t('content.empty')" />
      </ExpandableCard>
    </div>
  </PageShell>
</template>

<script setup lang="ts">
import { informationCircleOutline } from 'ionicons/icons';
import PageShell from '../components/PageShell.vue';
import ExpandableCard from '../components/ExpandableCard.vue';
import ContentText from '../components/ContentText.vue';

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
