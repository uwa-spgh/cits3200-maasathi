import { ref, watch } from 'vue';

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

  return {
    userName,
    setUserName
  };
}
