export type PregnancyStatus = 'active' | 'archived';
export type CareMode = 'ANC' | 'PNC';
export type ScheduleType = 'ANC' | 'TT' | 'PNC' | 'MILESTONE';
export type ScheduleStatus = 'upcoming' | 'completed';
export type TtStatus = 'known' | 'unknown' | 'never' | 'not_asked';
export type BirthOutcome = 'live_birth' | 'stillbirth' | 'unspecified';
export type DeliveryMode = 'vaginal' | 'caesarean' | 'unspecified';
export type DateSource = 'lmp' | 'edd' | 'unspecified';

export interface Profile {
  id: string;
  name: string;
  age: number | null;
  createdAt: string;
}

export interface Pregnancy {
  id: string;
  lmp: string | null;
  edd: string | null;
  dateSource: DateSource;
  pregnancyWeeksAtRegistration: number | null;
  gravida: number | null;
  parity: number | null;
  previousOutcomes: string;
  previousCaesarean: boolean;
  pregnancyType: string;
  highRisk: boolean;
  registeredAt: string;
  deliveryDate: string | null;
  deliveryPlace: string;
  deliveryMode: DeliveryMode;
  birthOutcome: BirthOutcome;
  complications: string;
  postnatalDangerSigns: string;
  breastfeedingInitiated: boolean;
  status: PregnancyStatus;
  archivedAt: string | null;
  notes: string;
}

/** Per-visit care record (requirements doc Table 2: ANC / PNC tracking). */
export interface VisitTracking {
  id: string;
  pregnancyId: string;
  ref: string;
  facility: string;
  bloodPressure: string;
  weightKg: string;
  urineTestDone: boolean;
  bloodTestDone: boolean;
  ultrasoundDate: string | null;
  dangerSigns: string;
  birthPlanCompleted: boolean;
  updatedAt: string;
}

export interface TtHistory {
  id: string;
  cardAvailable: boolean;
  status: TtStatus;
  dosesReceived: number | null;
  lastDoseDate: string | null;
  currentPregnancyDoseDate: string | null;
  nextDueDate: string | null;
  updatedAt: string;
}

export interface TtDose {
  id: string;
  doseNumber: number;
  dateGiven: string | null;
  pregnancyId: string | null;
  facility: string;
  recordedAt: string;
}

export interface Child {
  id: string;
  pregnancyId: string;
  dob: string;
  sex: string;
  notes: string;
}

export interface ScheduleItem {
  id: string;
  pregnancyId: string;
  type: ScheduleType;
  ref: string;
  titleKey: string;
  dueDate: string;
  status: ScheduleStatus;
  completedAt: string | null;
}

export const PROFILE_TABLE = 'profile';
export const PREGNANCY_TABLE = 'pregnancy';
export const TT_HISTORY_TABLE = 'tt_history';
export const TT_DOSE_TABLE = 'tt_dose';
export const CHILD_TABLE = 'child';
export const SCHEDULE_TABLE = 'schedule_item';
export const VISIT_TRACKING_TABLE = 'visit_tracking';
export const SETTINGS_TABLE = 'settings';

export const DDL: string[] = [
  `CREATE TABLE IF NOT EXISTS profile (
    id TEXT PRIMARY KEY NOT NULL,
    name TEXT NOT NULL DEFAULT '',
    age INTEGER,
    created_at TEXT NOT NULL
  );`,
  `CREATE TABLE IF NOT EXISTS pregnancy (
    id TEXT PRIMARY KEY NOT NULL,
    lmp TEXT,
    edd TEXT,
    date_source TEXT NOT NULL DEFAULT 'unspecified',
    pregnancy_weeks_at_registration INTEGER,
    gravida INTEGER,
    parity INTEGER,
    previous_outcomes TEXT NOT NULL DEFAULT '',
    previous_caesarean INTEGER NOT NULL DEFAULT 0,
    pregnancy_type TEXT NOT NULL DEFAULT '',
    high_risk INTEGER NOT NULL DEFAULT 0,
    registered_at TEXT NOT NULL,
    delivery_date TEXT,
    delivery_place TEXT NOT NULL DEFAULT '',
    delivery_mode TEXT NOT NULL DEFAULT 'unspecified',
    birth_outcome TEXT NOT NULL DEFAULT 'unspecified',
    complications TEXT NOT NULL DEFAULT '',
    postnatal_danger_signs TEXT NOT NULL DEFAULT '',
    breastfeeding_initiated INTEGER NOT NULL DEFAULT 0,
    status TEXT NOT NULL DEFAULT 'active',
    archived_at TEXT,
    notes TEXT NOT NULL DEFAULT ''
  );`,
  `CREATE TABLE IF NOT EXISTS tt_history (
    id TEXT PRIMARY KEY NOT NULL,
    card_available INTEGER NOT NULL DEFAULT 0,
    status TEXT NOT NULL DEFAULT 'not_asked',
    doses_received INTEGER,
    last_dose_date TEXT,
    current_pregnancy_dose_date TEXT,
    next_due_date TEXT,
    updated_at TEXT NOT NULL
  );`,
  `CREATE TABLE IF NOT EXISTS tt_dose (
    id TEXT PRIMARY KEY NOT NULL,
    dose_number INTEGER NOT NULL,
    date_given TEXT,
    pregnancy_id TEXT,
    facility TEXT NOT NULL DEFAULT '',
    recorded_at TEXT NOT NULL
  );`,
  `CREATE TABLE IF NOT EXISTS child (
    id TEXT PRIMARY KEY NOT NULL,
    pregnancy_id TEXT NOT NULL,
    dob TEXT NOT NULL,
    sex TEXT NOT NULL DEFAULT '',
    notes TEXT NOT NULL DEFAULT ''
  );`,
  `CREATE TABLE IF NOT EXISTS schedule_item (
    id TEXT PRIMARY KEY NOT NULL,
    pregnancy_id TEXT NOT NULL,
    type TEXT NOT NULL,
    ref TEXT NOT NULL,
    title_key TEXT NOT NULL,
    due_date TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'upcoming',
    completed_at TEXT
  );`,
  `CREATE TABLE IF NOT EXISTS visit_tracking (
    id TEXT PRIMARY KEY NOT NULL,
    pregnancy_id TEXT NOT NULL,
    ref TEXT NOT NULL,
    facility TEXT NOT NULL DEFAULT '',
    blood_pressure TEXT NOT NULL DEFAULT '',
    weight_kg TEXT NOT NULL DEFAULT '',
    urine_test_done INTEGER NOT NULL DEFAULT 0,
    blood_test_done INTEGER NOT NULL DEFAULT 0,
    ultrasound_date TEXT,
    danger_signs TEXT NOT NULL DEFAULT '',
    birth_plan_completed INTEGER NOT NULL DEFAULT 0,
    updated_at TEXT NOT NULL
  );`,
  `CREATE TABLE IF NOT EXISTS settings (
    key TEXT PRIMARY KEY NOT NULL,
    value TEXT NOT NULL
  );`
];

export function uuid(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID();
  }
  return `id-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}
