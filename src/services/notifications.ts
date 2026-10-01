import { Capacitor } from '@capacitor/core';
import { LocalNotifications, type ScheduleOptions } from '@capacitor/local-notifications';
import { settingsRepo } from '../db/database';
import type { ScheduleItem } from '../db/schemas';
import { i18n, t } from '../i18n';
import { todayIso } from '../utils/date';

export const REMINDER_OFFSETS_DAYS = [7, 3, 1, 0] as const;

const NOTIFICATION_HOUR = 9;

/**
 * How far in the future a reminder slot must be before we hand it to the OS.
 *
 * The Android implementation does not clamp past-dated alarms. A one-shot `at`
 * that has already gone by is posted to the notification shade immediately, in
 * process, inside the `schedule()` call. A lead time is therefore required so a
 * slot cannot slip into the past between our check and the bridge call.
 */
const MIN_LEAD_MS = 60_000;

/**
 * How long to defer a due-today reminder whose 9am moment has already passed.
 *
 * ANC visit 1 is due on the registration date, so a first-time install after
 * 9am has no future slots at all and the only reminder that can exist is the
 * "today" one. Dropping it leaves the user with no notification for a visit that
 * is genuinely today, so it is nudged instead — but never immediately, which is
 * what read as a bug in the first place.
 */
const CATCHUP_DELAY_MS = 10 * 60 * 1000;

/** Settings key: ids already nudged today, so a catch-up fires at most once a day. */
const CATCHUP_KEY = 'maasathi_reminder_catchup';

/** Catch-up records older than this are pruned to keep the map small. */
const CATCHUP_RETENTION_DAYS = 14;

/**
 * Android channel every reminder is posted to.
 *
 * Deliberately not the plugin's own `default` channel. That one is created with
 * IMPORTANCE_DEFAULT, and from API 26 the channel's importance alone decides
 * heads-up behaviour — `NotificationCompat.setPriority()` is ignored. So
 * IMPORTANCE_DEFAULT means the shade and nothing else: no banner over the
 * screen. Android also refuses to raise the importance of a channel that
 * already exists, so users who installed an earlier build keep the broken
 * channel forever unless reminders move to a new id.
 */
const REMINDER_CHANNEL_ID = 'maasathi-reminders';

/** NotificationManager.IMPORTANCE_HIGH — the level that alerts over the screen. */
const CHANNEL_IMPORTANCE = 4;

/** Language the channel was last created in, so it is only rebuilt on a change. */
let channelLocale: string | null = null;

export function visitNumber(item: ScheduleItem | null): number | null {
  if (!item) return null;
  const match = item.ref.match(/(\d+)$/);
  return match ? Number(match[1]) : null;
}

function reminderId(item: ScheduleItem, offsetDays: number): number {
  let hash = 0;
  const basis = `${item.pregnancyId}|${item.type}|${item.ref}|${offsetDays}`;
  for (let i = 0; i < basis.length; i++) {
    hash = (hash * 31 + basis.charCodeAt(i)) | 0;
  }
  return Math.abs(hash) % 2000000000;
}

function dateOnly(iso: string): Date {
  const [y, m, d] = iso.split('-').map((n) => Number(n));
  return new Date(y, (m ?? 1) - 1, d ?? 1, NOTIFICATION_HOUR, 0, 0, 0);
}

/**
 * Body template for each schedule type.
 *
 * ANC, PNC and TT each have their own template. MILESTONE covers two unrelated
 * things — the due date and the start of the child's EPI schedule — so it is
 * matched on `ref`.
 */
const REMINDER_BODY_KEYS: Record<string, string> = {
  ANC: 'notification.reminder_anc',
  PNC: 'notification.reminder_pnc',
  TT: 'notification.reminder_tt',
  MILESTONE_EDD: 'notification.reminder_edd',
  MILESTONE_EPI: 'notification.reminder_epi_start'
};

function reminderBodyKey(item: ScheduleItem): string {
  if (item.type === 'MILESTONE') {
    return item.ref === 'child_epi_start'
      ? REMINDER_BODY_KEYS.MILESTONE_EPI
      : REMINDER_BODY_KEYS.MILESTONE_EDD;
  }
  return REMINDER_BODY_KEYS[item.type] ?? 'notification.reminder_generic';
}

function addDays(iso: string, days: number): Date {
  const d = dateOnly(iso);
  d.setDate(d.getDate() + days);
  return d;
}

