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
import {
  IonContent,
  IonFooter,
  IonHeader,
  IonPage,
  useIonRouter
} from '@ionic/vue';
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
import type { ScheduleItem } from '../db/schemas';
import { formatDayMonthLong, todayIso } from '../utils/date';
import { getStageSurfacedContent } from '../utils/stageArticle';

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

// ---- Surfaced Stage Content: Wellbeing & Nutrition ----
const surfaced = computed(() => getStageSurfacedContent(items.value, mode.value, t));
const wellbeingBody = computed(() => surfaced.value.wellbeingBody);
const nutritionBody = computed(() => surfaced.value.nutritionBody);
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
