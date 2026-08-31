import { Capacitor } from '@capacitor/core';
import { CapacitorSQLite, SQLiteConnection, type SQLiteDBConnection } from '@capacitor-community/sqlite';
import {
  CHILD_TABLE,
  DDL,
  PREGNANCY_TABLE,
  PROFILE_TABLE,
  SCHEDULE_TABLE,
  SETTINGS_TABLE,
  TT_DOSE_TABLE,
  TT_HISTORY_TABLE,
  VISIT_TRACKING_TABLE,
  type Child,
  type Pregnancy,
  type Profile,
  type ScheduleItem,
  type TtDose,
  type TtHistory,
  type VisitTracking
} from './schemas';

export interface TableDef<T> {
  name: string;
  columns: string[];
  toRow(t: T): unknown[];
  fromRow(r: Record<string, unknown>): T;
}

const boolToInt = (v: boolean | undefined | null): number => (v ? 1 : 0);
const intToBool = (v: unknown): boolean => Number(v) === 1;
const asStr = (v: unknown): string => (typeof v === 'string' ? v : '');
const asNullableStr = (v: unknown): string | null => (typeof v === 'string' && v !== '' ? v : null);
const asNullableNum = (v: unknown): number | null => (v === null || v === undefined || v === '' ? null : Number(v));
const asNum = (v: unknown): number | null => (v === null || v === undefined ? null : Number(v));

export const ProfileTable: TableDef<Profile> = {
  name: PROFILE_TABLE,
  columns: ['id', 'name', 'age', 'created_at'],
  toRow: (t) => [t.id, t.name, t.age, t.createdAt],
  fromRow: (r) => ({
    id: asStr(r.id),
    name: asStr(r.name),
    age: asNullableNum(r.age),
    createdAt: asStr(r.created_at)
  })
};

export const PregnancyTable: TableDef<Pregnancy> = {
  name: PREGNANCY_TABLE,
  columns: [
    'id', 'lmp', 'edd', 'date_source', 'pregnancy_weeks_at_registration', 'gravida', 'parity',
    'previous_outcomes', 'previous_caesarean', 'pregnancy_type', 'high_risk', 'registered_at',
    'delivery_date', 'delivery_place', 'delivery_mode', 'birth_outcome', 'complications',
    'postnatal_danger_signs', 'breastfeeding_initiated', 'status', 'archived_at', 'notes'
  ],
  toRow: (t) => [
    t.id, t.lmp, t.edd, t.dateSource, t.pregnancyWeeksAtRegistration, t.gravida, t.parity,
    t.previousOutcomes, boolToInt(t.previousCaesarean), t.pregnancyType, boolToInt(t.highRisk),
    t.registeredAt, t.deliveryDate, t.deliveryPlace, t.deliveryMode, t.birthOutcome,
    t.complications, t.postnatalDangerSigns, boolToInt(t.breastfeedingInitiated),
    t.status, t.archivedAt, t.notes
  ],
  fromRow: (r) => ({
    id: asStr(r.id),
    lmp: asNullableStr(r.lmp),
    edd: asNullableStr(r.edd),
    dateSource: (asStr(r.date_source) || 'unspecified') as Pregnancy['dateSource'],
    pregnancyWeeksAtRegistration: asNullableNum(r.pregnancy_weeks_at_registration),
    gravida: asNullableNum(r.gravida),
    parity: asNullableNum(r.parity),
    previousOutcomes: asStr(r.previous_outcomes),
    previousCaesarean: intToBool(r.previous_caesarean),
    pregnancyType: asStr(r.pregnancy_type),
    highRisk: intToBool(r.high_risk),
    registeredAt: asStr(r.registered_at),
    deliveryDate: asNullableStr(r.delivery_date),
    deliveryPlace: asStr(r.delivery_place),
    deliveryMode: (asStr(r.delivery_mode) || 'unspecified') as Pregnancy['deliveryMode'],
    birthOutcome: (asStr(r.birth_outcome) || 'unspecified') as Pregnancy['birthOutcome'],
    complications: asStr(r.complications),
    postnatalDangerSigns: asStr(r.postnatal_danger_signs),
    breastfeedingInitiated: intToBool(r.breastfeeding_initiated),
    status: (asStr(r.status) || 'active') as Pregnancy['status'],
    archivedAt: asNullableStr(r.archived_at),
    notes: asStr(r.notes)
  })
};

