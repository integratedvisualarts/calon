/**
 * The snapshot: one pass that reads the till, the reviews, the weather and the calendar for a
 * workspace at a moment in time, and returns everything the screens show. Nothing in here is
 * typed in: each figure is computed, each opportunity is generated and ranked.
 *
 * Ranking: priority = 40% impact + 25% urgency + 20% fit + 15% confidence.
 */

import {
  addDays,
  atMinute,
  dateKey,
  dayDate,
  dayNames,
  dayShort,
  daysBetween,
  greetingFor,
  hhmm,
  longDate,
  minuteOfDay,
  monthName,
  parseKey,
  postSlot,
  relativeDay,
  shortDate,
  startOfDay,
} from "./dates";
import {
  byDay,
  dishStats,
  expectedByNow,
  liftOn,
  mean,
  peakWindows,
  summarize,
  weatherEffect,
  weekdayProfile,
  type DishStat,
} from "./metrics";
import { readThemes, replyDraft, reviewsUpTo, serviceLoad, themeLexicon, themeNames, type ThemeId } from "./reviews";
import { calendarFor, fit, weatherOn } from "./signals";
import { bookingsFor, ordersForDay, tillHistory } from "./till";
import { capitalise, listJoin, lowerFirst, money, moneyRange, pct, plural, round } from "./text";
import { bandLabel, seoGroupsDef, visibilityAudit, type DoneFix } from "./visibility";
import type { CalendarEntry, Confidence, MenuItem, Order, Review, Service, Weather, Workspace } from "./types";

export type OppType = "Festival" | "Event" | "Food" | "Service" | "Weather";
export type Variant = { id: string; label: string; body: string };
export type CampaignSeed = { id: string; title: string; audience: string; timing: string; variants: Variant[] };

export type EngineOpportunity = {
  id: string;
  type: OppType;
  priority: number;
  when: "week" | "coming" | "later";
  subtype: string;
  title: string;
  insight: string;
  metric: string;
  fitReason: string;
  actionLabel: string;
  tags: string[];
  featured?: boolean;
  confidence: Confidence;
  evidence: string;
  /** Rough value in pounds, used for ranking and the top card. */
  value: number;
  campaign: CampaignSeed;
};

export type SalesOpp = {
  id: string;
  priority: number;
  title: string;
  insight: string;
  metric: string;
  actionLabel: string;
  audience: string;
  timing: string;
  variants: Variant[];
};

export type Fix = {
  id: string;
  check: string;
  title: string;
  detail: string;
  priority: "High" | "Medium";
  impact: string;
  action: string;
  draftTitle: string;
  body: string;
  gain: number;
  aeo: boolean;
  seoGroup: string | null;
};

const HISTORY_DAYS = 84;
const confWeight: Record<Confidence, number> = { Low: 0.4, Moderate: 0.7, High: 1 };

const v = (straight: string, warmer: string, shorter: string): Variant[] => [
  { id: "a", label: "Straight", body: straight },
  { id: "b", label: "Warmer", body: warmer },
  { id: "c", label: "Shorter", body: shorter },
];

function rankScore(impact: number, daysToAct: number, fitShare: number, confidence: Confidence) {
  const urgency = 1 - Math.min(Math.max(daysToAct, 0), 30) / 30;
  return Math.round(100 * (0.4 * Math.min(1, Math.max(0, impact)) + 0.25 * urgency + 0.2 * fitShare + 0.15 * confWeight[confidence]));
}

function whenFor(target: Date, now: Date): EngineOpportunity["when"] {
  const diff = daysBetween(now, target);
  const toSunday = (7 - now.getDay()) % 7;
  if (diff <= toSunday) return "week";
  if (diff <= 45) return "coming";
  return "later";
}

const tagWords: Record<string, string> = {
  indian: "Indian kitchen",
  "north-indian": "North Indian menu",
  vegetarian: "veg-led menu",
  "street-food": "street food",
  chai: "chai house",
  thali: "thali",
  groups: "groups",
  students: "near campus",
  local: "local trade",
  cardiff: "Cardiff",
  delivery: "delivery",
  "south-asian": "South Asian guests",
};

function fitReason(tags: string[], ws: Workspace) {
  const words = tags.filter((tag) => ws.tags.includes(tag)).map((tag) => tagWords[tag] ?? tag);
  return `Fits: ${listJoin(Array.from(new Set(words)).slice(0, 2)) || ws.type}`;
}

function confidenceFromSample(n: number, effect: number): Confidence {
  if (n >= 6 && Math.abs(effect) >= 0.15) return "High";
  if (n >= 3) return "Moderate";
  return "Low";
}

function closedTodayKey(ws: Workspace, day: Date) {
  return ws.closedDates.includes(dateKey(day));
}

