import { createRouter as createIonicRouter, createWebHistory } from '@ionic/vue-router';
import type { RouteRecordRaw } from 'vue-router';

import { getNavMode, homePath } from '../config/app';
import { settingsRepo } from '../db/database';
import { ensureAppData } from '../bootstrap';
import HomePage from '../views/HomePage.vue';
import WeekInfoPage from '../views/WeekInfoPage.vue';
import EmergencyPage from '../views/EmergencyPage.vue';
import RemindersPage from '../views/RemindersPage.vue';
import InformationPage from '../views/InformationPage.vue';
import AncPage from '../views/AncPage.vue';
import AncTrimesterPage from '../views/AncTrimesterPage.vue';
import PncPage from '../views/PncPage.vue';
import VaccinationPage from '../views/VaccinationPage.vue';
import DangerSignsPage from '../views/DangerSignsPage.vue';
import NutritionPage from '../views/NutritionPage.vue';
import ProfilePage from '../views/ProfilePage.vue';
import ProfilePersonalPage from '../views/profile/ProfilePersonalPage.vue';
import ProfilePregnancyPage from '../views/profile/ProfilePregnancyPage.vue';
import ProfileVaccinationPage from '../views/profile/ProfileVaccinationPage.vue';
import ProfileContactsPage from '../views/profile/ProfileContactsPage.vue';
import ProfileSettingsPage from '../views/profile/ProfileSettingsPage.vue';
import HistorySummaryPage from '../views/HistorySummaryPage.vue';
import OnboardingPage from '../views/OnboardingPage.vue';
import TabsLayout from '../layouts/TabsLayout.vue';

const ONBOARDING_ROUTE: RouteRecordRaw = {
  path: '/onboarding',
  name: 'Onboarding',
  component: OnboardingPage
};

const AUX_ROUTES: RouteRecordRaw[] = [
  { path: '/week-info', name: 'WeekInfo', component: WeekInfoPage },
  { path: '/emergency', name: 'Emergency', component: EmergencyPage },
  { path: '/reminders', name: 'Reminders', component: RemindersPage },
  { path: '/information', name: 'Information', component: InformationPage },
  { path: '/information/anc', name: 'Anc', component: AncPage },
  { path: '/information/anc/trimester/:trimester', name: 'AncTrimester', component: AncTrimesterPage },
  { path: '/information/pnc', name: 'Pnc', component: PncPage },
  { path: '/information/vaccination', name: 'Vaccination', component: VaccinationPage },
  { path: '/information/danger-signs', name: 'DangerSigns', component: DangerSignsPage },
  { path: '/information/nutrition', name: 'Nutrition', component: NutritionPage },
  { path: '/profile', name: 'Profile', component: ProfilePage },
  { path: '/profile/personal', name: 'ProfilePersonal', component: ProfilePersonalPage },
  { path: '/profile/pregnancy', name: 'ProfilePregnancy', component: ProfilePregnancyPage },
  { path: '/profile/vaccination', name: 'ProfileVaccination', component: ProfileVaccinationPage },
  { path: '/profile/contacts', name: 'ProfileContacts', component: ProfileContactsPage },
  { path: '/profile/settings', name: 'ProfileSettings', component: ProfileSettingsPage },
  { path: '/profile/history/:pregnancyId', name: 'HistorySummary', component: HistorySummaryPage }
];

const PAGE_META: Record<string, { tab?: string }> = {
  Home: { tab: 'home' },
  Reminders: { tab: 'reminders' },
  Information: { tab: 'information' },
  Profile: { tab: 'profile' }
};

function applyTabMeta(routes: RouteRecordRaw[]): RouteRecordRaw[] {
  return routes.map((r) => ({ ...r, meta: PAGE_META[r.name as string] ?? {} }));
}

function buildRoutes(): RouteRecordRaw[] {
  const mode = getNavMode();
  if (mode === 'tabBar') {
    const tabChildren = applyTabMeta([
      { path: 'home', name: 'Home', component: HomePage },
      { path: 'reminders', name: 'Reminders', component: RemindersPage },
      { path: 'information', name: 'Information', component: InformationPage },
      { path: 'profile', name: 'Profile', component: ProfilePage },
      ...AUX_ROUTES.map((r) => ({
        ...r,
        path: r.path.replace(/^\//, '')
      }))
    ]);
    return [
      { path: '/', redirect: () => ({ path: homePath() }) },
      { path: '/tabs', component: TabsLayout, children: tabChildren },
      ONBOARDING_ROUTE,
      { path: '/:pathMatch(.*)*', redirect: () => ({ path: homePath() }) }
    ];
  }
  return [
    { path: '/', redirect: () => ({ path: homePath() }) },
    { path: '/home', name: 'Home', component: HomePage },
    ...applyTabMeta(AUX_ROUTES),
    ONBOARDING_ROUTE,
    { path: '/:pathMatch(.*)*', redirect: () => ({ path: homePath() }) }
  ];
}

export function createRouter() {
  const router = createIonicRouter({
    history: createWebHistory(import.meta.env.BASE_URL || '/'),
    routes: buildRoutes()
  });

  router.beforeEach(async (to) => {
    await ensureAppData();
    const onboardingDone = await settingsRepo.get('maasathi_onboarding_done');
    if (!onboardingDone && to.name !== 'Onboarding') {
      return { name: 'Onboarding' };
    }
    if (onboardingDone && to.name === 'Onboarding') {
      return { path: homePath() };
    }
    return true;
  });

  return router;
}

export { getNavMode };
