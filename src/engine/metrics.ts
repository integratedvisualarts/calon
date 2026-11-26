/**
 * Metrics. Everything here reads orders and nothing else: the same code runs on the simulated
 * till and on a restaurant's own imported sales.
 */

import { addDays, dateKey, dayShort, minuteOfDay, parseKey, startOfDay } from "./dates";
import { activeOn, fit, weatherOn } from "./signals";
import type { CalendarEntry, Channel, Confidence, MenuItem, Order, Workspace } from "./types";

export type Summary = {
  takings: number;
  covers: number;
  dineTakings: number;
  deliveryTakings: number;
  byPlatform: Record<Exclude<Channel, "dine-in">, number>;
  bookedCovers: number;
  walkInCovers: number;
  avgSpend: number;
  lunchCovers: number;
  dinnerCovers: number;
  items: Record<string, number>;
  itemRevenue: Record<string, number>;
  orders: number;
};

export function summarize(orders: Order[]): Summary {
  const s: Summary = {
    takings: 0,
    covers: 0,
    dineTakings: 0,
    deliveryTakings: 0,
    byPlatform: { deliveroo: 0, uber: 0, justeat: 0 },
    bookedCovers: 0,
    walkInCovers: 0,
    avgSpend: 0,
    lunchCovers: 0,
    dinnerCovers: 0,
    items: {},
    itemRevenue: {},
    orders: orders.length,
  };
  for (const order of orders) {
    s.takings += order.total;
    if (order.channel === "dine-in") {
      s.dineTakings += order.total;
      s.covers += order.covers;
      if (order.booked) s.bookedCovers += order.covers;
      else s.walkInCovers += order.covers;
      if (order.service === "lunch") s.lunchCovers += order.covers;
      else s.dinnerCovers += order.covers;
    } else {
      s.deliveryTakings += order.total;
      s.byPlatform[order.channel] += order.total;
    }
    for (const line of order.lines) {
      s.items[line.item] = (s.items[line.item] ?? 0) + line.qty;
      s.itemRevenue[line.item] = (s.itemRevenue[line.item] ?? 0) + line.qty * line.price;
    }
  }
  s.avgSpend = s.covers ? s.dineTakings / s.covers : 0;
  return s;
}

export type DayRow = { key: string; dow: number; summary: Summary; closed: boolean; wet: boolean; cold: boolean; entries: CalendarEntry[] };

export function byDay(ws: Workspace, orders: Order[], now: Date, days: number): DayRow[] {
  const today = startOfDay(now);
  const grouped = new Map<string, Order[]>();
  for (const order of orders) {
    const list = grouped.get(order.day);
    if (list) list.push(order);
    else grouped.set(order.day, [order]);
  }
  const rows: DayRow[] = [];
  for (let i = days; i >= 1; i--) {
    const day = addDays(today, -i);
    const key = dateKey(day);
    const weather = weatherOn(day, today);
    rows.push({
      key,
      dow: day.getDay(),
      summary: summarize(grouped.get(key) ?? []),
      closed: ws.closedDates.includes(key),
      wet: weather.wet,
      cold: weather.cold,
      entries: activeOn(ws, day).filter((entry) => fit(entry, ws) >= 0.5 && entry.kind !== "payday"),
    });
  }
  return rows;
}

export const mean = (xs: number[]) => (xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : 0);
export const sd = (xs: number[]) => {
  if (xs.length < 2) return 0;
  const m = mean(xs);
  return Math.sqrt(xs.reduce((sum, x) => sum + (x - m) ** 2, 0) / (xs.length - 1));
};

/** Ordinary days only: open, no event of note, so a baseline is a baseline. */
export function ordinary(rows: DayRow[]) {
  return rows.filter((row) => !row.closed && row.entries.length === 0 && row.summary.orders > 0);
}

export function weekdayProfile(rows: DayRow[]) {
  const base = ordinary(rows);
  return dayShort.map((label, dow) => {
    const same = base.filter((row) => row.dow === dow);
    return {
      dow,
      label,
      takings: mean(same.map((row) => row.summary.takings)),
      takingsSd: sd(same.map((row) => row.summary.takings)),
      covers: mean(same.map((row) => row.summary.covers)),
      lunch: mean(same.map((row) => row.summary.lunchCovers)),
      dinner: mean(same.map((row) => row.summary.dinnerCovers)),
      delivery: mean(same.map((row) => row.summary.deliveryTakings)),
      n: same.length,
    };
  });
}

/** What a normal day of this weekday has taken by this time of day. */
export function expectedByNow(ws: Workspace, history: Order[], now: Date, weeks = 4) {
  const minute = minuteOfDay(now);
  const today = startOfDay(now);
  const keys: string[] = [];
  for (let w = 1; keys.length < weeks && w <= weeks + 4; w++) {
    const day = addDays(today, -7 * w);
    const key = dateKey(day);
    if (ws.closedDates.includes(key)) continue;
    if (activeOn(ws, day).some((entry) => fit(entry, ws) >= 0.5 && entry.kind !== "payday" && entry.kind !== "campus")) continue;
    keys.push(key);
  }
  const partial = keys.map((key) => summarize(history.filter((order) => order.day === key && minuteOfDay(new Date(order.at)) <= minute)));
  const seated = keys.map((key) =>
    history.filter((order) => order.day === key && order.channel === "dine-in" && minuteOfDay(new Date(order.seatedAt)) <= minute).reduce((s, o) => s + o.covers, 0),
  );
  const full = keys.map((key) => summarize(history.filter((order) => order.day === key)));
  return {
    takings: mean(partial.map((s) => s.takings)),
    covers: mean(seated),
    fullDay: mean(full.map((s) => s.takings)),
    avgSpend: mean(full.map((s) => s.avgSpend)),
    weeks: keys.length,
  };
}