export const VisitTrackingTable: TableDef<VisitTracking> = {
  name: VISIT_TRACKING_TABLE,
  columns: [
    'id', 'pregnancy_id', 'ref', 'facility', 'blood_pressure', 'weight_kg',
    'urine_test_done', 'blood_test_done', 'ultrasound_date', 'danger_signs',
    'birth_plan_completed', 'updated_at'
  ],
  toRow: (t) => [
    t.id, t.pregnancyId, t.ref, t.facility, t.bloodPressure, t.weightKg,
    boolToInt(t.urineTestDone), boolToInt(t.bloodTestDone), t.ultrasoundDate,
    t.dangerSigns, boolToInt(t.birthPlanCompleted), t.updatedAt
  ],
  fromRow: (r) => ({
    id: asStr(r.id),
    pregnancyId: asStr(r.pregnancy_id),
    ref: asStr(r.ref),
    facility: asStr(r.facility),
    bloodPressure: asStr(r.blood_pressure),
    weightKg: asStr(r.weight_kg),
    urineTestDone: intToBool(r.urine_test_done),
    bloodTestDone: intToBool(r.blood_test_done),
    ultrasoundDate: asNullableStr(r.ultrasound_date),
    dangerSigns: asStr(r.danger_signs),
    birthPlanCompleted: intToBool(r.birth_plan_completed),
    updatedAt: asStr(r.updated_at)
  })
};

export const TtHistoryTable: TableDef<TtHistory> = {
  name: TT_HISTORY_TABLE,
  columns: [
    'id', 'card_available', 'status', 'doses_received', 'last_dose_date',
    'current_pregnancy_dose_date', 'next_due_date', 'updated_at'
  ],
  toRow: (t) => [
    t.id, boolToInt(t.cardAvailable), t.status, t.dosesReceived, t.lastDoseDate,
    t.currentPregnancyDoseDate, t.nextDueDate, t.updatedAt
  ],
  fromRow: (r) => ({
    id: asStr(r.id),
    cardAvailable: intToBool(r.card_available),
    status: (asStr(r.status) || 'not_asked') as TtHistory['status'],
    dosesReceived: asNullableNum(r.doses_received),
    lastDoseDate: asNullableStr(r.last_dose_date),
    currentPregnancyDoseDate: asNullableStr(r.current_pregnancy_dose_date),
    nextDueDate: asNullableStr(r.next_due_date),
    updatedAt: asStr(r.updated_at)
  })
};

export const TtDoseTable: TableDef<TtDose> = {
  name: TT_DOSE_TABLE,
  columns: ['id', 'dose_number', 'date_given', 'pregnancy_id', 'facility', 'recorded_at'],
  toRow: (t) => [t.id, t.doseNumber, t.dateGiven, t.pregnancyId, t.facility, t.recordedAt],
  fromRow: (r) => ({
    id: asStr(r.id),
    doseNumber: asNum(r.dose_number) ?? 0,
    dateGiven: asNullableStr(r.date_given),
    pregnancyId: asNullableStr(r.pregnancy_id),
    facility: asStr(r.facility),
    recordedAt: asStr(r.recorded_at)
  })
};

export const ChildTable: TableDef<Child> = {
  name: CHILD_TABLE,
  columns: ['id', 'pregnancy_id', 'dob', 'sex', 'notes'],
  toRow: (t) => [t.id, t.pregnancyId, t.dob, t.sex, t.notes],
  fromRow: (r) => ({
    id: asStr(r.id),
    pregnancyId: asStr(r.pregnancy_id),
    dob: asStr(r.dob),
    sex: asStr(r.sex),
    notes: asStr(r.notes)
  })
};

