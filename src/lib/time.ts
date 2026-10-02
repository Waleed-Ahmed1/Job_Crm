import { formatInTimeZone, fromZonedTime } from "date-fns-tz";
export const DEFAULT_TIMEZONE = "Asia/Karachi";
export function formatDateTime(value: string | Date, timezone = DEFAULT_TIMEZONE) { return formatInTimeZone(value, timezone, "MMM d, yyyy · h:mm a zzz"); }
export function localDayKey(value: string | Date, timezone = DEFAULT_TIMEZONE) { return formatInTimeZone(value, timezone, "yyyy-MM-dd"); }
export function dueBucket(dueAt: string, now = new Date(), timezone = DEFAULT_TIMEZONE): "overdue" | "today" | "upcoming" { const due = localDayKey(dueAt, timezone); const today = localDayKey(now, timezone); return due < today ? "overdue" : due === today ? "today" : "upcoming"; }
export function zonedDueAt(date: string, time: string, timezone = DEFAULT_TIMEZONE) { return fromZonedTime(`${date}T${time}:00`, timezone).toISOString(); }
