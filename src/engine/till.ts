/**
 * The till. In the demo this is a simulated Square feed: seeded orders built from the real menu,
 * prices and opening hours, shaped by weekday, weather, the local calendar and past campaigns.
 * A real account swaps this for imported orders (see csv.ts) and nothing downstream changes.
 */

import { atMinute, dateKey, daysBetween, parseKey, startOfDay } from "./dates";
import { rng, type Rng } from "./random";
import { activeOn, fit, weatherOn } from "./signals";
import type { Channel, MenuItem, Order, OrderLine, Service, Workspace } from "./types";

const REFERENCE = new Date(2026, 10, 18);

function arrivalMinute(r: Rng, service: Service, open: number, close: number): number {
  // Lunch peaks 12:30–13:45, dinner 18:30–20:30. Last orders 15 minutes before close.
  const peak = service === "lunch" ? open + 60 : open + 140;
  const spread = service === "lunch" ? 45 : 70;
  for (let i = 0; i < 8; i++) {
    const m = Math.round(r.normal(peak, spread));
    if (m >= open && m <= close - 15) return m;
  }
  return r.int(open, close - 15);
}

function partySize(r: Rng, service: Service, weekend: boolean, groupBoost: number): number {
  const sizes = service === "lunch" ? [1, 2, 3, 4, 5] : [1, 2, 3, 4, 5, 6, 8];
  const base = service === "lunch" ? [0.28, 0.46, 0.13, 0.1, 0.03] : [0.07, 0.44, 0.15, 0.2, 0.06, 0.05, 0.03];
  return r.weighted(sizes, (size) => {
    const i = sizes.indexOf(size);
    const groupy = size >= 4 ? (weekend ? 1.35 : 1) * (1 + groupBoost) : 1;
    return base[i] * groupy;
  });
}

function weightFor(item: MenuItem, service: Service, weeks: number, wet: boolean, boost: string | undefined, delivery: boolean): number {
  let w = (service === "lunch" ? item.lunchWeight : item.dinnerWeight) ?? item.weight;
  w *= Math.pow(1 + (item.drift ?? 0), weeks);
  if (wet) w *= 1 + (item.comfort ?? 0) * 0.6;
  if (delivery) w *= 1 + (item.comfort ?? 0);
  if (boost && item.id === boost) w *= 2.4;
  return w;
}

function addLine(lines: OrderLine[], item: MenuItem, qty = 1) {
  const found = lines.find((line) => line.item === item.id);
  if (found) found.qty += qty;
  else lines.push({ item: item.id, qty, price: item.price });
}

function basket(r: Rng, ws: Workspace, covers: number, service: Service, weeks: number, wet: boolean, boost: string | undefined, delivery: boolean): OrderLine[] {
  const lines: OrderLine[] = [];
  const by = (course: MenuItem["course"]) => ws.menu.filter((item) => item.course === course);
  const mains = by("main");
  const starters = by("starter");
  const drinks = by("drink");
  const sides = by("side");
  const pick = (pool: MenuItem[]) => r.weighted(pool, (item) => weightFor(item, service, weeks, wet, boost, delivery));
  for (let i = 0; i < covers; i++) {
    if (r.chance(0.96)) {
      const main = pick(mains);
      addLine(lines, main);
      if (sides.length && !main.id.includes("roll") && main.id !== "thali" && r.chance(0.55)) addLine(lines, pick(sides));
    }
    const drinkChance = delivery ? 0.28 : 0.86;
    if (r.chance(drinkChance)) {
      const pool = delivery ? drinks.filter((item) => item.id !== "cobra") : drinks;
      addLine(lines, pick(pool));
      // A second round at dinner.
      if (!delivery && service === "dinner" && r.chance(0.35)) addLine(lines, pick(pool));
    }
  }
  const starterCount = Math.max(0, Math.round(covers * (delivery ? 0.45 : 0.55) + r.normal(0, 0.6)));
  for (let i = 0; i < starterCount; i++) addLine(lines, pick(starters));
  return lines;
}

const dayCache = new Map<string, Order[]>();

/** Real sales, imported from a till export or a POS API, replace the simulation for that workspace. */
const imported = new Map<string, Map<string, Order[]>>();

export function loadImportedOrders(workspaceId: string, orders: Order[]) {
  const byDay = new Map<string, Order[]>();
  for (const order of orders) {
    const list = byDay.get(order.day);
    if (list) list.push(order);
    else byDay.set(order.day, [order]);
  }
  for (const list of byDay.values()) list.sort((a, b) => a.at - b.at);
  imported.set(workspaceId, byDay);
}

export function isImported(workspaceId: string) {
  return imported.has(workspaceId);
}