export const ScheduleTable: TableDef<ScheduleItem> = {
  name: SCHEDULE_TABLE,
  columns: ['id', 'pregnancy_id', 'type', 'ref', 'title_key', 'due_date', 'status', 'completed_at'],
  toRow: (t) => [t.id, t.pregnancyId, t.type, t.ref, t.titleKey, t.dueDate, t.status, t.completedAt],
  fromRow: (r) => ({
    id: asStr(r.id),
    pregnancyId: asStr(r.pregnancy_id),
    type: (asStr(r.type) || 'ANC') as ScheduleItem['type'],
    ref: asStr(r.ref),
    titleKey: asStr(r.title_key),
    dueDate: asStr(r.due_date),
    status: (asStr(r.status) || 'upcoming') as ScheduleItem['status'],
    completedAt: asNullableStr(r.completed_at)
  })
};

interface DbDriver {
  init(): Promise<void>;
  getAll<T>(def: TableDef<T>): Promise<T[]>;
  upsert<T>(def: TableDef<T>, row: T): Promise<void>;
  remove(def: TableDef<unknown>, id: string): Promise<void>;
  clear(): Promise<void>;
  getSetting(key: string): Promise<string | null>;
  setSetting(key: string, value: string): Promise<void>;
}

class LocalStorageDriver implements DbDriver {
  private key(table: string): string {
    return `maasathi_db_v1_${table}`;
  }

  async init(): Promise<void> {
    void DDL;
  }

  private readTable(table: string): Record<string, unknown>[] {
    try {
      const raw = localStorage.getItem(this.key(table));
      return raw ? (JSON.parse(raw) as Record<string, unknown>[]) : [];
    } catch (e) {
      console.error(`Failed to read table ${table}`, e);
      return [];
    }
  }

  private writeTable(table: string, rows: Record<string, unknown>[]): void {
    try {
      localStorage.setItem(this.key(table), JSON.stringify(rows));
    } catch (e) {
      console.error(`Failed to write table ${table}`, e);
    }
  }

  async getAll<T>(def: TableDef<T>): Promise<T[]> {
    return this.readTable(def.name).map((r) => def.fromRow(r));
  }

  async upsert<T>(def: TableDef<T>, row: T): Promise<void> {
    const rows = this.readTable(def.name);
    const rec = row as unknown as Record<string, unknown>;
    const idx = rows.findIndex((r) => r['id'] === rec['id']);
    if (idx >= 0) rows[idx] = rec;
    else rows.push(rec);
    this.writeTable(def.name, rows);
  }

  async remove(def: TableDef<unknown>, id: string): Promise<void> {
    const rows = this.readTable(def.name).filter((r) => r['id'] !== id);
    this.writeTable(def.name, rows);
  }

  async clear(): Promise<void> {
    const tables = [PROFILE_TABLE, PREGNANCY_TABLE, TT_HISTORY_TABLE, TT_DOSE_TABLE, CHILD_TABLE, SCHEDULE_TABLE, VISIT_TRACKING_TABLE, SETTINGS_TABLE];
    tables.forEach((t) => localStorage.removeItem(this.key(t)));
  }

  async getSetting(key: string): Promise<string | null> {
    return this.readTable(SETTINGS_TABLE).find((r) => r['key'] === key)?.['value'] as string ?? null;
  }

  async setSetting(key: string, value: string): Promise<void> {
    const rows = this.readTable(SETTINGS_TABLE).filter((r) => r['key'] !== key);
    rows.push({ key, value });
    this.writeTable(SETTINGS_TABLE, rows);
  }
}

class SQLiteDriver implements DbDriver {
  private db: SQLiteDBConnection | null = null;

  /** Columns added after the first release; applied to existing installs. */
  private static readonly COLUMN_MIGRATIONS: Array<{ table: string; column: string; decl: string }> = [
    { table: PREGNANCY_TABLE, column: 'date_source', decl: "TEXT NOT NULL DEFAULT 'unspecified'" },
    { table: PREGNANCY_TABLE, column: 'pregnancy_weeks_at_registration', decl: 'INTEGER' },
    { table: PREGNANCY_TABLE, column: 'postnatal_danger_signs', decl: "TEXT NOT NULL DEFAULT ''" },
    { table: PREGNANCY_TABLE, column: 'breastfeeding_initiated', decl: 'INTEGER NOT NULL DEFAULT 0' }
  ];

  async init(): Promise<void> {
    const sqlite = new SQLiteConnection(CapacitorSQLite);
    const db = await sqlite.createConnection('maasathi', false, 'no-encryption', 1, false);
    await db.open();
    this.db = db;
    // Idempotent: creates missing tables, leaves existing data untouched.
    await db.execute(DDL.join('\n'));
    await this.applyColumnMigrations();
  }

