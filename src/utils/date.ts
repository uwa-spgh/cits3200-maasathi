export function toIsoDate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export function todayIso(): string {
  return toIsoDate(new Date());
}

export function addDaysIso(iso: string, days: number): string {
  const [y, m, d] = iso.split('-').map((n) => Number(n));
  const date = new Date(y, (m ?? 1) - 1, d ?? 1);
  date.setDate(date.getDate() + days);
  return toIsoDate(date);
}

export function addMonthsIso(iso: string, months: number): string {
  const [y, m, d] = iso.split('-').map((n) => Number(n));
  const date = new Date(y, (m ?? 1) - 1, d ?? 1);
  const day = date.getDate();
  date.setDate(1);
  date.setMonth(date.getMonth() + months);
  const daysInTargetMonth = new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  date.setDate(Math.min(day, daysInTargetMonth));
  return toIsoDate(date);
}

export function daysBetween(fromIso: string, toIsoB: string): number {
  const [fy, fm, fd] = fromIso.split('-').map((n) => Number(n));
  const [ty, tm, td] = toIsoB.split('-').map((n) => Number(n));
  const from = new Date(fy, (fm ?? 1) - 1, fd ?? 1);
  const to = new Date(ty, (tm ?? 1) - 1, td ?? 1);
  return Math.round((to.getTime() - from.getTime()) / 86400000);
}

export const PREGNANCY_DURATION_DAYS = 280;

export function eddFromLmp(lmpIso: string): string {
  return addDaysIso(lmpIso, PREGNANCY_DURATION_DAYS);
}

export function lmpFromEdd(eddIso: string): string {
  return addDaysIso(eddIso, -PREGNANCY_DURATION_DAYS);
}

export interface DateBounds {
  min: string;
  max: string;
}

/** A typed LMP can be up to 300 days back and never in the future. */
export function lmpBounds(today: string = todayIso()): DateBounds {
  return { min: addDaysIso(today, -300), max: today };
}

/** A typed EDD can be up to 30 days overdue and up to 300 days ahead. */
export function eddBounds(today: string = todayIso()): DateBounds {
  return { min: addDaysIso(today, -30), max: addDaysIso(today, 300) };
}

export function isWithinBounds(iso: string, bounds: DateBounds): boolean {
  return iso >= bounds.min && iso <= bounds.max;
}

/**
 * The local calendar date (YYYY-MM-DD) for a stored value. Plain dates pass
 * through; full ISO timestamps (UTC, from toISOString) are converted to local
 * time so that a late-evening UTC value is not shown as the next day.
 */
export function isoToLocalDate(iso: string): string {
  return iso.length === 10 ? iso : toIsoDate(new Date(iso));
}

export function gestationalWeek(lmpIso: string, onIso: string = todayIso()): number {
  const days = daysBetween(lmpIso, onIso);
  return Math.floor(days / 7) + 1;
}

export function postpartumDays(deliveryIso: string, onIso: string = todayIso()): number {
  return Math.max(0, daysBetween(deliveryIso, onIso));
}

/**
 * Bangladesh EPI 5-dose lifetime Td schedule (Table A): TT2 is due at least
 * 4 weeks after TT1, TT3 six months after TT2, and TT4/TT5 one year after the
 * previous dose. The interval follows the dose just received, regardless of
 * which pregnancy it was given in.
 */
export function nextDueFromLastDose(lastDoseNumber: number, lastDoseDateIso: string): string {
  if (lastDoseNumber <= 1) return addDaysIso(lastDoseDateIso, 28);
  if (lastDoseNumber === 2) return addMonthsIso(lastDoseDateIso, 6);
  return addMonthsIso(lastDoseDateIso, 12);
}

export function formatDate(iso: string | null | undefined, locale = 'en'): string {
  if (!iso) return '';
  // Accept full ISO timestamps (e.g. completedAt) as well as plain YYYY-MM-DD.
  const [y, m, d] = iso.slice(0, 10).split('-').map((n) => Number(n));
  const date = new Date(y, (m ?? 1) - 1, d ?? 1);
  return date.toLocaleDateString(locale === 'bn' ? 'bn-BD' : 'en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  });
}

/** "31 Feb" / "৩১ ফেব্রু" — short day+month, no year. */
export function formatDayMonthShort(iso: string, locale = 'en'): string {
  const [y, m, d] = iso.split('-').map((n) => Number(n));
  const date = new Date(y, (m ?? 1) - 1, d ?? 1);
  return date.toLocaleDateString(locale === 'bn' ? 'bn-BD' : 'en-GB', {
    day: 'numeric',
    month: 'short'
  });
}

/** "31st of February" (en) / "৩১ ফেব্রুয়ারি" (bn) — built from Intl parts, no hardcoded words. */
export function formatDayMonthLong(iso: string, locale = 'en'): string {
  const [y, m, d] = iso.split('-').map((n) => Number(n));
  const date = new Date(y, (m ?? 1) - 1, d ?? 1);
  if (locale === 'bn') {
    return date.toLocaleDateString('bn-BD', { day: 'numeric', month: 'long' });
  }
  const month = date.toLocaleDateString('en-GB', { month: 'long' });
  return `${d ?? 1}${ordinalSuffix(d ?? 1)} of ${month}`;
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

/**
 * Bangladesh's national 4-visit focused ANC schedule. Visit 1 has no week
 * target here: the guideline is "before 16 weeks, as early as possible", so
 * it is scheduled on the registration date (see useSchedule.ts). Visits 2-4
 * target the middle/deadline week of their windows.
 */
export const ANC_VISIT_TARGET_WEEKS: Record<string, number> = {
  visit2: 26,
  visit3: 32,
  visit4: 36
};

export const PNC_CONTACT_OFFSET_DAYS: Record<string, number> = {
  contact1: 0,
  contact2: 2,
  contact3: 10,
  contact4: 42
};