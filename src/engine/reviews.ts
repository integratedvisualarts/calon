/**
 * Reviews. In the demo, guests write reviews about the meals the simulated till actually served:
 * a crowded Friday makes a "we waited" review likelier, a leaky delivery lid after the packaging
 * change makes a delivery complaint likelier. The theme engine then reads the text back, so the
 * patterns it finds come from the data, not from a script.
 */

import { addDays, dateKey, parseKey, startOfDay } from "./dates";
import { rng } from "./random";
import { ordersForDay } from "./till";
import type { Order, Review, Workspace } from "./types";

export type ThemeId = "speed" | "portion" | "packaging" | "welcome" | "signature";

export const themeNames: Record<ThemeId, string> = {
  speed: "Service speed on busy nights",
  portion: "Lunch portion comments",
  packaging: "Delivery packaging",
  welcome: "Warm welcome",
  signature: "Masala chai and chaat",
};

/** What the reader looks for in text. Order matters only for display. */
export const themeLexicon: Record<ThemeId, { words: string[]; tone: "up" | "down" }> = {
  speed: { words: ["waited", "wait", "slow", "took a long time", "still waiting"], tone: "down" },
  portion: { words: ["small", "portion", "what came with"], tone: "down" },
  packaging: { words: ["lid", "leak", "spilled", "shifted in the bag"], tone: "down" },
  welcome: { words: ["welcome", "looked after", "friendly", "remembered"], tone: "up" },
  signature: { words: ["chai", "chaat"], tone: "up" },
};

const phrases = {
  open5: ["Lovely evening.", "Really good food.", "Came back again and it didn’t disappoint.", "Great find.", "Proper street food."],
  open4: ["Good food overall.", "Nice spot.", "Enjoyed it.", "Solid meal."],
  welcome: ["The welcome made the table stay.", "Staff looked after our group.", "Friendly from the door.", "Someone remembered us from last time."],
  wait: ["We waited a long time for mains on a busy night.", "Mains took a long time to arrive.", "Booked a table and were still waiting at the pass.", "Slow once the room filled up."],
  portion: ["The lunch roll felt small for the price.", "Wanted the menu to say what came with the roll.", "Portion was on the small side at lunch."],
  leak: ["A lid came loose on the way and the curry leaked.", "The gravy shifted in the bag and spilled.", "Lid wasn’t on properly, bit of a mess."],
  deliveryGood: ["Arrived hot and quick.", "Delivery was spot on.", "Still warm when it arrived."],
};

function dishLine(order: Order, ws: Workspace, pick: <T>(items: readonly T[]) => T): string | null {
  const named = order.lines
    .map((line) => ws.menu.find((item) => item.id === line.item))
    .filter((item): item is NonNullable<typeof item> => !!item && item.course !== "side");
  if (named.length === 0) return null;
  const item = pick(named);
  const verbs = ["was the highlight", "was excellent", "is worth the trip", "was what we came back for"];
  return `The ${item.name.toLowerCase()} ${pick(verbs)}.`;
}

/** Busiest 60 minutes of seated covers, per floor person, against what one person can carry. */
export function serviceLoad(ws: Workspace, orders: Order[], service: "lunch" | "dinner", dow: number): number {
  const seated = orders.filter((order) => order.channel === "dine-in" && order.service === service).map((order) => ({ t: order.seatedAt, c: order.covers }));
  let peak = 0;
  for (const a of seated) {
    const inHour = seated.filter((b) => b.t >= a.t && b.t < a.t + 3_600_000).reduce((sum, b) => sum + b.c, 0);
    peak = Math.max(peak, inHour);
  }
  return peak / (ws.rota[dow].floor * ws.coversPerFloorHour);
}

const reviewCache = new Map<string, Review[]>();

