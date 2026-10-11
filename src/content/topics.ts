/**
 * Which translation keys make up the content pages that can be read aloud.
 *
 * Pure data with no imports, so the Vue pages and the audio generator script
 * (scripts/audio) both load the same lists. Adding a topic here updates the
 * page and the set of clips the generator produces.
 */

export interface TopicDef {
  key: string;
  /** Number of bullet points, keyed `<ns>.<key>.point<n>`. 0 when the topic links to its own page. */
  points: number;
  /** Route name this topic links out to instead of showing inline points. */
  route?: string;
}

// Layla's authored ANC topics (nutrition is separate in Nutrition section)
export const ANC_TOPICS: TopicDef[] = [
  { key: 'early_care', points: 2 },
  { key: 'anc_visits', points: 2 },
  { key: 'iron_folic_acid', points: 2 },
  { key: 'calcium_supplementation', points: 2 },
  { key: 'pre_eclampsia_monitoring', points: 4 },
  { key: 'physical_activity', points: 2 },
  { key: 'hydration_rest', points: 2 },
  { key: 'mental_wellbeing', points: 2 },
  { key: 'danger_signs_note', points: 1 },
  { key: 'birth_preparedness', points: 2 },
  { key: 'skilled_birth_care', points: 2 },
  { key: 'signs_of_labour', points: 5 },
  { key: 'labour_go_to_facility', points: 12 },
  { key: 'maternal_immunisation', points: 2 },
  { key: 'avoid_harmful_substances', points: 2 },
  { key: 'hygiene_infection_prevention', points: 2 },
  { key: 'preparing_baby_care', points: 2 }
];

// Layla's authored PNC topics (nutrition is separate in Nutrition section)
export const PNC_TOPICS: TopicDef[] = [
  { key: 'routine_care', points: 0, route: 'PncRoutineCare' },
  { key: 'rest', points: 1 },
  { key: 'bleeding', points: 1 },
  { key: 'pain', points: 1 },
  { key: 'cleanliness', points: 1 },
  { key: 'cord_healing', points: 10 },
  { key: 'checkup', points: 1 },
  { key: 'family_planning', points: 1 },
  { key: 'mood', points: 1 }
];

export const PNC_ROUTINE_CARE_TOPICS: TopicDef[] = [
  { key: 'keep_baby_warm', points: 4 },
  { key: 'routine_breastfeed', points: 4 },
  { key: 'keep_baby_clean', points: 4 },
  { key: 'keep_baby_safe', points: 3 },
  { key: 'baby_checkups', points: 3 }
];

export const PNC_BREASTFEEDING_TOPICS: TopicDef[] = [
  { key: 'start_early', points: 1 },
  { key: 'only_breastmilk', points: 1 },
  { key: 'feed_often', points: 1 },
  { key: 'good_position', points: 1 },
  { key: 'enough_milk', points: 1 },
  { key: 'sore_breasts', points: 1 },
  { key: 'both_breasts', points: 1 },
  { key: 'get_help', points: 1 }
];

// Child vaccination topics (moved here from the PNC page; text lives under `pnc.*`)
export const CHILD_VACCINE_TOPICS: TopicDef[] = [
  { key: 'vaccines_after_birth', points: 6 },
  { key: 'childhood_immunisation', points: 9 }
];

// Tetanus education topics (text lives under `tt.*`)
export const TETANUS_TOPICS: TopicDef[] = [
  { key: 'what_is_tetanus', points: 1 },
  { key: 'newborn_risk', points: 2 },
  { key: 'tt_protection', points: 1 },
  { key: 'five_dose_schedule', points: 2 },
  { key: 'bring_epi_card', points: 1 },
  { key: 'previous_doses', points: 1 }
];

/** Danger-sign groups and how many signs each has (`danger_signs.<key>.signs.sign<n>`). */
export const DANGER_SIGN_GROUPS: { key: string; count: number }[] = [
  { key: 'pregnancy', count: 11 },
  { key: 'labour', count: 7 },
  { key: 'postpartum', count: 9 },
  { key: 'newborn', count: 6 }
];

export const NUTRITION_TOPICS = ['healthy_diet', 'ifa', 'calcium', 'hydration', 'activity'] as const;

/** Which ANC visits each trimester page covers. */
export const TRIMESTER_VISITS: Record<string, string[]> = {
  '1': ['visit1'],
  '2': ['visit2'],
  '3': ['visit3', 'visit4']
};

/** How many pregnancy danger signs the trimester pages list. */
export const TRIMESTER_DANGER_SIGN_COUNT = 5;

/**
 * What the Listen button on each onboarding step reads: the translation keys of its title,
 * then any hint or label shown with it.
 */
export const ONBOARDING_SPEECH = {
  language: ['onboarding.welcome_title', 'onboarding.welcome_text'],
  name: ['onboarding.name_title'],
  lmp_known: ['onboarding.q_lmp'],
  lmp_date: ['onboarding.q_lmp_when'],
  edd_known: ['onboarding.q_edd'],
  edd_date: ['onboarding.q_edd_when'],
  estimate: ['onboarding.q_estimate', 'onboarding.estimate_hint'],
  tt_ever: ['profile.tt_question'],
  tt_count_known: ['onboarding.q_tt_count'],
  tt_details: ['profile.tt_dose_count_label', 'profile.tt_last_dose_label'],
  done: ['onboarding.done_title', 'onboarding.done_text']
} as const;

export type OnboardingSpeechStep = keyof typeof ONBOARDING_SPEECH;
