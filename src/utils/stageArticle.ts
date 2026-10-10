import type { CareMode, ScheduleItem } from '../db/schemas';

export interface NowTopic {
  ns: 'anc' | 'pnc';
  key: string;
  /** Bullet points to show inline, keyed `${ns}.${key}.point${n}`. Unused when `route` is set. */
  points: number;
  /** When set, this topic links out to a full info page instead of showing inline bullet points. */
  route?: string;
  /** Page the Home widget's "Learn more" opens (with ?topic=key). Defaults to Anc/Pnc by `ns`. */
  page?: string;
  /** Card key on `page` when it differs from `key` (e.g. the PNC page calls mental wellbeing `mood`). */
  pageKey?: string;
  /** i18n key for the widget text, overriding the default first-point/body excerpt. */
  excerptKey?: string;
  /** i18n key for the widget title, overriding `${ns}.${key}_title`. */
  titleKey?: string;
  /** Query for the `page` link, overriding the default `?topic=key`. */
  pageQuery?: Record<string, string>;
}

/** Shown once every PNC contact is completed, until the child immunisation milestone is. */
const CHILDHOOD_IMMUNISATION_TOPIC: NowTopic = {
  ns: 'pnc',
  key: 'childhood_immunisation',
  points: 9,
  page: 'VaccinationChild'
};

/** Shown once the child immunisation milestone is completed, and after the pregnancy is closed. */
export const NEW_PREGNANCY_TOPIC: NowTopic = {
  ns: 'pnc',
  key: 'new_pregnancy',
  points: 0,
  titleKey: 'home.cards.now_new_pregnancy_title',
  excerptKey: 'home.cards.now_new_pregnancy',
  page: 'ProfilePregnancy',
  pageQuery: {}
};

/** Shown once "Give Birth" is marked completed but the birth isn't registered yet. */
export const REGISTER_BIRTH_TOPIC: NowTopic = {
  ns: 'anc',
  key: 'register_birth',
  points: 0,
  titleKey: 'home.cards.now_register_birth_title',
  excerptKey: 'home.cards.now_register_birth',
  page: 'ProfilePregnancy',
  pageQuery: { section: 'birth' }
};

/** Stage topics without nutrition (nutrition is kept separate in the Nutrition section) */
export const STAGE_NOW_TOPICS: Record<string, NowTopic[]> = {
  'ANC:visit1': [
    { ns: 'anc', key: 'iron_folic_acid', points: 2 },
    { ns: 'anc', key: 'healthy_diet', points: 2, page: 'Nutrition' },
    { ns: 'anc', key: 'hydration_rest', points: 2 },
    // Visit 1 nudges the user to start their Birth Plan rather than show the info card
    { ns: 'anc', key: 'birth_preparedness', points: 2, page: 'ProfilePlan', excerptKey: 'home.cards.now_birth_plan' }
  ],
  'ANC:visit2': [
    { ns: 'anc', key: 'iron_folic_acid', points: 2 },
    { ns: 'anc', key: 'calcium_supplementation', points: 2 },
    { ns: 'anc', key: 'pre_eclampsia_monitoring', points: 4 }
  ],
  'ANC:visit3': [
    { ns: 'anc', key: 'iron_folic_acid', points: 2 },
    { ns: 'anc', key: 'calcium_supplementation', points: 2 },
    { ns: 'anc', key: 'mental_wellbeing', points: 2 },
    { ns: 'anc', key: 'birth_preparedness', points: 2 }
  ],
  'ANC:visit4': [
    { ns: 'anc', key: 'preparing_baby_care', points: 2 },
    { ns: 'anc', key: 'skilled_birth_care', points: 2 },
    { ns: 'anc', key: 'signs_of_labour', points: 5 },
    { ns: 'anc', key: 'labour_go_to_facility', points: 12 },
    // Visit 4 reminds the user to review their Birth Plan
    { ns: 'anc', key: 'birth_preparedness', points: 2, page: 'ProfilePlan', excerptKey: 'home.cards.now_birth_plan_review' }
  ],
  'PNC:contact1': [
    { ns: 'pnc', key: 'rest', points: 1 },
    { ns: 'pnc', key: 'bleeding', points: 1 },
    { ns: 'pnc', key: 'breastfeeding', points: 0, route: 'PncBreastfeeding' }
  ],
  'PNC:contact2': [
    { ns: 'pnc', key: 'mental_wellbeing', points: 1, pageKey: 'mood' },
    { ns: 'pnc', key: 'family_planning', points: 1 },
    { ns: 'pnc', key: 'cord_healing', points: 10 }
  ],
  'PNC:contact3': [
    { ns: 'pnc', key: 'routine_care', points: 0, route: 'PncRoutineCare' },
    { ns: 'pnc', key: 'vaccines_after_birth', points: 6, page: 'VaccinationChild' },
    { ns: 'pnc', key: 'childhood_immunisation', points: 9, page: 'VaccinationChild' }
  ],
  'PNC:contact4': [
    { ns: 'pnc', key: 'childhood_immunisation', points: 9, page: 'VaccinationChild' },
    { ns: 'pnc', key: 'family_planning', points: 1 }
  ]
};

