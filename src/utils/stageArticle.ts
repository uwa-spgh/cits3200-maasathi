import type { CareMode, ScheduleItem } from '../db/schemas';

export interface NowTopic {
  ns: 'anc' | 'pnc';
  key: string;
  points: number;
}

/** Stage topics without nutrition (nutrition is kept separate in the Nutrition section) */
export const STAGE_NOW_TOPICS: Record<string, NowTopic[]> = {
  'ANC:visit1': [
    { ns: 'anc', key: 'early_care', points: 2 },
    { ns: 'anc', key: 'iron_folic_acid', points: 2 },
    { ns: 'anc', key: 'hydration_rest', points: 2 }
  ],
  'ANC:visit2': [
    { ns: 'anc', key: 'iron_folic_acid', points: 2 },
    { ns: 'anc', key: 'calcium_supplementation', points: 2 },
    { ns: 'anc', key: 'pre_eclampsia_monitoring', points: 1 }
  ],
  'ANC:visit3': [
    { ns: 'anc', key: 'iron_folic_acid', points: 2 },
    { ns: 'anc', key: 'calcium_supplementation', points: 2 },
    { ns: 'anc', key: 'birth_preparedness', points: 2 },
    { ns: 'anc', key: 'mental_wellbeing', points: 2 }
  ],
  'ANC:visit4': [
    { ns: 'anc', key: 'preparing_baby_care', points: 2 },
    { ns: 'anc', key: 'skilled_birth_care', points: 2 },
    { ns: 'anc', key: 'avoid_harmful_substances', points: 2 },
    { ns: 'anc', key: 'hygiene_infection_prevention', points: 2 }
  ],
  'PNC:contact1': [
    { ns: 'pnc', key: 'rest', points: 1 },
    { ns: 'pnc', key: 'bleeding', points: 1 }
  ],
  'PNC:contact2': [
    { ns: 'pnc', key: 'pain', points: 1 },
    { ns: 'pnc', key: 'cleanliness', points: 1 }
  ],
  'PNC:contact3': [
    { ns: 'pnc', key: 'cleanliness', points: 1 },
    { ns: 'pnc', key: 'checkup', points: 1 },
    { ns: 'pnc', key: 'mood', points: 1 }
  ],
  'PNC:contact4': [
    { ns: 'pnc', key: 'checkup', points: 1 },
    { ns: 'pnc', key: 'family_planning', points: 1 },
    { ns: 'pnc', key: 'mood', points: 1 }
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
  nutritionBody: string;
  dangerBody: string;
} {
  const stage = currentStageRef(items, mode);
  if (!stage) {
    return {
      stageKey: null,
      wellbeingBody: t('home.cards.wellbeing_placeholder'),
      nutritionBody: t('home.cards.nutrition_body') || t('content.empty'),
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

  // 2. Nutrition: stage-specific nutrition tip or general nutrition body
  const stageNutritionKey = ns === 'pnc' ? 'home.cards.nutrition_pnc' : `home.cards.nutrition_anc_${ref}`;
  const nutritionBody =
    t(stageNutritionKey) ||
    t('home.cards.nutrition_body') ||
    t('content.empty');

  // 3. Danger: stage-specific danger flags
  const stageDangerKey = ns === 'pnc' ? 'home.cards.danger_pnc_body' : 'home.cards.danger_anc_body';
  const dangerBody = t(stageDangerKey) || t('home.cards.danger_generic_body');

  return { stageKey, wellbeingBody, nutritionBody, dangerBody };
}
