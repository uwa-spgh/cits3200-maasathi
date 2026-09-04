import { Capacitor } from '@capacitor/core';
import { LocalNotifications, type ScheduleOptions } from '@capacitor/local-notifications';
import type { ScheduleItem } from '../db/schemas';

export const REMINDER_OFFSETS_DAYS = [7, 3, 1, 0] as const;

const NOTIFICATION_HOUR = 9;

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

function addDays(iso: string, days: number): Date {
  const d = dateOnly(iso);
  d.setDate(d.getDate() + days);
  return d;
}

export function isSameDay(a: Date, b: Date): boolean {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

export async function requestNotificationPermission(): Promise<boolean> {
  if (!Capacitor.isNativePlatform()) {
    console.info('MaaSathi: notification permissions skipped on web');
    return false;
  }
  try {
    const status = await LocalNotifications.checkPermissions();
    if (status.display !== 'granted') {
      const requested = await LocalNotifications.requestPermissions();
      return requested.display === 'granted';
    }
    return true;
  } catch (e) {
    console.error('MaaSathi: notification permission check failed', e);
    return false;
  }
}

export async function scheduleItemReminders(
  item: ScheduleItem,
  title: string,
  body: string
): Promise<void> {
  if (!Capacitor.isNativePlatform()) {
    console.info(`MaaSathi: would schedule reminders for ${item.type}/${item.ref}`);
    return;
  }
  const granted = await requestNotificationPermission();
  if (!granted) return;

  const today = new Date();
  const schedule: ScheduleOptions = {
    notifications: []
  };

  for (const offset of REMINDER_OFFSETS_DAYS) {
    const when = addDays(item.dueDate, -offset);
    if (when.getTime() < today.getTime() && !isSameDay(when, today)) continue;
    schedule.notifications.push({
      id: reminderId(item, offset),
      title,
      body,
      schedule: { at: when, allowWhileIdle: true },
      ongoing: false,
      smallIcon: 'ic_launcher',
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
