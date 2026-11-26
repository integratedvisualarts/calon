/** External signals: weather and the local calendar. */

import { addDays, dateKey, lastFridayOfMonth, parseKey, startOfDay } from "./dates";
import { rng } from "./random";
import type { CalendarEntry, Weather, Workspace } from "./types";

/** Cardiff monthly climate normals: mean temperature and chance of a wet day (≥1 mm). */
const normals = [
  { t: 5, wet: 0.55 },
  { t: 5.3, wet: 0.48 },
  { t: 7, wet: 0.45 },
  { t: 9, wet: 0.4 },
  { t: 12.5, wet: 0.38 },
  { t: 15, wet: 0.36 },
  { t: 17, wet: 0.38 },
  { t: 17, wet: 0.42 },
  { t: 14.5, wet: 0.43 },
  { t: 11.5, wet: 0.52 },
  { t: 8, wet: 0.55 },
  { t: 5.5, wet: 0.56 },
];

function noise(key: string, salt: string) {
  return rng(`${salt}:${key}`).normal(0, 1);
}

const weatherCache = new Map<string, Weather>();

/**
 * Daily weather for Whitchurch Road. In the demo this stands in for the Met Office feed:
 * seeded, so a past day never changes, with wet and cold spells that run for several days.
 */
export function weatherOn(date: Date, today: Date, place = "cardiff"): Weather {
  const key = dateKey(date);
  const cacheKey = `${place}:${key}:${key > dateKey(today) ? "f" : "a"}`;
  const hit = weatherCache.get(cacheKey);
  if (hit) return hit;
  let wetLatent = 0;
  let tempLatent = 0;
  let norm = 0;
  for (let k = 0; k < 7; k++) {
    const w = Math.pow(0.6, k);
    const d = dateKey(addDays(date, -k));
    wetLatent += w * noise(d, `${place}-wet`);
    tempLatent += w * noise(d, `${place}-temp`);
    norm += w * w;
  }
  wetLatent /= Math.sqrt(norm);
  tempLatent /= Math.sqrt(norm);
  const n = normals[date.getMonth()];
  // Threshold so that P(wet) matches the monthly normal.
  const threshold = inverseNormal(1 - n.wet);
  const wet = wetLatent > threshold;
  const rainMm = wet ? Math.round((1 + (wetLatent - threshold) * 7) * 10) / 10 : 0;
  const tempC = Math.round((n.t + tempLatent * 2.6) * 10) / 10;
  const cold = tempC < 4.5;
  const label = wet ? (rainMm >= 8 ? "Heavy rain" : "Showers") : cold ? "Cold and dry" : tempC > 16 ? "Warm and dry" : "Dry";
  const weather: Weather = { date: key, rainMm, tempC, wet, cold, label, forecast: key > dateKey(today) };
  weatherCache.set(cacheKey, weather);
  return weather;
}

/** Acklam's approximation, good enough for thresholds. */
function inverseNormal(p: number): number {
  const a = [-39.6968302866538, 220.946098424521, -275.928510446969, 138.357751867269, -30.6647980661472, 2.50662827745924];
  const b = [-54.4760987982241, 161.585836858041, -155.698979859887, 66.8013118877197, -13.2806815528857];
  const c = [-0.00778489400243029, -0.322396458041136, -2.40075827716184, -2.54973253934373, 4.37466414146497, 2.93816398269878];
  const d = [0.00778469570904146, 0.32246712907004, 2.445134137143, 3.75440866190742];
  const pl = 0.02425;
  if (p < pl) {
    const q = Math.sqrt(-2 * Math.log(p));
    return (((((c[0] * q + c[1]) * q + c[2]) * q + c[3]) * q + c[4]) * q + c[5]) / ((((d[0] * q + d[1]) * q + d[2]) * q + d[3]) * q + 1);
  }
  if (p > 1 - pl) return -inverseNormal(1 - p);
  const q = p - 0.5;
  const r = q * q;
  return ((((((a[0] * r + a[1]) * r + a[2]) * r + a[3]) * r + a[4]) * r + a[5]) * q) / (((((b[0] * r + b[1]) * r + b[2]) * r + b[3]) * r + b[4]) * r + 1);
}

/** Paydays are generated: the last Friday of every month. */
function paydays(from: Date, to: Date): CalendarEntry[] {
  const out: CalendarEntry[] = [];
  const cursor = new Date(from.getFullYear(), from.getMonth() - 1, 1);
  while (cursor <= to) {
    const friday = lastFridayOfMonth(cursor.getFullYear(), cursor.getMonth());
    out.push({
      id: `payday-${dateKey(friday)}`,
      name: "Payday Friday",
      kind: "payday",
      date: dateKey(friday),
      end: dateKey(addDays(friday, 1)),
      tags: ["groups"],
      lift: 0.1,
      service: "dinner",
      deliveryLift: 0.08,
      source: "Last Friday of the month",
      angle: "Payday is when groups book a table",
      hero: "thali",
    });
    cursor.setMonth(cursor.getMonth() + 1);
  }
  return out;
}

export function calendarFor(ws: Workspace, from: Date, to: Date): CalendarEntry[] {
  return [...ws.calendar, ...paydays(from, to)].filter((entry) => {
    const start = parseKey(entry.date);
    const end = parseKey(entry.end ?? entry.date);
    return end >= startOfDay(from) && start <= to;
  });
}

export function activeOn(ws: Workspace, date: Date): CalendarEntry[] {
  const key = dateKey(date);
  return calendarFor(ws, addDays(date, -40), addDays(date, 40)).filter((entry) => entry.date <= key && (entry.end ?? entry.date) >= key);
}

/** Share of a calendar entry's tags this restaurant carries. */
export function fit(entry: { tags: readonly string[] }, ws: Workspace): number {
  if (entry.tags.length === 0) return 0;
  return entry.tags.filter((tag) => ws.tags.includes(tag)).length / entry.tags.length;
}
