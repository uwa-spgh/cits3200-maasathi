<template>
  <IonPage>
    <IonContent class="home-content ion-padding">
      <div class="content-wrapper">
        <div class="top-bar">
          <span class="app-caption">{{ $t('app.title') }} app</span>
          <LanguageSwitcher />
        </div>

        <h1 class="greeting-text">
          {{ $t('greeting', { name: userName && userName.trim() ? userName : $t('user_default') }) }}
        </h1>

        <div class="journey-row">
          <!-- Left: vertical journey rail -->
          <div class="rail-col">
            <button class="nav-pill" @click="goBack">
              <IonIcon :icon="arrowBackCircleOutline" />
              <span>{{ $t('common.back') }}</span>
            </button>

            <div class="rail" aria-hidden="false">
              <span class="rail-line"></span>

              <!-- Got pregnant cap -->
              <span class="rail-cap top" aria-hidden="true">
                <IonIcon :icon="heartOutline" />
              </span>
              <span class="rail-cap-label top">{{ $t('home.journey.conceived') }}</span>

              <!-- Trimester badges sit on the spine -->
              <span
                v-for="tri in triBadges"
                :key="tri.key"
                class="tri-badge"
                :style="{ top: tri.pct + '%' }"
              >
                {{ tri.label }}
              </span>

              <!-- Event markers -->
              <button
                v-for="d in dots"
                :key="d.id"
                class="rail-dot"
                :class="[d.major ? 'major' : 'minor', { done: d.done, today: d.isToday, selected: d.id === selectedId }]"
                :style="{ top: d.pct + '%' }"
                :title="d.title"
                :aria-label="d.title"
                @click="selectedId = d.id"
              >
                <IonIcon v-if="d.major" :icon="d.icon" />
              </button>

              <span v-if="showTodayRing" class="rail-today" :style="{ top: todayPct + '%' }">
                <span class="today-ring"></span>
                <span class="today-caption">{{ $t('reminders.today') }}</span>
              </span>
              <span
                v-else-if="hasData"
                class="rail-today-caption"
                :style="{ top: todayPct + '%' }"
              >
                {{ $t('reminders.today') }}
              </span>

              <span v-if="nextLabel" class="rail-next-label" :style="{ top: nextPct + '%' }">
                {{ nextLabel }}
              </span>

              <!-- Baby due cap (the EDD milestone) -->
              <button
                v-if="eddItem"
                class="rail-cap bottom"
                :class="{ done: eddDone, selected: eddItem.id === selectedId }"
                :title="eddTitle"
                :aria-label="eddTitle"
                @click="selectedId = eddItem.id"
              >
                <IonIcon :icon="happyOutline" />
              </button>
              <span class="rail-cap-label bottom">{{ $t('home.journey.baby_due') }}</span>
            </div>

            <button class="nav-pill" @click="go('Reminders')">
              <IonIcon :icon="arrowForwardCircleOutline" />
              <span>{{ $t('home.journey.next') }}</span>
            </button>
          </div>

          <!-- Right: reminders first, info tucked below -->
          <div class="cards-col">
            <button class="reminders-card" @click="onRemindersTap">
              <span class="card-pill">
                <IonIcon :icon="timeOutline" />
                {{ $t('buttons.reminders') }}
              </span>
              <span v-if="shownEvent" class="card-date">{{ shortDate(shownEvent.dueDate) }}</span>
              <span v-if="shownEvent" class="card-title">{{ shownTitle }}</span>
              <span v-if="shownEvent" class="card-sub">{{ shownCountdown }}</span>
              <span v-else class="card-title small">{{ $t('home.no_pregnancy') }}</span>
              <span class="card-link">{{ $t('home.journey.view_all') }} →</span>
            </button>

            <button class="mini-btn danger-btn" @click="go('Emergency')">
              <IonIcon :icon="warningOutline" />
              <span>{{ $t('home.journey.danger') }}</span>
            </button>

            <button class="mini-btn wellbeing-btn" @click="go('WeekInfo')">
              <IonIcon :icon="informationCircleOutline" />
              <span>{{ $t('home.journey.wellbeing') }}</span>
            </button>
          </div>
        </div>

        <button class="profile-pill" @click="go('Profile')">
          <IonIcon :icon="personOutline" />
          <span>{{ $t('buttons.profile') }}</span>
        </button>
      </div>
    </IonContent>

    <IonFooter v-if="isHomeBar" class="ion-no-border">
      <HomeBarFooter />
    </IonFooter>
  </IonPage>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import {
  IonContent,
  IonFooter,
  IonIcon,
  IonPage,
  useIonRouter
} from '@ionic/vue';
import { useI18n } from 'vue-i18n';
import {
  arrowBackCircleOutline,
  arrowForwardCircleOutline,
  informationCircleOutline,
  happyOutline,
  heartOutline,
  homeOutline,
  personOutline,
  pulseOutline,
  shieldCheckmarkOutline,
  starOutline,
  timeOutline,
  warningOutline,
  type IonIconNames
} from 'ionicons/icons';