/** Calendar day of a Date as YYYY-MM-DD, in local time. */
function isoDay(d: Date): string {
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${d.getFullYear()}-${m}-${day}`;
}

/**
 * Ids already nudged today, read from the app's own settings rather than
 * inferred from the plugin's delivered list. A delivered record is kept by the
 * plugin until the user dismisses it, so keying off that would suppress the
 * reminder on every future day for a visit that is still incomplete.
 */
async function catchupLedger(): Promise<{
  done: Set<string>;
  entries: Record<string, string>;
  pruned: boolean;
}> {
  const today = todayIso();
  const cutoff = isoDay(addDays(today, -CATCHUP_RETENTION_DAYS));
  const raw = await settingsRepo.getJson<Record<string, string>>(CATCHUP_KEY, {});
  const entries: Record<string, string> = {};
  let pruned = false;
  for (const [id, day] of Object.entries(raw ?? {})) {
    if (day >= cutoff) entries[id] = day;
    else pruned = true;
  }
  return {
    done: new Set(Object.entries(entries).filter(([, day]) => day === today).map(([id]) => id)),
    entries,
    pruned
  };
}

/**
 * Creates or refreshes the reminder channel. Idempotent, so it is safe to call
 * on every schedule pass — re-running it after a language switch relabels the
 * channel, because Android does update an existing channel's name and
 * description. Importance and sound are fixed at creation and Android ignores
 * any later attempt to change them.
 *
 * No `sound` is set on purpose: the channel then falls back to the system
 * default notification sound, which respects the user's own setting. The plugin
 * can only address sounds in `android/app/src/main/res/raw`, and this app ships
 * none.
 */
export async function ensureReminderChannel(): Promise<void> {
  if (Capacitor.getPlatform() !== 'android') return;
  // regenerateSchedule() walks every upcoming item, so this is called several
  // times per app start. Android updates a channel's name and description, so
  // re-running it after a language switch relabels the channel — but only when
  // the language has actually changed.
  const locale = i18n.global.locale.value;
  if (channelLocale === locale) return;
  try {
    await LocalNotifications.createChannel({
      id: REMINDER_CHANNEL_ID,
      name: t('notification.channel_name'),
      description: t('notification.channel_description'),
      // 4 == NotificationManager.IMPORTANCE_HIGH, the level that alerts over
      // the screen. The plugin passes this straight through to the channel.
      importance: CHANNEL_IMPORTANCE,
      vibration: true,
      lights: true,
      lightColor: '#f6c945',
      // 1 == NotificationCompat.VISIBILITY_PUBLIC, so the body is readable on a
      // locked screen. Reminders carry no medical detail beyond the visit name.
      visibility: 1
    });
    channelLocale = locale;
    // Read the channel back from the OS rather than trusting the call. Importance
    // is fixed at creation and Android silently ignores a request to change it,
    // so this is the only way to confirm a banner will actually appear.
    const { channels } = await LocalNotifications.listChannels();
    const ours = channels.find((c) => c.id === REMINDER_CHANNEL_ID);
    console.info(
      `MaaSathi: reminder channel "${REMINDER_CHANNEL_ID}" importance=${ours?.importance ?? 'MISSING'} ` +
        `(4 = heads-up), sound=${ours?.sound ?? 'system default'}, ${channels.length} channel(s) total`
    );
    if (ours && ours.importance !== CHANNEL_IMPORTANCE) {
      console.warn(
        `MaaSathi: reminder channel importance is ${ours.importance}, expected ${CHANNEL_IMPORTANCE}. ` +
          'Android will not raise an existing channel — uninstall the app or clear its notifications to reset it.'
      );
    }
  } catch (e) {
    console.error('MaaSathi: could not create reminder notification channel', e);
  }
}

export async function requestNotificationPermission(): Promise<boolean> {
  if (!Capacitor.isNativePlatform()) {
    console.info('MaaSathi: notification permissions skipped on web');
    return false;
  }
  try {
    const status = await LocalNotifications.checkPermissions();
    const granted =
      status.display === 'granted' ? true : (await LocalNotifications.requestPermissions()).display === 'granted';
    if (granted) await ensureReminderChannel();
    return granted;
  } catch (e) {
    console.error('MaaSathi: notification permission check failed', e);
    return false;
  }
}

export async function scheduleItemReminders(
  item: ScheduleItem,
  title: string,
): Promise<void> {
  if (!Capacitor.isNativePlatform()) {
    console.info(`MaaSathi: would schedule reminders for ${item.type}/${item.ref}`);
    return;
  }

  const granted = await requestNotificationPermission();
  if (!granted) return;

  const now = Date.now();
  const today = todayIso();
  const schedule: ScheduleOptions = {
    notifications: []
  };
  const expired: number[] = [];
  const nudgedIds: Record<string, string> = {};
  const ledger = await catchupLedger();

  for (const offset of REMINDER_OFFSETS_DAYS) {
    const nominal = addDays(item.dueDate, -offset);
    const id = reminderId(item, offset);
    // Notification ids are numbers; the ledger is JSON, so its keys are strings.
    const key = String(id);
    let when = nominal;

    if (nominal.getTime() - now < MIN_LEAD_MS) {
      // The nominal moment has gone by. Only the "today" reminder can still be
      // sent truthfully: the 7/3/1-day bodies state a day count, so firing one
      // late would make the text lie. The item itself must also still be
      // upcoming for a catch-up to mean anything.
      const stillRelevant = offset === 0 && item.dueDate >= today;

      if (stillRelevant && ledger.done.has(key)) {
        // An earlier launch already nudged this today. Its alarm is either
        // still pending or has already fired, and both are fine — so leave it
        // strictly alone. Cancelling here would destroy a catch-up that a
        // previous launch armed but that has not had its 10 minutes yet, which
        // is why the user would never receive it at all.
        continue;
      }

      const deferred = new Date(now + CATCHUP_DELAY_MS);
      // Never let a deferred reminder cross midnight, or "today" turns false.
      if (stillRelevant && isoDay(deferred) === today) {
        when = deferred;
        nudgedIds[key] = today;
      } else {
        expired.push(id);
        continue;
      }
    }

    let body = t(reminderBodyKey(item));
    let body_time = t('notification.in_days');

    body_time = body_time.replace('#days', offset.toString())
    const n = visitNumber(item);

    if (offset == 1) body_time = t('timeline.tomorrow');
    if (offset == 0) body_time = t('timeline.today');

    // Only the ANC and PNC templates carry an ordinal; the others have no
    // placeholder, so replacing it is a no-op for them.
    if (n != null) body = body.replace('#ordinal', t(`home.cards.ordinal_${n}`))
      else body = body.replace('#ordinal', "");
    body = body.replace('#date', body_time);

    schedule.notifications.push({
      id,
      title,
      body,
      channelId: REMINDER_CHANNEL_ID,
      schedule: { at: when, allowWhileIdle: true },
      ongoing: false,
      actionTypeId: ''
    });
  }

  if (schedule.notifications.length > 0) {
    try {
      await LocalNotifications.schedule(schedule);
    } catch (e) {
      console.error('MaaSathi: failed to schedule notifications', e);
    }
  }

  // A slot we just dropped must be cancelled explicitly. The plugin only clears
  // the ids it is handed in schedule(), so an alarm armed by an earlier run for
  // one of these ids would stay pending in AlarmManager and fire later — which
  // looks exactly like the bug this guard is meant to prevent.
  if (expired.length > 0) {
    try {
      await LocalNotifications.cancel({ notifications: expired.map((expiredId) => ({ id: expiredId })) });
    } catch (e) {
      console.error('MaaSathi: failed to clear expired reminder alarms', e);
    }
  }

  // Persist only once the notifications are actually armed, so a failed schedule
  // does not consume today's single catch-up.
  const nudgedCount = Object.keys(nudgedIds).length;
  if (nudgedCount > 0) {
    await settingsRepo.set(CATCHUP_KEY, JSON.stringify({ ...ledger.entries, ...nudgedIds }));
  } else if (ledger.pruned) {
    await settingsRepo.set(CATCHUP_KEY, JSON.stringify(ledger.entries));
  }

  console.info(
    `MaaSathi: reminders ${item.type}/${item.ref} due ${item.dueDate} — ` +
      `${schedule.notifications.length} armed on "${REMINDER_CHANNEL_ID}" ` +
      `(${nudgedCount} due-today catch-up), ${expired.length} expired and cleared`
  );
}

export async function cancelItemReminders(item: ScheduleItem): Promise<void> {
  if (!Capacitor.isNativePlatform()) return;
  const ids = REMINDER_OFFSETS_DAYS.map((offset) => ({ id: reminderId(item, offset) }));
  try {
    await LocalNotifications.cancel({ notifications: ids });
  } catch (e) {
    console.error('MaaSathi: failed to cancel notifications', e);
  }
}

export async function cancelAllReminders(items: ScheduleItem[]): Promise<void> {
  for (const item of items) {
    await cancelItemReminders(item);
  }
}

export async function forceCancelAllReminders(): Promise<void> {
  if (!Capacitor.isNativePlatform()) return;
  const pending = await LocalNotifications.getPending();
  if (pending.notifications.length > 0) {
    await LocalNotifications.cancel(pending);
  }
}