export interface StageDefinition {
  mode: 'ANC' | 'PNC';
  ref: string;
  stageKey: string;
  pillLabelKey: string;
  titleKey: string;
  timingKey: string;
}

export const ALL_STAGES: StageDefinition[] = [
  { mode: 'ANC', ref: 'visit1', stageKey: 'ANC:visit1', pillLabelKey: 'stage_nav.anc_visit1_short', titleKey: 'timeline.anc.visit1', timingKey: 'stage_nav.timing_visit1' },
  { mode: 'ANC', ref: 'visit2', stageKey: 'ANC:visit2', pillLabelKey: 'stage_nav.anc_visit2_short', titleKey: 'timeline.anc.visit2', timingKey: 'stage_nav.timing_visit2' },
  { mode: 'ANC', ref: 'visit3', stageKey: 'ANC:visit3', pillLabelKey: 'stage_nav.anc_visit3_short', titleKey: 'timeline.anc.visit3', timingKey: 'stage_nav.timing_visit3' },
  { mode: 'ANC', ref: 'visit4', stageKey: 'ANC:visit4', pillLabelKey: 'stage_nav.anc_visit4_short', titleKey: 'timeline.anc.visit4', timingKey: 'stage_nav.timing_visit4' },
  { mode: 'PNC', ref: 'contact1', stageKey: 'PNC:contact1', pillLabelKey: 'stage_nav.pnc_contact1_short', titleKey: 'timeline.pnc.contact1', timingKey: 'stage_nav.timing_contact1' },
  { mode: 'PNC', ref: 'contact2', stageKey: 'PNC:contact2', pillLabelKey: 'stage_nav.pnc_contact2_short', titleKey: 'timeline.pnc.contact2', timingKey: 'stage_nav.timing_contact2' },
  { mode: 'PNC', ref: 'contact3', stageKey: 'PNC:contact3', pillLabelKey: 'stage_nav.pnc_contact3_short', titleKey: 'timeline.pnc.contact3', timingKey: 'stage_nav.timing_contact3' },
  { mode: 'PNC', ref: 'contact4', stageKey: 'PNC:contact4', pillLabelKey: 'stage_nav.pnc_contact4_short', titleKey: 'timeline.pnc.contact4', timingKey: 'stage_nav.timing_contact4' }
];

/** The care reference matching the stage the mother is in right now:
 *  the earliest non-completed ANC visit (or PNC contact in PNC mode). */
export function currentStageRef(
  items: ScheduleItem[],
  mode: CareMode
): { ns: 'anc' | 'pnc'; ref: string; stageKey: string } | null {
  const type = mode === 'PNC' ? 'PNC' : 'ANC';
  const next = items
    .filter((i) => i.type === type && i.status !== 'completed')
    .sort((a, b) => a.dueDate.localeCompare(b.dueDate))[0];
  if (!next) return null;
  const ns = type === 'PNC' ? 'pnc' : 'anc';
  return { ns, ref: next.ref, stageKey: `${type}:${next.ref}` };
}

/**
 * Stage for the Home cards. Same as currentStageRef, except that once every
 * ANC visit is done the cards stay on visit 4 until "Give Birth" is marked
 * completed.
 */
export function homeStageRef(
  items: ScheduleItem[],
  mode: CareMode
): { ns: 'anc' | 'pnc'; ref: string; stageKey: string } | null {
  const stage = currentStageRef(items, mode);
  if (stage || mode === 'PNC') return stage;
  const giveBirth = items.find((i) => i.type === 'MILESTONE' && i.ref === 'edd');
  if (giveBirth && giveBirth.status !== 'completed') {
    return { ns: 'anc', ref: 'visit4', stageKey: 'ANC:visit4' };
  }
  return null;
}

