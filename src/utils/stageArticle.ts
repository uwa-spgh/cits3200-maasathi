import type { CareMode, ScheduleItem } from '../db/schemas';

/** The care reference matching the stage the mother is in right now:
 *  the earliest non-completed ANC visit (or PNC contact in PNC mode). */
export function currentStageRef(
  items: ScheduleItem[],
  mode: CareMode
): { ns: 'anc' | 'pnc'; ref: string } | null {
  const type = mode === 'PNC' ? 'PNC' : 'ANC';
  const next = items
    .filter((i) => i.type === type && i.status !== 'completed')
    .sort((a, b) => a.dueDate.localeCompare(b.dueDate))[0];
  if (!next) return null;
  return { ns: type === 'PNC' ? 'pnc' : 'anc', ref: next.ref };
}

/** First paragraph block, for card-sized excerpts of long articles. */
export function excerpt(text: string, max = 200): string {
  const block = text
    .split('\n\n')
    .map((s) => s.trim())
    .find((s) => s.length > 0) ?? '';
  return block.length > max ? `${block.slice(0, max).trimEnd()}…` : block;
}
