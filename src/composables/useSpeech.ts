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
  /**
   * `segments` is for text that has no recording of its own because part of it changes (a date):
   * the pieces are played one after another when every one of them has a clip.
   */
  function speak(text: string, locale: string, segments?: string[]): void {
    stop();
    if (!text) return;
    const fallback = () => speakWithDevice(text, locale);
    const url = clipUrl(locale, text, { warn: !segments });
    if (url && playClip([url], fallback)) return;
    if (segments && segments.length > 0) {
      const urls = segments.map((piece) => clipUrl(locale, piece));
      if (urls.every((u): u is string => u !== null) && playClip(urls, fallback)) return;
    }
    fallback();
  }

  /** Plays recordings back to back. Returns false if they could not even be started. */
  function playClip(urls: string[], onFailure: () => void): boolean {
    if (typeof Audio === 'undefined' || urls.length === 0) return false;
    let index = 0;
    let audio = new Audio(urls[0]);
    const finish = () => {
      if (currentAudio !== audio) return;
      currentAudio = null;
      speaking.value = false;
    };
    const onEnded = () => {
      if (currentAudio !== audio) return;
      if (++index >= urls.length) return finish();
      audio = new Audio(urls[index]);
      currentAudio = audio;
      attach(audio);
    };
    const attach = (el: HTMLAudioElement) => {
      el.onended = onEnded;
      // A missing or undecodable file should not leave the user with silence.
      el.onerror = () => {
        if (currentAudio !== el) return;
        finish();
        onFailure();
      };
      el.play().catch(() => el.onerror?.(new Event('error')));
    };
    currentAudio = audio;
    speaking.value = true;
    attach(audio);
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