/** Topics for the "What to know right now" widget at the current stage. */
export function nowTopicsFor(items: ScheduleItem[], mode: CareMode): NowTopic[] {
  const stage = homeStageRef(items, mode);
  if (stage) return STAGE_NOW_TOPICS[stage.stageKey] ?? [];
  // Every PNC contact done: the baby's vaccinations, then (once the child
  // immunisation milestone is completed) registering a future pregnancy
  if (mode === 'PNC') {
    if (!items.some((i) => i.type === 'PNC')) return [];
    const epiStart = items.find((i) => i.type === 'MILESTONE' && i.ref === 'child_epi_start');
    return epiStart?.status === 'completed' ? [NEW_PREGNANCY_TOPIC] : [CHILDHOOD_IMMUNISATION_TOPIC];
  }
  // "Give Birth" marked completed but still in pregnancy mode: prompt to register
  const giveBirth = items.find((i) => i.type === 'MILESTONE' && i.ref === 'edd');
  return giveBirth?.status === 'completed' ? [REGISTER_BIRTH_TOPIC] : [];
}

/** First paragraph block, for card-sized excerpts of long articles. */
export function excerpt(text: string, max = 200): string {
  const block = text
    .split('\n\n')
    .map((s) => s.trim())
    .find((s) => s.length > 0) ?? '';
  return block.length > max ? `${block.slice(0, max).trimEnd()}…` : block;
}

export function getStageSummary(
  mode: 'ANC' | 'PNC',
  ref: string,
  t: (key: string, values?: Record<string, any>) => string
): string {
  const key = mode === 'PNC' ? `home.cards.stage_pnc_${ref}` : `home.cards.stage_anc_${ref}`;
  const val = t(key);
  if (val && val !== key) return val;
  const visitBody = t(`${mode.toLowerCase()}.visit_body.${ref}`);
  if (visitBody && visitBody !== `${mode.toLowerCase()}.visit_body.${ref}`) {
    return excerpt(visitBody);
  }
  return '';
}

export function getStageSurfacedContent(
  items: ScheduleItem[],
  mode: CareMode,
  t: (key: string, values?: Record<string, any>) => string
): {
  stageKey: string | null;
  wellbeingBody: string;
  dangerBody: string;
} {
  const stage = homeStageRef(items, mode);
  if (!stage) {
    // "Give Birth" marked completed but the birth isn't registered yet
    const giveBirth = items.find((i) => i.type === 'MILESTONE' && i.ref === 'edd');
    const justBorn = mode !== 'PNC' && giveBirth?.status === 'completed';
    // Child immunisation milestone marked completed: the guidance is finished
    const epiStart = items.find((i) => i.type === 'MILESTONE' && i.ref === 'child_epi_start');
    const journeyDone = mode === 'PNC' && epiStart?.status === 'completed';
    // Every PNC contact done, child immunisation milestone still to come
    const epiStage = mode === 'PNC' && !!epiStart && epiStart.status !== 'completed';
    const bodyKey = justBorn
      ? 'home.cards.after_birth_congrats'
      : journeyDone
        ? 'home.cards.journey_complete'
        : epiStage
          ? 'home.cards.child_epi_stage'
          : 'home.cards.wellbeing_placeholder';
    return {
      stageKey: null,
      wellbeingBody: t(bodyKey),
      dangerBody: t('home.cards.danger_generic_body')
    };
  }

  const { ns, ref } = stage;
  const stageKey = `${ns === 'pnc' ? 'PNC' : 'ANC'}:${ref}`;

  // 1. Stage info summary (Wellbeing / Information)
  const override = t('week_info.body_stage');
  const stageWellbeingKey = ns === 'pnc' ? `home.cards.stage_pnc_${ref}` : `home.cards.stage_anc_${ref}`;
  const wellbeingBody =
    override ||
    t(stageWellbeingKey) ||
    excerpt(t(`${ns}.visit_body.${ref}`)) ||
    t('home.cards.wellbeing_placeholder');

  // 2. Danger: stage-specific danger flags
  const stageDangerKey = ns === 'pnc' ? 'home.cards.danger_pnc_body' : 'home.cards.danger_anc_body';
  const dangerBody = t(stageDangerKey) || t('home.cards.danger_generic_body');

  return { stageKey, wellbeingBody, dangerBody };
}
