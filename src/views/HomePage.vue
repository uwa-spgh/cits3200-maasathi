<template>
  <IonPage>
    <IonHeader class="home-header ion-no-border">
      <div class="header-inner">
        <p class="brand-tag">MaaSathi app</p>
        <h1 class="greeting">
          {{ $t('greeting', { name: userName || $t('home.default_name') }) }}
        </h1>
      </div>
    </IonHeader>

    <IonContent class="home-content">
      <div class="content-wrapper">
        <!-- Horizontal visual timeline rail -->
        <HomeTimelineRail
          :items="items"
          :current-id="shownEvent?.id ?? null"
          @select="openEvent"
        />

        <!-- High-level glanceable cards -->
        <HomeCard
          accent="yellow"
          :title="$t('home.cards.reminder_title')"
          :title-icon="homeIcons.reminderTitle"
          :body="reminderBody"
          :badge="reminderBadge"
          :graphic-icon="homeIcons.reminderGraphic"
          :listen-label="$t('home.cards.listen')"
          :learn-more-label="$t('home.cards.learn_more')"
          @open="onRemindersTap"
          @listen="listen(reminderBody)"
          @learn-more="onRemindersTap"
        />

        <HomeCard
          accent="blue"
          :title="$t('home.cards.wellbeing_title')"
          :title-icon="homeIcons.wellbeingTitle"
          :body="wellbeingBody"
          :listen-label="$t('home.cards.listen')"
          :learn-more-label="$t('home.cards.learn_more')"
          @open="onInformationTap"
          @listen="listen(wellbeingBody)"
          @learn-more="onInformationTap"
        />

        <!--
          "What to know right now" rotating widget — pick ONE rotation
          method in the <script> below (search "ROTATION METHOD"). METHOD 3
          is active: a single corner arrow on the card advances to the next
          topic (see the `corner-arrow-*` props below and the `HomeCard`
          corner-arrow-btn styling for the look).
        -->
        <HomeCard
          accent="green"
          :title="nowTitle"
          :title-icon="homeIcons.nowTitle"
          :body="nowExcerpt"
          :corner-arrow-icon="nowTopics.length > 1 ? homeIcons.nowNext : null"
          :corner-arrow-label="$t('home.cards.now_next')"
          :listen-label="$t('home.cards.listen')"
          :learn-more-label="$t('home.cards.learn_more')"
          @open="onNowLearnMore"
          @listen="listen(nowExcerpt)"
          @learn-more="onNowLearnMore"
          @corner-arrow="nowNext"
        />
      </div>
    </IonContent>

    <IonFooter class="nav-footer ion-no-border">
      <BottomNav active="home" @navigate="go" />
    </IonFooter>
  </IonPage>
</template>

<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref, watch } from 'vue';
import {
  IonContent,
  IonFooter,
  IonHeader,
  IonPage,
  onIonViewWillLeave,
  useIonRouter
} from '@ionic/vue';
// Only needed by ROTATION METHOD 2 (leave-page/app rotation) below — safe to
// leave imported even if that method is disabled.
import { App as CapApp } from '@capacitor/app';
import type { PluginListenerHandle } from '@capacitor/core';
import { useI18n } from 'vue-i18n';
import BottomNav from '../components/BottomNav.vue';
import HomeCard from '../components/HomeCard.vue';
import HomeTimelineRail from '../components/HomeTimelineRail.vue';
import { homeIcons } from '../config/icons';
import { NOW_WIDGET_ROTATE_MS } from '../config/app';
import { usePregnancy } from '../composables/usePregnancy';
import { useSchedule } from '../composables/useSchedule';
import { useSpeech } from '../composables/useSpeech';
import { useTt } from '../composables/useTt';
import { useUser } from '../composables/useUser';
import type { ScheduleItem } from '../db/schemas';
import { formatDayMonthLong, todayIso } from '../utils/date';
import { currentStageRef, excerpt, getStageSurfacedContent, STAGE_NOW_TOPICS } from '../utils/stageArticle';

const ionRouter = useIonRouter();
const { t, locale } = useI18n();
const { userName } = useUser();
const { activePregnancy, mode } = usePregnancy();
const { items, load: loadSchedule } = useSchedule();
const { load: loadTt } = useTt();
const { speak } = useSpeech();

onMounted(() => {
  void loadSchedule();
  void loadTt();
});

function go(routeName: string): void {
  ionRouter.push({ name: routeName });
}

function listen(text: string): void {
  speak(text, locale.value);
}

// ---- Reminder card: the next thing needing attention ----
const nextEvent = computed<ScheduleItem | null>(() => {
  const today = todayIso();
  const upcoming = items.value
    .filter((i) => i.status !== 'completed' && i.dueDate >= today)
    .sort((a, b) => a.dueDate.localeCompare(b.dueDate));
  if (upcoming.length > 0) return upcoming[0] ?? null;
  return (
    items.value
      .filter((i) => i.status !== 'completed')
      .sort((a, b) => a.dueDate.localeCompare(b.dueDate))[0] ?? null
  );
});

// The reminder card always shows the next thing needing attention.
const shownEvent = computed<ScheduleItem | null>(() => {
  if (!activePregnancy.value) return null;
  return nextEvent.value;
});

function openEvent(id: string): void {
  if (id === 'tt-action') {
    go('VaccinationTetanus');
    return;
  }
  ionRouter.push({ name: 'Reminders', query: { focus: id } });
}

function visitNumber(item: ScheduleItem | null): number | null {
  if (!item) return null;
  const match = item.ref.match(/(\d+)$/);
  return match ? Number(match[1]) : null;
}