/** Every order for a whole trading day. The caller hides anything after "now". */
export function ordersForDay(ws: Workspace, day: Date, today: Date): Order[] {
  const key = dateKey(day);
  const real = imported.get(ws.id);
  if (real) return real.get(key) ?? [];
  const cacheKey = `${ws.id}:${key}`;
  const hit = dayCache.get(cacheKey);
  if (hit) return hit;
  if (ws.closedDates.includes(key)) {
    dayCache.set(cacheKey, []);
    return [];
  }
  const r = rng(`${ws.id}:${key}:till`);
  const weeks = daysBetween(REFERENCE, day) / 7;
  const dow = day.getDay();
  const weekend = dow === 5 || dow === 6;
  const weather = weatherOn(day, today);
  const calendar = activeOn(ws, day);
  const growth = Math.pow(1 + ws.weeklyGrowth, weeks);

  const orders: Order[] = [];
  let seq = 0;
  const services: Service[] = ["lunch", "dinner"];
  let groupBoost = 0;
  for (const entry of calendar) if (entry.tags.includes("groups")) groupBoost += Math.max(0, entry.lift) * fit(entry, ws);

  for (const service of services) {
    let covers = ws.baseCovers[dow][service] * growth;
    if (weather.wet) covers *= 0.86;
    if (weather.cold) covers *= 0.95;
    for (const entry of calendar) {
      if (entry.closed) continue;
      if (entry.service === "day" || entry.service === service) covers *= 1 + entry.lift * fit(entry, ws);
    }
    covers *= Math.max(0.6, r.normal(1, 0.1));
    const campaign = ws.campaignHistory.find((item) => item.date === key && item.service === service);
    if (campaign) covers += campaign.extraCovers;
    const boost = campaign?.item;
    const target = Math.max(0, Math.round(covers));
    const { open, close } = ws.hours[service];
    let seated = 0;
    while (seated < target) {
      const size = Math.min(partySize(r, service, weekend, groupBoost), Math.max(1, target - seated + 1));
      seated += size;
      const arrive = arrivalMinute(r, service, open, close);
      const dwell = service === "lunch" ? r.int(38, 62) : r.int(55, 95) + (size >= 4 ? 15 : 0);
      const booked = size >= 4 ? r.chance(0.85) : r.chance(service === "dinner" ? 0.55 : 0.22);
      const lines = basket(r, ws, size, service, weeks, weather.wet, boost, false);
      orders.push({
        id: `${key}-${++seq}`,
        seatedAt: atMinute(day, arrive).getTime(),
        at: atMinute(day, Math.min(arrive + dwell, close + 20)).getTime(),
        day: key,
        service,
        channel: "dine-in",
        covers: size,
        booked,
        lines,
        total: round2(lines.reduce((sum, line) => sum + line.qty * line.price, 0)),
      });
    }
  }

  let deliveries = ws.baseDelivery[dow] * growth;
  if (weather.wet) deliveries *= 1.38;
  if (weather.cold) deliveries *= 1.1;
  for (const entry of calendar) {
    if (entry.closed) continue;
    deliveries *= 1 + (entry.deliveryLift ?? 0) * fit(entry, ws);
  }
  deliveries = Math.max(0, Math.round(deliveries * Math.max(0.6, r.normal(1, 0.14))));
  const platforms = Object.keys(ws.platformMix) as Exclude<Channel, "dine-in">[];
  for (let i = 0; i < deliveries; i++) {
    const service: Service = r.chance(0.2) ? "lunch" : "dinner";
    const { open, close } = ws.hours[service];
    const placed = arrivalMinute(r, service, open, close);
    const people = r.weighted([1, 2, 3, 4], (n) => [0.35, 0.4, 0.17, 0.08][n - 1]);
    const lines = basket(r, ws, people, service, weeks, weather.wet, undefined, true);
    orders.push({
      id: `${key}-${++seq}`,
      seatedAt: atMinute(day, placed).getTime(),
      at: atMinute(day, placed + 2).getTime(),
      day: key,
      service,
      channel: r.weighted(platforms, (p) => ws.platformMix[p]),
      covers: 0,
      booked: false,
      lines,
      total: round2(lines.reduce((sum, line) => sum + line.qty * line.price, 0)),
    });
  }
  orders.sort((a, b) => a.at - b.at);
  dayCache.set(cacheKey, orders);
  return orders;
}

function round2(n: number) {
  return Math.round(n * 100) / 100;
}

/** Orders the till has recorded by "now": every past day, and today's bills already closed. */
export function tillHistory(ws: Workspace, now: Date, days: number): Order[] {
  const today = startOfDay(now);
  const out: Order[] = [];
  for (let i = days; i >= 0; i--) {
    const day = new Date(today.getFullYear(), today.getMonth(), today.getDate() - i);
    const orders = ordersForDay(ws, day, today);
    if (i === 0) out.push(...orders.filter((order) => order.at <= now.getTime()));
    else out.push(...orders);
  }
  return out;
}

/** Bookings already in the diary for a day: booked dine-in parties, whether or not they have arrived. */
export function bookingsFor(ws: Workspace, day: Date, today: Date): Order[] {
  return ordersForDay(ws, day, today).filter((order) => order.booked);
}

export function dayFromKey(key: string) {
  return parseKey(key);
}