import LanguageSwitcher from '../components/LanguageSwitcher.vue';
import HomeBarFooter from '../components/HomeBarFooter.vue';
import { useUser } from '../composables/useUser';
import { usePregnancy } from '../composables/usePregnancy';
import { useSchedule } from '../composables/useSchedule';
import { getNavMode } from '../config/app';
import { daysBetween, formatDate, todayIso } from '../utils/date';
import type { ScheduleItem } from '../db/schemas';

const ionRouter = useIonRouter();
const { t, locale } = useI18n();
const { userName } = useUser();
const { activePregnancy, mode } = usePregnancy();
const { items, load: loadSchedule } = useSchedule();

const isHomeBar = computed(() => getNavMode() === 'homeBar');
const selectedId = ref<string | null>(null);

onMounted(() => {
  void loadSchedule();
});

function go(routeName: string): void {
  ionRouter.push({ name: routeName });
}

function goBack(): void {
  window.history.length > 1 ? ionRouter.back() : go('Profile');
}

function onRemindersTap(): void {
  go(activePregnancy.value ? 'Reminders' : 'Profile');
}

// ---- Journey rail geometry (same scale as the reminders journey) ----
const isPnc = computed(() => mode.value === 'PNC' && !!activePregnancy.value?.deliveryDate);
const baseIso = computed(
  () => (isPnc.value ? activePregnancy.value?.deliveryDate : activePregnancy.value?.lmp) ?? null
);
const totalDays = computed(() => (isPnc.value ? 42 : 280));
const hasData = computed(() => !!baseIso.value);

function clampPct(fraction: number): number {
  return Math.min(100, Math.max(0, fraction * 100));
}

const todayPct = computed(() => {
  if (!baseIso.value) return 0;
  return clampPct(daysBetween(baseIso.value, todayIso()) / totalDays.value);
});

// If a visit marker sits at (or nearly at) today's position, that dot
// carries the Today styling itself — the separate ring would just cover it.
const showTodayRing = computed(
  () => hasData.value && !dots.value.some((d) => Math.abs(d.pct - todayPct.value) < 3.5)
);

const dots = computed(() => {
  const base = baseIso.value;
  if (!base) return [];
  const today = todayIso();
  const todayPos = clampPct(daysBetween(base, today) / totalDays.value);
  const sorted = items.value
    .filter((i) => !(i.type === 'MILESTONE' && i.ref === 'edd'))
    .map((i) => {
      const kind = kindOf(i);
      const major = kind === 'anc' || kind === 'tt';
      const pct = Math.min(92, Math.max(8, clampPct(daysBetween(base, i.dueDate) / totalDays.value)));
      return {
        id: i.id,
        item: i,
        kind,
        major,
        icon: iconFor(kind),
        pct,
        done: i.status === 'completed',
        isToday: i.status !== 'completed' && Math.abs(pct - todayPos) < 3.5,
        title: `${t(i.titleKey)} · ${formatDate(i.dueDate, locale.value)}`
      };
    })
    .sort((a, b) => a.pct - b.pct);
  // Nudge overlapping markers apart so each stays tappable.
  const MIN_GAP = 7;
  for (let i = 1; i < sorted.length; i++) {
    if (sorted[i].pct - sorted[i - 1].pct < MIN_GAP) {
      sorted[i].pct = Math.min(98, sorted[i - 1].pct + MIN_GAP);
    }
  }
  return sorted;
});

type DotKind = 'anc' | 'pnc' | 'tt' | 'milestone';