const reminderBadge = computed<string | null>(() => {
  const n = visitNumber(shownEvent.value);
  return n !== null && shownEvent.value?.status !== 'completed' ? `#${n}` : null;
});

const reminderBody = computed(() => {
  const e = shownEvent.value;
  if (!e) return t('home.no_pregnancy');
  const date = formatDayMonthLong(e.dueDate, locale.value);
  const n = visitNumber(e);
  if (e.type === 'ANC' && n !== null) {
    return t('home.cards.reminder_anc', { ordinal: t(`home.cards.ordinal_${n}`), date });
  }
  if (e.type === 'PNC' && n !== null) {
    return t('home.cards.reminder_pnc', { ordinal: t(`home.cards.ordinal_${n}`), date });
  }
  if (e.type === 'TT') return t('home.cards.reminder_tt', { date });
  if (e.ref === 'edd') return t('home.cards.reminder_edd', { date });
  return t('home.cards.reminder_generic', { title: t(e.titleKey), date });
});

/**
 * Tapping the reminder card or "Learn more" on it takes the user to the Reminders section,
 * focusing on that upcoming visit item in the timeline.
 */
function onRemindersTap(): void {
  if (!activePregnancy.value) {
    go('Profile');
    return;
  }
  const id = shownEvent.value?.id;
  ionRouter.push(id ? { name: 'Reminders', query: { focus: id } } : { name: 'Reminders' });
}

/**
 * Tapping the Information card opens Layla's comprehensive information page for the current mode.
 */
function onInformationTap(): void {
  if (mode.value === 'PNC') {
    go('Pnc');
  } else {
    go('Anc');
  }
}

// ---- Surfaced Stage Content: Wellbeing ----
const surfaced = computed(() => getStageSurfacedContent(items.value, mode.value, t));
const wellbeingBody = computed(() => surfaced.value.wellbeingBody);

// ---- "What to know right now" rotating widget ----
const nowTopics = computed(() => {
  const stage = currentStageRef(items.value, mode.value);
  return stage ? STAGE_NOW_TOPICS[stage.stageKey] ?? [] : [];
});

const nowIndex = ref(0);

/** Move to the next/previous slide, wrapping around. Shared by whichever
 *  rotation method below is active. */
function nowAdvance(step: number): void {
  const len = nowTopics.value.length;
  if (len === 0) return;
  nowIndex.value = (nowIndex.value + step + len) % len;
}

// Always jump back to the first slide when the underlying topic list
// changes (e.g. moving from one ANC visit to the next).
watch(nowTopics, () => {
  nowIndex.value = 0;
});


// METHOD 1: auto-rotate on a timer 
/*
let nowTimer: ReturnType<typeof setInterval> | null = null;

function stopNowRotation(): void {
  if (nowTimer !== null) {
    clearInterval(nowTimer);
    nowTimer = null;
  }
}

function startNowRotation(): void {
  stopNowRotation();
  if (nowTopics.value.length <= 1) return;
  nowTimer = setInterval(() => nowAdvance(1), NOW_WIDGET_ROTATE_MS);
}

watch(nowTopics, startNowRotation, { immediate: true });
onUnmounted(stopNowRotation);
*/

// METHOD 2: advance once each time you leave the Home page
/*
onIonViewWillLeave(() => nowAdvance(1));

let appStateHandle: PluginListenerHandle | null = null;
onMounted(async () => {
  appStateHandle = await CapApp.addListener('appStateChange', ({ isActive }) => {
    if (!isActive) nowAdvance(1);
  });
});
onUnmounted(() => {
  void appStateHandle?.remove();
});
*/

// METHOD 3: manual navigation via a corner arrow button

function nowNext(): void {
  nowAdvance(1);
}

const activeNowTopic = computed(() => nowTopics.value[nowIndex.value] ?? null);

const nowTitle = computed(() => {
  const topic = activeNowTopic.value;
  return topic ? t(`${topic.ns}.${topic.key}_title`) : t('home.cards.now_placeholder');
});

const nowExcerpt = computed(() => {
  const topic = activeNowTopic.value;
  if (!topic) return '';
  if (topic.key === 'breastfeeding') return t('pnc.start_early.point1');
  if (topic.route) return excerpt(t(`${topic.ns}.${topic.key}_body`));
  return t(`${topic.ns}.${topic.key}.point1`);
});

function onNowLearnMore(): void {
  const topic = activeNowTopic.value;
  if (!topic) {
    go('Information');
    return;
  }
  if (topic.route) {
    go(topic.route);
    return;
  }
  ionRouter.push({ name: 'Information', query: { topic: `${topic.ns}.${topic.key}` } });
}
</script>

<style scoped>
.home-content {
  --background: var(--color-app-bg, #fbf7f5);
}

.content-wrapper {
  max-width: 480px;
  margin: 0 auto;
  padding: 12px 16px 24px 16px;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.home-header {
  background: var(--color-app-bg, #fbf7f5);
  padding: 24px 20px 8px 20px;
}

.header-inner {
  max-width: 480px;
  margin: 0 auto;
}

.brand-tag {
  font-size: 0.85rem;
  font-weight: 700;
  color: #8c8c8c;
  margin: 0 0 4px 0;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.greeting {
  font-size: 1.85rem;
  font-weight: 800;
  color: #1a1a1a;
  margin: 0;
}

.nav-footer {
  background: var(--color-app-bg, #fbf7f5);
  box-shadow: 0 -4px 16px rgba(0, 0, 0, 0.04);
}
</style>
