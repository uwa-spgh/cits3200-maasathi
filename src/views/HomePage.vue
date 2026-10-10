<!--
  HomePage — main dashboard: greeting, a timeline rail of visits, and cards for the next reminder, a wellbeing article, and a daily "What to know right now" topic. Cards open Reminders, Information or the topic page.
-->
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
          :graphic-icon="reminderGraphic"
          :listen-text="reminderBody"
          :learn-more-label="$t('home.cards.learn_more')"
          @open="onRemindersTap"
          @learn-more="onRemindersTap"
        />

        <HomeCard
          accent="blue"
          :title="$t('home.cards.wellbeing_title')"
          :title-icon="homeIcons.wellbeingTitle"
          :body="wellbeingBody"
          :listen-text="wellbeingBody"
          :learn-more-label="$t('home.cards.learn_more')"
          @open="onInformationTap"
          @learn-more="onInformationTap"
        />

        <!--
          "What to know right now" rotating widget — shows a different topic
          each day, and the corner arrow advances to the next topic.
        -->
        <HomeCard
          accent="green"
          :title="nowTitle"
          :title-icon="homeIcons.nowTitle"
          :body="nowExcerpt"
          :corner-arrow-icon="nowTopics.length > 1 ? homeIcons.nowNext : null"
          :corner-arrow-label="$t('home.cards.now_next')"
          :listen-text="nowExcerpt"
          :learn-more-label="$t('home.cards.learn_more')"
          :dot-count="nowTopics.length"
          :active-dot-index="nowIndex"
          @open="onNowLearnMore"
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
import { computed, onMounted, ref, watch } from 'vue';
import {
  IonContent,
  IonFooter,
  IonHeader,
  IonPage,
  onIonViewWillEnter,
  useIonRouter
} from '@ionic/vue';
import { useI18n } from 'vue-i18n';
import BottomNav from '../components/BottomNav.vue';
import HomeCard from '../components/HomeCard.vue';
import HomeTimelineRail from '../components/HomeTimelineRail.vue';
import { homeIcons } from '../config/icons';
import { usePregnancy } from '../composables/usePregnancy';
import { useSchedule } from '../composables/useSchedule';
import { useTt } from '../composables/useTt';
import { useUser } from '../composables/useUser';
import type { ScheduleItem } from '../db/schemas';
import { daysBetween, formatDayMonthLong, todayIso } from '../utils/date';
import { currentStageRef, excerpt, getStageSurfacedContent, STAGE_NOW_TOPICS } from '../utils/stageArticle';
import { visitNumber } from '../services/notifications';

const ionRouter = useIonRouter();
const { t, locale } = useI18n();
const { userName } = useUser();
const { activePregnancy, mode } = usePregnancy();
const { items, load: loadSchedule } = useSchedule();
const { load: loadTt } = useTt();

onMounted(() => {
  void loadSchedule();
  void loadTt();
});

function go(routeName: string): void {
  ionRouter.push({ name: routeName });
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

const reminderGraphic = computed(() => {
  const e = shownEvent.value;
  if (!e) return homeIcons.nodeAnc;
  if (e.type === 'ANC') return homeIcons.nodeAnc;
  if (e.type === 'PNC') return homeIcons.nodePnc;
  if (e.type === 'TT') return homeIcons.nodeTt;
  if (e.ref === 'edd') return homeIcons.nodeMilestone;
  return homeIcons.nodeAnc;
});

const reminderBadge = computed<string | null>(() => {
  const n = visitNumber(shownEvent.value);
  return n !== null && shownEvent.value?.status !== 'completed' ? `${n}` : null;
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
 * Tapping the wellbeing card opens the general Information page.
 */
function onInformationTap(): void {
  go('Information');
}

// ---- Surfaced Stage Content: Wellbeing ----
const surfaced = computed(() => getStageSurfacedContent(items.value, mode.value, t));
const wellbeingBody = computed(() => surfaced.value.wellbeingBody);

// ---- "What to know right now" rotating widget ----
const nowTopics = computed(() => {
  const stage = currentStageRef(items.value, mode.value);
  return stage ? STAGE_NOW_TOPICS[stage.stageKey] ?? [] : [];
});

// Today's date, refreshed whenever Home is shown so the daily topic changes
// even if the app stays open overnight.
const today = ref(todayIso());
onIonViewWillEnter(() => {
  today.value = todayIso();
});

// Extra steps from tapping the corner arrow, on top of the daily topic.
const nowTapOffset = ref(0);

// Start from a different topic each day, then step forward per arrow tap.
const nowIndex = computed(() => {
  const len = nowTopics.value.length;
  if (len === 0) return 0;
  const day = daysBetween('1970-01-01', today.value);
  return (((day + nowTapOffset.value) % len) + len) % len;
});

// Clear manual taps when the topic list (e.g. a new ANC visit) or the day changes.
watch([nowTopics, today], () => {
  nowTapOffset.value = 0;
});

function nowNext(): void {
  nowTapOffset.value += 1;
}

const activeNowTopic = computed(() => nowTopics.value[nowIndex.value] ?? null);

const nowTitle = computed(() => {
  const topic = activeNowTopic.value;
  return topic ? t(`${topic.ns}.${topic.key}_title`) : t('home.cards.now_placeholder');
});

const nowExcerpt = computed(() => {
  const topic = activeNowTopic.value;
  if (!topic) return '';
  if (topic.excerptKey) return t(topic.excerptKey);
  if (topic.key === 'breastfeeding') return t('pnc.start_early.point1');
  if (topic.key === 'routine_care') return t('pnc.routine_care_blurb');
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
  const routeName = topic.page ?? (topic.ns === 'pnc' ? 'Pnc' : 'Anc');
  ionRouter.push({ name: routeName, query: { topic: topic.pageKey ?? topic.key } });
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
  /* Clear the status bar / Dynamic Island; see SectionHeader.vue. */
  padding: calc(24px + var(--ion-safe-area-top, 0px)) 20px 8px 20px;
}

.header-inner {
  max-width: 480px;
  margin: 0 auto;
}

.brand-tag {
  font-size: 0.85rem;
  font-weight: 700;
  color: var(--color-text-muted, #5c5c5c);
  margin: 0 0 4px 0;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.greeting {
  font-size: 1.85rem;
  font-weight: 800;
  color: var(--color-card-text, #1a1a1a);
  margin: 0;
}

.nav-footer {
  background: var(--color-app-bg, #fbf7f5);
  box-shadow: 0 -4px 16px var(--color-shadow, rgba(0, 0, 0, 0.08));
}
</style>
