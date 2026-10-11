/**
 * Works out every fixed string the app can read aloud, in each language.
 *
 * Each section below mirrors how a page assembles the text it passes to its
 * Listen button (title + points, chunked to the same word budget), so the
 * resulting strings hash to the same clip ids the app asks for at runtime.
 * When a page changes how it builds its spoken text, change it here too; the
 * dev-only "no clip" warning in the app shows when the two drift apart.
 *
 * Dynamic text (the reminder card's date, the tetanus tracker's dose counts)
 * has no fixed string and is deliberately not collected: it keeps using the
 * device voice.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { chunkPoints, chunkSentences, speechText } from '../../src/utils/speechChunks.ts';
import { excerpt, NEW_PREGNANCY_TOPIC, REGISTER_BIRTH_TOPIC, STAGE_NOW_TOPICS } from '../../src/utils/stageArticle.ts';
import type { NowTopic } from '../../src/utils/stageArticle.ts';
import {
  ANC_TOPICS,
  CHILD_VACCINE_TOPICS,
  DANGER_SIGN_GROUPS,
  NUTRITION_TOPICS,
  ONBOARDING_SPEECH,
  PNC_BREASTFEEDING_TOPICS,
  PNC_ROUTINE_CARE_TOPICS,
  PNC_TOPICS,
  TETANUS_TOPICS,
  TRIMESTER_DANGER_SIGN_COUNT,
  TRIMESTER_VISITS
} from '../../src/content/topics.ts';
import type { TopicDef } from '../../src/content/topics.ts';

export const LOCALES = ['en', 'bn'] as const;
export type Locale = (typeof LOCALES)[number];

export interface Speakable {
  locale: Locale;
  text: string;
  /** Where the text is shown, for review ("Information > ANC: early_care"). */
  sources: string[];
}

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');

type Messages = Record<string, unknown>;
const messages: Record<Locale, Messages> = {
  en: JSON.parse(fs.readFileSync(path.join(root, 'src/locales/en.json'), 'utf8')),
  bn: JSON.parse(fs.readFileSync(path.join(root, 'src/locales/bn.json'), 'utf8'))
};

/** Same default word budget ListenList / ListenText use. */
const MAX_WORDS = 45;
/** Bullet markers are shown on screen but not read aloud (see ListenText). */
const BULLET = /^[•◦▪*-]\s*/;

