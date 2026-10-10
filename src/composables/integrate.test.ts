/**
 * @vitest-environment jsdom
 */

import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { ScheduleItem } from '../db/schemas';

const LMP = '2026-01-01';
const EDD = '2026-10-08';

beforeEach(() => {
  vi.resetModules();
  localStorage.clear();
});

async function loadFresh() {
  const { usePregnancy } = await import('./usePregnancy');
  const { useTt } = await import('./useTt');
  const db = await import('../db/database');
  return { usePregnancy, useTt, ...db };
}

function byRef(items: ScheduleItem[], type: ScheduleItem['type'], ref: string): ScheduleItem {
  const item = items.find((i) => i.type === type && i.ref === ref);
  if (!item) throw new Error(`No item found for type ${type} and ref ${ref}`);
  return item;
}

function expectAncFromLmp(items: ScheduleItem[], registeredAt: string) {
  expect(items.filter((i) => i.type === 'ANC').map((i) => i.ref)).toEqual([
    'visit1',
    'visit2',
    'visit3',
    'visit4'
  ]);
  expect(byRef(items, 'ANC', 'visit1').dueDate).toBe(registeredAt.slice(0, 10));
  expect(byRef(items, 'ANC', 'visit2').dueDate).toBe('2026-07-02'); // LMP + 26 weeks
  expect(byRef(items, 'ANC', 'visit3').dueDate).toBe('2026-08-13'); // LMP + 32 weeks
  expect(byRef(items, 'ANC', 'visit4').dueDate).toBe('2026-09-10'); // LMP + 36 weeks
  expect(byRef(items, 'MILESTONE', 'edd').dueDate).toBe(EDD); // LMP + 280 days
}

