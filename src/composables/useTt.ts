import { computed, ref } from 'vue';
import { pregnancyRepo, ttDoseRepo, ttHistoryRepo } from '../db/database';
import { uuid, type TtDose, type TtDose as TtDoseType, type TtHistory, type TtStatus } from '../db/schemas';
import { nextDueFromLastDose, todayIso } from '../utils/date';

export const TT_MAX_DOSES = 5;

const history = ref<TtHistory | null>(null);
const doses = ref<TtDoseType[]>([]);
const loaded = ref(false);

function defaultHistory(): TtHistory {
  return {
    id: 'primary',
    cardAvailable: false,
    status: 'not_asked',
    dosesReceived: null,
    lastDoseDate: null,
    currentPregnancyDoseDate: null,
    nextDueDate: null,
    updatedAt: new Date().toISOString()
  };
}

export function useTt() {
  const lifetimeDoseCount = computed<number>(() => {
    if (history.value?.status === 'known' && history.value.dosesReceived !== null) {
      return history.value.dosesReceived;
    }
    if (history.value?.status === 'never') return 0;
    return doses.value.filter((d) => d.dateGiven !== null).length;
  });

  const nextDoseNumber = computed<number | null>(() => {
    const count = lifetimeDoseCount.value;
    if (history.value?.status === 'unknown') return null;
    if (count >= TT_MAX_DOSES) return null;
    return count + 1;
  });

  const isComplete = computed<boolean>(() => lifetimeDoseCount.value >= TT_MAX_DOSES);

  const isUnknown = computed<boolean>(() => history.value?.status === 'unknown');

  /**
   * Next due date per Bangladesh EPI rules:
   * - Unknown history: never guessed (null). Mother confirms with health worker.
   * - Dose 1: as early as possible in the pregnancy.
   * - Later doses: per the lifetime schedule from the date of the last dose
   *   (TT2 +4 weeks, TT3 +6 months, TT4/TT5 +1 year).
   * - Un-datable history (count known but date unknown): null.
   */
  function computeNextDue(pregnancyRegisteredAtIso: string | null): string | null {
    const h = history.value;
    if (!h) return null;
    if (h.status === 'unknown') return null;
    if (lifetimeDoseCount.value >= TT_MAX_DOSES) return null;
    if (h.status === 'never') return pregnancyRegisteredAtIso ? pregnancyRegisteredAtIso.slice(0, 10) : todayIso();
    if (h.lastDoseDate) {
      return nextDueFromLastDose(h.dosesReceived ?? 1, h.lastDoseDate);
    }
    if (h.dosesReceived !== null && h.dosesReceived > 0) return null;
    return pregnancyRegisteredAtIso ? pregnancyRegisteredAtIso.slice(0, 10) : todayIso();
  }

  async function load(): Promise<void> {
    history.value = (await ttHistoryRepo.get()) ?? defaultHistory();
    doses.value = await ttDoseRepo.all();
    loaded.value = true;
  }

  async function saveHistory(patch: Partial<TtHistory>): Promise<void> {
    const base = history.value ?? defaultHistory();
    const updated: TtHistory = { ...base, ...patch, updatedAt: new Date().toISOString() };
    await ttHistoryRepo.save(updated);
    history.value = updated;
  }

  async function setRegistration(input: {
    status: TtStatus;
    dosesReceived: number | null;
    lastDoseDate: string | null;
    cardAvailable: boolean;
  }): Promise<void> {
    const active = await pregnancyRepo.active();
    await saveHistory({
      status: input.status,
      dosesReceived: input.dosesReceived,
      lastDoseDate: input.lastDoseDate,
      cardAvailable: input.cardAvailable,
      nextDueDate: null
    });
    if (input.status === 'known' && input.lastDoseDate && input.dosesReceived !== null && doses.value.length === 0) {
      await ttDoseRepo.save({
        id: uuid(),
        doseNumber: input.dosesReceived,
        dateGiven: input.lastDoseDate,
        pregnancyId: null,
        facility: '',
        recordedAt: new Date().toISOString()
      });
      doses.value = await ttDoseRepo.all();
    }
    void active;
  }

  async function recordDose(dateGiven: string, facility = ''): Promise<void> {
    const h = history.value;
    if (!h) return;
    const active = await pregnancyRepo.active();
    const number = nextDoseNumber.value;
    if (number === null) return;
    await ttDoseRepo.save({
      id: uuid(),
      doseNumber: number,
      dateGiven,
      pregnancyId: active?.id ?? null,
      facility,
      recordedAt: new Date().toISOString()
    });
    doses.value = await ttDoseRepo.all();
    const isLast = number >= TT_MAX_DOSES;
    await saveHistory({
      status: 'known',
      dosesReceived: number,
      lastDoseDate: dateGiven,
      currentPregnancyDoseDate: active ? dateGiven : h.currentPregnancyDoseDate,
      nextDueDate: isLast ? null : nextDueFromLastDose(number, dateGiven)
    });
  }

  async function reset(): Promise<void> {
    await saveHistory(defaultHistory());
    doses.value = await ttDoseRepo.all();
  }

  return {
    history,
    doses,
    loaded,
    lifetimeDoseCount,
    nextDoseNumber,
    isComplete,
    isUnknown,
    computeNextDue,
    load,
    setRegistration,
    recordDose,
    reset
  };
}
