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
  const [y, m, d] = iso.split('-').map((n) => Number(n));
  const date = new Date(y, (m ?? 1) - 1, d ?? 1);
  return date.toLocaleDateString(locale === 'bn' ? 'bn-BD' : 'en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  });
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