/** Peak windows, from where seated covers bunch over the last weeks. */
export function peakWindows(orders: Order[]) {
  const bins = new Map<number, number>();
  for (const order of orders) {
    if (order.channel !== "dine-in") continue;
    const slot = Math.floor(minuteOfDay(new Date(order.seatedAt)) / 30) * 30;
    bins.set(slot, (bins.get(slot) ?? 0) + order.covers);
  }
  const windowFor = (from: number, to: number) => {
    const slots = [...bins.entries()].filter(([m]) => m >= from && m < to).sort((a, b) => a[0] - b[0]);
    if (slots.length === 0) return null;
    const top = Math.max(...slots.map(([, c]) => c));
    const busy = slots.filter(([, c]) => c >= top * 0.6).map(([m]) => m);
    return { start: Math.min(...busy), end: Math.max(...busy) + 30 };
  };
  return { lunch: windowFor(11 * 60, 16 * 60), dinner: windowFor(16 * 60, 23 * 60) };
}

export type DishStat = {
  item: MenuItem;
  qtyWeek: number;
  revenueWeek: number;
  shareOfFood: number;
  perWeekBefore: number;
  change: number;
};

export function dishStats(ws: Workspace, orders: Order[], now: Date): DishStat[] {
  const today = startOfDay(now).getTime();
  const weekStart = today - 7 * 86_400_000;
  const beforeStart = weekStart - 28 * 86_400_000;
  const week = summarize(orders.filter((order) => order.at >= weekStart && order.at < today));
  const before = summarize(orders.filter((order) => order.at >= beforeStart && order.at < weekStart));
  const foodRevenue = ws.menu
    .filter((item) => item.course !== "drink")
    .reduce((sum, item) => sum + (week.itemRevenue[item.id] ?? 0), 0);
  return ws.menu.map((item) => {
    const qtyWeek = week.items[item.id] ?? 0;
    const perWeekBefore = (before.items[item.id] ?? 0) / 4;
    return {
      item,
      qtyWeek,
      revenueWeek: week.itemRevenue[item.id] ?? 0,
      shareOfFood: item.course === "drink" || !foodRevenue ? 0 : (week.itemRevenue[item.id] ?? 0) / foodRevenue,
      perWeekBefore,
      change: perWeekBefore ? qtyWeek / perWeekBefore - 1 : 0,
    };
  });
}

/** How wet days move the till, measured against the same weekday's dry days. */
export function weatherEffect(rows: DayRow[]) {
  const base = rows.filter((row) => !row.closed && row.entries.length === 0 && row.summary.orders > 0);
  const ratios = { wetDelivery: [] as number[], wetCovers: [] as number[] };
  for (const row of base) {
    if (!row.wet) continue;
    const dry = base.filter((other) => other.dow === row.dow && !other.wet);
    if (dry.length === 0) continue;
    const dryDelivery = mean(dry.map((d) => d.summary.deliveryTakings));
    const dryCovers = mean(dry.map((d) => d.summary.covers));
    if (dryDelivery > 0) ratios.wetDelivery.push(row.summary.deliveryTakings / dryDelivery);
    if (dryCovers > 0) ratios.wetCovers.push(row.summary.covers / dryCovers);
  }
  const deliveryLift = mean(ratios.wetDelivery) - 1;
  const coverLift = mean(ratios.wetCovers) - 1;
  const n = ratios.wetDelivery.length;
  const spread = sd(ratios.wetDelivery);
  const confidence: Confidence = n >= 12 && spread < 0.45 ? "High" : n >= 6 ? "Moderate" : "Low";
  const wetDays = base.filter((row) => row.wet);
  return {
    deliveryLift,
    coverLift,
    n,
    confidence,
    wetDeliveryAvg: mean(wetDays.map((row) => row.summary.deliveryTakings)),
    dryDeliveryAvg: mean(base.filter((row) => !row.wet).map((row) => row.summary.deliveryTakings)),
  };
}

/** Lift of a past day against the same weekday's ordinary days, for one service. */
export function liftOn(rows: DayRow[], key: string, service: "lunch" | "dinner" | "day") {
  const row = rows.find((r) => r.key === key);
  if (!row) return null;
  const same = ordinary(rows).filter((r) => r.dow === row.dow && r.key !== key && !r.wet === !row.wet);
  const pool = same.length >= 2 ? same : ordinary(rows).filter((r) => r.dow === row.dow && r.key !== key);
  const pick = (s: Summary) => (service === "lunch" ? s.lunchCovers : service === "dinner" ? s.dinnerCovers : s.covers);
  const baseline = mean(pool.map((r) => pick(r.summary)));
  const actual = pick(row.summary);
  return { actual, baseline, extra: actual - baseline, ratio: baseline ? actual / baseline - 1 : 0, n: pool.length, takings: row.summary.takings };
}

export function dayLabelKey(key: string) {
  return dayShort[parseKey(key).getDay()];
}