export function collect(): { speakables: Speakable[]; missingKeys: string[] } {
  const found = new Map<string, Speakable>();
  const missing = new Set<string>();

  for (const locale of LOCALES) {
    const lookup = (key: string): string => {
      const value = key.split('.').reduce<unknown>(
        (node, part) => (node && typeof node === 'object' ? (node as Messages)[part] : undefined),
        messages[locale]
      );
      if (typeof value !== 'string') {
        missing.add(`${locale}: ${key}`);
        return '';
      }
      return value;
    };

    const add = (text: string, source: string): void => {
      if (text.trim() === '') return;
      const id = `${locale}\u0000${text}`;
      const existing = found.get(id);
      if (existing) {
        if (!existing.sources.includes(source)) existing.sources.push(source);
      } else {
        found.set(id, { locale, text, sources: [source] });
      }
    };

    /** A ListenList: optional title, then points, chunked. */
    const addList = (title: string | undefined, points: string[], source: string): void => {
      chunkPoints(points, MAX_WORDS).forEach((chunk, i) => add(speechText(i === 0 ? title : undefined, chunk), source));
    };

    /** A ListenText: optional title, then prose, chunked by sentence. */
    const addProse = (title: string | undefined, body: string, source: string): void => {
      chunkSentences(body, MAX_WORDS).forEach((part, i) =>
        add(speechText(i === 0 ? title : undefined, part.split('\n').map((line) => line.replace(BULLET, ''))), source)
      );
    };

    const topicPoints = (ns: string, topic: { key: string; points: number }): string[] =>
      Array.from({ length: topic.points }, (_, i) => lookup(`${ns}.${topic.key}.point${i + 1}`));

    const addTopics = (ns: string, topics: TopicDef[], source: string): void => {
      for (const topic of topics) {
        if (topic.route) continue;
        addList(lookup(`${ns}.${topic.key}_title`), topicPoints(ns, topic), `${source}: ${topic.key}`);
      }
    };

    // --- Information pages ---
    addTopics('anc', ANC_TOPICS, 'Information > ANC');
    addTopics('pnc', PNC_TOPICS, 'Information > PNC');
    addTopics('pnc', PNC_ROUTINE_CARE_TOPICS, 'PNC > routine baby care');
    addTopics('pnc', PNC_BREASTFEEDING_TOPICS, 'PNC > breastfeeding');
    addTopics('pnc', CHILD_VACCINE_TOPICS, 'Vaccination > child');
    addTopics('tt', TETANUS_TOPICS, 'Vaccination > tetanus');

    // "What to know right now" topics (Information hub and the stage page) reuse the topic text.
    for (const [stage, topics] of Object.entries(STAGE_NOW_TOPICS)) {
      for (const topic of topics) {
        if (topic.route) continue;
        addList(lookup(`${topic.ns}.${topic.key}_title`), topicPoints(topic.ns, topic), `Stage ${stage}: ${topic.key}`);
      }
    }

    // --- Danger signs (also shown on the emergency page) ---
    for (const group of DANGER_SIGN_GROUPS) {
      const signs = Array.from({ length: group.count }, (_, i) => lookup(`danger_signs.${group.key}.signs.sign${i + 1}`));
      addList(lookup(`danger_signs.${group.key}.title`), signs, `Danger signs: ${group.key}`);
    }
    add(lookup('danger_signs.seek_care_note'), 'Danger signs: note');

    // --- ANC trimester pages ---
    const pregnancySigns = Array.from({ length: TRIMESTER_DANGER_SIGN_COUNT }, (_, i) =>
      lookup(`danger_signs.pregnancy.signs.sign${i + 1}`)
    );
    addList(lookup('danger_signs.section_title'), pregnancySigns, 'ANC trimester: danger signs');
    for (const visit of new Set(Object.values(TRIMESTER_VISITS).flat())) {
      addProse(lookup(`anc.visits.${visit}`), lookup(`anc.visit_body.${visit}`), `ANC trimester: ${visit}`);
    }
    addProse(lookup('nutrition.section_title'), lookup('anc.nutrition_body'), 'ANC trimester: nutrition');
    addProse(lookup('anc.tests_title'), lookup('anc.tests_body'), 'ANC trimester: tests');

    // --- Nutrition page: one button per card, reading the card as displayed ---
    for (const topic of NUTRITION_TOPICS) {
      const title = lookup(`nutrition.topics.${topic}`).trim();
      const lines = lookup(`nutrition.body.${topic}`)
        .trim()
        .split('\n')
        .map((line) => line.trim().replace(/^[•\-*]\s*/, ''))
        .filter((line) => line.length > 0);
      if (lines[0] === title) lines.shift();
      if (lines.length > 0) add(speechText(title, lines), `Nutrition: ${topic}`);
    }

    // --- Home and stage summaries ---
    const stageRefs = [
      ...['visit1', 'visit2', 'visit3', 'visit4'].map((ref) => ({ mode: 'anc', ref })),
      ...['contact1', 'contact2', 'contact3', 'contact4'].map((ref) => ({ mode: 'pnc', ref }))
    ];
    for (const { mode, ref } of stageRefs) {
      const summary = lookup(`home.cards.stage_${mode}_${ref}`);
      add(summary, `Home / stage summary: ${mode} ${ref}`);
      // The stage page splits a long overview into parts, each read via speechText.
      if (chunkSentences(summary, MAX_WORDS).length > 1) addProse(undefined, summary, `Stage summary parts: ${mode} ${ref}`);
    }
    for (const key of [
      'home.no_pregnancy',
      'home.cards.no_reminders',
      'home.cards.wellbeing_placeholder',
      'home.cards.journey_complete',
      'home.cards.journey_ended_early',
      'home.cards.after_birth_congrats',
      'home.cards.child_epi_stage'
    ]) {
      add(lookup(key), `Home: ${key}`);
    }

    // "What to know right now" widget: the short excerpt shown on the Home card.
    const nowTopics: NowTopic[] = [...Object.values(STAGE_NOW_TOPICS).flat(), NEW_PREGNANCY_TOPIC, REGISTER_BIRTH_TOPIC];
    nowTopics.push({ ns: 'pnc', key: 'childhood_immunisation', points: 9 });
    for (const topic of nowTopics) {
      let text: string;
      if (topic.excerptKey) text = lookup(topic.excerptKey);
      else if (topic.key === 'breastfeeding') text = lookup('pnc.start_early.point1');
      else if (topic.key === 'routine_care') text = lookup('pnc.routine_care_blurb');
      else if (topic.route) text = excerpt(lookup(`${topic.ns}.${topic.key}_body`));
      else text = lookup(`${topic.ns}.${topic.key}.point1`);
      add(text, `Home widget: ${topic.key}`);
    }

    // --- Timeline "what to prepare" panels ---
    for (const key of ['anc.prep.visit1', 'anc.prep.visit2', 'anc.prep.visit3', 'anc.prep.visit4', 'pnc.prep.contact1', 'pnc.prep.contact2', 'pnc.prep.contact3', 'pnc.prep.contact4']) {
      const paragraphs = lookup(key)
        .split('\n')
        .map((p) => p.trim())
        .filter((p) => p.length > 0);
      add(speechText(lookup('timeline.prep_title'), paragraphs), `Timeline prep: ${key}`);
    }

    // --- Birth plan packing lists ---
    const bag = (key: string, count: number): string[] =>
      Array.from({ length: count }, (_, i) => lookup(`profile.${key}.item${i + 1}`));
    addList(lookup('profile.plan_bag_mother_title'), bag('plan_bag_items', 7), 'Birth plan: mother bag');
    addList(lookup('profile.plan_bag_baby_title'), bag('plan_bag_baby_items', 4), 'Birth plan: baby bag');

    // --- Onboarding: each step's Listen button reads its title, then any hint ---
    for (const [step, keys] of Object.entries(ONBOARDING_SPEECH)) {
      const [title, ...rest] = keys.map((key) => lookup(key));
      add(speechText(title, rest), `Onboarding: ${step}`);
    }

    // --- One-off hints next to forms ---
    for (const key of [
      'profile.tt_unknown_hint',
      'profile.date_pair_hint',
      'profile.birth_registration_hint',
      'tt.unknown_banner',
      'tt.bring_epi_card.point1'
    ]) {
      add(lookup(key), `Hint: ${key}`);
    }
  }

  return { speakables: [...found.values()], missingKeys: [...missing] };
}
