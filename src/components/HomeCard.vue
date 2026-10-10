<template>
  <div class="home-card" :class="`accent-${accent}`" @click="$emit('open')">
    <div class="card-top">
      <div class="card-heading" :class="{ 'make-room-for-arrow': cornerArrowIcon }">
        <span class="title-row">
          <IonIcon :icon="titleIcon" class="title-icon" />
          <strong>{{ title }}</strong>
        </span>
        <p class="card-body">{{ body }}</p>
      </div>
      <div v-if="badge || graphicIcon || cornerArrowIcon" class="card-graphic">
        <span v-if="badge" class="card-badge">{{ badge }}</span>
        <IonIcon v-if="graphicIcon" :icon="graphicIcon" class="graphic-icon" />
        <IonIcon v-if="graphicIconSecondary" :icon="graphicIconSecondary" class="graphic-icon small" />
        <button
          v-if="cornerArrowIcon"
          class="corner-arrow-btn"
          :aria-label="cornerArrowLabel"
          @click.stop="$emit('cornerArrow')"
        >
          <IonIcon :icon="cornerArrowIcon" />
        </button>
      </div>
    </div>
    <div v-if="listenText || learnMoreLabel" class="card-actions" :class="{ split: listenText && learnMoreLabel }">
      <button
        v-if="learnMoreLabel"
        class="pill-btn learn"
        @click.stop="$emit('learnMore')"
      >
        <IonIcon :icon="homeIcons.learnMore" />
        <span>{{ learnMoreLabel }}</span>
      </button>
      <ListenButton v-if="listenText" :text="listenText" :accent="accent" />
    </div>
    <div v-if="dotCount && dotCount > 1" class="dot-indicator" role="presentation">
      <span
        v-for="i in dotCount"
        :key="i"
        class="dot"
        :class="{ active: i - 1 === activeDotIndex }"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { IonIcon } from '@ionic/vue';
import ListenButton from './ListenButton.vue';
import { homeIcons } from '../config/icons';

export type CardAccent = 'yellow' | 'blue' | 'green' | 'red';

defineProps<{
  accent: CardAccent;
  title: string;
  titleIcon: string;
  body: string;
  badge?: string | null;
  graphicIcon?: string | null;
  graphicIconSecondary?: string | null;
  cornerArrowIcon?: string | null;
  cornerArrowLabel?: string;
  /** Text read aloud by the Listen button; the button is hidden when empty. */
  listenText?: string | null;
  learnMoreLabel?: string | null;
  dotCount?: number;
  activeDotIndex?: number;
}>();

defineEmits<{
  (e: 'open'): void;
  (e: 'learnMore'): void;
  (e: 'cornerArrow'): void;
}>();
</script>

