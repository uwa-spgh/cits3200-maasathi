import { computed, ref } from 'vue';
import { childRepo, pregnancyRepo, scheduleRepo, ttDoseRepo, visitTrackingRepo } from '../db/database';
import type { Child, Pregnancy, ScheduleItem, VisitTracking } from '../db/schemas';
import { formatDate } from '../utils/date';
import { useTt } from './useTt';

export interface PregnancySummary {
  pregnancy: Pregnancy;
  child: Child | null;
  schedule: ScheduleItem[];
  visitTracking: VisitTracking[];
  ttDoses: number;
  ancCompleted: number;
  pncCompleted: number;
  lmpDisplay: string;
  eddDisplay: string;
  deliveryDisplay: string;
  archivedDisplay: string;
}

const summaries = ref<Map<string, PregnancySummary>>(new Map());

export function useHistory() {
  const historyList = computed<PregnancySummary[]>(() =>
    Array.from(summaries.value.values()).sort((a, b) =>
      (b.pregnancy.archivedAt ?? '').localeCompare(a.pregnancy.archivedAt ?? '')
    )
  );

  async function loadAll(): Promise<void> {
    const { lifetimeDoseCount } = useTt();
    void lifetimeDoseCount;
    const archived = (await pregnancyRepo.all()).filter((p) => p.status === 'archived');
    const map = new Map<string, PregnancySummary>();
    for (const pregnancy of archived) {
      map.set(pregnancy.id, await buildSummary(pregnancy));
    }
    summaries.value = map;
  }

  async function buildSummary(pregnancy: Pregnancy): Promise<PregnancySummary> {
    const [child, schedule, doseLog, tracking] = await Promise.all([
      childRepo.byPregnancy(pregnancy.id),
      scheduleRepo.byPregnancy(pregnancy.id),
      ttDoseRepo.all(),
      visitTrackingRepo.byPregnancy(pregnancy.id)
    ]);
    return {
      pregnancy,
      child,
      schedule: [...schedule].sort((a, b) => a.dueDate.localeCompare(b.dueDate)),
      visitTracking: [...tracking].sort((a, b) => a.ref.localeCompare(b.ref)),
      ttDoses: doseLog.filter((d) => d.pregnancyId === pregnancy.id).length,
      ancCompleted: schedule.filter((s) => s.type === 'ANC' && s.status === 'completed').length,
      pncCompleted: schedule.filter((s) => s.type === 'PNC' && s.status === 'completed').length,
      lmpDisplay: formatDate(pregnancy.lmp),
      eddDisplay: formatDate(pregnancy.edd),
      deliveryDisplay: formatDate(pregnancy.deliveryDate),
      archivedDisplay: pregnancy.archivedAt ? formatDate(pregnancy.archivedAt.slice(0, 10)) : ''
    };
  }

  async function loadOne(pregnancyId: string): Promise<PregnancySummary | null> {
    const cached = summaries.value.get(pregnancyId);
    if (cached) return cached;
    const pregnancy = await pregnancyRepo.byId(pregnancyId);
    if (!pregnancy) return null;
    const summary = await buildSummary(pregnancy);
    summaries.value.set(pregnancyId, summary);
    return summary;
  }

  return {
    historyList,
    loadAll,
    loadOne
  };
}
