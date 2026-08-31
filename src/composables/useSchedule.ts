import { computed, ref } from 'vue';
import { scheduleRepo } from '../db/database';
import type { Pregnancy, ScheduleItem } from '../db/schemas';
import { t } from '../i18n';
import { cancelItemReminders, scheduleItemReminders } from '../services/notifications';
import { ANC_VISIT_TARGET_WEEKS, PNC_CONTACT_OFFSET_DAYS, addDaysIso, eddFromLmp, todayIso } from '../utils/date';
import { useTt } from './useTt';

const ANC_VISITS = ['visit1', 'visit2', 'visit3', 'visit4'] as const;
const PNC_CONTACTS = ['contact1', 'contact2', 'contact3', 'contact4'] as const;

const items = ref<ScheduleItem[]>([]);
const activePregnancyId = ref<string | null>(null);

function itemId(pregnancyId: string, type: string, refKey: string): string {
  return `${pregnancyId}:${type}:${refKey}`;
}

function desiredItems(pregnancy: Pregnancy, ttNextDue: string | null, ttComplete: boolean, ttUnknown: boolean): ScheduleItem[] {
  const result: ScheduleItem[] = [];
  const isPnc = pregnancy.deliveryDate !== null;

  if (!isPnc) {
    const lmp = pregnancy.lmp ?? null;
    if (lmp) {
      const registeredDate = pregnancy.registeredAt.slice(0, 10);
      for (const visit of ANC_VISITS) {
        const dueDate =
          visit === 'visit1'
            ? registeredDate
            : addDaysIso(lmp, ANC_VISIT_TARGET_WEEKS[visit] * 7);
        result.push({
          id: itemId(pregnancy.id, 'ANC', visit),
          pregnancyId: pregnancy.id,
          type: 'ANC',
          ref: visit,
          titleKey: `timeline.anc.${visit}`,
          dueDate,
          status: 'upcoming',
          completedAt: null
        });
      }
      result.push({
        id: itemId(pregnancy.id, 'MILESTONE', 'edd'),
        pregnancyId: pregnancy.id,
        type: 'MILESTONE',
        ref: 'edd',
        titleKey: 'timeline.milestone.edd',
        dueDate: eddFromLmp(lmp),
        status: 'upcoming',
        completedAt: null
      });
    }
    if (ttNextDue && !ttComplete && !ttUnknown) {
      result.push({
        id: itemId(pregnancy.id, 'TT', 'next'),
        pregnancyId: pregnancy.id,
        type: 'TT',
        ref: 'next',
        titleKey: 'timeline.tt.next',
        dueDate: ttNextDue,
        status: 'upcoming',
        completedAt: null
      });
    }
  } else {
    const delivery = pregnancy.deliveryDate as string;
    for (const contact of PNC_CONTACTS) {
      result.push({
        id: itemId(pregnancy.id, 'PNC', contact),
        pregnancyId: pregnancy.id,
        type: 'PNC',
        ref: contact,
        titleKey: `timeline.pnc.${contact}`,
        dueDate: addDaysIso(delivery, PNC_CONTACT_OFFSET_DAYS[contact]),
        status: 'upcoming',
        completedAt: null
      });
    }
    result.push({
      id: itemId(pregnancy.id, 'MILESTONE', 'child_epi_start'),
      pregnancyId: pregnancy.id,
      type: 'MILESTONE',
      ref: 'child_epi_start',
      titleKey: 'timeline.milestone.child_epi_start',
      dueDate: addDaysIso(delivery, PNC_CONTACT_OFFSET_DAYS['contact4']),
      status: 'upcoming',
      completedAt: null
    });
  }
  return result;
}

/**
 * Regenerates the active pregnancy's schedule. Existing completion state is
 * preserved by matching on type + ref. Upcoming items get 7/3/1/0-day
 * notifications scheduled.
 */
export async function regenerateSchedule(pregnancy: Pregnancy): Promise<void> {
  const { computeNextDue, isComplete, isUnknown } = useTt();
  const existing = await scheduleRepo.byPregnancy(pregnancy.id);
  const completionByKey = new Map<string, ScheduleItem>();
  for (const item of existing) {
    completionByKey.set(`${item.type}:${item.ref}`, item);
  }

  const ttNextDue = computeNextDue(pregnancy.registeredAt);
  const desired = desiredItems(pregnancy, ttNextDue, isComplete.value, isUnknown.value);

  const staleIds = new Set(existing.map((e) => e.id).filter((id) => !desired.some((d) => d.id === id)));
  for (const staleId of staleIds) {
    const stale = existing.find((e) => e.id === staleId);
    if (stale) await cancelItemReminders(stale);
  }
  for (const id of staleIds) {
    const stale = existing.find((e) => e.id === id);
    if (stale) await scheduleRepo.remove(stale);
  }

  const merged: ScheduleItem[] = desired.map((item) => {
    const prev = completionByKey.get(`${item.type}:${item.ref}`);
    if (prev) {
      return { ...item, status: prev.status, completedAt: prev.completedAt };
    }
    return item;
  });

  await scheduleRepo.upsertAll(merged);

  for (const item of merged) {
    if (item.status === 'upcoming' && item.dueDate >= todayIso()) {
      await scheduleItemReminders(
        item,
        t('notification.title'),
        t(item.titleKey)
      );
    }
  }

  items.value = merged.sort((a, b) => a.dueDate.localeCompare(b.dueDate));
  activePregnancyId.value = pregnancy.id;
}

async function load(): Promise<void> {
  const id = activePregnancyId.value;
  if (!id) return;
  items.value = (await scheduleRepo.byPregnancy(id)).sort((a, b) => a.dueDate.localeCompare(b.dueDate));
}

async function markCompleted(item: ScheduleItem): Promise<void> {
  await cancelItemReminders(item);
  item.status = 'completed';
  item.completedAt = new Date().toISOString();
  await scheduleRepo.upsertAll([{ ...item }]);
  await load();
}

async function markUpcoming(item: ScheduleItem): Promise<void> {
  item.status = 'upcoming';
  item.completedAt = null;
  await scheduleRepo.upsertAll([{ ...item }]);
  if (item.dueDate >= todayIso()) {
    await scheduleItemReminders(item, t('notification.title'), t(item.titleKey));
  }
  await load();
}

export function useSchedule() {
  const upcoming = computed<ScheduleItem[]>(() =>
    items.value.filter((i) => i.status === 'upcoming').sort((a, b) => a.dueDate.localeCompare(b.dueDate))
  );

  const past = computed<ScheduleItem[]>(() =>
    items.value
      .filter((i) => i.status === 'completed' || i.dueDate < todayIso())
      .sort((a, b) => b.dueDate.localeCompare(a.dueDate))
  );

  return {
    items,
    upcoming,
    past,
    load,
    regenerateSchedule,
    markCompleted,
    markUpcoming
  };
}
