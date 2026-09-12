import { ref } from 'vue';

const speaking = ref(false);

function pickVoice(langPrefix: string): SpeechSynthesisVoice | null {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) return null;
  const voices = window.speechSynthesis.getVoices();
  return (
    voices.find((v) => v.lang.toLowerCase().startsWith(langPrefix.toLowerCase())) ??
    null
  );
}

/**
 * Reads a string aloud in the current app locale (`en` or `bn`).
 * No-ops on platforms without the Web Speech API.
 */
export function useSpeech() {
  function speak(text: string, locale: string): void {
    stop();
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;
    if (!text) return;
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = locale === 'bn' ? 'bn-BD' : 'en-US';
    const voice = pickVoice(locale === 'bn' ? 'bn' : 'en');
    if (voice) utterance.voice = voice;
    utterance.onend = () => {
      speaking.value = false;
    };
    utterance.onerror = () => {
      speaking.value = false;
    };
    speaking.value = true;
    window.speechSynthesis.speak(utterance);
  }

  function stop(): void {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    speaking.value = false;
  }

  return { speaking, speak, stop };
}