function kindOf(i: ScheduleItem): DotKind {
  if (i.type === 'ANC') return 'anc';
  if (i.type === 'PNC') return 'pnc';
  if (i.type === 'TT') return 'tt';
  return 'milestone';
}

function iconFor(kind: DotKind): IonIconNames | null {
  if (kind === 'anc') return pulseOutline as IonIconNames;
  if (kind === 'tt') return shieldCheckmarkOutline as IonIconNames;
  if (kind === 'pnc') return homeOutline as IonIconNames;
  return starOutline as IonIconNames;
}

// Trimester badges at the midpoints of the three 40-week segments.
const triBadges = computed(() => {
  if (isPnc.value) return [];
  return [
    { key: 't1', label: 'T1', pct: (45.5 / 280) * 100 },
    { key: 't2', label: 'T2', pct: (140 / 280) * 100 },
    { key: 't3', label: 'T3', pct: (234.5 / 280) * 100 }
  ];
});

// The EDD milestone renders as the rail's bottom cap.
const eddItem = computed(() => items.value.find((i) => i.type === 'MILESTONE' && i.ref === 'edd') ?? null);
const eddDone = computed(() => eddItem.value?.status === 'completed');
const eddTitle = computed(() =>
  eddItem.value ? `${t(eddItem.value.titleKey)} · ${formatDate(eddItem.value.dueDate, locale.value)}` : ''
);

const nextEvent = computed<ScheduleItem | null>(() => {
  const today = todayIso();
  const upcoming = items.value
    .filter((i) => i.status !== 'completed' && i.dueDate >= today)
    .sort((a, b) => a.dueDate.localeCompare(b.dueDate));
  if (upcoming.length > 0) return upcoming[0] ?? null;
  const overdue = items.value
    .filter((i) => i.status !== 'completed')
    .sort((a, b) => a.dueDate.localeCompare(b.dueDate));
  return overdue[0] ?? null;
});

// Tapping a dot previews that event in the reminders card; defaults to next up.
const shownEvent = computed<ScheduleItem | null>(() => {
  if (!activePregnancy.value) return null;
  if (selectedId.value) {
    const found = items.value.find((i) => i.id === selectedId.value) ?? null;
    if (found) return found;
  }
  return nextEvent.value;
});

const shownTitle = computed(() => (shownEvent.value ? t(shownEvent.value.titleKey) : ''));

const shownCountdown = computed(() => {
  const e = shownEvent.value;
  if (!e) return '';
  if (e.status === 'completed') return t('timeline.status_done');
  const days = daysBetween(todayIso(), e.dueDate);
  if (days < 0) {
    const ago = Math.abs(days);
    return ago === 1 ? t('timeline.overdue_1_day') : t('timeline.overdue_days', { days: ago });
  }
  if (days === 0) return t('timeline.due_today');
  if (days === 1) return t('timeline.due_tomorrow');
  return t('timeline.due_in_days', { days });
});

function shortDate(iso: string): string {
  const [y, m, d] = iso.split('-').map((n) => Number(n));
  const date = new Date(y, (m ?? 1) - 1, d ?? 1);
  return date.toLocaleDateString(locale.value === 'bn' ? 'bn-BD' : 'en-GB', {
    day: 'numeric',
    month: 'short'
  });
}

const nextPct = computed(() => {
  const e = nextEvent.value;
  const base = baseIso.value;
  if (!e || !base) return 0;
  return Math.min(96, Math.max(4, clampPct(daysBetween(base, e.dueDate) / totalDays.value)));
});

// Hide the next-date caption when it would collide with the Today marker.
const nextLabel = computed(() => {
  if (!nextEvent.value) return '';
  if (Math.abs(nextPct.value - todayPct.value) < 7) return '';
  return shortDate(nextEvent.value.dueDate);
});
</script>

