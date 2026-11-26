/** Local-calendar date helpers. All engine dates are local (Europe/London on a UK device). */

export const DAY_MS = 86_400_000;
export const dayNames = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"] as const;
export const dayShort = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"] as const;
const monthShort = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"] as const;
const monthLong = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
] as const;

export function startOfDay(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

export function addDays(date: Date, days: number): Date {
  const next = new Date(date.getFullYear(), date.getMonth(), date.getDate() + days);
  next.setHours(date.getHours(), date.getMinutes(), date.getSeconds(), date.getMilliseconds());
  return next;
}

/** Whole calendar days from a to b (b later is positive). */
export function daysBetween(a: Date, b: Date): number {
  return Math.round((startOfDay(b).getTime() - startOfDay(a).getTime()) / DAY_MS);
}

export function dateKey(date: Date): string {
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${date.getFullYear()}-${m}-${d}`;
}

export function parseKey(key: string): Date {
  const [y, m, d] = key.split("-").map(Number);
  return new Date(y, m - 1, d);
}

/** Minutes after midnight. */
export function minuteOfDay(date: Date): number {
  return date.getHours() * 60 + date.getMinutes();
}

export function atMinute(day: Date, minute: number): Date {
  const d = startOfDay(day);
  d.setMinutes(minute);
  return d;
}

export function hhmm(minute: number): string {
  const h = Math.floor(minute / 60);
  const m = Math.round(minute % 60);
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

export function shortDate(date: Date): string {
  return `${date.getDate()} ${monthShort[date.getMonth()]}`;
}

export function dayDate(date: Date): string {
  return `${dayShort[date.getDay()]} ${date.getDate()} ${monthShort[date.getMonth()]}`;
}

export function longDate(date: Date): string {
  return `${dayNames[date.getDay()]} ${date.getDate()} ${monthLong[date.getMonth()]}`;
}

export function monthName(date: Date): string {
  return monthShort[date.getMonth()];
}

/** "today", "tomorrow", "this Sunday", "next Tuesday", "Sat 5 Dec". */
export function relativeDay(target: Date, now: Date): string {
  const diff = daysBetween(now, target);
  if (diff === 0) return "today";
  if (diff === 1) return "tomorrow";
  if (diff === -1) return "yesterday";
  const daysToSunday = (7 - now.getDay()) % 7;
  if (diff > 1 && diff <= daysToSunday) return `this ${dayNames[target.getDay()]}`;
  if (diff > daysToSunday && diff <= daysToSunday + 7) return `next ${dayNames[target.getDay()]}`;
  return dayDate(target);
}

/** The best moment to post ahead of a target day: 11:00 two days before, never in the past. */
export function postSlot(target: Date, now: Date, leadDays = 2, minute = 11 * 60): { at: Date; label: string } {
  let at = atMinute(addDays(startOfDay(target), -leadDays), minute);
  if (at.getTime() <= now.getTime()) {
    at = atMinute(startOfDay(now), Math.max(minute, minuteOfDay(now) + 30));
    if (minuteOfDay(at) > 20 * 60) at = atMinute(addDays(startOfDay(now), 1), minute);
  }
  const rel = relativeDay(at, now);
  const day = rel === "today" ? "Today" : rel === "tomorrow" ? "Tomorrow" : dayNames[at.getDay()];
  return { at, label: `${day} ${hhmm(minuteOfDay(at))}` };
}

export function lastFridayOfMonth(year: number, month: number): Date {
  const last = new Date(year, month + 1, 0);
  const back = (last.getDay() - 5 + 7) % 7;
  return new Date(year, month, last.getDate() - back);
}

export function greetingFor(now: Date): string {
  const h = now.getHours();
  if (h < 12) return "Good morning";
  if (h < 18) return "Good afternoon";
  return "Good evening";
}
