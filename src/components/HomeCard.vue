<template>
  <div class="home-card" :class="`accent-${accent}`" @click="$emit('open')">
    <div class="card-top">
      <div class="card-heading">
        <span class="title-row">
          <IonIcon :icon="titleIcon" class="title-icon" />
          <strong>{{ title }}</strong>
        </span>
        <p class="card-body">{{ body }}</p>
      </div>
      <div v-if="badge || graphicIcon" class="card-graphic">
        <span v-if="badge" class="card-badge">{{ badge }}</span>
        <IonIcon v-if="graphicIcon" :icon="graphicIcon" class="graphic-icon" />
        <IonIcon v-if="graphicIconSecondary" :icon="graphicIconSecondary" class="graphic-icon small" />
      </div>
    </div>
    <div v-if="listenLabel || learnMoreLabel" class="card-actions" :class="{ split: listenLabel && learnMoreLabel }">
      <button
        v-if="learnMoreLabel"
        class="pill-btn learn"
        @click.stop="$emit('learnMore')"
      >
        <IonIcon :icon="homeIcons.learnMore" />
        <span>{{ learnMoreLabel }}</span>
      </button>
      <button
        v-if="listenLabel"
        class="pill-btn listen"
        @click.stop="$emit('listen')"
      >
        <IonIcon :icon="homeIcons.listen" />
        <span>{{ listenLabel }}</span>
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { IonIcon } from '@ionic/vue';
import { homeIcons } from '../config/icons';

export type CardAccent = 'yellow' | 'blue' | 'green';

defineProps<{
  accent: CardAccent;
  title: string;
  titleIcon: string;
  body: string;
  badge?: string | null;
  graphicIcon?: string | null;
  graphicIconSecondary?: string | null;
  listenLabel?: string | null;
  learnMoreLabel?: string | null;
}>();

defineEmits<{
  (e: 'open'): void;
  (e: 'listen'): void;
  (e: 'learnMore'): void;
}>();
</script>

<style scoped>
.home-card {
  width: 100%;
  background: #fff;
  border-radius: 20px;
  padding: 14px 16px 12px 16px;
  cursor: pointer;
  box-shadow: 0 3px 10px rgba(0, 0, 0, 0.08);
  border: 2px solid transparent;
}

.home-card:active {
  transform: scale(0.99);
}

.accent-yellow { border-color: var(--color-reminders-bg, #f6c945); }
.accent-blue { border-color: var(--color-profile-bg, #33a1de); }
.accent-green { border-color: var(--color-information-bg, #7bc62d); }

.card-top {
  display: flex;
  gap: 10px;
  align-items: flex-start;
}

.card-heading {
  flex: 1;
  min-width: 0;
}

.title-row {
  display: flex;
  align-items: center;
  gap: 7px;
  font-size: 1rem;
  color: var(--color-card-text, #1a1a1a);
}

.title-icon {
  font-size: 1.35rem;
  flex-shrink: 0;
}

.card-body {
  margin: 6px 0 0 0;
  font-size: 0.88rem;
  font-weight: 600;
  line-height: 1.4;
  color: var(--color-card-text, #1a1a1a);
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

.graphic-icon {
  font-size: 2.6rem;
}

.graphic-icon.small {
  font-size: 1.8rem;
  margin-left: -6px;
  align-self: flex-end;
}

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

.accent-yellow .pill-btn { background: var(--color-reminders-bg, #f6c945); }
.accent-blue .pill-btn { background: var(--color-profile-bg, #33a1de); }
.accent-green .pill-btn { background: var(--color-information-bg, #7bc62d); }
</style>
