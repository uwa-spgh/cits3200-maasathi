<template>
  <button
    type="button"
    class="listen-button"
    :class="[`accent-${accent}`, `size-${size}`, { 'is-speaking': isSpeaking }]"
    :aria-label="label"
    @click.stop="onClick"
  >
    <IonIcon :icon="isSpeaking ? homeIcons.stop : homeIcons.listen" aria-hidden="true" />
    <span>{{ label }}</span>
  </button>
</template>

<script lang="ts">
import { ref } from 'vue';

/**
 * Which ListenButton instance started the current speech. Shared by all instances,
 * because the speech composable only knows that something is speaking, not which button.
 */
const activeOwner = ref<symbol | null>(null);
</script>

<script setup lang="ts">
import { computed, onBeforeUnmount, watch } from 'vue';
import { IonIcon } from '@ionic/vue';
import { useI18n } from 'vue-i18n';
import { useSpeech } from '../composables/useSpeech';
import { homeIcons } from '../config/icons';

export type ListenAccent = 'yellow' | 'blue' | 'green' | 'red' | 'neutral';

const props = withDefaults(
  defineProps<{
    /** The text to read aloud. Clicking does nothing when empty. */
    text: string;
    accent?: ListenAccent;
    size?: 'md' | 'sm';
  }>(),
  { accent: 'neutral', size: 'md' }
);

const { t, locale } = useI18n();
const { speaking, speak, stop } = useSpeech();

const ownerId = Symbol('listen-button');
const isSpeaking = computed(() => speaking.value && activeOwner.value === ownerId);
const label = computed(() => t(isSpeaking.value ? 'home.cards.stop' : 'home.cards.listen'));

function onClick(): void {
  if (!props.text) return;
  if (isSpeaking.value) {
    stop();
    activeOwner.value = null;
    return;
  }
  activeOwner.value = ownerId;
  speak(props.text, locale.value);
}

// Speech ended naturally: release ownership so this button goes back to "Listen".
watch(speaking, (on) => {
  if (!on && activeOwner.value === ownerId) activeOwner.value = null;
});

// The text changed while this button's text was being read: stop, since the audio no longer matches the card.
watch(
  () => props.text,
  () => {
    if (isSpeaking.value) {
      stop();
      activeOwner.value = null;
    }
  }
);

// Leaving the page should not leave audio playing with no visible control.
onBeforeUnmount(() => {
  if (activeOwner.value === ownerId) {
    if (speaking.value) stop();
    activeOwner.value = null;
  }
});
</script>

<style scoped>
.listen-button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  min-height: 40px;
  padding: 0 16px;
  border: 2px solid transparent;
  border-radius: 999px;
  font-weight: 800;
  line-height: 1.2;
  cursor: pointer;
  white-space: nowrap;
  transition: transform 0.1s ease, box-shadow 0.15s ease;
}

.listen-button.size-md {
  min-height: 44px;
  padding: 0 18px;
  font-size: 0.9rem;
}

.listen-button.size-sm {
  min-height: 40px;
  padding: 0 14px;
  font-size: 0.82rem;
}

.listen-button ion-icon {
  font-size: 1.15rem;
  flex-shrink: 0;
}

.listen-button:active {
  transform: scale(0.95);
}

.listen-button:focus-visible {
  outline: 3px solid var(--color-card-text, #1a1a1a);
  outline-offset: 2px;
}

/* Neutral: surface style with a visible border (solid in the high-contrast theme). */
.accent-neutral {
  background: var(--color-surface, #fff);
  color: var(--color-surface-text, #1a1a1a);
  border-color: var(--color-border, rgba(0, 0, 0, 0.1));
}

/* Accents: filled pill in the matching theme colour. Border is transparent except in the high-contrast theme. */
.accent-yellow {
  background: var(--color-reminders-bg, #f6c945);
  color: var(--color-reminders-text, #000);
  border-color: var(--color-card-border, transparent);
}

.accent-blue {
  background: var(--color-profile-bg, #33a1de);
  color: var(--color-profile-text, #000);
  border-color: var(--color-card-border, transparent);
}

.accent-green {
  background: var(--color-information-bg, #7bc62d);
  color: var(--color-information-text, #000);
  border-color: var(--color-card-border, transparent);
}

.accent-red {
  background: var(--color-emergency-bg, #ff5c5c);
  color: var(--color-emergency-text, #000);
  border-color: var(--color-card-border, transparent);
}

/* While reading: a ring in the text colour shows which button is active. */
.listen-button.is-speaking {
  box-shadow: 0 0 0 3px var(--color-surface, #fff), 0 0 0 5px currentColor;
}
</style>
