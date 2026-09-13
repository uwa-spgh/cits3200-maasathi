<template>
  <IonPage>
    <IonContent class="home-content ion-padding">
      <div class="content-wrapper">
        <span class="app-caption">{{ $t('app.title') }} app</span>

        <h1 class="greeting-text">
          {{ $t('greeting', { name: userName && userName.trim() ? userName : $t('user_default') }) }}
        </h1>

        <HomeTimelineRail
          :items="items"
          :current-id="shownEvent?.id ?? null"
          @select="openEvent"
        />

        <HomeCard
          id="home-reminder-card"
          accent="yellow"
          :title="$t('home.cards.reminder_title')"
          :title-icon="homeIcons.reminderTitle"
          :body="reminderBody"
          :badge="reminderBadge"
          :graphic-icon="homeIcons.reminderGraphic"
          :listen-label="$t('home.cards.listen')"
          @open="onRemindersTap"
          @listen="listen(reminderBody)"
        />

        <HomeCard
          accent="blue"
          :title="$t('home.cards.wellbeing_title')"
          :title-icon="homeIcons.wellbeingTitle"
          :body="wellbeingBody"
          :listen-label="$t('home.cards.listen')"
          @open="go('WeekInfo')"
          @listen="listen(wellbeingBody)"
        />

        <HomeCard
          accent="green"
          :title="$t('home.cards.nutrition_title')"
          :title-icon="homeIcons.nutritionTitle"
          :body="nutritionBody"
          :graphic-icon="homeIcons.nutritionGraphicMain"
          :graphic-icon-secondary="homeIcons.nutritionGraphicSecondary"
          :listen-label="$t('home.cards.listen')"
          :learn-more-label="$t('home.cards.learn_more')"
          @open="go('Nutrition')"
          @listen="listen(nutritionBody)"
          @learn-more="go('Nutrition')"
        />
      </div>
    </IonContent>

    <IonFooter class="nav-footer ion-no-border">
      <BottomNav active="home" @navigate="go" />
    </IonFooter>
  </IonPage>
</template>

<script setup lang="ts">
import { computed, onMounted } from 'vue';
import { IonContent, IonFooter, IonPage, useIonRouter } from '@ionic/vue';
import { useI18n } from 'vue-i18n';

import BottomNav from '../components/BottomNav.vue';
import HomeCard from '../components/HomeCard.vue';
import HomeTimelineRail from '../components/HomeTimelineRail.vue';
import { homeIcons } from '../config/icons';
import { usePregnancy } from '../composables/usePregnancy';
import { useSchedule } from '../composables/useSchedule';
import { useSpeech } from '../composables/useSpeech';
import { useTt } from '../composables/useTt';
import { useUser } from '../composables/useUser';
import { formatDayMonthLong, todayIso } from '../utils/date';
import type { ScheduleItem } from '../db/schemas';

const ionRouter = useIonRouter();
const { t, locale } = useI18n();
const { userName } = useUser();
const { activePregnancy, mode } = usePregnancy();
const { items, load: loadSchedule } = useSchedule();
const { speak } = useSpeech();
const { isComplete: ttComplete, load: loadTt } = useTt();

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
    go('ProfileVaccination');
    return;
  }
  ionRouter.push({ name: 'Reminders', query: { focus: id } });
}

// Tetanus never makes it into the schedule when the history is unknown,
// so surface it as an explicit action node instead of dropping it.
const ttActionNode = computed<{ id: string; title: string } | null>(() => {
  if (!activePregnancy.value || mode.value !== 'ANC' || ttComplete.value) return null;
  if (items.value.some((i) => i.type === 'TT')) return null;
  return { id: 'tt-action', title: t('home.rail.tt_action') };
});

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

function onRemindersTap(): void {
  if (!activePregnancy.value) {
    go('Profile');
    return;
  }
  const id = shownEvent.value?.id;
  ionRouter.push(id ? { name: 'Reminders', query: { focus: id } } : { name: 'Reminders' });
}

// ---- "How are you?" card: short placeholder until stage content lands ----
const wellbeingBody = computed(() => t('home.cards.wellbeing_placeholder'));
const nutritionBody = computed(() => t('home.cards.nutrition_body') || t('content.empty'));
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
  padding-top: 10px;
  padding-bottom: 20px;
  min-height: 100%;
}

.app-caption {
  font-size: 0.85rem;
  font-weight: 700;
  opacity: 0.55;
  align-self: flex-start;
  color: var(--color-card-text, #1a1a1a);
}

.greeting-text {
  font-size: 2.1rem;
  font-weight: 800;
  color: var(--color-card-text, #111111);
  margin: 0;
  letter-spacing: -0.5px;
  align-self: flex-start;
}

#home-reminder-card {
  scroll-margin: 90px;
}

.nav-footer {
  background: transparent;
}
</style>
