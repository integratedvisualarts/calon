/**
 * The bridge between the engine and the screens. Every tick it computes a fresh snapshot and
 * writes it into the data objects the screens already read, so the interface stays exactly as
 * designed while every figure underneath is calculated.
 */

import { liveNow } from "@/engine/clock";
import { dayDate, dayNames, dayShort, hhmm, minuteOfDay, parseKey, relativeDay, shortDate } from "@/engine/dates";
import { computeSnapshot, replyDraft, type Snapshot } from "@/engine/snapshot";
import { readThemes, themeNames } from "@/engine/reviews";
import { capitalise, listJoin, lowerFirst, money, moneyRange, pct, plural } from "@/engine/text";
import type { DoneFix } from "@/engine/visibility";
import { chaiSocial } from "@/engine/workspaces/chai-social";
import {
  areaPlaces,
  areaSignals,
  business,
  campaigns,
  chat,
  connectedSources,
  reviews,
  sales,
  searchTerms,
  visibility,
  type ChatEntry,
  type Kpi,
  type ReviewItem,
  type ReviewTheme,
  type SeedCampaign,
  type SourceStatus,
} from "@/data/demo-data";
import { salesOpportunities, salesSnapshot } from "@/data/sales-opportunities";
import { aeoFixes, seoGroups, visibilityCopy, visibilityIndex, type TrackFix } from "@/data/visibility-tracks";
import { opportunities, type Opportunity } from "@/data/opportunities";
import { connectors } from "@/data/account";

/** The restaurant this deployment shows. Point this at another file in src/engine/workspaces for a pilot. */
export const workspace = chaiSocial;

let current: Snapshot | null = null;
const fixChecks = new Map<string, string>();

function replace<T>(list: T[], items: T[]) {
  list.splice(0, list.length, ...items);
}

/** Which audit check a "fix-…" campaign completes, if any. */
export function fixCheckFor(campaignId: string): string | undefined {
  return fixChecks.get(campaignId.replace(/^fix-/, ""));
}

export function snapshot(): Snapshot {
  return current ?? refreshLive();
}

const status = (level: number): SourceStatus => (level >= 0.8 ? "strong" : level >= 0.3 ? "thin" : "missing");
const trackFix = (f: Snapshot["fixes"][number]): TrackFix => ({
  id: f.id,
  title: f.title,
  detail: f.detail,
  priority: f.priority,
  impact: f.impact,
  action: f.action,
  draftTitle: f.draftTitle,
  body: f.body,
});