describe('pregnancy schedule', () => {
  it('case 1: unknown TT history does not invent a dose or a due date', async () => {
    const { usePregnancy, useTt, ttHistoryRepo, ttDoseRepo, scheduleRepo } = await loadFresh();
    const tt = useTt();
    await tt.load();
    await tt.setRegistration({
      status: 'unknown',
      dosesReceived: null,
      lastDoseDate: null,
      cardAvailable: false
    });
    const saved = await usePregnancy().registerPregnancy({ lmp: LMP });
    const items = await scheduleRepo.byPregnancy(saved.id);
    expect((await ttHistoryRepo.get())?.status).toBe('unknown');
    expect(await ttDoseRepo.all()).toHaveLength(0);
    expectAncFromLmp(items, saved.registeredAt);
    expect(items.some((i) => i.type === 'TT')).toBe(false);
  });

  it('case 2: known TT history schedules dose 4 weeks later', async () => {
    const { usePregnancy, useTt, ttHistoryRepo, ttDoseRepo, scheduleRepo } = await loadFresh();
    const tt = useTt();
    await tt.load();
    await tt.setRegistration({
      status: 'known',
      dosesReceived: 1,
      lastDoseDate: '2026-01-01',
      cardAvailable: true
    });
    const saved = await usePregnancy().registerPregnancy({ lmp: LMP });
    const items = await scheduleRepo.byPregnancy(saved.id);
    expect((await ttHistoryRepo.get())?.status).toBe('known');
    expect(await ttDoseRepo.all()).toHaveLength(1);
    expectAncFromLmp(items, saved.registeredAt);
    expect(byRef(items, 'TT', 'next').dueDate).toBe('2026-01-29'); // last dose + 28 days
  });

  it('case 3: two known doses schedule the next TT 6 months later', async () => {
    const { usePregnancy, useTt, scheduleRepo } = await loadFresh();
    const tt = useTt();
    await tt.load();
    await tt.setRegistration({
      status: 'known',
      dosesReceived: 2,
      lastDoseDate: '2026-01-01',
      cardAvailable: true
    });
    const saved = await usePregnancy().registerPregnancy({ lmp: LMP });
    const items = await scheduleRepo.byPregnancy(saved.id);
    expect(byRef(items, 'TT', 'next').dueDate).toBe('2026-07-01');
  });

  it('case 4: three known doses schedule the next TT 1 year later', async () => {
    const { usePregnancy, useTt, scheduleRepo } = await loadFresh();
    const tt = useTt();
    await tt.load();
    await tt.setRegistration({
      status: 'known',
      dosesReceived: 3,
      lastDoseDate: '2026-01-01',
      cardAvailable: true
    });
    const saved = await usePregnancy().registerPregnancy({ lmp: LMP });
    const items = await scheduleRepo.byPregnancy(saved.id);
    expect(byRef(items, 'TT', 'next').dueDate).toBe('2027-01-01');
  });

  it('case 5: five known doses are complete', async () => {
    const { usePregnancy, useTt, ttHistoryRepo, scheduleRepo } = await loadFresh();
    const tt = useTt();
    await tt.load();
    await tt.setRegistration({
      status: 'known',
      dosesReceived: 5,
      lastDoseDate: '2026-01-01',
      cardAvailable: true
    });
    const saved = await usePregnancy().registerPregnancy({ lmp: LMP });
    const items = await scheduleRepo.byPregnancy(saved.id);
    expect((await ttHistoryRepo.get())?.status).toBe('known');
    expect((await ttHistoryRepo.get())?.dosesReceived).toBe(5);
    expect(items.some((i) => i.type === 'TT')).toBe(false);
    expectAncFromLmp(items, saved.registeredAt);
  });

  it('case 6: known dose count with no date is not given a due date', async () => {
    const { usePregnancy, useTt, ttDoseRepo, scheduleRepo } = await loadFresh();
    const tt = useTt();
    await tt.load();
    await tt.setRegistration({
      status: 'known',
      dosesReceived: 2,
      lastDoseDate: null,
      cardAvailable: false
    });
    const saved = await usePregnancy().registerPregnancy({ lmp: LMP });
    const items = await scheduleRepo.byPregnancy(saved.id);
    expect(await ttDoseRepo.all()).toHaveLength(0);
    expect(items.some((i) => i.type === 'TT')).toBe(false);
  });

  it('case 7: never vaccinated schedules TT on the registration day', async () => {
    const { usePregnancy, useTt, ttHistoryRepo, ttDoseRepo, scheduleRepo } = await loadFresh();
    const tt = useTt();
    await tt.load();
    await tt.setRegistration({
      status: 'never',
      dosesReceived: 0,
      lastDoseDate: null,
      cardAvailable: false
    });
    const saved = await usePregnancy().registerPregnancy({ lmp: LMP });
    const items = await scheduleRepo.byPregnancy(saved.id);
    expect((await ttHistoryRepo.get())?.status).toBe('never');
    expect((await ttHistoryRepo.get())?.dosesReceived).toBe(0);
    expect(await ttDoseRepo.all()).toHaveLength(0);
    expect(byRef(items, 'TT', 'next').dueDate).toBe(saved.registeredAt.slice(0, 10));
  });

  it('case 8: LMP unknown, EDD entered — LMP is derived and ANC is still built', async () => {
    const { usePregnancy, pregnancyRepo, scheduleRepo } = await loadFresh();
    const saved = await usePregnancy().registerPregnancy({ edd: EDD });
    const stored = await pregnancyRepo.byId(saved.id);
    const items = await scheduleRepo.byPregnancy(saved.id);
    expect(stored?.dateSource).toBe('edd');
    expect(stored?.edd).toBe(EDD);
    expect(stored?.lmp).toBe(LMP); // EDD - 280 days
    expectAncFromLmp(items, saved.registeredAt);
  });

  it('case 9: neither LMP nor EDD leaves the ANC calendar empty', async () => {
    const { usePregnancy, pregnancyRepo, scheduleRepo } = await loadFresh();
    const saved = await usePregnancy().registerPregnancy({});
    const stored = await pregnancyRepo.byId(saved.id);
    const items = await scheduleRepo.byPregnancy(saved.id);
    expect(stored?.dateSource).toBe('unspecified');
    expect(stored?.lmp).toBeNull();
    expect(stored?.edd).toBeNull();
    expect(items.some((i) => i.type === 'ANC' || i.ref === 'edd')).toBe(false);
  });

  it('case 10: birth replaces ANC with PNC contacts and a child record', async () => {
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
    const items = await scheduleRepo.byPregnancy(saved.id);
    expect((await pregnancyRepo.byId(saved.id))?.deliveryDate).toBe(EDD);
    expect(pregnancy.mode.value).toBe('PNC');
    expect((await childRepo.byPregnancy(saved.id))?.dob).toBe(EDD);
    expect(items.some((i) => i.type === 'ANC')).toBe(false);
    expect(items.filter((i) => i.type === 'PNC').map((i) => i.ref)).toEqual([
      'contact1',
      'contact2',
      'contact3',
      'contact4'
    ]);
    expect(byRef(items, 'PNC', 'contact1').dueDate).toBe('2026-10-08'); // delivery day
    expect(byRef(items, 'PNC', 'contact2').dueDate).toBe('2026-10-10'); // day 2
    expect(byRef(items, 'PNC', 'contact3').dueDate).toBe('2026-10-18'); // day 10
    expect(byRef(items, 'PNC', 'contact4').dueDate).toBe('2026-11-19'); // day 42
    expect(byRef(items, 'MILESTONE', 'child_epi_start').dueDate).toBe('2026-11-19');
  });
});