<style scoped>
.home-content {
  --background: var(--color-app-bg, #fbf7f5);
}

.content-wrapper {
  max-width: 480px;
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 14px;
  padding-top: 6px;
  padding-bottom: 20px;
}

.top-bar {
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.app-caption {
  flex: 1;
  text-align: center;
  font-size: 0.8rem;
  font-weight: 600;
  opacity: 0.45;
  margin-left: 48px;
}

.greeting-text {
  font-size: 2rem;
  font-weight: 800;
  color: var(--color-card-text, #111111);
  margin: 0;
  letter-spacing: -0.5px;
  text-align: center;
}

.journey-row {
  width: 100%;
  display: flex;
  gap: 16px;
  align-items: stretch;
  min-height: 580px;
}

/* ---- Left rail ---- */
.rail-col {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
  width: 92px;
  flex-shrink: 0;
}

.nav-pill {
  border: 1.5px solid rgba(0, 0, 0, 0.15);
  background-color: var(--color-card-bg, #eaeaea);
  color: var(--color-card-text, #1a1a1a);
  border-radius: 999px;
  padding: 5px 12px;
  font-size: 0.78rem;
  font-weight: 700;
  display: inline-flex;
  align-items: center;
  gap: 4px;
  cursor: pointer;
}

.nav-pill:active {
  transform: scale(0.95);
}

.nav-pill ion-icon {
  font-size: 1rem;
}

.rail {
  position: relative;
  flex: 1;
  min-height: 460px;
  width: 100%;
}

.rail-line {
  position: absolute;
  top: 22px;
  bottom: 22px;
  left: 50%;
  width: 3px;
  transform: translateX(-50%);
  border-radius: 2px;
  background: #1a3a6b;
  opacity: 0.85;
}

/* Trimester badges sitting on the spine */
.tri-badge {
  position: absolute;
  left: 50%;
  transform: translate(-50%, -50%);
  background: var(--color-card-bg, #fbf7f5);
  border: 2px solid #1a3a6b;
  border-radius: 999px;
  padding: 1px 7px;
  font-size: 0.6rem;
  font-weight: 800;
  color: #1a3a6b;
  opacity: 0.65;
  z-index: 1;
  pointer-events: none;
}

/* End caps: got pregnant / baby due */
.rail-cap {
  position: absolute;
  left: 50%;
  transform: translate(-50%, -50%);
  height: 30px;
  width: 30px;
  border-radius: 50%;
  background: #1a3a6b;
  color: #fff;
  border: none;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  z-index: 2;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.3);
}

.rail-cap.top { top: 22px; }
.rail-cap.bottom { bottom: 22px; }

.rail-cap ion-icon {
  font-size: 1rem;
  --ionicon-stroke-weight: 700;
}

.rail-cap.done {
  background: #4d6fa8;
}

.rail-cap.selected {
  outline: 3px solid rgba(51, 161, 222, 0.55);
  outline-offset: 2px;
}

.rail-cap-label {
  position: absolute;
  left: 50%;
  transform: translateX(-50%);
  font-size: 0.66rem;
  font-weight: 800;
  white-space: nowrap;
  opacity: 0.55;
  pointer-events: none;
}

.rail-cap-label.top { top: -8px; }
.rail-cap-label.bottom { bottom: -8px; }

.rail-dot {
  position: absolute;
  left: 50%;
  transform: translate(-50%, -50%);
  border-radius: 50%;
  background: #fff;
  padding: 0;
  cursor: pointer;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.25);
  z-index: 2;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: transform 0.15s ease;
  border: 2.5px solid #1a3a6b;
  color: #1a3a6b;
}

/* Minor markers: small plain dots */
.rail-dot.minor {
  height: 12px;
  width: 12px;
  background: #1a3a6b;
}

/* Major markers: big highlighted dots with an icon */
.rail-dot.major {
  height: 32px;
  width: 32px;
  font-size: 0;
}

.rail-dot.major ion-icon {
  font-size: 1.05rem;
  --ionicon-stroke-weight: 700;
}

.rail-dot.done {
  background: #1a3a6b;
  color: #fff;
}

.rail-dot.today {
  border-color: #7fb3e8;
  background: #bcdcff;
  color: #1a3a6b;
  animation: today-pulse 2s ease-in-out infinite;
}

@keyframes today-pulse {
  0%, 100% { box-shadow: 0 0 0 0 rgba(127, 179, 232, 0.5); }
  50% { box-shadow: 0 0 0 7px rgba(127, 179, 232, 0); }
}

.rail-dot.selected {
  outline: 3px solid rgba(51, 161, 222, 0.55);
  outline-offset: 2px;
  transform: translate(-50%, -50%) scale(1.12);
}

.rail-today {
  position: absolute;
  left: 50%;
  transform: translate(-50%, -50%);
  z-index: 3;
  pointer-events: none;
  display: flex;
  align-items: center;
}

.today-ring {
  height: 15px;
  width: 15px;
  border-radius: 50%;
  background: #bcdcff;
  border: 3px solid #7fb3e8;
  box-shadow: 0 0 0 3px rgba(255, 255, 255, 0.9);
}

.today-caption {
  position: absolute;
  right: 14px;
  font-size: 0.72rem;
  font-weight: 700;
  white-space: nowrap;
  color: var(--color-card-text, #1a1a1a);
  opacity: 0.8;
}

.rail-today-caption {
  position: absolute;
  right: calc(50% + 20px);
  transform: translateY(-50%);
  font-size: 0.72rem;
  font-weight: 700;
  white-space: nowrap;
  color: var(--color-card-text, #1a1a1a);
  opacity: 0.8;
  pointer-events: none;
}

.rail-next-label {
  position: absolute;
  left: calc(50% + 14px);
  transform: translateY(-50%);
  font-size: 0.72rem;
  font-weight: 700;
  white-space: nowrap;
  color: var(--color-card-text, #1a1a1a);
  opacity: 0.8;
  pointer-events: none;
}

/* ---- Right cards ---- */
.cards-col {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.reminders-card {
  flex: 1;
  min-height: 300px;
  border: 1.5px solid rgba(246, 201, 69, 0.7);
  background-color: var(--color-card-bg, #ffffff);
  color: var(--color-card-text, #1a1a1a);
  border-radius: 22px;
  padding: 30px 16px 18px 16px;
  margin-top: 16px;
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 8px;
  cursor: pointer;
  box-shadow: 0 4px 14px rgba(0, 0, 0, 0.08);
}

.reminders-card:active {
  transform: scale(0.98);
}

.card-pill {
  position: absolute;
  top: -14px;
  left: 50%;
  transform: translateX(-50%);
  display: inline-flex;
  align-items: center;
  gap: 5px;
  background: #fff;
  border: 2px solid var(--color-reminders-bg, #f6c945);
  color: var(--color-card-text, #1a1a1a);
  font-size: 0.8rem;
  font-weight: 800;
  border-radius: 999px;
  padding: 4px 14px;
  white-space: nowrap;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.12);
}

.card-date {
  background: var(--color-reminders-bg, #f6c945);
  color: var(--color-reminders-text, #000);
  font-size: 0.85rem;
  font-weight: 800;
  border-radius: 10px;
  padding: 5px 16px;
}

.card-title {
  font-size: 1.2rem;
  font-weight: 800;
  text-align: center;
  line-height: 1.25;
}

.card-title.small {
  font-size: 0.85rem;
  font-weight: 600;
  opacity: 0.8;
}

.card-sub {
  font-size: 0.9rem;
  font-weight: 700;
  opacity: 0.7;
}

.card-link {
  font-size: 0.8rem;
  font-weight: 800;
  opacity: 0.55;
  margin-top: 6px;
}

.mini-btn {
  border: none;
  border-radius: 20px;
  padding: 13px 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  font-size: 0.95rem;
  font-weight: 700;
  cursor: pointer;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.12);
  flex-shrink: 0;
}

.mini-btn:active {
  transform: scale(0.97);
}

.mini-btn ion-icon {
  font-size: 1.4rem;
}

.danger-btn {
  background-color: var(--color-emergency-bg, #ff5c5c);
  color: var(--color-emergency-text, #1a1a1a);
}

.wellbeing-btn {
  background-color: var(--color-information-bg, #7bc62d);
  color: var(--color-information-text, #1a1a1a);
}

.profile-pill {
  border: none;
  background-color: var(--color-profile-bg, #33a1de);
  color: var(--color-profile-text, #1a1a1a);
  border-radius: 999px;
  padding: 7px 18px;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 0.85rem;
  font-weight: 700;
  cursor: pointer;
  box-shadow: 0 3px 8px rgba(0, 0, 0, 0.15);
  margin-top: 6px;
}

.profile-pill:active {
  transform: scale(0.95);
}

.profile-pill ion-icon {
  font-size: 1.1rem;
}
</style>