  private async applyColumnMigrations(): Promise<void> {
    if (!this.db) throw new Error('Database not initialised');
    for (const migration of SQLiteDriver.COLUMN_MIGRATIONS) {
      const info = await this.db.query(`PRAGMA table_info(${migration.table})`);
      const columns = (info?.values ?? []).map((r) => asStr((r as Record<string, unknown>)['name']));
      if (!columns.includes(migration.column)) {
        await this.db.execute(
          `ALTER TABLE ${migration.table} ADD COLUMN ${migration.column} ${migration.decl}`
        );
      }
    }
  }

  private async exec(statement: string, values: unknown[]): Promise<void> {
    if (!this.db) throw new Error('Database not initialised');
    await this.db.run(statement, values as never[], false, 'no');
  }

  async getAll<T>(def: TableDef<T>): Promise<T[]> {
    if (!this.db) throw new Error('Database not initialised');
    const res = await this.db.query(`SELECT * FROM ${def.name}`);
    return (res?.values ?? []).map((r) => def.fromRow(r as Record<string, unknown>));
  }

  async upsert<T>(def: TableDef<T>, row: T): Promise<void> {
    const placeholders = def.columns.map(() => '?').join(', ');
    await this.exec(
      `INSERT OR REPLACE INTO ${def.name} (${def.columns.join(', ')}) VALUES (${placeholders})`,
      def.toRow(row)
    );
  }

  async remove(def: TableDef<unknown>, id: string): Promise<void> {
    await this.exec(`DELETE FROM ${def.name} WHERE id = ?`, [id]);
  }

  async clear(): Promise<void> {
    if (!this.db) throw new Error('Database not initialised');
    const tables = [PROFILE_TABLE, PREGNANCY_TABLE, TT_HISTORY_TABLE, TT_DOSE_TABLE, CHILD_TABLE, SCHEDULE_TABLE, VISIT_TRACKING_TABLE, SETTINGS_TABLE];
    for (const t of tables) {
      await this.db.query(`DELETE FROM ${t}`);
    }
  }

  async getSetting(key: string): Promise<string | null> {
    if (!this.db) throw new Error('Database not initialised');
    const res = await this.db.query(`SELECT value FROM ${SETTINGS_TABLE} WHERE key = ?`, [key]);
    const first = res?.values?.[0] as Record<string, unknown> | undefined;
    return first ? asStr(first['value']) : null;
  }

  async setSetting(key: string, value: string): Promise<void> {
    await this.exec(
      `INSERT OR REPLACE INTO ${SETTINGS_TABLE} (key, value) VALUES (?, ?)`,
      [key, value]
    );
  }
}

let driver: DbDriver = new LocalStorageDriver();
let ready: Promise<void> | null = null;

export function initDatabase(): Promise<void> {
  if (!ready) {
    ready = (async () => {
      if (Capacitor.isNativePlatform()) {
        try {
          const sqliteDriver = new SQLiteDriver();
          await sqliteDriver.init();
          driver = sqliteDriver;
          console.info('MaaSathi: using SQLite storage');
          return;
        } catch (e) {
          console.error('MaaSathi: SQLite init failed, falling back to localStorage', e);
        }
      }
      driver = new LocalStorageDriver();
      await driver.init();
      console.info('MaaSathi: using localStorage storage');
    })();
  }
  return ready;
}

async function withDb<T>(fn: (d: DbDriver) => Promise<T>): Promise<T> {
  await initDatabase();
  return fn(driver);
}

export const profileRepo = {
  get(): Promise<Profile | null> {
    return withDb(async (d) => {
      const rows = await d.getAll(ProfileTable);
      return rows.length > 0 ? rows[rows.length - 1] : null;
    });
  },
  save(p: Profile): Promise<void> {
    return withDb((d) => d.upsert(ProfileTable, p));
  }
};

