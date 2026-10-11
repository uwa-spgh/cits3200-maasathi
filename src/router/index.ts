import { createRouter as createIonicRouter, createWebHistory } from '@ionic/vue-router';
import type { RouteRecordRaw } from 'vue-router';

import { homePath } from '../config/app';
import { settingsRepo } from '../db/database';
import { ensureAppData } from '../bootstrap';
import HomePage from '../views/HomePage.vue';
import WeekInfoPage from '../views/WeekInfoPage.vue';
import RemindersPage from '../views/RemindersPage.vue';
import InformationPage from '../views/InformationPage.vue';
import AncPage from '../views/AncPage.vue';
import AncTrimesterPage from '../views/AncTrimesterPage.vue';
import PncPage from '../views/PncPage.vue';
import PncBreastfeedingPage from '../views/PncBreastfeedingPage.vue';
import PncRoutineCarePage from '../views/PncRoutineCarePage.vue';
import VaccinationPage from '../views/VaccinationPage.vue';
import VaccinationTetanusPage from '../views/VaccinationTetanusPage.vue';
import VaccinationChildPage from '../views/VaccinationChildPage.vue';
import DangerSignsPage from '../views/DangerSignsPage.vue';
import NutritionPage from '../views/NutritionPage.vue';
import ProfilePage from '../views/ProfilePage.vue';
import ProfilePersonalPage from '../views/profile/ProfilePersonalPage.vue';
import ProfilePregnancyPage from '../views/profile/ProfilePregnancyPage.vue';
import ProfileVaccinationPage from '../views/profile/ProfileVaccinationPage.vue';
import ProfilePlanPage from '../views/profile/ProfilePlan.vue';
import HistorySummaryPage from '../views/HistorySummaryPage.vue';
import OnboardingPage from '../views/OnboardingPage.vue';

const ONBOARDING_ROUTE: RouteRecordRaw = {
  path: '/onboarding',
  name: 'Onboarding',
  component: OnboardingPage
};

const AUX_ROUTES: RouteRecordRaw[] = [
  { path: '/week-info', name: 'WeekInfo', component: WeekInfoPage },
  { path: '/reminders', name: 'Reminders', component: RemindersPage },
  { path: '/information', name: 'Information', component: InformationPage },
  { path: '/information/anc', name: 'Anc', component: AncPage },
  { path: '/information/anc/trimester/:trimester', name: 'AncTrimester', component: AncTrimesterPage },
  { path: '/information/pnc', name: 'Pnc', component: PncPage },
  { path: '/information/pnc/breastfeeding', name: 'PncBreastfeeding', component: PncBreastfeedingPage },
  { path: '/information/pnc/routine-care', name: 'PncRoutineCare', component: PncRoutineCarePage },
  { path: '/information/vaccination', name: 'Vaccination', component: VaccinationPage },
  { path: '/information/vaccination/tetanus', name: 'VaccinationTetanus', component: VaccinationTetanusPage },
  { path: '/information/vaccination/child', name: 'VaccinationChild', component: VaccinationChildPage },
  { path: '/information/danger-signs', name: 'DangerSigns', component: DangerSignsPage },
  { path: '/information/nutrition', name: 'Nutrition', component: NutritionPage },
  { path: '/profile', name: 'Profile', component: ProfilePage },
  { path: '/profile/personal', name: 'ProfilePersonal', component: ProfilePersonalPage },
  { path: '/profile/pregnancy', name: 'ProfilePregnancy', component: ProfilePregnancyPage },
  { path: '/profile/vaccination', name: 'ProfileVaccination', component: ProfileVaccinationPage },
  { path: '/profile/plan', name: 'ProfilePlan', component: ProfilePlanPage },
  { path: '/profile/history/:pregnancyId', name: 'HistorySummary', component: HistorySummaryPage }
];

function buildRoutes(): RouteRecordRaw[] {
  return [
    { path: '/', redirect: () => ({ path: homePath() }) },
    { path: '/home', name: 'Home', component: HomePage },
    ...AUX_ROUTES,
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
    try {
      await ensureAppData();
    } catch (e) {
      console.error('MaaSathi: continuing without app data', e);
    }
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