export function reviewsUpTo(ws: Workspace, now: Date): Review[] {
  const today = startOfDay(now);
  const cacheKey = `${ws.id}:${dateKey(today)}`;
  let all = reviewCache.get(cacheKey);
  if (!all) {
    all = [];
    const start = parseKey(ws.reviewBaseline.before);
    for (let day = start; day <= today; day = addDays(day, 1)) {
      const key = dateKey(day);
      const orders = ordersForDay(ws, day, today);
      const r = rng(`${ws.id}:${key}:reviews`);
      const load = { lunch: serviceLoad(ws, orders, "lunch", day.getDay()), dinner: serviceLoad(ws, orders, "dinner", day.getDay()) };
      // The new lids leak for a while, then the pass learns to tape them and complaints fade.
      const sinceChange = ws.packagingChange ? (day.getTime() - parseKey(ws.packagingChange).getTime()) / 86_400_000 : -1;
      const leakRisk = sinceChange < 0 ? 0.03 : sinceChange < 35 ? 0.3 : Math.max(0.03, 0.3 - (sinceChange - 35) * 0.012);
      for (const order of orders) {
        const delivery = order.channel !== "dine-in";
        if (!r.chance(delivery ? 0.02 : 0.034)) continue;
        const themes: string[] = [];
        const parts: string[] = [];
        let stars = r.chance(0.82) ? 5 : 4;
        const pick = <T,>(items: readonly T[]) => r.pick(items);
        if (delivery) {
          if (r.chance(leakRisk)) {
            parts.push(pick(phrases.leak));
            themes.push(themeNames.packaging);
            stars = r.chance(0.6) ? 3 : 2;
          } else parts.push(pick(phrases.deliveryGood));
        } else {
          const l = load[order.service];
          if (r.chance(Math.max(0, Math.min(0.65, 0.03 + 1.4 * (l - 0.9))))) {
            parts.push(pick(phrases.wait));
            themes.push(themeNames.speed);
            stars = r.chance(0.7) ? 3 : 2;
          }
          const roll = order.lines.some((line) => line.item.includes("roll"));
          if (order.service === "lunch" && roll && r.chance(0.16)) {
            parts.push(pick(phrases.portion));
            themes.push(themeNames.portion);
            stars = Math.min(stars, 4);
          }
          if (stars >= 4 && r.chance(0.36)) {
            parts.unshift(pick(phrases.welcome));
            themes.push(themeNames.welcome);
          }
        }
        const dish = dishLine(order, ws, pick);
        if (dish && r.chance(0.7)) parts.push(dish);
        const hasSignature = order.lines.some((line) => ["chai", "ragada", "dahipuri"].includes(line.item));
        if (hasSignature && r.chance(0.42)) {
          parts.push(r.chance(0.5) ? "Came back for the masala chai." : "The chaat is the thing to order.");
          themes.push(themeNames.signature);
        }
        if (r.chance(0.11)) parts.push(`Easy to find on ${ws.street}.`);
        parts.unshift(pick(stars >= 5 ? phrases.open5 : phrases.open4));
        const at = order.at + r.int(2, 30) * 3_600_000;
        all.push({
          id: `rv-${order.id}`,
          name: r.pick(ws.firstNames),
          stars,
          at,
          day: dateKey(new Date(at)),
          visitDay: order.day,
          text: parts.join(" "),
          themes: Array.from(new Set(themes)),
          channel: order.channel,
          source: "Google",
        });
      }
    }
    all.sort((a, b) => b.at - a.at);
    reviewCache.set(cacheKey, all);
  }
  return all.filter((review) => review.at <= now.getTime());
}

/** Read a review back into themes from its words, the way a real ingest would. */
export function readThemes(text: string): ThemeId[] {
  const hay = text.toLowerCase();
  return (Object.keys(themeLexicon) as ThemeId[]).filter((id) => themeLexicon[id].words.some((word) => hay.includes(word)));
}

export function replyDraft(review: Review, ws: Workspace): string {
  const t = readThemes(review.text);
  if (t.includes("speed")) return `Thank you for saying so, ${review.name}. A long wait on a busy night is on us, even when the food lands. We’re putting one more person on the floor at the peak. We’d like the chance to do better.`;
  if (t.includes("packaging")) return `Sorry about the bag, ${review.name}. Lids are now taped before they leave ${ws.street}. If a dish arrives spilled, message us and we’ll replace it.`;
  if (t.includes("portion")) return `Thanks, ${review.name}. The lunch roll comes as listed on the menu, and we’ll make that clearer on the board.`;
  if (review.stars >= 5 && t.includes("signature")) return `Thank you, ${review.name}. The chai and the chaat are exactly what we hope people leave talking about. See you on ${ws.street}.`;
  if (review.stars >= 5) return `Thank you, ${review.name}. We’ll pass this to the team. See you on ${ws.street} soon.`;
  return `Thank you for the review, ${review.name}. We’re glad you came in, and we’ll take the note to the team.`;
}
