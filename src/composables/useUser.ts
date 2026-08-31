import { ref, watch } from 'vue';
import { settingsRepo } from '../db/database';

const STORAGE_KEY = 'maasathi_user_name';

function getInitialName(): string {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      return localStorage.getItem(STORAGE_KEY) || '';
    }
  } catch (e) {
    console.error('Failed to read user name from localStorage', e);
  }
  return '';
}

const userName = ref<string>(getInitialName());

// Mirror name changes into SQLite (authoritative on device).
watch(userName, (val) => {
  void settingsRepo.set(STORAGE_KEY, val);
});

export function useUser() {
  const setUserName = (newName: string) => {
    userName.value = newName;
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        localStorage.setItem(STORAGE_KEY, newName);
      }
    } catch (e) {
      console.error('Failed to save user name to localStorage', e);
    }
  };

  // Restores the name from SQLite after the database is initialised
  // (e.g. if the WebView localStorage was cleared by the system).
  const loadFromDb = async () => {
    const saved = await settingsRepo.get(STORAGE_KEY);
    if (saved !== null && saved !== userName.value) {
      userName.value = saved;
      try {
        if (typeof window !== 'undefined' && window.localStorage) {
          localStorage.setItem(STORAGE_KEY, saved);
        }
      } catch (e) {
        console.error('Failed to mirror user name to localStorage', e);
      }
    }
  };

  return {
    userName,
    setUserName,
    loadFromDb
  };
}