<style scoped>
.home-card {
  position: relative;
  width: 100%;
  background: var(--color-surface, #fff);
  color: var(--color-surface-text, #1a1a1a);
  border-radius: 20px;
  padding: 14px 16px 12px 16px;
  cursor: pointer;
  box-shadow: 0 3px 10px var(--color-shadow, rgba(0, 0, 0, 0.08));
  border: 2px solid var(--color-card-border, transparent);
}

.home-card:active {
  transform: scale(0.99);
}

.accent-yellow { border-color: var(--color-reminders-bg, #f6c945); }
.accent-blue { border-color: var(--color-profile-bg, #33a1de); }
.accent-green { border-color: var(--color-information-bg, #7bc62d); }
.accent-red { border-color: var(--color-emergency-bg, #ff5c5c); }

.card-top {
  display: flex;
  gap: 10px;
  align-items: flex-start;
}

.card-heading {
  flex: 1;
  min-width: 0;
}

.card-heading.make-room-for-arrow {
  padding-right: 40px;
}

.title-row {
  display: flex;
  align-items: center;
  gap: 7px;
  font-size: 1rem;
  color: var(--color-card-text, #1a1a1a);
}

.title-row strong {
  flex: 1;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.title-icon {
  font-size: 1.35rem;
  flex-shrink: 0;
}

.accent-red .title-icon {
  color: var(--color-emergency-bg, #ff5c5c);
}

.card-body {
  margin: 6px 0 0 0;
  font-size: 0.88rem;
  font-weight: 600;
  line-height: 1.4;
  color: var(--color-card-text, #1a1a1a);
  min-height: calc(1.4em * 3);
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.card-graphic {
  flex-shrink: 0;
  display: flex;
  align-items: center;
  gap: 2px;
  color: var(--color-card-text, #1a1a1a);
}

.card-badge {
  font-size: 1.4rem;
  font-weight: 800;
}

/* Reminder card: yellow corner tab behind the visit number + icon, flush
   with the card's top-right corner (card padding 14px 16px, inner radius 18px) */
.accent-yellow .card-graphic {
  align-self: flex-start;
  margin: -14px -16px 0 0;
  padding: 10px 14px 10px 16px;
  background: var(--color-reminders-bg, #f6c945);
  color: var(--color-reminders-text, #000);
  border-radius: 0 18px 0 18px;
}

.graphic-icon {
  font-size: 2.6rem;
}

.graphic-icon.small {
  font-size: 1.8rem;
  margin-left: -6px;
  align-self: flex-end;
}

.corner-arrow-btn {
  position: absolute;
  top: 10px;
  right: 10px;
  width: 34px;
  height: 34px;
  border: none;
  border-radius: 50%;
  background: var(--color-information-bg, #7bc62d);
  color: var(--color-information-text, #000);
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.18);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.05rem;
  cursor: pointer;
}

.corner-arrow-btn ion-icon {
  margin-left: 2px;
}

.corner-arrow-btn:active {
  transform: scale(0.92);
}

.accent-yellow .corner-arrow-btn { background: var(--color-reminders-bg, #f6c945); color: var(--color-reminders-text, #000); }
.accent-blue .corner-arrow-btn { background: var(--color-profile-bg, #33a1de); color: var(--color-profile-text, #000); }
.accent-green .corner-arrow-btn { background: var(--color-information-bg, #7bc62d); color: var(--color-information-text, #000); }
.accent-red .corner-arrow-btn { background: var(--color-emergency-bg, #ff5c5c); color: var(--color-emergency-text, #000); }

.card-actions {
  display: flex;
  justify-content: flex-end;
  margin-top: 8px;
}

.card-actions.split {
  justify-content: space-between;
}

.pill-btn {
  border: none;
  border-radius: 999px;
  padding: 6px 16px;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 0.82rem;
  font-weight: 800;
  cursor: pointer;
  color: var(--color-card-text, #1a1a1a);
}

.pill-btn:active {
  transform: scale(0.95);
}

.pill-btn ion-icon {
  font-size: 1.1rem;
}

.accent-yellow .pill-btn { background: var(--color-reminders-bg, #f6c945); color: var(--color-reminders-text, #000); }
.accent-blue .pill-btn { background: var(--color-profile-bg, #33a1de); color: var(--color-profile-text, #000); }
.accent-green .pill-btn { background: var(--color-information-bg, #7bc62d); color: var(--color-information-text, #000); }
.accent-red .pill-btn { background: var(--color-emergency-bg, #ff5c5c); color: var(--color-emergency-text, #000); }

.dot-indicator {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 6px;
  margin-top: 10px;
}

.dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: var(--color-text-muted, #5c5c5c);
  transition: background-color 0.15s ease, transform 0.15s ease;
}

.dot.active {
  transform: scale(1.3);
}

.accent-yellow .dot.active { background: var(--color-reminders-bg, #f6c945); }
.accent-blue .dot.active { background: var(--color-profile-bg, #33a1de); }
.accent-green .dot.active { background: var(--color-information-bg, #7bc62d); }
.accent-red .dot.active { background: var(--color-emergency-bg, #ff5c5c); }
</style>