export function computeSnapshot(ws: Workspace, now: Date, done: DoneFix[] = []) {
  const today = startOfDay(now);
  const item = (id: string | undefined): MenuItem => ws.menu.find((m) => m.id === id) ?? ws.menu.find((m) => m.hero && m.course === "main") ?? ws.menu[0];
  const heroMain = item("thali");
  const history = tillHistory(ws, now, HISTORY_DAYS);
  const rows = byDay(ws, history, now, HISTORY_DAYS);
  const recentRows = rows.slice(-56);
  const profile = weekdayProfile(recentRows);
  const todayOrders = history.filter((order) => order.day === dateKey(today));
  const todaySummary = summarize(todayOrders);
  // Covers count from when a table sits down; takings count when the bill closes.
  const seatedToday = closedTodayKey(ws, today) ? [] : ordersForDay(ws, today, today).filter((o) => o.channel === "dine-in" && o.seatedAt <= now.getTime());
  const seatedCovers = seatedToday.reduce((s, o) => s + o.covers, 0);
  const seatedBooked = seatedToday.filter((o) => o.booked).reduce((s, o) => s + o.covers, 0);
  const expected = expectedByNow(ws, history, now);
  const weatherToday = weatherOn(today, today);
  const lastWeek = summarize(history.filter((order) => order.at >= today.getTime() - 7 * 86_400_000 && order.at < today.getTime()));
  const weekBefore = summarize(history.filter((order) => order.at >= today.getTime() - 14 * 86_400_000 && order.at < today.getTime() - 7 * 86_400_000));
  const dishes = dishStats(ws, history, now);
  const wx = weatherEffect(rows);
  const peaks = peakWindows(history.filter((order) => order.at >= today.getTime() - 28 * 86_400_000));
  const avgSpend = mean(recentRows.filter((row) => row.summary.covers).map((row) => row.summary.avgSpend));
  const avgDay = mean(profile.filter((p) => p.n).map((p) => p.takings));
  const minute = minuteOfDay(now);
  const open = (service: Service) => minute >= ws.hours[service].open && minute < ws.hours[service].close;
  const closedToday = ws.closedDates.includes(dateKey(today));

  // ---------- Today ----------
  const diaryToday = closedToday ? [] : bookingsFor(ws, today, today);
  const tonight = diaryToday.filter((order) => order.service === "dinner");
  const lateFrom = Math.max(atMinute(today, 19 * 60 + 30).getTime(), now.getTime());
  const lateBooked = tonight.filter((order) => order.seatedAt >= lateFrom).length;
  const openLate = Math.max(0, ws.tables - lateBooked);
  const sinceSync = now.getMinutes() % 5;
  const lastOrder = todayOrders[todayOrders.length - 1];
  const syncText = sinceSync === 0 ? "just now" : `${plural(sinceSync, "minute")} ago`;
  const vsExpected = todaySummary.takings - expected.takings;
  const phase = closedToday
    ? "closed"
    : minute < ws.hours.lunch.open
      ? "before"
      : open("lunch")
        ? "lunch"
        : minute < ws.hours.dinner.open
          ? "between"
          : open("dinner")
            ? "dinner"
            : "after";

  // ---------- Forecast: baseline weekday × measured weather effect × calendar ----------
  const forecast = Array.from({ length: 7 }, (_, i) => {
    const day = addDays(today, i + 1);
    const key = dateKey(day);
    const w = weatherOn(day, today);
    const base = profile[day.getDay()];
    if (ws.closedDates.includes(key)) return { key, day, weather: w, low: 0, high: 0, mid: 0, entries: [] as CalendarEntry[], closed: true };
    const entries = calendarFor(ws, day, day).filter((entry) => fit(entry, ws) >= 0.5 && !entry.closed);
    let mid = base.takings;
    if (w.wet) mid = mid * (1 + wx.coverLift * 0.8) + base.delivery * wx.deliveryLift;
    for (const entry of entries) mid *= 1 + entry.lift * fit(entry, ws) * (entry.service === "day" ? 1 : 0.6);
    const spread = Math.max(0.08, base.takings ? base.takingsSd / base.takings : 0.12);
    return { key, day, weather: w, low: mid * (1 - spread), high: mid * (1 + spread), mid, entries, closed: false };
  });
  const weekLow = forecast.reduce((s, d) => s + d.low, 0);
  const weekHigh = forecast.reduce((s, d) => s + d.high, 0);

  // ---------- Staffing ----------
  const staffing = dayShort.map((label, dow) => {
    const days = recentRows.filter((row) => row.dow === dow && !row.closed && row.summary.orders);
    const loads = days.map((row) => {
      const orders = history.filter((order) => order.day === row.key);
      return { lunch: serviceLoad(ws, orders, "lunch", dow), dinner: serviceLoad(ws, orders, "dinner", dow) };
    });
    const lunch = mean(loads.map((l) => l.lunch));
    const dinner = mean(loads.map((l) => l.dinner));
    const rota = ws.rota[dow];
    let read = "Rota matches the covers";
    let flag: "light" | "heavy" | null = null;
    if (dinner > 1.08) {
      read = `One server light, ${peaks.dinner ? `${hhmm(peaks.dinner.start)}–${hhmm(peaks.dinner.end)}` : "at the dinner peak"}`;
      flag = "light";
    } else if (lunch < 0.45 && dinner < 0.75 && rota.floor >= 4) {
      read = "One floor over between services, unless lunch runs";
      flag = "heavy";
    }
    return { dow, label, floor: rota.floor, kitchen: rota.kitchen, lunchLoad: lunch, dinnerLoad: dinner, read, flag };
  });

  // ---------- Reviews ----------
  const reviewsAll = reviewsUpTo(ws, now);
  const generated = reviewsAll.length;
  const ratingSum = ws.reviewBaseline.count * ws.reviewBaseline.average + reviewsAll.reduce((s, r) => s + r.stars, 0);
  const reviewCount = ws.reviewBaseline.count + generated;
  const rating = Math.round((ratingSum / reviewCount) * 10) / 10;
  const monday = addDays(today, -((today.getDay() + 6) % 7));
  const newSince = reviewsAll.filter((r) => r.at >= monday.getTime());
  const sinceLabel = daysBetween(monday, today) === 0 ? "today" : "Monday";
  const ratingAt = (at: Date) => {
    const upto = reviewsAll.filter((r) => r.at <= at.getTime());
    return Math.round(((ws.reviewBaseline.count * ws.reviewBaseline.average + upto.reduce((s, r) => s + r.stars, 0)) / (ws.reviewBaseline.count + upto.length)) * 10) / 10;
  };
  const reviewTrend = [2, 1, 0].map((back) => {
    const end = back === 0 ? now : new Date(today.getFullYear(), today.getMonth() - back + 1, 0, 23, 59);
    return { n: monthName(end), v: ratingAt(end) };
  });
  const windowMs = 56 * 86_400_000;
  const recentReviews = reviewsAll.filter((r) => r.at > now.getTime() - windowMs);
  const priorReviews = reviewsAll.filter((r) => r.at <= now.getTime() - windowMs && r.at > now.getTime() - 2 * windowMs);
  const sentenceWith = (text: string, id: ThemeId) =>
    text.split(/(?<=\.)\s+/).find((s) => themeLexicon[id].words.some((w) => s.toLowerCase().includes(w))) ?? text;
  const themeIds = Object.keys(themeLexicon) as ThemeId[];
  const busiestDayFor = (list: Review[]) => {
    const counts = [0, 0, 0, 0, 0, 0, 0];
    for (const r of list) counts[parseKey(r.visitDay).getDay()]++;
    const max = Math.max(...counts);
    return { dow: counts.indexOf(max), count: max };
  };
  const themes = themeIds
    .map((id) => {
      const hits = recentReviews.filter((r) => readThemes(r.text).includes(id));
      const prior = priorReviews.filter((r) => readThemes(r.text).includes(id)).length;
      const tone = themeLexicon[id].tone;
      const count = hits.length;
      const trend = prior === 0 && count >= 2 ? "New" : count >= prior * 1.3 && count >= prior + 2 ? "Rising" : count <= prior * 0.7 && prior - count >= 2 ? "Falling" : "Stable";
      const severity = tone === "up" ? "Low" : count >= 5 ? "High" : count >= 3 ? "Medium" : "Low";
      const busiest = busiestDayFor(hits);
      return { id, name: themeNames[id], count, prior, tone, trend, severity, hits, busiest };
    })
    .filter((t) => t.count > 0);
  const replyNeeded = reviewsAll.filter((r) => r.at > now.getTime() - 14 * 86_400_000).sort((a, b) => a.stars - b.stars || b.at - a.at);
  const whenLabel = (r: Review) => {
    const rel = relativeDay(new Date(r.at), now);
    return rel === "today" || rel === "yesterday" ? capitalise(rel) : dayDate(new Date(r.at));
  };

  // ---------- Visibility ----------
  const audit = visibilityAudit(ws, reviewsAll, now, done);

  // ---------- Opportunities ----------
  const opportunities: EngineOpportunity[] = [];
  const horizon = addDays(today, 220);
  const entries = calendarFor(ws, today, horizon).filter((entry) => (entry.end ?? entry.date) >= dateKey(today));
  const groupsAudience = ws.audiences.groups;

  for (const entry of entries) {
    const share = fit(entry, ws);
    if (share < 0.5 || entry.closed) continue;
    const isFestival = entry.kind === "festival" || entry.kind === "season";
    const isEvent = entry.kind === "event" || entry.kind === "payday" || entry.kind === "campus";
    if (!isFestival && !isEvent) continue;
    const start = parseKey(entry.date);
    const target = start < today ? today : start;
    if (ws.closedDates.includes(dateKey(target))) continue;
    const daysUntil = daysBetween(today, target);
    if (isEvent && daysUntil > 35) continue;
    const service: Service = entry.service === "lunch" ? "lunch" : "dinner";
    const base = profile[target.getDay()][service] || mean(profile.map((p) => p[service]));
    // A past occurrence of the same festival in the till beats the calendar's prior.
    const pastSame = rows
      .flatMap((row) => row.entries.filter((e) => e.name === entry.name && e.id !== entry.id).map(() => row.key))
      .map((key) => liftOn(rows, key, service))
      .filter((x): x is NonNullable<typeof x> => !!x);
    const measured = pastSame[0];
    const ratio = measured ? measured.ratio : entry.lift * share;
    const days = entry.kind === "season" && entry.end ? Math.max(1, Math.min(7, daysBetween(target, parseKey(entry.end)) + 1)) : 1;
    const extra = base * ratio * days;
    const confidence: Confidence = measured ? confidenceFromSample(measured.n, measured.ratio) : entry.provisional ? "Low" : "Moderate";
    const hero = item(entry.hero);
    const lead = entry.kind === "season" ? 10 : Math.abs(entry.lift) >= 0.2 ? 6 : 3;
    const startsAt = entry.time ? atMinute(target, Number(entry.time.slice(0, 2)) * 60 + Number(entry.time.slice(3, 5))) : null;
    const slot =
      daysUntil === 0 && startsAt
        ? { at: now, label: now < startsAt ? `Now, before ${hhmm(minuteOfDay(startsAt))}` : "Now" }
        : postSlot(target, now, Math.min(lead, Math.max(daysUntil - 1, 0)));
    const rel = relativeDay(target, now);
    const relWord = rel.startsWith("this") || rel.startsWith("next") || rel === "today" || rel === "tomorrow";
    const dateText = relWord ? `${rel}, ${shortDate(target)}` : longDate(target);
    const valuePounds = extra * avgSpend;

    if (entry.kind === "campus" && ratio < 0) {
      const lost = Math.abs(extra);
      opportunities.push({
        id: `event-${entry.id}`,
        type: "Event",
        priority: rankScore(lost * avgSpend / (avgDay || 1), daysUntil - 3, share, confidence),
        when: whenFor(target, now),
        subtype: "Campus",
        title: `${entry.venue ?? "Campus"} empties from ${dayDate(start)}`,
        insight: `${entry.name} runs ${dayDate(start)} to ${dayDate(parseKey(entry.end ?? entry.date))}. Expect about ${Math.round(lost)} fewer covers a day. Lean on delivery and locals, not students.`,
        metric: `−${Math.round(lost)} covers a day`,
        fitReason: fitReason(entry.tags, ws),
        actionLabel: "Plan the quiet weeks",
        tags: entry.tags,
        confidence,
        evidence: entry.source,
        value: lost * avgSpend,
        campaign: {
          id: `opp-${entry.id}`,
          title: "Locals while campus is away",
          audience: ws.audiences.local,
          timing: slot.label,
          variants: v(
            `${ws.street} stays open while campus is away. ${hero.name} and masala chai, lunch and dinner. Walk in or book.`,
            `Still here when the students go home. Come in for ${lowerFirst(hero.name)} and a masala chai on ${ws.street}.`,
            `${ws.street}, open as usual. ${hero.name} and masala chai.`,
          ),
        },
      });
      continue;
    }

    const lowC = Math.max(1, Math.round(extra * 0.7));
    const highC = Math.max(lowC + 2, Math.round(extra * 1.3));
    const evidence = measured
      ? `Last ${entry.name} here ran ${pct(measured.ratio, true)} on ${service} covers against ${plural(measured.n, `ordinary ${dayNames[parseKey(entry.date).getDay()]}`)}`
      : `${entry.source}${entry.provisional ? ", date provisional" : ""}`;
    const at = entry.time ? `, ${entry.time}` : "";
    const where = entry.venue && !entry.name.includes(entry.venue.split(" ").pop() ?? "~") ? ` at ${entry.venue}` : "";
    const distance = entry.miles ? `, ${entry.miles} miles away` : "";
    const type: OppType = isFestival ? "Festival" : "Event";
    const name = entry.name;
    const title =
      entry.kind === "season"
        ? `${name.replace(" season", "")} tables, booked early`
        : entry.kind === "payday"
          ? `Payday ${dayNames[start.getDay()]}, the ${lowerFirst(hero.name)} for four`
          : entry.angle && entry.miles
            ? `Hold early tables before the ${name.split(",")[0].replace(/^Diwali /, "") .toLowerCase()}`
            : `${name}, the ${lowerFirst(hero.name)}`;
    const insight = `${entry.kind === "season" ? `${name} starts` : name}${where}${distance}, ${dateText}${at}. ${entry.angle ? `${entry.angle}.` : ""} ${
      measured ? `Last time it added ${Math.round(measured.extra)} ${service} covers here.` : `A normal ${dayNames[target.getDay()]} ${service} is ${Math.round(base)} covers.`
    }`.replace(/\s+/g, " ").trim();
    const timeLine = service === "lunch" ? `from ${hhmm(ws.hours.lunch.open)}` : `from ${hhmm(ws.hours.dinner.open)}`;
    opportunities.push({
      id: `${type.toLowerCase()}-${entry.id}`,
      type,
      priority: rankScore(valuePounds / (avgDay || 1), daysUntil - lead, share, confidence),
      when: whenFor(target, now),
      subtype: entry.kind === "season" ? "Season" : entry.kind === "payday" ? "Payday" : entry.provisional ? `${dayDate(start)} · provisional` : entry.miles ? "Local event" : dayDate(start),
      title,
      insight,
      metric: `+${lowC}–${highC} covers${entry.kind === "season" ? " a week" : ""}`,
      fitReason: fitReason(entry.tags, ws),
      actionLabel: entry.kind === "season" ? "Open party bookings" : type === "Festival" ? "Start festival prep" : entry.kind === "payday" ? "Plan payday push" : "Plan the night",
      tags: entry.tags,
      confidence,
      evidence,
      value: valuePounds,
      campaign: {
        id: `opp-${entry.id}`,
        title:
          entry.kind === "season"
            ? `${name.replace(" party season", "").replace(" season", "")} party ${hero.name.split(" ").pop()?.toLowerCase()}`
            : entry.miles
              ? `${dayNames[target.getDay()]} ${hero.name.split(" ").pop()?.toLowerCase()}, before the ${name.split(",")[0].split(" ").pop()?.toLowerCase()}`
              : `${name}: ${lowerFirst(hero.name)}`,
        audience: entry.tags.includes("groups") || entry.kind === "season" ? groupsAudience : ws.audiences.past,
        timing: slot.label,
        variants: v(
          `${name} ${rel === "today" ? "is today" : `is ${rel}`}. ${hero.name} ${timeLine} on ${ws.street}. Reply to book.`,
          `${entry.angle ?? `Make ${name} a table out`}. Come to ${ws.name}: the ${lowerFirst(hero.name)} is the easy order and the masala chai is on. Reply and we’ll hold a table.`,
          `${name}. ${hero.name} ${timeLine}. ${ws.street}. Reply to book.`,
        ),
      },
    });
  }

  // Food: best seller, quiet seller, riser, faller. All from item sales.
  const mains = dishes.filter((d) => d.item.course === "main");
  const best = [...mains].sort((a, b) => b.revenueWeek - a.revenueWeek)[0];
  const courses = ["drink", "starter", "main"] as const;
  const lowCandidates: { stat: DishStat; vsTop: DishStat }[] = [];
  for (const course of courses) {
    const pool = dishes.filter((d) => d.item.course === course);
    if (pool.length < 3) continue;
    const top = [...pool].sort((a, b) => b.qtyWeek - a.qtyWeek)[0];
    const low = [...pool].sort((a, b) => a.qtyWeek / (top.qtyWeek || 1) - b.qtyWeek / (top.qtyWeek || 1))[0];
    lowCandidates.push({ stat: low, vsTop: top });
  }
  const lowSeller = lowCandidates.sort((a, b) => a.stat.qtyWeek / (a.vsTop.qtyWeek || 1) - b.stat.qtyWeek / (b.vsTop.qtyWeek || 1))[0];
  const movers = dishes.filter((d) => d.perWeekBefore >= 8 && d.item.course !== "side");
  const riser = [...movers].sort((a, b) => b.change - a.change)[0];
  const faller = [...movers].sort((a, b) => a.change - b.change)[0];
  const nextThu = postSlot(addDays(today, 3), now, 1);
  if (best) {
    const top2 = [...mains].sort((a, b) => b.revenueWeek - a.revenueWeek).slice(0, 2);
    const share2 = top2.reduce((s, d) => s + d.shareOfFood, 0);
    opportunities.push({
      id: "food-best",
      type: "Food",
      priority: rankScore((best.revenueWeek * 0.1) / (avgDay || 1) + 0.25, 3, 1, "High"),
      when: "week",
      subtype: "Best seller",
      title: `Lead with the ${lowerFirst(best.item.name)}`,
      insight: `The ${lowerFirst(best.item.name)} is ${pct(best.shareOfFood)} of food sales this week, ${best.qtyWeek} sold. With the ${lowerFirst(top2[1]?.item.name ?? "")} that is ${pct(share2)}. It is what the room already orders.`,
      metric: `${pct(best.shareOfFood)} of food`,
      fitReason: fitReason(["vegetarian", "thali"], ws),
      actionLabel: `Push the ${best.item.name.split(" ").pop()?.toLowerCase()}`,
      tags: ["vegetarian"],
      confidence: "High",
      evidence: `Item sales, last 7 days against the 4 weeks before`,
      value: best.revenueWeek * 0.1,
      campaign: {
        id: "opp-food-best",
        title: `Lead with the ${lowerFirst(best.item.name)}`,
        audience: groupsAudience,
        timing: nextThu.label,
        variants: v(
          `The ${lowerFirst(best.item.name)} is what the room actually orders. ${money(best.item.price, true)}, on ${ws.street}. Reply to book.`,
          `If you’re feeding a group, the ${lowerFirst(best.item.name)} is the order the kitchen already knows. We’ll keep a table if you reply.`,
          `${best.item.name}. ${ws.street}. Reply to book.`,
        ),
      },
    });
  }
  if (lowSeller) {
    const s = lowSeller.stat;
    const top = lowSeller.vsTop;
    opportunities.push({
      id: "food-low",
      type: "Food",
      priority: rankScore(0.25, 2, 1, "High") + 4,
      when: "week",
      subtype: "Low seller",
      title: `The ${lowerFirst(s.item.name)} is the quiet one`,
      insight: `${s.qtyWeek} ${lowerFirst(s.item.name)} this week against ${top.qtyWeek} ${lowerFirst(top.item.name)}. It is the slowest ${s.item.course} on the menu. Pair it with what already sells, or take it off.`,
      metric: `${s.qtyWeek} sold`,
      fitReason: fitReason(["indian", "chai"], ws),
      actionLabel: `Boost the ${s.item.name.split(" ").pop()?.toLowerCase()}`,
      tags: ["indian"],
      confidence: "High",
      evidence: "Item sales, last 7 days",
      value: s.item.price * top.qtyWeek * 0.1,
      campaign: {
        id: "opp-food-low",
        title: `${s.item.name}, with the ${lowerFirst(top.item.name)}`,
        audience: ws.audiences.past,
        timing: "This week",
        variants: v(
          `${s.item.name} with ${lowerFirst(top.item.name)}. Both are on at ${ws.name}, ${ws.street}. Walk in or reply to book.`,
          `If you already come for the ${lowerFirst(top.item.name)}, the ${lowerFirst(s.item.name)} is the one to try next.`,
          `${s.item.name} and ${lowerFirst(top.item.name)}. ${ws.street}.`,
        ),
      },
    });
  }
  if (riser && riser.change >= 0.1) {
    opportunities.push({
      id: "food-rising",
      type: "Food",
      priority: rankScore(0.2, 4, 1, riser.change > 0.2 ? "High" : "Moderate"),
      when: "week",
      subtype: "Rising",
      title: `${riser.item.name} is climbing`,
      insight: `${riser.qtyWeek} sold this week against ${Math.round(riser.perWeekBefore)} a week over the month before, ${pct(riser.change, true)}. Put it where people decide: the first line of the post.`,
      metric: pct(riser.change, true),
      fitReason: fitReason(["street-food", "indian"], ws),
      actionLabel: "Ride the trend",
      tags: ["street-food"],
      confidence: riser.change > 0.2 ? "High" : "Moderate",
      evidence: "Item sales, last 7 days against the 4 weeks before",
      value: riser.item.price * riser.qtyWeek * 0.15,
      campaign: {
        id: "opp-food-rising",
        title: `${riser.item.name}, while it’s moving`,
        audience: ws.audiences.local,
        timing: nextThu.label,
        variants: v(
          `${riser.item.name} is the one guests keep ordering. ${money(riser.item.price, true)}, ${ws.street}.`,
          `Everyone’s been asking for the ${lowerFirst(riser.item.name)} lately. Come and see why, on ${ws.street}.`,
          `${riser.item.name}. ${money(riser.item.price, true)}. ${ws.street}.`,
        ),
      },
    });
  }
  if (faller && faller.change <= -0.1) {
    opportunities.push({
      id: "food-falling",
      type: "Food",
      priority: rankScore(0.15, 7, 1, "Moderate"),
      when: "week",
      subtype: "Slipping",
      title: `${faller.item.name} is slipping`,
      insight: `${faller.qtyWeek} sold this week against ${Math.round(faller.perWeekBefore)} a week before, ${pct(faller.change, true)}. Check the plate before you promote it.`,
      metric: pct(faller.change, true),
      fitReason: fitReason(["indian"], ws),
      actionLabel: "Re-feature it",
      tags: ["indian"],
      confidence: "Moderate",
      evidence: "Item sales, last 7 days against the 4 weeks before",
      value: faller.item.price * faller.perWeekBefore * 0.1,
      campaign: {
        id: "opp-food-falling",
        title: `${faller.item.name}, back on the table`,
        audience: ws.audiences.past,
        timing: "This week",
        variants: v(
          `${faller.item.name} is on at ${ws.name}. ${money(faller.item.price, true)}, ${ws.street}.`,
          `An old favourite: the ${lowerFirst(faller.item.name)}. Come back for it this week.`,
          `${faller.item.name}. ${ws.street}.`,
        ),
      },
    });
  }

  // Service: themes and the latest low-star review.
  const lowStar = reviewsAll.filter((r) => r.stars <= 3 && r.at > now.getTime() - 14 * 86_400_000)[0];
  for (const theme of themes) {
    const busyDay = dayNames[theme.busiest.dow];
    if (theme.tone === "down" && theme.count >= 2) {
      const load = staffing[theme.busiest.dow].dinnerLoad;
      const speed = theme.id === "speed";
      const insight = speed
        ? `${plural(theme.count, "review")} in 8 weeks mention waiting, ${theme.busiest.count} after a ${busyDay}. ${busyDay} dinner peaks at ${pct(load)} of what ${ws.rota[theme.busiest.dow].floor} on the floor can carry.`
        : `${plural(theme.count, "review")} in 8 weeks mention ${lowerFirst(theme.name)}${theme.trend === "New" ? ", none in the 8 weeks before" : theme.trend === "Rising" ? `, up from ${theme.prior}` : ""}.`;
      const conf: Confidence = theme.count >= 5 ? "High" : theme.count >= 3 ? "Moderate" : "Low";
      opportunities.push({
        id: `service-${theme.id}`,
        type: "Service",
        priority:
          rankScore((theme.count * avgSpend * 2) / (avgDay || 1), 2, 1, conf) +
          (theme.trend === "Rising" || theme.trend === "New" ? 6 : theme.trend === "Falling" ? -15 : 0),
        when: "week",
        subtype: theme.name,
        title: speed
          ? `${busyDay} waits are showing in reviews`
          : theme.id === "packaging"
            ? theme.trend === "Falling"
              ? "Delivery lid complaints are easing"
              : "Delivery lids are letting go"
            : "Say what the lunch roll includes",
        insight,
        metric: plural(theme.count, "review"),
        fitReason: speed ? `Fits: the ${lowerFirst(heroMain.name)} is the faster order` : `Fits: ${theme.id === "packaging" ? "delivery" : "lunch trade"}`,
        actionLabel: speed ? `Fix ${busyDay}s` : "Reply and fix",
        tags: ["indian"],
        confidence: conf,
        evidence: `Google reviews, last 8 weeks against the 8 before`,
        value: theme.count * avgSpend,
        campaign: {
          id: `opp-service-${theme.id}`,
          title: speed ? `A note about ${busyDay} waits` : theme.id === "packaging" ? "Delivery packing note" : "What the lunch roll includes",
          audience: speed ? `People booking ${busyDay}` : theme.id === "packaging" ? ws.audiences.delivery : ws.audiences.local,
          timing: postSlot(addDays(today, ((theme.busiest.dow - today.getDay() + 7) % 7) || 7), now, 1).label,
          variants: speed
            ? v(
                `${busyDay} service can run long. If you book the ${lowerFirst(heroMain.name)}, the kitchen already knows the order and the wait is shorter.`,
                `We’d rather you knew: busy ${busyDay}s have kept people waiting. The ${lowerFirst(heroMain.name)} is the calmer way through the evening.`,
                `Busy ${busyDay}? The ${lowerFirst(heroMain.name)} is the quicker order.`,
              )
            : theme.id === "packaging"
              ? v(
                  `Delivery lids are taped before they leave ${ws.street}. If a bag still leaks, tell us and we’ll replace that dish.`,
                  `We heard you about the lids. Every pot is taped now before the rider leaves ${ws.street}.`,
                  `Lids taped, every order. Tell us if one leaks.`,
                )
              : v(
                  `The lunch kathi roll comes as listed: the wrap and its sides. That is the portion, stated up front.`,
                  `Lunch on ${ws.street}: the kathi roll, with what comes with it written on the board.`,
                  `Kathi roll, as listed. ${ws.street}.`,
                ),
        },
      });
    } else if (theme.tone === "up" && theme.count >= 4) {
      opportunities.push({
        id: `service-${theme.id}`,
        type: "Service",
        priority: rankScore(0.1, 6, 1, "Moderate"),
        when: "week",
        subtype: theme.name,
        title: theme.id === "welcome" ? "Guests name the welcome" : "Guests name the chai and the chaat",
        insight: `${plural(theme.count, "review")} in 8 weeks praise ${theme.id === "welcome" ? "the welcome" : "the masala chai or the chaat"}. It is the line to reuse, not a new promise.`,
        metric: plural(theme.count, "review"),
        fitReason: theme.id === "welcome" ? "Fits: a room that looks after groups" : "Fits: chai house",
        actionLabel: "Share what they say",
        tags: ["indian"],
        confidence: "Moderate",
        evidence: "Google reviews, last 8 weeks",
        value: theme.count * 5,
        campaign: {
          id: `opp-service-${theme.id}`,
          title: theme.id === "welcome" ? "The welcome line" : "What guests come back for",
          audience: ws.audiences.past,
          timing: "This week",
          variants:
            theme.id === "welcome"
              ? v(
                  `The room is looked after. ${heroMain.name} and masala chai, ${ws.street}.`,
                  `People stay because the welcome is warm. If you’re in, the ${lowerFirst(heroMain.name)} is the easy order.`,
                  `A warm room. ${heroMain.name}. ${ws.street}.`,
                )
              : v(
                  `Guests come back for the masala chai and the samosa chaat. Both are on this week, ${ws.street}.`,
                  `“Came back for the chai.” We hear it a lot. Come and find out why.`,
                  `Masala chai. Samosa chaat. ${ws.street}.`,
                ),
        },
      });
    }
  }
  if (lowStar) {
    opportunities.push({
      id: `service-review-${lowStar.id}`,
      type: "Service",
      priority: rankScore(0.3, 0, 1, "High") + 5,
      when: "week",
      subtype: "Needs a reply",
      title: `${lowStar.name} left ${plural(lowStar.stars, "star")}`,
      insight: `${whenLabel(lowStar)}: “${(() => {
        const sentences = lowStar.text.split(/(?<=\.)\s+/);
        const negative = sentences.filter((line) => readThemes(line).some((id) => themeLexicon[id].tone === "down"));
        return (negative.length ? negative : sentences.slice(-2)).join(" ");
      })()}” A reply within a day is what the next guest reads.`,
      metric: `${lowStar.stars} stars`,
      fitReason: "Fits: replies are read before bookings",
      actionLabel: "Reply now",
      tags: ["indian"],
      confidence: "High",
      evidence: "Google reviews",
      value: avgSpend * 2,
      campaign: {
        id: `opp-reply-${lowStar.id}`,
        title: `Reply to ${lowStar.name}`,
        audience: "Google reviews",
        timing: "Today",
        variants: v(replyDraft(lowStar, ws), replyDraft(lowStar, ws).replace("Thank you for saying so", "We’re sorry"), `Thank you, ${lowStar.name}. We’ve taken this to the team.`),
      },
    });
  }

  // Weather: forecast set against the measured wet-day effect.
  const wetDays = forecast.filter((d) => d.weather.wet && !d.closed);
  const dryWeekend = forecast.filter((d) => !d.weather.wet && (d.day.getDay() === 6 || d.day.getDay() === 5) && !d.closed);
  if (wetDays.length) {
    const run = wetDays.slice(0, 3);
    const names = run.map((d) => dayNames[d.day.getDay()]);
    const extra = run.reduce((s, d) => s + profile[d.day.getDay()].delivery * wx.deliveryLift, 0);
    const first = run[0].day;
    const deliveryOrders = history.filter((o) => o.channel !== "dine-in" && o.at >= today.getTime() - 28 * 86_400_000);
    const orderValue = mean(deliveryOrders.map((o) => o.total)) || 20;
    const cap = Math.max(10, round(mean(run.map((d) => profile[d.day.getDay()].delivery)) * (1 + wx.deliveryLift) / orderValue * 1.15, 5));
    opportunities.push({
      id: "weather-wet",
      type: "Weather",
      priority: rankScore(extra / (avgDay || 1) + 0.15, daysBetween(today, first) - 1, 1, wx.confidence),
      when: whenFor(first, now),
      subtype: run.some((d) => d.weather.label === "Heavy rain") ? "Heavy rain" : "Showers",
      title: `${run.some((d) => d.weather.label === "Heavy rain") ? "Rain" : "Showers"} ${listJoin(names)}`,
      insight: `Wet days here run delivery ${pct(wx.deliveryLift, true)} against dry ones (${money(wx.wetDeliveryAvg)} against ${money(wx.dryDeliveryAvg)}, ${plural(wx.n, "wet day")} measured). Room covers dip ${pct(Math.abs(wx.coverLift))}.`,
      metric: `+${moneyRange(extra * 0.75, extra * 1.25)}`,
      fitReason: fitReason(["delivery", "chai"], ws),
      actionLabel: "Prep wet-day delivery",
      tags: ["delivery"],
      confidence: wx.confidence,
      evidence: `Met Office forecast, set against ${plural(wx.n, "wet day")} in your till`,
      value: extra,
      campaign: {
        id: "opp-weather-wet",
        title: "Rainy-day choley and chai",
        audience: ws.audiences.delivery,
        timing: postSlot(first, now, 0, 15 * 60).label,
        variants: v(
          `Rain is due ${listJoin(names.map((n) => n))}. Choley batura, a vegetable curry and masala chai are on for delivery. We can take ${cap} orders.`,
          `Stay in the dry. We’ll send choley and chai to your door from ${ws.street}, while ${cap} portions last.`,
          `Wet ${names[0]}. Choley and chai, delivered. ${cap} orders.`,
        ),
      },
    });
  }
  if (dryWeekend.length) {
    const d = dryWeekend[dryWeekend.length - 1];
    const base = profile[d.day.getDay()];
    opportunities.push({
      id: "weather-dry",
      type: "Weather",
      priority: rankScore(0.18, daysBetween(today, d.day) - 2, 1, wx.confidence),
      when: whenFor(d.day, now),
      subtype: d.weather.cold ? "Cold and dry" : "Dry",
      title: `Dry ${dayNames[d.day.getDay()]}: sell the room`,
      insight: `${capitalise(relativeDay(d.day, now))} looks dry, ${Math.round(d.weather.tempC)}°C. Dry ${dayNames[d.day.getDay()]}s here average ${Math.round(base.covers)} covers. Ask people to sit down, not order in.`,
      metric: `${Math.round(base.covers)} covers`,
      fitReason: fitReason(["groups", "thali"], ws),
      actionLabel: "Keep it seated",
      tags: ["groups"],
      confidence: wx.confidence,
      evidence: "Met Office forecast and your weekday averages",
      value: base.takings * 0.05,
      campaign: {
        id: "opp-weather-dry",
        title: `${dayNames[d.day.getDay()]}, in the room`,
        audience: ws.audiences.past,
        timing: postSlot(d.day, now, 2).label,
        variants: v(
          `${dayNames[d.day.getDay()]} is a sit-down day. The ${lowerFirst(heroMain.name)} is on from ${hhmm(ws.hours.dinner.open)}, ${ws.street}. Reply to book.`,
          `Come in for ${dayNames[d.day.getDay()]}, don’t have it on the sofa. We’ll hold a table from ${hhmm(ws.hours.dinner.open)} if you reply.`,
          `${dayNames[d.day.getDay()]}, in the room. ${heroMain.name} from ${hhmm(ws.hours.dinner.open)}.`,
        ),
      },
    });
  }

  // Featured = best in each type.
  for (const type of ["Festival", "Event", "Food", "Service", "Weather"] as OppType[]) {
    const pool = opportunities.filter((o) => o.type === type).sort((a, b) => b.priority - a.priority);
    if (pool[0]) pool[0].featured = true;
  }
  opportunities.sort((a, b) => b.priority - a.priority);

  // ---------- Sales opportunities ----------
  const sittings = profile.flatMap((p) => (["lunch", "dinner"] as const).map((service) => ({ dow: p.dow, service, covers: p[service] })));
  const quiet = [...sittings].filter((s) => s.covers > 0).sort((a, b) => a.covers - b.covers)[0];
  const typicalSitting = mean(sittings.filter((s) => s.service === quiet.service && s.covers > 0).map((s) => s.covers));
  const strongest = [...profile].sort((a, b) => b.takings - a.takings)[0];
  const weakestDay = [...profile].filter((p) => p.n).sort((a, b) => a.takings - b.takings)[0];
  const deliveryShareToday = todaySummary.takings ? todaySummary.deliveryTakings / todaySummary.takings : 0;
  const deliveryShareUsual = mean(recentRows.filter((r) => r.summary.takings).map((r) => r.summary.deliveryTakings / r.summary.takings));
  const nextQuiet = addDays(today, ((quiet.dow - today.getDay() + 7) % 7) || 7);
  const salesOpps: SalesOpp[] = [];
  const roll = ws.menu.find((m) => m.id.includes("roll"));
  salesOpps.push({
    id: "sales-quiet",
    priority: 90,
    title: `${dayNames[quiet.dow]} ${quiet.service} is the quiet sitting`,
    insight: `${dayNames[quiet.dow]} ${quiet.service} averages ${Math.round(quiet.covers)} covers against ${Math.round(typicalSitting)} at a typical ${quiet.service}, over the last 8 weeks.`,
    metric: `${Math.round(quiet.covers)} covers`,
    actionLabel: `Fill ${dayNames[quiet.dow]} ${quiet.service}`,
    audience: ws.audiences.local,
    timing: postSlot(nextQuiet, now, 0).label,
    variants: v(
      `${dayNames[quiet.dow]} ${quiet.service} at ${ws.name}. ${quiet.service === "lunch" && roll ? `${roll.name}, ${money(roll.price, true)},` : `${heroMain.name} and masala chai,`} ${hhmm(ws.hours[quiet.service].open)}–${hhmm(ws.hours[quiet.service].close)}, ${ws.street}.`,
      `If ${dayNames[quiet.dow]} is a quiet one, come in for ${quiet.service}. We’ll hold a table if you reply.`,
      `${dayNames[quiet.dow]} ${quiet.service}, ${hhmm(ws.hours[quiet.service].open)}. ${ws.street}.`,
    ),
  });
  salesOpps.push({
    id: "sales-apps",
    priority: 80,
    title: `Delivery is ${money(todaySummary.deliveryTakings)} of today`,
    insight: `Deliveroo ${money(todaySummary.byPlatform.deliveroo)}, Uber Eats ${money(todaySummary.byPlatform.uber)}, Just Eat ${money(todaySummary.byPlatform.justeat)}. That is ${pct(deliveryShareToday)} of the till against ${pct(deliveryShareUsual)} usually.`,
    metric: money(todaySummary.deliveryTakings),
    actionLabel: wetDays.length ? "Push the wet-day apps" : "Steer back to the room",
    audience: ws.audiences.delivery,
    timing: wetDays.length ? postSlot(wetDays[0].day, now, 0, 15 * 60).label : "Today",
    variants: v(
      `Delivery from ${ws.name}. Choley and masala chai on Deliveroo, Uber Eats and Just Eat.`,
      `Stay in. We’ll send chai and choley from ${ws.street}.`,
      `Delivery today. Choley and chai.`,
    ),
  });
  salesOpps.push({
    id: "sales-strong",
    priority: 70,
    title: `${dayNames[strongest.dow]} carries the week`,
    insight: `${dayNames[strongest.dow]} averages ${money(strongest.takings)}, ${pct(strongest.takings / (avgDay || 1) - 1, true)} on an average day. ${dayNames[weakestDay.dow]} is ${money(weakestDay.takings)}. Keep ${dayNames[strongest.dow]} in the room.`,
    metric: money(strongest.takings),
    actionLabel: `Keep ${dayNames[strongest.dow]} seated`,
    audience: ws.audiences.past,
    timing: postSlot(addDays(today, ((strongest.dow - today.getDay() + 7) % 7) || 7), now, 2).label,
    variants: v(
      `${dayNames[strongest.dow]} is a sit-down day. ${heroMain.name} from ${hhmm(ws.hours.dinner.open)}, ${ws.street}. Reply to book.`,
      `Come in for ${dayNames[strongest.dow]}. We’ll hold a table from ${hhmm(ws.hours.dinner.open)} if you reply.`,
      `${dayNames[strongest.dow]}, in the room, from ${hhmm(ws.hours.dinner.open)}.`,
    ),
  });
  salesOpps.push({
    id: "sales-tonight",
    priority: 60,
    title: phase === "after" || phase === "closed" ? "The diary is closed for tonight" : `${plural(openLate, "table")} open ${minute >= 19 * 60 + 30 ? "for the rest of tonight" : "after 19:30"}`,
    insight: `${plural(tonight.length, "booking")} tonight for ${tonight.reduce((s, o) => s + o.covers, 0)} covers. Covers bunch ${peaks.lunch ? `${hhmm(peaks.lunch.start)}–${hhmm(peaks.lunch.end)}` : "at lunch"} and ${peaks.dinner ? `${hhmm(peaks.dinner.start)}–${hhmm(peaks.dinner.end)}` : "at dinner"}.`,
    metric: `${todaySummary.covers} covers`,
    actionLabel: "Fill the late tables",
    audience: groupsAudience,
    timing: "Today",
    variants: v(
      `Tables after 19:30 tonight at ${ws.name}. ${plural(openLate, "table")} still open.`,
      `If you can come a little later, the room is easier. Reply and we’ll hold it.`,
      `Late tables tonight. Reply to book.`,
    ),
  });
  if (expected.takings > 80 && Math.abs(vsExpected) / expected.takings > 0.1 && phase !== "closed") {
    salesOpps.unshift({
      id: "sales-pace",
      priority: 95,
      title: vsExpected < 0 ? `Today is ${money(-vsExpected)} behind a normal ${dayNames[today.getDay()]}` : `Today is ${money(vsExpected)} ahead of a normal ${dayNames[today.getDay()]}`,
      insight: `By ${hhmm(minute)} a normal ${dayNames[today.getDay()]} has taken ${money(expected.takings)}. Today is ${money(todaySummary.takings)}${weatherToday.wet ? ", in the rain" : ""}.`,
      metric: money(todaySummary.takings),
      actionLabel: vsExpected < 0 ? "Nudge tonight" : "Hold the pace",
      audience: ws.audiences.local,
      timing: "Today",
      variants: v(
        `Tables free tonight on ${ws.street}. ${heroMain.name} and masala chai from ${hhmm(ws.hours.dinner.open)}. Walk in.`,
        `Haven’t sorted dinner? We’ve room tonight on ${ws.street}. Come as you are.`,
        `Room tonight. ${ws.street}. Walk in.`,
      ),
    });
  }

  // ---------- Visibility fixes ----------
  const close = hhmm(ws.hours.dinner.close);
  const lastOnline = hhmm(ws.hours.dinner.close - 15);
  const signatureLine = `${heroMain.name} and masala chai`;
  const hoursLine = `Lunch ${hhmm(ws.hours.lunch.open)}–${hhmm(ws.hours.lunch.close)}, dinner ${hhmm(ws.hours.dinner.open)}–${close}`;
  const fixCopy: Record<string, { id: string; title: string; detail: string; action: string; draftTitle: string; body: string; effort: string }> = {
    "gbp-description": {
      id: "aeo-profile",
      title: `Answer “${ws.queries.ai[0]?.question}” in the profile`,
      detail: "Engines name you without ordering you. The first sentence of the profile should be the answer.",
      action: "Write the profile line",
      draftTitle: `Profile line for ${ws.queries.ai[0]?.question}`,
      body: `${ws.name} is a ${ws.cuisine.toLowerCase()} café on ${ws.street}, ${ws.town}. ${signatureLine} are the order. ${hoursLine}.`,
      effort: "Low",
    },
    faq: {
      id: "aeo-faq",
      title: "FAQ the engines can quote",
      detail: "Answer engines quote pages that answer the question in plain sentences.",
      action: "Draft the FAQ",
      draftTitle: "FAQ: groups, chai and hours",
      body: `Yes, we take groups. The ${lowerFirst(heroMain.name)} is the easy order. Masala chai is served all day. ${hoursLine}. ${ws.address}.`,
      effort: "Low",
    },
    "menu-schema": {
      id: "aeo-menu",
      title: "Menu structured data",
      detail: `The ${lowerFirst(heroMain.name)} and masala chai are not marked up, so engines cannot list them.`,
      action: "Mark up the menu",
      draftTitle: "Menu schema",
      body: `Mark up ${signatureLine.toLowerCase()} at ${ws.address} as menu items, with the hours ${hoursLine.toLowerCase()}.`,
      effort: "Medium",
    },
    "hours-consistent": {
      id: "seo-hours",
      title: "One set of hours everywhere",
      detail: `The website says ${close}. The order page stops at ${lastOnline}. That is why “open now” drops you after ${lastOnline}.`,
      action: "Align the hours",
      draftTitle: "One set of hours",
      body: `${ws.name}, ${ws.address}. ${hoursLine}. Phone ${ws.phone}. Use that on the site, the order page and Google.`,
      effort: "Low",
    },
    "review-language": {
      id: "aeo-reviews",
      title: "Ask guests to name the dish and the road",
      detail: `${pct(audit.languageShare)} of reviews in 90 days name a dish and ${ws.street} together. Engines repeat the words guests use.`,
      action: "Ask for the words",
      draftTitle: "Review request: dish and road",
      body: `If you have a minute, a Google review that names what you ordered, masala chai or the ${lowerFirst(heroMain.name)}, and ${ws.street}, helps the next table find us.`,
      effort: "Medium",
    },
    "local-lists": {
      id: "aeo-lists",
      title: "Get cited on local lists",
      detail: `AI Overviews cite a profile, not a ${ws.town} list. A guest post on a local food site is the citation.`,
      action: "Seed a guest post",
      draftTitle: `Guest post: ${ws.queries.ai[0]?.question} in ${ws.town}`,
      body: `For a ${ws.town} food blog: where to find ${signatureLine.toLowerCase()} on ${ws.street}. ${ws.name}, ${ws.address}.`,
      effort: "Medium",
    },
    nap: {
      id: "seo-citations",
      title: "Directories use one phone",
      detail: `${ws.phone} on every listing. A second format looks like two businesses.`,
      action: "Send the phone line",
      draftTitle: "One phone number",
      body: `Please list ${ws.name}, ${ws.address}, on ${ws.phone}.`,
      effort: "Low",
    },
    "title-locality": {
      id: "seo-title",
      title: `Titles say ${ws.street}`,
      detail: `The menu page title does not say ${ws.street}.`,
      action: "Rewrite the title",
      draftTitle: "Menu page title",
      body: `${signatureLine} in ${ws.town}. ${ws.name}, ${ws.street}.`,
      effort: "Low",
    },
    "page-speed": {
      id: "seo-speed",
      title: "Menu page speed",
      detail: "The menu page is the one Google has to read. Keep it light.",
      action: "Note the menu page",
      draftTitle: "Light menu page",
      body: `The menu page should load ${signatureLine.toLowerCase()} and the hours without a heavy gallery.`,
      effort: "Medium",
    },
    "review-velocity": {
      id: "seo-reviews",
      title: "Review velocity",
      detail: `${audit.reviewsPerWeek.toFixed(1)} new reviews a week. Four a week keeps the local pack fresh.`,
      action: "Ask for reviews",
      draftTitle: "Review request",
      body: `Thanks for coming in. A short Google review helps the next guest find ${ws.name} on ${ws.street}.`,
      effort: "Medium",
    },
    backlinks: {
      id: "seo-blogs",
      title: `A ${ws.town} food blog link`,
      detail: `No ${ws.town} food blog points at the menu. That is the off-page gap.`,
      action: "Pitch the blog",
      draftTitle: `Pitch: chai on ${ws.street}`,
      body: `A short piece for a ${ws.town} food blog: ${signatureLine.toLowerCase()} at ${ws.address}, dinner until ${close}.`,
      effort: "Medium",
    },
    "gbp-category": {
      id: "seo-category",
      title: "Category stays Indian restaurant",
      detail: "The public category matches the site. Keep it, and do not add a competing one.",
      action: "Confirm the category",
      draftTitle: "Google category",
      body: `${ws.name} is an Indian restaurant at ${ws.address}. Keep that as the primary category.`,
      effort: "Low",
    },
    "gbp-photos": {
      id: "seo-photos",
      title: `Photos of the ${lowerFirst(heroMain.name)} and the chai`,
      detail: `The last photo went up ${audit.photoAge} days ago. The listing needs a current ${lowerFirst(heroMain.name)} and a masala chai.`,
      action: "List the two photos",
      draftTitle: "Google photos",
      body: `Add a ${lowerFirst(heroMain.name)} photo and a masala chai photo to the Google listing for ${ws.address}.`,
      effort: "Low",
    },
    "gbp-post": {
      id: "seo-post",
      title: "A Google post this week",
      detail: `The last Google post was ${audit.postAge} days ago. A weekly post keeps the listing live.`,
      action: "Draft the post",
      draftTitle: "Google post",
      body: opportunities.find((o) => o.type === "Event" || o.type === "Festival")?.campaign.variants[0].body ?? `${signatureLine} this week at ${ws.name}, ${ws.street}.`,
      effort: "Low",
    },
  };
  const fixes: Fix[] = audit.gaps
    .filter((gap) => fixCopy[gap.id])
    .map((gap) => {
      const c = fixCopy[gap.id];
      return {
        id: c.id,
        check: gap.id,
        title: c.title,
        detail: c.detail,
        priority: gap.gain >= 5 ? "High" : "Medium",
        impact: `+${gap.gain} points`,
        action: c.action,
        draftTitle: c.draftTitle,
        body: c.body,
        gain: gap.gain,
        aeo: audit.isAeo(gap.id),
        seoGroup: audit.seoGroupOf(gap.id),
      };
    });

  // ---------- Top card ----------
  const top = opportunities[0];

  // ---------- Past campaigns, measured in the till ----------
  const campaignResults = ws.campaignHistory
    .filter((c) => parseKey(c.date) < today)
    .map((c) => {
      const lift = liftOn(rows, c.date, c.service);
      const dayOrders = history.filter((o) => o.day === c.date);
      const qty = c.item ? summarize(dayOrders).items[c.item] ?? 0 : 0;
      const sameDays = rows.filter((r) => r.dow === parseKey(c.date).getDay() && r.key !== c.date && !r.closed).slice(-4);
      const usualQty = c.item ? mean(sameDays.map((r) => r.summary.items[c.item!] ?? 0)) : 0;
      const extra = lift ? lift.extra : 0;
      return {
        id: c.id,
        title: c.title,
        date: c.date,
        audience: c.audience,
        extra,
        lowHigh: [Math.max(0, Math.round(extra * 0.75)), Math.max(1, Math.round(extra * 1.2))],
        baseline: lift?.baseline ?? 0,
        n: lift?.n ?? 0,
        item: c.item ? item(c.item).name : undefined,
        qty,
        usualQty,
      };
    });

  return {
    ws,
    now,
    phase,
    greeting: `${greetingFor(now)} ${ws.owner}`,
    today: {
      summary: todaySummary,
      seatedCovers,
      seatedBooked,
      seatedWalkIn: seatedCovers - seatedBooked,
      expected,
      vsExpected,
      weather: weatherToday,
      tonight,
      tonightCovers: tonight.reduce((s, o) => s + o.covers, 0),
      openLate,
      syncText,
      lastOrder,
      closed: closedToday,
    },
    lastWeek,
    weekBefore,
    rows,
    profile,
    peaks,
    dishes,
    wx,
    forecast,
    weekLow,
    weekHigh,
    staffing,
    avgSpend,
    avgDay,
    reviews: {
      all: reviewsAll,
      rating,
      count: reviewCount,
      newSince,
      sinceLabel,
      trend: reviewTrend,
      themes,
      replyNeeded,
      whenLabel,
      sentenceWith,
    },
    audit,
    bandLabel: bandLabel(audit.total),
    opportunities,
    salesOpps,
    fixes,
    top,
    campaignResults,
    seoGroupsDef,
  };
}

export type Snapshot = ReturnType<typeof computeSnapshot>;
export { replyDraft, longDate, ordersForDay };
export type { Order, Weather };