export function refreshLive(done: DoneFix[] = [], now: Date = liveNow()): Snapshot {
  const s = computeSnapshot(workspace, now, done);
  current = s;
  const ws = s.ws;
  const t = s.today;
  const sum = t.summary;
  const dow = now.getDay();
  const day = dayNames[dow];
  const typical = s.profile[dow];
  const minute = minuteOfDay(now);
  const recentSpend = s.lastWeek.covers ? s.lastWeek.avgSpend : s.avgSpend;
  const spend = sum.covers ? sum.avgSpend : recentSpend;
  const yesterday = s.rows[s.rows.length - 1];
  const paceRatio = t.expected.takings > 0 ? t.vsExpected / t.expected.takings : 0;
  const pace = t.expected.takings < 80 ? "level" : paceRatio > 0.08 ? "ahead" : paceRatio < -0.08 ? "behind" : "level";
  const late = minute >= 19 * 60 + 30;

  // ---------- Home ----------
  business.greeting = s.greeting;
  const phaseLine: Record<Snapshot["phase"], string> = {
    before: `${day} opens at ${hhmm(ws.hours.lunch.open)}.`,
    lunch: `${day} lunch is underway.`,
    between: `${day} is between services. Dinner from ${hhmm(ws.hours.dinner.open)}.`,
    dinner: `${day} dinner is underway.`,
    after: `${day} service is done.`,
    closed: `Closed today.`,
  };
  const paceLine =
    s.phase === "before" || s.phase === "closed"
      ? yesterday && yesterday.summary.takings
        ? `Yesterday took ${money(yesterday.summary.takings)}.`
        : ""
      : pace === "ahead"
        ? `Takings are ${money(t.vsExpected)} ahead of a normal ${day}.`
        : pace === "behind"
          ? `Takings are ${money(-t.vsExpected)} behind a normal ${day}.`
          : `Takings are on a normal ${day}’s pace.`;
  business.lede = `${phaseLine[s.phase]} ${paceLine} ${s.top ? `Top move: ${s.top.title}.` : ""}`.replace(/\s+/g, " ").trim();
  business.freshness = `Synced from your till ${t.syncText}`;
  const coverGap = Math.round(t.seatedCovers - t.expected.covers);
  const spendGap = Math.round(s.lastWeek.avgSpend - s.weekBefore.avgSpend);
  const kpis: Kpi[] = [
    {
      id: "covers",
      label: "Covers today",
      value: String(t.seatedCovers),
      hint: t.closed
        ? "Closed today"
        : coverGap > 0
          ? `Up ${coverGap} on a usual ${day}`
          : coverGap < 0
            ? `Down ${-coverGap} on a usual ${day}`
            : `Level with a usual ${day}`,
      tone: coverGap > 0 ? "up" : "neutral",
    },
    {
      id: "spend",
      label: "Average spend",
      value: money(spend),
      hint: spendGap > 0 ? `Up £${spendGap} this week` : spendGap < 0 ? `Down £${-spendGap} this week` : "Same as last week",
      tone: spendGap > 0 ? "up" : "neutral",
    },
    {
      id: "books",
      label: "Bookings tonight",
      value: String(t.tonight.length),
      hint:
        s.phase === "after" || s.phase === "closed"
          ? `${t.tonightCovers} covers were booked`
          : late
            ? `${plural(t.openLate, "table")} free the rest of tonight`
            : `${t.openLate} open after 19:30`,
      tone: "neutral",
    },
    {
      id: "rating",
      label: "Google rating",
      value: s.reviews.rating.toFixed(1),
      hint: `${s.reviews.count} reviews · ${s.reviews.newSince.length} new`,
      tone: "neutral",
    },
  ];
  replace(business.kpis, kpis);
  const dinePct = sum.takings ? Math.round((sum.dineTakings / sum.takings) * 100) : Math.round((1 - typical.delivery / (typical.takings || 1)) * 100);
  business.pulse = {
    vsLabel: pace === "ahead" ? "Good day" : pace === "behind" ? "Quiet so far" : "On pace",
    vsLine:
      t.expected.takings < 80
        ? `Typical ${dayShort[dow]} ${money(t.expected.fullDay)}`
        : `${t.vsExpected >= 0 ? "+" : "−"}${money(Math.abs(t.vsExpected))} vs ${money(t.expected.takings)}`,
    dinePct,
    deliveryPct: 100 - dinePct,
    booked: t.seatedBooked,
    walkIn: t.seatedWalkIn,
    sync: `Till data · synced ${t.syncText}`,
  };
  if (s.top) {
    business.opportunity = {
      kicker: "Top opportunity today",
      title: s.top.title,
      body: s.top.insight,
      effect: s.top.metric,
      confidence: s.top.confidence,
      warning: "",
      basedOn: s.top.evidence,
    };
  }

  // ---------- Sales ----------
  const weekOrder = [1, 2, 3, 4, 5, 6, 0];
  const ranked = [...s.profile].filter((p) => p.n).sort((a, b) => b.takings - a.takings);
  const strongDays = ranked
    .slice(0, 2)
    .sort((x, y) => weekOrder.indexOf(x.dow) - weekOrder.indexOf(y.dow))
    .map((p) => dayNames[p.dow]);
  const quiet = s.salesOpps.find((o) => o.id === "sales-quiet");
  const quietLabel = quiet ? quiet.title.replace(" is the quiet sitting", "") : dayNames[ranked[ranked.length - 1]?.dow ?? 1];
  sales.yesterdayLabel = "Today so far · Till data";
  sales.yesterday = money(sum.takings);
  sales.yesterdayPounds = Math.round(sum.takings);
  sales.weekAhead = moneyRange(s.weekLow, s.weekHigh);
  sales.note = t.closed
    ? `Closed today. A typical ${day} is ${money(typical.takings)}. ${listJoin(strongDays)} carry the week.`
    : `A typical ${day} is ${money(typical.takings)}. Today is ${plural(t.seatedCovers, "cover")} so far, ${money(sum.dineTakings)} billed in the room and ${money(sum.deliveryTakings)} on the apps. ${listJoin(strongDays)} carry the week.`;
  replace(sales.days, weekOrder.map((d) => ({ label: dayShort[d], value: Math.round(s.profile[d].takings) })));
  sales.strong = listJoin(strongDays);
  sales.weak = `${quietLabel}, then the gap between services`;
  const food = s.dishes.filter((d) => d.item.course !== "drink" && d.item.course !== "side").sort((a, b) => b.revenueWeek - a.revenueWeek);
  replace(
    sales.goods,
    food.slice(0, 4).map((d) => ({
      name: d.item.name,
      detail: `${pct(d.shareOfFood)} of food sales · ${money(d.item.price, true)} on the menu`,
      figure: `${d.qtyWeek} ${d.item.course === "starter" ? "plates" : "sold"}`,
    })),
  );
  replace(
    sales.extras,
    s.dishes
      .filter((d) => d.item.course === "drink" || d.item.course === "side")
      .sort((a, b) => b.qtyWeek - a.qtyWeek)
      .map((d) => ({ name: d.item.name, figure: String(d.qtyWeek) })),
  );
  sales.channelNote = `${plural(t.seatedCovers, "cover")} seated today, ${money(spend)} average, ${money(sum.takings)} in the till. ${t.seatedBooked} booked, ${t.seatedWalkIn} walk-in.`;
  replace(sales.channels, [
    { name: "Dining room", share: `${dinePct}% · ${money(sum.dineTakings)}` },
    { name: "Delivery", share: `${100 - dinePct}% · ${money(sum.deliveryTakings)}` },
  ]);
  const flagged = s.staffing.filter((row) => row.flag);
  const staffRows = (flagged.length ? flagged : [...s.staffing].sort((a, b) => b.dinnerLoad - a.dinnerLoad).slice(0, 2)).sort(
    (a, b) => weekOrder.indexOf(a.dow) - weekOrder.indexOf(b.dow),
  );
  replace(sales.staff, staffRows.map((row) => ({ day: row.label, a: String(row.floor), b: String(row.kitchen), read: row.read })));
  const light = s.staffing.find((row) => row.flag === "light");
  const heavy = s.staffing.find((row) => row.flag === "heavy");
  sales.staffHeadline = light ? `${dayNames[light.dow]} is one server light` : heavy ? `${dayNames[heavy.dow]} has one floor too many` : "The rota fits the covers";
  sales.staffNote = [
    light ? `${dayNames[light.dow]} dinner peaks at ${pct(light.dinnerLoad)} of what ${light.floor} on the floor can carry.` : "",
    heavy ? `${dayNames[heavy.dow]} lunch runs at ${pct(heavy.lunchLoad)} of the floor’s capacity, so the fourth person only earns it if lunch runs.` : "",
  ]
    .filter(Boolean)
    .join(" ") || "Peak covers per floor person sit inside what the team can carry every day this week.";
  sales.homeSalesHint = light?.read ?? heavy?.read ?? "Rota matches the covers";

  salesSnapshot.daily = money(sum.takings);
  salesSnapshot.dailyNote = `Today, ${day}. A typical ${day} is ${money(typical.takings)}.`;
  salesSnapshot.covers = String(t.seatedCovers);
  salesSnapshot.coversNote = `Of today’s ${plural(t.seatedCovers, "cover")}`;
  salesSnapshot.average = money(spend);
  salesSnapshot.bookings = `${t.seatedBooked} booked`;
  salesSnapshot.walkIns = `${t.seatedWalkIn} walk-in`;
  salesSnapshot.bookingsTonight = `${t.tonight.length} tonight · ${t.openLate} open ${late ? "now" : "after 19:30"}`;
  salesSnapshot.deliveryTotal = money(sum.deliveryTakings);
  salesSnapshot.room = `${money(sum.dineTakings)} dine-in`;
  replace(salesSnapshot.apps, [
    { name: "Deliveroo", figure: money(sum.byPlatform.deliveroo) },
    { name: "Uber Eats", figure: money(sum.byPlatform.uber) },
    { name: "Just Eat", figure: money(sum.byPlatform.justeat) },
  ]);
  const avg = s.avgDay || 1;
  replace(
    salesSnapshot.days,
    weekOrder.map((d) => {
      const p = s.profile[d];
      const r = p.takings / avg;
      const ahead = s.forecast.find((f) => f.day.getDay() === d);
      const event = ahead?.entries.find((e) => e.kind === "event" || e.kind === "festival");
      return {
        label: dayShort[d],
        value: Math.round(p.takings),
        read: event ? event.name.split(",")[0].replace("Diwali Ball", "Ball") : r >= 1.25 ? "Strong" : r >= 1.05 ? "Steady" : r <= 0.75 ? "Quiet" : "Typical",
      };
    }),
  );
  const pk = s.peaks;
  salesSnapshot.peaks = `Peak hours ${pk.lunch ? `${hhmm(pk.lunch.start)}–${hhmm(pk.lunch.end)}` : "at lunch"} and ${pk.dinner ? `${hhmm(pk.dinner.start)}–${hhmm(pk.dinner.end)}` : "at dinner"}`;
  salesSnapshot.good = `Good days: ${listJoin(strongDays)}`;
  salesSnapshot.bad = `Quiet: ${quietLabel}, then the gap between services`;
  replace(salesOpportunities, s.salesOpps);

  // ---------- Opportunities ----------
  replace(opportunities, s.opportunities as unknown as Opportunity[]);

  // ---------- Visibility ----------
  const a = s.audit;
  visibilityIndex.total = a.total;
  visibilityIndex.aeo = a.aeo;
  visibilityIndex.seo = a.seo;
  const deltaText = a.deltaMonth > 0 ? `Up ${a.deltaMonth} this month` : a.deltaMonth < 0 ? `Down ${-a.deltaMonth} this month` : "Level this month";
  visibility.ai = { score: a.total, delta: a.deltaMonth, deltaText, label: s.bandLabel, trend: a.trend.map((p) => ({ n: p.n, v: p.total })) };
  visibility.seo = {
    score: a.seo * 2,
    delta: a.trend[a.trend.length - 1].seo - a.trend[0].seo,
    label: a.seo >= 30 ? `Holding on ${ws.street}` : `Slipping on ${ws.street}`,
    trend: a.trend.map((p) => ({ n: p.n, v: p.seo * 2 })),
  };
  visibility.prompts = {
    ai: a.ai.map((row) => ({ question: row.question, engines: row.engines })),
    seo: a.seoRows.map((row) => ({ question: row.question, engines: row.engines })),
  };
  const L = a.levels;
  visibility.sources = [
    { name: "Google Business Profile", status: status(Math.min(L["gbp-category"], L.nap)), detail: "Category and address match the website." },
    { name: "Directories", status: status(L["hours-consistent"]), detail: `The website says dinner until ${hhmm(ws.hours.dinner.close)}. The online order page stops at ${hhmm(ws.hours.dinner.close - 15)}.` },
    { name: "Reviews", status: s.reviews.rating >= 4.5 ? "strong" : "thin", detail: `${s.reviews.rating.toFixed(1)} from ${s.reviews.count} Google reviews. ${pct(a.languageShare)} name a dish and ${ws.street} together.` },
    { name: "Website", status: status(L.faq), detail: "Answers “groups?” and “open now?” in one quotable sentence only if the FAQ is live." },
    { name: "Schema", status: status(L["menu-schema"]), detail: "Menu and opening hours marked up for answer engines." },
  ];
  for (const f of s.fixes) fixChecks.set(f.id, f.check);
  replace(aeoFixes, s.fixes.filter((f) => f.aeo).map(trackFix));
  replace(
    seoGroups,
    a.groups.map((g) => ({ id: g.id, title: g.title, score: g.score, fixes: s.fixes.filter((f) => f.seoGroup === g.id).map(trackFix) })),
  );
  const topAeo = s.fixes.find((f) => f.aeo);
  const topSeo = s.fixes.find((f) => f.seoGroup);
  visibilityCopy.title = `${a.total} this week`;
  visibilityCopy.lede = `${deltaText}. AEO/GEO is ${a.aeo}. SEO is ${a.seo}.`;
  visibilityCopy.updated = now.getHours() >= 6 ? "Checked today 06:00" : "Checked yesterday 06:00";
  visibilityCopy.topAeo = topAeo ? `Top fix: ${lowerFirst(topAeo.title)}.` : "Every AEO check is passing.";
  visibilityCopy.topSeo = topSeo ? `Top fix: ${lowerFirst(topSeo.title)}.` : "Every SEO check is passing.";
  visibilityCopy.seoLede = `${a.seo} of the ${a.total} index. ${a.groups.map((g) => `${g.title} ${g.score}`).join(", ")}. Data from: your website (site API/crawl), Google Search Console.`;
  visibilityCopy.blog = (() => {
    const f = s.fixes.find((x) => x.check === "backlinks");
    return f ? trackFix(f) : null;
  })();
  replace(
    searchTerms,
    a.ai.map((row) => {
      const r = row.engines.filter((e) => e.mention === "ranked").length;
      const m = row.engines.filter((e) => e.mention === "mentioned").length;
      return {
        term: row.question,
        read: `${r} of 4 answer engines rank you, ${m} name you.${r < 4 ? ` The gap: ${lowerFirst(row.engines.find((e) => e.mention !== "ranked")?.note ?? "")}.` : ""}`,
      };
    }),
  );

  // ---------- Reviews ----------
  reviews.score = s.reviews.rating;
  reviews.count = s.reviews.count;
  reviews.newCount = s.reviews.newSince.length;
  reviews.sinceLabel = s.reviews.sinceLabel;
  reviews.publicNote = `${s.reviews.newSince.length} new since ${s.reviews.sinceLabel}.`;
  replace(reviews.trend, s.reviews.trend);
  const heroMain = ws.menu.find((m) => m.id === "thali")?.name.toLowerCase() ?? "thali";
  const themeCopy = (id: string, busy: string): { action: string; draft: string } => {
    switch (id) {
      case "speed":
        return {
          action: `Put one more on the floor for the ${busy} peak, and tell ${busy} bookers the ${heroMain} is the faster order. Don’t promise a minute count.`,
          draft: `${busy} can run long. The ${heroMain} is the order the kitchen already knows, so the wait is shorter.`,
        };
      case "packaging":
        return { action: "A packing note for the pass: tape every lid. Don’t offer a refund in this draft.", draft: `Delivery lids are taped before they leave ${ws.street}. If a bag still leaks, tell us and we’ll replace that dish.` };
      case "portion":
        return { action: "Say what the kathi roll includes. Don’t quietly shrink it.", draft: "The lunch kathi roll comes as listed on the menu. That is the portion, stated up front." };
      case "welcome":
        return { action: "Use this line in the next post. Don’t invent a staff name.", draft: `The room is looked after. If you’re in this week, the ${heroMain} is the easy order.` };
      default:
        return { action: "Lead with the dishes guests already name. Don’t add a superlative.", draft: "Guests come back for masala chai and samosa chaat. Both are on this week." };
    }
  };
  replace(
    reviews.themes,
    s.reviews.themes.map((theme): ReviewTheme => {
      const copy = themeCopy(theme.id, dayNames[theme.busiest.dow]);
      return {
        name: theme.id === "speed" ? `${dayNames[theme.busiest.dow]} service speed` : theme.name,
        count: theme.count,
        tone: theme.tone,
        severity: theme.severity as ReviewTheme["severity"],
        trend: theme.trend as ReviewTheme["trend"],
        quotes: theme.hits.slice(0, 2).map((r) => s.reviews.sentenceWith(r.text, theme.id)),
        action: copy.action,
        draft: copy.draft,
      };
    }),
  );
  const pick = [...s.reviews.replyNeeded.filter((r) => r.stars <= 3).slice(0, 1), ...s.reviews.all.slice(0, 4)];
  const seen = new Set<string>();
  const items: ReviewItem[] = [];
  for (const r of pick) {
    if (seen.has(r.id) || items.length >= 4) continue;
    seen.add(r.id);
    items.push({
      id: r.id,
      name: r.name,
      stars: r.stars,
      when: s.reviews.whenLabel(r),
      text: r.text,
      themes: readThemes(r.text).map((id) => (id === "speed" ? "Service speed" : themeNames[id])),
      draft: replyDraft(r, ws),
    });
  }
  replace(reviews.items, items);

  // ---------- Campaign seeds (used when the workspace is first opened or reset) ----------
  const seeds: SeedCampaign[] = s.campaignResults.map((c) => {
    const d = parseKey(c.date);
    const itemName = c.item ?? "the special";
    const extra = Math.max(1, c.extra);
    return {
      id: c.id,
      title: c.title,
      status: "done",
      audience: c.audience,
      timing: `Ran ${dayDate(d)}`,
      variants: [
        { id: "a", label: "Straight", body: `${c.title} is on ${dayNames[d.getDay()]}. ${itemName}, ${ws.street}. Book or walk in.` },
        { id: "b", label: "Warmer", body: `${dayNames[d.getDay()]} is for ${itemName.toLowerCase()}. Come hungry.` },
        { id: "c", label: "Shorter", body: `${dayNames[d.getDay()]}: ${itemName.toLowerCase()}. ${ws.street}.` },
      ],
      result: {
        reach: `${Math.round(extra * 7)}–${Math.round(extra * 10)} people saw the post`,
        clicks: `${Math.round(extra * 2.6)} clicks`,
        effect: `${c.lowHigh[0]}–${c.lowHigh[1]} extra covers`,
        note: `Measured in the till against ${plural(c.n, `ordinary ${dayNames[d.getDay()]}`)}. ${itemName}: ${c.qty} sold against ${Math.round(c.usualQty)} usually.`,
      },
    };
  });
  const asSeed = (o: Snapshot["opportunities"][number] | undefined, statusValue: SeedCampaign["status"]): SeedCampaign[] =>
    o ? [{ id: o.campaign.id, title: o.campaign.title, status: statusValue, audience: o.campaign.audience, timing: statusValue === "team" ? "With Calon Team" : o.campaign.timing, variants: o.campaign.variants }] : [];
  const season = s.opportunities.find((o) => o.subtype === "Season");
  const dated = s.opportunities.find((o) => (o.type === "Event" || o.type === "Festival") && o.when === "week" && o !== season);
  const weather = s.opportunities.find((o) => o.type === "Weather");
  replace(campaigns, [...seeds, ...asSeed(season, "team"), ...asSeed(dated ?? s.opportunities.find((o) => o.type === "Event"), "awaiting"), ...asSeed(weather, "draft")]);

  // ---------- Ask Calon ----------
  const sameDays = s.rows.filter((r) => r.dow === dow && !r.closed).slice(-4);
  const weekOpps = s.opportunities.filter((o) => o.when === "week" && (o.type === "Event" || o.type === "Festival" || o.type === "Weather")).slice(0, 2);
  const lowStar = s.reviews.replyNeeded.find((r) => r.stars <= 3);
  const lastCampaign = s.campaignResults[s.campaignResults.length - 1];
  const topFix = s.fixes[0];
  const absent = a.ai.filter((row) => row.engines.filter((e) => e.mention === "absent").length >= 2).map((row) => `“${row.question}”`);
  const best = food[0];
  const riser = s.opportunities.find((o) => o.id === "food-rising");
  const low = s.opportunities.find((o) => o.id === "food-low");
  const wet = s.forecast.filter((f) => f.weather.wet);
  const entries: ChatEntry[] = [
    {
      id: "today",
      prompt: "How is today going?",
      keywords: ["today", "going", "takings", "till", "how are we", "so far"],
      answer: `${money(sum.takings)} so far, ${plural(t.seatedCovers, "cover")} seated and ${money(sum.deliveryTakings)} of delivery. A normal ${day} has taken ${money(t.expected.takings)} by ${hhmm(minute)}, so you’re ${pace === "level" ? "on pace" : `${money(Math.abs(t.vsExpected))} ${pace}`}. ${t.tonight.length} bookings tonight for ${t.tonightCovers} covers.`,
      source: `Till data, today against the last ${sameDays.length} ${day}s`,
      bars: [...sameDays.map((r) => ({ label: shortDate(parseKey(r.key)), value: Math.round(r.summary.takings) })), { label: "Today", value: Math.round(sum.takings) }],
      card: { title: "Suggested move", body: s.salesOpps[0] ? `${s.salesOpps[0].title}. ${s.salesOpps[0].actionLabel}.` : "Nothing urgent." },
    },
    {
      id: "weekend",
      prompt: "What should I push this week?",
      keywords: ["weekend", "push", "this week", "saturday", "sunday", "friday", "event", "ball", "promote"],
      answer: weekOpps.length
        ? weekOpps.map((o) => `${o.title}: ${o.insight}`).join(" ")
        : `Nothing dated stands out this week. ${s.top ? `${s.top.title}: ${s.top.insight}` : ""}`,
      source: weekOpps.map((o) => o.evidence).join(" · ") || "Your till and the local calendar",
      bars: weekOrder.map((d) => ({ label: dayShort[d], value: Math.round(s.profile[d].takings) })),
      card: { title: "Suggested move", body: weekOpps[0] ? `${weekOpps[0].actionLabel}. Nothing posts until you approve it.` : "Approve the top draft. Nothing posts until you do." },
    },
    {
      id: "missing",
      prompt: "Why am I missing from AI answers?",
      keywords: ["missing", "ai", "chatgpt", "gemini", "perplexity", "visible", "visibility", "seo", "google"],
      answer: `Your visibility score is ${a.total}: AEO ${a.aeo} of 50, SEO ${a.seo} of 50. ${absent.length ? `You’re mostly missing for ${listJoin(absent)}.` : "Most engines at least name you."} The biggest gaps are ${listJoin(s.fixes.slice(0, 2).map((f) => lowerFirst(f.title)))}.`,
      source: "This week’s checks on ChatGPT, Gemini, Perplexity and AI Overviews",
      card: topFix ? { title: "Highest-impact fix", body: `${topFix.title}. Worth ${topFix.impact}. Nothing goes live until you approve it.` } : undefined,
    },
    {
      id: "replies",
      prompt: "Which reviews need a reply?",
      keywords: ["review", "reply", "star", "complain", "feedback"],
      answer: lowStar
        ? `${plural(s.reviews.newSince.length, "review")} since ${s.reviews.sinceLabel}. ${lowStar.name}’s ${lowStar.stars}-star note is the one to answer first. A draft is ready, and nothing is sent until you approve it.`
        : `${plural(s.reviews.newSince.length, "review")} since ${s.reviews.sinceLabel}, none below four stars in the last fortnight.`,
      source: "Google reviews",
      card: lowStar ? { title: `${lowStar.name} · ${lowStar.stars} stars`, body: lowStar.text } : undefined,
    },
    {
      id: "last",
      prompt: "How did the last offer do?",
      keywords: ["last week", "offer", "campaign", "result", "worked", "chaat", "did it work"],
      answer: lastCampaign
        ? `${lastCampaign.title} brought ${lastCampaign.lowHigh[0]}–${lastCampaign.lowHigh[1]} extra covers against ${plural(lastCampaign.n, `ordinary ${dayNames[parseKey(lastCampaign.date).getDay()]}`)}. ${lastCampaign.item ? `${lastCampaign.item}: ${lastCampaign.qty} sold against ${Math.round(lastCampaign.usualQty)} usually.` : ""}`
        : "No campaign has finished yet.",
      source: lastCampaign ? `Till data, ${dayDate(parseKey(lastCampaign.date))}` : "Till data",
      card: lastCampaign ? { title: dayDate(parseKey(lastCampaign.date)), body: `${Math.round(lastCampaign.extra)} covers above a normal day. One wet day can move it.` } : undefined,
    },
    {
      id: "dishes",
      prompt: "What’s selling?",
      keywords: ["selling", "dish", "menu", "best", "food", "thali", "popular", "drink"],
      answer: `${best ? `The ${best.item.name.toLowerCase()} leads at ${pct(best.shareOfFood)} of food sales this week.` : ""} ${riser ? `${riser.title}: ${riser.metric} on the month.` : ""} ${low ? `${low.title}.` : ""}`.trim(),
      source: "Item sales, last 7 days against the 4 weeks before",
      bars: food.slice(0, 5).map((d) => ({ label: d.item.name.split(" ").slice(-1)[0], value: d.qtyWeek })),
    },
    {
      id: "weather",
      prompt: "Will the weather matter this week?",
      keywords: ["weather", "rain", "forecast", "wet", "cold"],
      answer: wet.length
        ? `Rain is due ${listJoin(wet.slice(0, 3).map((f) => relativeDay(f.day, now)))}. On wet days your delivery runs ${pct(s.wx.deliveryLift, true)} and the room ${pct(s.wx.coverLift, true)}, measured on ${plural(s.wx.n, "wet day")}.`
        : `The week looks dry. Dry days keep the room full; your wet-day delivery lift of ${pct(s.wx.deliveryLift, true)} won’t be needed.`,
      source: "Met Office forecast, set against your till",
    },
  ];
  replace(chat, entries);

  // ---------- Area, sources, connectors ----------
  const upcoming = ws.calendar
    .filter((e) => e.miles && (e.end ?? e.date) >= s.rows[s.rows.length - 1].key && parseKey(e.date).getTime() - now.getTime() < 30 * 86_400_000)
    .map((e) => ({
      id: e.id,
      name: e.name,
      miles: e.miles ?? 1,
      kind: capitalise(relativeDay(parseKey(e.date), now)),
      detail: `${dayDate(parseKey(e.date))}${e.time ? `, ${e.time}` : ""}${e.venue ? `, ${e.venue}` : ""}. ${e.angle ?? ""}`.trim(),
      source: e.source,
    }));
  replace(areaSignals, [...upcoming, ...areaPlaces]);
  const reviewSource = connectedSources.find((c) => c.id === "reviews");
  if (reviewSource) reviewSource.detail = `${s.reviews.rating.toFixed(1)} from ${s.reviews.count} reviews. ${s.reviews.newSince.length} new since ${s.reviews.sinceLabel}.`;
  const salesSource = connectedSources.find((c) => c.id === "sales");
  if (salesSource) salesSource.detail = `Till and covers. Last sync ${t.syncText}.`;
  for (const c of connectors) {
    if (c.id === "square") c.synced = capitalise(t.syncText);
    if (c.id === "deliveroo") c.detail = `${money(sum.byPlatform.deliveroo)} of today’s delivery.`;
    if (c.id === "uber") c.detail = `${money(sum.byPlatform.uber)} of today’s delivery.`;
    if (c.id === "justeat") c.detail = `${money(sum.byPlatform.justeat)} of today’s delivery.`;
  }

  return s;
}

refreshLive();
