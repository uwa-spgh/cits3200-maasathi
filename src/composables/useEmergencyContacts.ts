import { computed, ref } from 'vue';
import { settingsRepo } from '../db/database';

export interface EmergencyContact {
  labelKey: string;
  phone: string;
}

const STORAGE_KEY = 'maasathi_emergency_contacts';

const DEFAULT_CONTACTS: EmergencyContact[] = [
  { labelKey: 'emergency.contacts.national', phone: '000000' },
  { labelKey: 'emergency.contacts.hospital', phone: '' },
  { labelKey: 'emergency.contacts.doctor', phone: '' }
];

const contacts = ref<EmergencyContact[]>(DEFAULT_CONTACTS.map((c) => ({ ...c })));
const loaded = ref(false);

export function useEmergencyContacts() {
  const dialableContacts = computed<EmergencyContact[]>(() =>
    contacts.value.filter((c) => c.phone.trim() !== '')
  );

  async function load(): Promise<void> {
    const saved = await settingsRepo.getJson<EmergencyContact[] | null>(STORAGE_KEY, null);
    if (saved && Array.isArray(saved)) {
      contacts.value = DEFAULT_CONTACTS.map((def) => {
        const found = saved.find((s) => s.labelKey === def.labelKey);
        return found ? { ...def, phone: found.phone } : { ...def };
      });
    }
    loaded.value = true;
  }

  async function save(): Promise<void> {
    await settingsRepo.setJson(STORAGE_KEY, contacts.value);
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
    telHref
  };
}
