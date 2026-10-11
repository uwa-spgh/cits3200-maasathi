/**
 * Reading a sentence that contains a date from recorded pieces.
 *
 * "You have your first ANC visit on 11th of October" has no recording of its own (the date
 * changes), so it is played as: the words before the date, the day, the month, the words after.
 * Each piece is a short clip the generator makes once; any date is then a combination of them.
 *
 * Pure and import-free, shared by the Home page and the audio generator (scripts/audio).
 */

/** Stands in for the date while a translation is split around it. */
export const DATE_MARK = '\u0000';

export interface DayMonthParts {
  /** "11th of" (en) / "১১" (bn). Depends only on the day. */
  day: string;
  /** "October" (en) / "অক্টোবর" (bn). Depends only on the month. */
  month: string;
}

function ordinalSuffix(day: number): string {
  if (day >= 11 && day <= 13) return 'th';
  switch (day % 10) {
    case 1:
      return 'st';
    case 2:
      return 'nd';
    case 3:
      return 'rd';
    default:
      return 'th';
  }
}

/** The day and month of an ISO date as they are spoken, matching formatDayMonthLong's wording. */
export function dayMonthSpeechParts(iso: string, locale: string): DayMonthParts {
  const [y, m, d] = iso.split('-').map((n) => Number(n));
  const date = new Date(y, (m ?? 1) - 1, d ?? 1);
  if (locale === 'bn') {
    const parts = new Intl.DateTimeFormat('bn-BD', { day: 'numeric', month: 'long' }).formatToParts(date);
    return {
      day: parts.find((p) => p.type === 'day')?.value ?? '',
      month: parts.find((p) => p.type === 'month')?.value ?? ''
    };
  }
  return {
    day: `${d ?? 1}${ordinalSuffix(d ?? 1)} of`,
    month: date.toLocaleDateString('en-GB', { month: 'long' })
  };
}

/**
 * The pieces to play for a sentence built from a translation with a `{date}` placeholder:
 * pass the translation rendered with `date: DATE_MARK`. Empty pieces (a date at the very start or
 * end of the sentence) are dropped.
 */
export function segmentsAroundDate(rendered: string, iso: string, locale: string): string[] {
  const [before = '', after = ''] = rendered.split(DATE_MARK);
  const { day, month } = dayMonthSpeechParts(iso, locale);
  return [before, day, month, after].map((piece) => piece.trim()).filter((piece) => piece !== '');
}
