<template>
  <PageShell
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
          <ul class="danger-list">
            <li v-for="sign in group.signs" :key="sign">
              {{ $t(`danger_signs.${group.key}.signs.${sign}`) }}
            </li>
          </ul>
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
import { useEmergencyContacts } from '../composables/useEmergencyContacts';
import { usePregnancy } from '../composables/usePregnancy';
import { useI18n } from 'vue-i18n';

const { t } = useI18n();
const { contacts, load, telHref } = useEmergencyContacts();
const { activePregnancy, mode } = usePregnancy();

const dangerGroups = ref<{ key: string; signs: string[] }[]>([]);

onMounted(() => {
  void load();
  const groupKey = !activePregnancy.value
    ? 'pregnancy'
    : mode.value === 'PNC'
      ? 'postpartum'
      : 'pregnancy';
  dangerGroups.value = [
    {
      key: groupKey,
      signs: Array.from({ length: SIGN_COUNTS[groupKey] }, (_, i) => `sign${i + 1}`)
    }
  ];
});

const SIGN_COUNTS: Record<string, number> = {
  pregnancy: 11,
  labour: 7,
  postpartum: 9
};

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
  background-color: var(--color-emergency-bg, #ff5c5c);
  color: var(--color-emergency-text, #000);
  border-radius: 999px;
  padding: 12px 18px;
  text-decoration: none;
  box-shadow: 0 3px 10px rgba(0, 0, 0, 0.12);
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
  opacity: 0.8;
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

.danger-list {
  margin: 0;
  padding-left: 20px;
  display: flex;
  flex-direction: column;
  gap: 6px;
  color: var(--color-card-text, #1a1a1a);
  font-size: 0.9rem;
}
</style>
