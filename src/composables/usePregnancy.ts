import { computed, ref } from 'vue';
import {
  childRepo,
  pregnancyRepo,
  scheduleRepo,
  ttHistoryRepo
} from '../db/database';
import { uuid, type CareMode, type Pregnancy } from '../db/schemas';
import { cancelAllReminders } from '../services/notifications';
import { PNC_CONTACT_OFFSET_DAYS, addDaysIso, eddFromLmp, gestationalWeek, isoToLocalDate, lmpFromEdd, postpartumDays, todayIso } from '../utils/date';
import { regenerateSchedule, useSchedule } from './useSchedule';

const PNC_END_DAY = PNC_CONTACT_OFFSET_DAYS['contact4'];

const activePregnancy = ref<Pregnancy | null>(null);
const pastPregnancies = ref<Pregnancy[]>([]);
const loaded = ref(false);

export function usePregnancy() {
  const mode = computed<CareMode>(() =>
    activePregnancy.value?.deliveryDate ? 'PNC' : 'ANC'
  );

  const currentWeek = computed<number | null>(() => {
    const p = activePregnancy.value;
    if (!p) return null;
    if (mode.value === 'ANC') {
      const lmp = p.lmp ?? null;
      if (!lmp) return null;
      return gestationalWeek(lmp);
    }
    return null;
  });

  const postpartumDay = computed<number | null>(() => {
    const p = activePregnancy.value;
    if (!p?.deliveryDate) return null;
    return postpartumDays(p.deliveryDate);
  });

  async function load(): Promise<void> {
    await checkArchive();
    activePregnancy.value = await pregnancyRepo.active();
    pastPregnancies.value = (await pregnancyRepo.all())
      .filter((p) => p.status === 'archived')
      .sort((a, b) => (a.archivedAt ?? '').localeCompare(b.archivedAt ?? ''));
    loaded.value = true;
  }

  async function checkArchive(): Promise<void> {
    const active = await pregnancyRepo.active();
    if (!active?.deliveryDate) return;
    const archiveOn = addDaysIso(active.deliveryDate, PNC_END_DAY);
    if (todayIso() > archiveOn) {
      await archive(active.id);
    }
  }

  async function archive(pregnancyId: string): Promise<void> {
    const p = await pregnancyRepo.byId(pregnancyId);
    if (!p) return;
    const items = await scheduleRepo.byPregnancy(pregnancyId);
    await cancelAllReminders(items.filter((i) => i.status === 'upcoming'));
    // Schedule items are deliberately KEPT so the archived pregnancy's
    // appointment record remains viewable in the history section.
    p.status = 'archived';
    p.archivedAt = new Date().toISOString();
    await pregnancyRepo.save(p);
    await ttHistoryRepo.save({
      ...(await ttHistoryRepo.get() ?? defaultTt()),
      currentPregnancyDoseDate: null,
      nextDueDate: null,
      updatedAt: new Date().toISOString()
    });
  }

  function defaultTt() {
    return {
      id: 'primary',
      cardAvailable: false,
      status: 'not_asked' as const,
      dosesReceived: null,
      lastDoseDate: null,
      currentPregnancyDoseDate: null,
      nextDueDate: null,
      updatedAt: new Date().toISOString()
    };
  }

  async function registerPregnancy(input: Partial<Pregnancy>): Promise<Pregnancy> {
    const existing = await pregnancyRepo.active();
    if (existing) {
      // Only re-derive the date source and weeks when the mother actually changed a date,
      // so an unrelated edit does not overwrite what was recorded at registration.
      const datesChanged =
        (input.lmp !== undefined && input.lmp !== existing.lmp) ||
        (input.edd !== undefined && input.edd !== existing.edd) ||
        (input.dateSource !== undefined && input.dateSource !== existing.dateSource);
      Object.assign(existing, input);
      if (datesChanged) applyDateSource(existing, input);
      await pregnancyRepo.save(existing);
      activePregnancy.value = existing;
      await regenerateSchedule(existing);
      return existing;
    }
    const pregnancy: Pregnancy = {
      id: uuid(),
      lmp: input.lmp ?? null,
      edd: input.edd ?? null,
      dateSource: 'unspecified',
      pregnancyWeeksAtRegistration: null,
      gravida: input.gravida ?? null,
      parity: input.parity ?? null,
      previousOutcomes: input.previousOutcomes ?? '',
      previousCaesarean: input.previousCaesarean ?? false,
      pregnancyType: input.pregnancyType ?? '',
      highRisk: input.highRisk ?? false,
      registeredAt: new Date().toISOString(),
      deliveryDate: null,
      deliveryPlace: '',
      deliveryMode: 'unspecified',
      birthOutcome: 'unspecified',
      complications: '',
      postnatalDangerSigns: '',
      breastfeedingInitiated: false,
      status: 'active',
      archivedAt: null,
      notes: ''
    };
    applyDateSource(pregnancy, input);
    await pregnancyRepo.save(pregnancy);
    activePregnancy.value = pregnancy;
    await regenerateSchedule(pregnancy);
    return pregnancy;
  }

  /**
   * Requirements Table 1: record which date the mother supplied
   * (LMP or EDD) and the gestational week at registration. When both are
   * given, input.dateSource (the field the mother last typed) decides; otherwise LMP wins.
   */
  function applyDateSource(target: Pregnancy, input: Partial<Pregnancy>): void {
    const source =
      input.dateSource === 'edd' && input.edd ? 'edd'
        : input.dateSource === 'lmp' && input.lmp ? 'lmp'
          : input.lmp ? 'lmp'
            : input.edd ? 'edd'
              : null;
    const registeredOn = isoToLocalDate(target.registeredAt);
    if (source === 'lmp' && input.lmp) {
      target.dateSource = 'lmp';
      target.lmp = input.lmp;
      target.edd = eddFromLmp(input.lmp);
      target.pregnancyWeeksAtRegistration = clampWeeks(gestationalWeek(input.lmp, registeredOn));
    } else if (source === 'edd' && input.edd) {
      const derivedLmp = lmpFromEdd(input.edd);
      target.dateSource = 'edd';
      target.edd = input.edd;
      target.lmp = derivedLmp;
      target.pregnancyWeeksAtRegistration = clampWeeks(gestationalWeek(derivedLmp, registeredOn));
    }
  }

  function clampWeeks(week: number): number {
    return Math.min(42, Math.max(0, week));
  }

  async function registerBirth(
    pregnancyId: string,
    details: {
      deliveryDate: string;
      deliveryPlace: string;
      deliveryMode: Pregnancy['deliveryMode'];
      birthOutcome: Pregnancy['birthOutcome'];
      babySex?: string;
      breastfeedingInitiated?: boolean;
      complications?: string;
      postnatalDangerSigns?: string;
    }
  ): Promise<void> {
    const p = await pregnancyRepo.byId(pregnancyId);
    if (!p) return;
    p.deliveryDate = details.deliveryDate;
    p.deliveryPlace = details.deliveryPlace;
    p.deliveryMode = details.deliveryMode;
    p.birthOutcome = details.birthOutcome;
    if (details.complications !== undefined) p.complications = details.complications;
    if (details.postnatalDangerSigns !== undefined) p.postnatalDangerSigns = details.postnatalDangerSigns;
    if (details.breastfeedingInitiated !== undefined) p.breastfeedingInitiated = details.breastfeedingInitiated;
    await pregnancyRepo.save(p);
    // Re-saving a birth (e.g. after clearing and re-entering the delivery date) updates the
    // existing child rather than adding a second one.
    const existingChild = await childRepo.byPregnancy(p.id);
    await childRepo.save({
      id: existingChild?.id ?? uuid(),
      pregnancyId: p.id,
      dob: details.deliveryDate,
      sex: details.babySex ?? existingChild?.sex ?? '',
      notes: existingChild?.notes ?? ''
    });
    activePregnancy.value = p;
    await regenerateSchedule(p);
  }

  async function closePregnancyEarly(pregnancyId: string): Promise<void> {
    await archive(pregnancyId);
    activePregnancy.value = null;
    pastPregnancies.value = (await pregnancyRepo.all()).filter((p) => p.status === 'archived');
    // Drop the closed pregnancy's reminders from the in-memory schedule, so
    // Home and Reminders stop showing them without a reload
    await useSchedule().load();
  }

  async function refresh(): Promise<void> {
    await load();
  }

  return {
    activePregnancy,
    pastPregnancies,
    loaded,
    mode,
    currentWeek,
    postpartumDay,
    load,
    refresh,
    registerPregnancy,
    registerBirth,
    closePregnancyEarly
  };
}