export const pregnancyRepo = {
  all(): Promise<Pregnancy[]> {
    return withDb((d) => d.getAll(PregnancyTable));
  },
  byId(id: string): Promise<Pregnancy | null> {
    return withDb(async (d) => (await d.getAll(PregnancyTable)).find((p) => p.id === id) ?? null);
  },
  active(): Promise<Pregnancy | null> {
    return withDb(async (d) => (await d.getAll(PregnancyTable)).find((p) => p.status === 'active') ?? null);
  },
  save(p: Pregnancy): Promise<void> {
    return withDb((d) => d.upsert(PregnancyTable, p));
  }
};

export const ttHistoryRepo = {
  get(): Promise<TtHistory | null> {
    return withDb(async (d) => {
      const rows = await d.getAll(TtHistoryTable);
      return rows.length > 0 ? rows[rows.length - 1] : null;
    });
  },
  save(h: TtHistory): Promise<void> {
    return withDb((d) => d.upsert(TtHistoryTable, h));
  }
};

export const ttDoseRepo = {
  all(): Promise<TtDose[]> {
    return withDb((d) => d.getAll(TtDoseTable));
  },
  save(dose: TtDose): Promise<void> {
    return withDb((d) => d.upsert(TtDoseTable, dose));
  }
};

export const visitTrackingRepo = {
  byPregnancy(pregnancyId: string): Promise<VisitTracking[]> {
    return withDb(async (d) => (await d.getAll(VisitTrackingTable)).filter((v) => v.pregnancyId === pregnancyId));
  },
  byPregnancyAndRef(pregnancyId: string, ref: string): Promise<VisitTracking | null> {
    return withDb(async (d) =>
      (await d.getAll(VisitTrackingTable)).find((v) => v.pregnancyId === pregnancyId && v.ref === ref) ?? null
    );
  },
  save(tracking: VisitTracking): Promise<void> {
    return withDb((d) => d.upsert(VisitTrackingTable, tracking));
  }
};

export const childRepo = {
  byPregnancy(pregnancyId: string): Promise<Child | null> {
    return withDb(async (d) => (await d.getAll(ChildTable)).find((c) => c.pregnancyId === pregnancyId) ?? null);
  },
  save(c: Child): Promise<void> {
    return withDb((d) => d.upsert(ChildTable, c));
  }
};

export const scheduleRepo = {
  all(): Promise<ScheduleItem[]> {
    return withDb((d) => d.getAll(ScheduleTable));
  },
  byPregnancy(pregnancyId: string): Promise<ScheduleItem[]> {
    return withDb(async (d) => (await d.getAll(ScheduleTable)).filter((s) => s.pregnancyId === pregnancyId));
  },
  upsertAll(items: ScheduleItem[]): Promise<void> {
    return withDb(async (d) => {
      for (const item of items) await d.upsert(ScheduleTable, item);
    });
  },
  removeForPregnancy(pregnancyId: string): Promise<void> {
    return withDb(async (d) => {
      const rows = await d.getAll(ScheduleTable);
      for (const r of rows) {
        if (r.pregnancyId === pregnancyId) await d.remove(ScheduleTable, r.id);
      }
    });
  },
  remove(item: ScheduleItem): Promise<void> {
    return withDb((d) => d.remove(ScheduleTable, item.id));
  }
};

export const settingsRepo = {
  async get(key: string): Promise<string | null> {
    try {
      return await withDb((d) => d.getSetting(key));
    } catch (e) {
      console.error('settingsRepo.get failed', e);
      return null;
    }
  },
  set(key: string, value: string): Promise<void> {
    return withDb((d) => d.setSetting(key, value));
  },
  async getNumber(key: string): Promise<number | null> {
    const raw = await settingsRepo.get(key);
    if (raw === null || raw === '') return null;
    const n = Number(raw);
    return Number.isNaN(n) ? null : n;
  },
  async setNumber(key: string, value: number | null): Promise<void> {
    await withDb((d) => d.setSetting(key, value === null ? '' : String(value)));
  },
  async getJson<T>(key: string, fallback: T): Promise<T> {
    const raw = await settingsRepo.get(key);
    if (!raw) return fallback;
    try {
      return JSON.parse(raw) as T;
    } catch {
      return fallback;
    }
  },
  setJson(key: string, value: unknown): Promise<void> {
    return settingsRepo.set(key, JSON.stringify(value));
  }
};

export async function clearAllData(): Promise<void> {
  await withDb((d) => d.clear());
}
