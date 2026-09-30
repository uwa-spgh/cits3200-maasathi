/**
 * @vitest-environment jsdom
 */
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { ScheduleItem } from '../db/schemas';
//setting test values
const LMP = '2026-01-01';
const EDD = '2026-10-08';
// runs before each test
//reset cache
beforeEach(() => {
  vi.resetModules();
  localStorage.clear();
});
//import keeps old database
//load fresh returns new pregnancy
async function loadFresh() {
  const { usePregnancy } = await import('./usePregnancy');
  const { useTt } = await import('./useTt');
  const db = await import('../db/database');
  return { usePregnancy, useTt, ...db };
}
//byRef -> look up for given scheduled rows
function byRef(items: ScheduleItem[], type: ScheduleItem['type'], ref: string): ScheduleItem {
  const item = items.find((i) => i.type === type && i.ref === ref);
  if (!item) throw new Error(`missing ${type}/${ref}`);
  return item;
}

describe('pregnancy schedule', () => {
  it('persists ANC visits, EDD, and the next TT date for a known dose', async () => {
    const { usePregnancy, useTt, pregnancyRepo, scheduleRepo, ttHistoryRepo, ttDoseRepo } = await loadFresh();
    const tt = useTt();
    await tt.load();
    await tt.setRegistration({
      status: 'known',
      dosesReceived: 1,
      lastDoseDate: '2026-01-01',
      cardAvailable: true
    });
    //bring it together, fills in pregnancy data  and saves before calling registerateschedule
    const pregnancy = usePregnancy();
    const saved = await pregnancy.registerPregnancy({ lmp: LMP });

    const storedPregnancy = await pregnancyRepo.byId(saved.id);
    const storedHistory = await ttHistoryRepo.get();
    const storedDoses = await ttDoseRepo.all();
    const items = await scheduleRepo.byPregnancy(saved.id);

    expect(storedPregnancy?.status).toBe('active');
    expect(storedPregnancy?.dateSource).toBe('lmp');
    expect(storedPregnancy?.lmp).toBe(LMP);
    expect(storedPregnancy?.edd).toBe(EDD);

    expect(storedHistory?.status).toBe('known');
    expect(storedDoses).toHaveLength(1);

    expect(items.filter((i) => i.type === 'ANC').map((i) => i.ref)).toEqual([
      'visit1',
      'visit2',
      'visit3',
      'visit4'
    ]);
    expect(byRef(items, 'ANC', 'visit1').dueDate).toBe(saved.registeredAt.slice(0, 10));
    expect(byRef(items, 'ANC', 'visit2').dueDate).toBe('2026-07-02'); // LMP + 26 weeks
    expect(byRef(items, 'ANC', 'visit3').dueDate).toBe('2026-08-13'); // LMP + 32 weeks
    expect(byRef(items, 'ANC', 'visit4').dueDate).toBe('2026-09-10'); // LMP + 36 weeks

    expect(byRef(items, 'MILESTONE', 'edd').dueDate).toBe(EDD);
    expect(byRef(items, 'TT', 'next').dueDate).toBe('2026-01-29'); // last dose + 28 days
    expect(items.every((i) => i.status === 'upcoming')).toBe(true);
  });

  it('replaces the ANC timeline with PNC contacts and a child record after birth', async () => {
    const { usePregnancy, pregnancyRepo, childRepo, scheduleRepo } = await loadFresh();

    const pregnancy = usePregnancy();
    const saved = await pregnancy.registerPregnancy({ lmp: LMP });

    await pregnancy.registerBirth(saved.id, {
      deliveryDate: EDD,
      deliveryPlace: 'home',
      deliveryMode: 'vaginal',
      birthOutcome: 'live_birth',
      babySex: 'female'
    });

    const stored = await pregnancyRepo.byId(saved.id);
    const child = await childRepo.byPregnancy(saved.id);
    const items = await scheduleRepo.byPregnancy(saved.id);

    expect(stored?.deliveryDate).toBe(EDD);
    expect(pregnancy.mode.value).toBe('PNC');
    expect(child?.dob).toBe(EDD);

    expect(items.some((i) => i.type === 'ANC')).toBe(false);
    expect(items.filter((i) => i.type === 'PNC').map((i) => i.ref)).toEqual([
      'contact1',
      'contact2',
      'contact3',
      'contact4'
    ]);
    expect(byRef(items, 'PNC', 'contact1').dueDate).toBe('2026-10-08');
    expect(byRef(items, 'PNC', 'contact2').dueDate).toBe('2026-10-10');
    expect(byRef(items, 'PNC', 'contact3').dueDate).toBe('2026-10-18');
    expect(byRef(items, 'PNC', 'contact4').dueDate).toBe('2026-11-19');
    expect(byRef(items, 'MILESTONE', 'child_epi_start').dueDate).toBe('2026-11-19');
  });
});