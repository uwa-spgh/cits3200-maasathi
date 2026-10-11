import { ref } from 'vue';
import { clipUrl } from '../audio/clips';

const speaking = ref(false);

// Only the most recent utterance may clear `speaking`. Cancelling fires onerror/onend
// on the old utterance asynchronously, which would otherwise wipe out a newer one's state.
let currentUtterance: SpeechSynthesisUtterance | null = null;
let currentAudio: HTMLAudioElement | null = null;

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
 * Plays the pre-recorded clip for the exact text when there is one, otherwise
 * uses the device voice. No-ops on platforms with neither.
 */
export function useSpeech() {
  function speak(text: string, locale: string): void {
    stop();
    if (!text) return;
    const url = clipUrl(locale, text);
    if (url && playClip(url, () => speakWithDevice(text, locale))) return;
    speakWithDevice(text, locale);
  }

  /** Plays a recording. Returns false if it could not even be started. */
  function playClip(url: string, onFailure: () => void): boolean {
    if (typeof Audio === 'undefined') return false;
    const audio = new Audio(url);
    const finish = () => {
      if (currentAudio !== audio) return;
      currentAudio = null;
      speaking.value = false;
    };
    audio.onended = finish;
    // A missing or undecodable file should not leave the user with silence.
    audio.onerror = () => {
      if (currentAudio !== audio) return;
      finish();
      onFailure();
    };
    currentAudio = audio;
    speaking.value = true;
    audio.play().catch(() => audio.onerror?.(new Event('error')));
    return true;
  }

  function speakWithDevice(text: string, locale: string): void {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = locale === 'bn' ? 'bn-BD' : 'en-US';
    const voice = pickVoice(locale === 'bn' ? 'bn' : 'en');
    if (voice) utterance.voice = voice;
    const finish = () => {
      if (currentUtterance !== utterance) return;
      currentUtterance = null;
      speaking.value = false;
    };
    utterance.onend = finish;
    utterance.onerror = finish;
    currentUtterance = utterance;
    speaking.value = true;
    window.speechSynthesis.speak(utterance);
  }

  function stop(): void {
    currentUtterance = null;
    if (currentAudio) {
      const audio = currentAudio;
      currentAudio = null;
      audio.pause();
    }
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    speaking.value = false;
  }

  return { speaking, speak, stop };
}
