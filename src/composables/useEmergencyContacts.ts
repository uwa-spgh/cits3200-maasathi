import { computed, ref } from 'vue';
import { settingsRepo } from '../db/database';

export interface EmergencyContact {
  labelKey: string;
  phone: string;
}

const STORAGE_KEY = 'maasathi_emergency_contacts';
/** Birth plan's emergency contact before it was merged into this list; read once, then cleared. */
const LEGACY_BIRTH_PLAN_CONTACT_KEY = 'maasathi_birth_plan_emergency_contact';

export const NATIONAL_LABEL_KEY = 'emergency.contacts.national';
export const HOSPITAL_LABEL_KEY = 'emergency.contacts.hospital';
export const DOCTOR_LABEL_KEY = 'emergency.contacts.doctor';
export const FAMILY_LABEL_KEY = 'emergency.contacts.family';

const DEFAULT_CONTACTS: EmergencyContact[] = [
  { labelKey: NATIONAL_LABEL_KEY, phone: '999' },
  { labelKey: HOSPITAL_LABEL_KEY, phone: '' },
  { labelKey: DOCTOR_LABEL_KEY, phone: '' },
  { labelKey: FAMILY_LABEL_KEY, phone: '' }
];

const contacts = ref<EmergencyContact[]>(DEFAULT_CONTACTS.map((c) => ({ ...c })));
const loaded = ref(false);

export function useEmergencyContacts() {
  const dialableContacts = computed<EmergencyContact[]>(() =>
    contacts.value.filter((c) => c.phone.trim() !== '')
  );

  async function load(): Promise<void> {
    const saved = await settingsRepo.getJson<EmergencyContact[] | null>(STORAGE_KEY, null);
    const rows = Array.isArray(saved) ? saved : [];
    contacts.value = DEFAULT_CONTACTS.map((def) => {
      // The national number is not editable, so a value saved by an older version (e.g. '000000') is ignored.
      const found = def.labelKey === NATIONAL_LABEL_KEY ? undefined : rows.find((s) => s.labelKey === def.labelKey);
      return { ...def, phone: found?.phone ?? def.phone };
    });

    const legacy = (await settingsRepo.get(LEGACY_BIRTH_PLAN_CONTACT_KEY))?.trim() ?? '';
    if (legacy) {
      const family = contacts.value.find((c) => c.labelKey === FAMILY_LABEL_KEY);
      if (family && !family.phone.trim()) family.phone = legacy;
      await save();
      await settingsRepo.set(LEGACY_BIRTH_PLAN_CONTACT_KEY, '');
    }
    loaded.value = true;
  }

  async function save(): Promise<void> {
    await settingsRepo.setJson(STORAGE_KEY, contacts.value);
  }

  /** Sets one contact's number by label key and persists the whole list. */
  async function setPhone(labelKey: string, phone: string): Promise<void> {
    const row = contacts.value.find((c) => c.labelKey === labelKey);
    if (!row) return;
    row.phone = phone.trim();
    await save();
  }

  function phoneOf(labelKey: string): string {
    return contacts.value.find((c) => c.labelKey === labelKey)?.phone ?? '';
  }

  function telHref(phone: string): string {
    return `tel:${phone.replace(/\s+/g, '')}`;
  }

  return {
    contacts,
    loaded,
    dialableContacts,
    load,
    save,
    setPhone,
    phoneOf,
    telHref
  };
}
