<!--
  EmergencyPage — tap-to-call emergency contacts, a placeholder for the nearest facility, and danger-sign checklists. Checklists depend on stage: pregnancy, labour signs from week 36, or postpartum and newborn in PNC mode.
-->
<template>
  <PageShell
    nav="danger"
    :title="$t('emergency.title')"
    :icon="warningOutline"
    color="red"
  >
    <div class="emergency-page">
      <div class="call-list">
        <a
          v-for="contact in contacts"
          :key="contact.labelKey"
          class="call-btn"
          :href="telHref(contact.phone)"
        >
          <IonIcon :icon="callOutline" class="call-icon" />
          <span class="call-text">
            <span class="call-label">{{ $t(contact.labelKey) }}</span>
            <span class="call-number">{{ contact.phone || $t('emergency.no_number') }}</span>
          </span>
        </a>
      </div>

      <PlaceholderBox
        :title="$t('emergency.nearest_facility_placeholder')"
        :hint="$t('placeholder.hint')"
      />

      <div class="danger-box">
        <p class="danger-box-title">{{ $t('emergency.danger_signs') }}</p>
        <ExpandableCard
          v-for="group in dangerGroups"
          :key="group.key"
          :title="$t(`danger_signs.${group.key}.title`)"
        >
          <ListenList
            :title="$t(`danger_signs.${group.key}.title`)"
            :points="signTexts(group)"
            accent="red"
          />
        </ExpandableCard>
      </div>
    </div>
  </PageShell>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue';
import { IonIcon } from '@ionic/vue';
import { callOutline, warningOutline } from 'ionicons/icons';
import PageShell from '../components/PageShell.vue';
import PlaceholderBox from '../components/PlaceholderBox.vue';
import ExpandableCard from '../components/ExpandableCard.vue';
import ListenList from '../components/ListenList.vue';
import { useEmergencyContacts } from '../composables/useEmergencyContacts';
import { usePregnancy } from '../composables/usePregnancy';
import { useI18n } from 'vue-i18n';

const { t } = useI18n();
const { contacts, load, telHref } = useEmergencyContacts();
const { activePregnancy, mode, currentWeek } = usePregnancy();

const dangerGroups = ref<{ key: string; signs: string[] }[]>([]);

const SIGN_COUNTS: Record<string, number> = {
  pregnancy: 11,
  labour: 7,
  postpartum: 9,
  newborn: 6
};

onMounted(() => {
  void load();
  dangerGroups.value = emergencyGroups().map((key) => ({
    key,
    signs: Array.from({ length: SIGN_COUNTS[key] }, (_, i) => `sign${i + 1}`)
  }));
});

/** The translated sign texts for one danger-sign group, in display order. */
function signTexts(group: { key: string; signs: string[] }): string[] {
  return group.signs.map((sign) => t(`danger_signs.${group.key}.signs.${sign}`));
}

/** Context-relevant checklists for all four stages:
 *  - ANC: pregnancy signs, plus labour signs from week 36 (Visit 4 guidance).
 *  - PNC: mother (postpartum) signs plus the newborn checklist.
 */
function emergencyGroups(): string[] {
  if (!activePregnancy.value) return ['pregnancy'];
  if (mode.value === 'PNC') return ['postpartum', 'newborn'];
  const week = currentWeek.value;
  return week !== null && week >= 36 ? ['pregnancy', 'labour'] : ['pregnancy'];
}

void t;
</script>

<style scoped>
.emergency-page {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.call-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.call-btn {
  display: flex;
  align-items: center;
  gap: 12px;
  background-color: var(--color-surface, #fff);
  color: var(--color-surface-text, #1a1a1a);
  border: 2px solid var(--color-emergency-bg, #ff5c5c);
  border-radius: 20px;
  padding: 12px 18px;
  text-decoration: none;
  box-shadow: 0 3px 10px var(--color-shadow, rgba(0, 0, 0, 0.08));
  transition: transform 0.15s ease;
}

.call-btn:active {
  transform: scale(0.97);
}

.call-icon {
  font-size: 1.4rem;
}

.call-text {
  display: flex;
  flex-direction: column;
}

.call-label {
  font-weight: 700;
  font-size: 0.95rem;
}

.call-number {
  font-size: 0.8rem;
  color: var(--color-text-muted, #5c5c5c);
}

.danger-box {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.danger-box-title {
  margin: 0;
  font-weight: 800;
  font-size: 1.05rem;
  color: var(--color-card-text, #1a1a1a);
  text-align: center;
}
</style>
