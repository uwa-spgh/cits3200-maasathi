<!--
  EmergencyPage — tap-to-call emergency contacts (editable hospital, doctor and family numbers), a placeholder for the nearest facility, and danger-sign checklists. Checklists depend on stage: pregnancy, labour signs from week 36, or postpartum and newborn in PNC mode.
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
        <template v-for="contact in contacts" :key="contact.labelKey">
          <IonItem
            v-if="editing && contact.labelKey !== NATIONAL_LABEL_KEY"
            lines="none"
            class="edit-item"
          >
            <IonLabel position="stacked">{{ $t(contact.labelKey) }}</IonLabel>
            <IonInput
              v-model="draft[contact.labelKey]"
              type="tel"
              :placeholder="$t('emergency.number_placeholder')"
            />
          </IonItem>
          <component
            :is="contact.phone.trim() ? 'a' : 'div'"
            v-else
            :class="['call-btn', { 'call-btn--empty': !contact.phone.trim() }]"
            :href="contact.phone.trim() ? telHref(contact.phone) : undefined"
          >
            <IonIcon :icon="callOutline" class="call-icon" />
            <span class="call-text">
              <span class="call-label">{{ $t(contact.labelKey) }}</span>
              <span class="call-number">{{ contact.phone.trim() || $t('emergency.no_number') }}</span>
            </span>
          </component>
        </template>
      </div>

      <div class="edit-actions">
        <IonButton v-if="!editing" fill="outline" class="edit-btn" @click="startEdit">
          {{ $t('emergency.edit') }}
        </IonButton>
        <template v-else>
          <IonButton fill="outline" class="edit-btn" @click="cancelEdit">
            {{ $t('common.cancel') }}
          </IonButton>
          <IonButton class="edit-btn edit-btn--save" @click="saveEdit">
            {{ $t('common.save') }}
          </IonButton>
        </template>
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
import { onMounted, reactive, ref } from 'vue';
import { IonButton, IonIcon, IonInput, IonItem, IonLabel, toastController } from '@ionic/vue';
import { callOutline, warningOutline } from 'ionicons/icons';
import PageShell from '../components/PageShell.vue';
import PlaceholderBox from '../components/PlaceholderBox.vue';
import ExpandableCard from '../components/ExpandableCard.vue';
import ListenList from '../components/ListenList.vue';
import { DANGER_SIGN_GROUPS } from '../content/topics';
import { NATIONAL_LABEL_KEY, useEmergencyContacts } from '../composables/useEmergencyContacts';
import { usePregnancy } from '../composables/usePregnancy';
import { useI18n } from 'vue-i18n';

const { t } = useI18n();
const { contacts, load, setPhone, telHref } = useEmergencyContacts();
const { activePregnancy, mode, currentWeek } = usePregnancy();

const editing = ref(false);
/** Numbers being typed while editing; copied into the saved contacts only on Save. */
const draft = reactive<Record<string, string>>({});

const signCounts = Object.fromEntries(DANGER_SIGN_GROUPS.map((g) => [g.key, g.count]));

const dangerGroups = ref<{ key: string; signs: string[] }[]>([]);

onMounted(() => {
  void load();
  dangerGroups.value = emergencyGroups().map((key) => ({
    key,
    signs: Array.from({ length: signCounts[key] }, (_, i) => `sign${i + 1}`)
  }));
});

function startEdit(): void {
  for (const contact of contacts.value) draft[contact.labelKey] = contact.phone;
  editing.value = true;
}

function cancelEdit(): void {
  editing.value = false;
}

async function saveEdit(): Promise<void> {
  for (const contact of contacts.value) {
    if (contact.labelKey === NATIONAL_LABEL_KEY) continue;
    await setPhone(contact.labelKey, draft[contact.labelKey] ?? '');
  }
  editing.value = false;
  const toast = await toastController.create({
    message: t('common.saved'),
    duration: 1500,
    position: 'bottom'
  });
  await toast.present();
}

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

.call-btn--empty {
  border-color: var(--color-shadow, rgba(0, 0, 0, 0.15));
  opacity: 0.7;
}

.call-btn--empty:active {
  transform: none;
}

.edit-item {
  --background: var(--color-surface, #fff);
  border: 2px solid var(--color-emergency-bg, #ff5c5c);
  border-radius: 20px;
  box-shadow: 0 3px 10px var(--color-shadow, rgba(0, 0, 0, 0.08));
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

.edit-actions {
  display: flex;
  justify-content: center;
  gap: 8px;
}

.edit-btn {
  --border-radius: 999px;
  --color: var(--color-surface-text, #1a1a1a);
  --border-color: var(--color-emergency-bg, #ff5c5c);
  font-weight: 700;
}

.edit-btn--save {
  --background: var(--color-emergency-bg, #ff5c5c);
  --color: var(--color-emergency-text, #000);
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
