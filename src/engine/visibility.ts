/**
 * Visibility. A weighted audit of how findable the restaurant is, for answer engines (AEO/GEO)
 * and for search (SEO). Some checks are read from the profile and website; the review checks
 * are computed from the review feed. Approving a fix marks its check done and the score moves.
 */

import { addDays, daysBetween, parseKey, shortDate } from "./dates";
import { readThemes } from "./reviews";
import type { Review, Workspace } from "./types";

export type Mention = "ranked" | "mentioned" | "absent";

const aeoWeights: Record<string, number> = {
  "gbp-description": 8,
  faq: 9,
  "menu-schema": 8,
  "hours-consistent": 7,
  "review-language": 8,
  "local-lists": 6,
  nap: 4,
};

export const seoGroupsDef = [
  { id: "on-page", title: "On-page", weights: { "title-locality": 6, "hours-consistent": 6, "page-speed": 6 } as Record<string, number> },
  { id: "off-page", title: "Off-page", weights: { "review-velocity": 6, nap: 5, backlinks: 5 } as Record<string, number> },
  { id: "local", title: "Google Business Profile", weights: { "gbp-category": 4, "gbp-photos": 6, "gbp-post": 6 } as Record<string, number> },
];

export type DoneFix = { check: string; at: number };

export function checkLevels(ws: Workspace, reviews: Review[], at: Date, done: DoneFix[]) {
  const levels: Record<string, number> = {};
  for (const fact of ws.presence) levels[fact.id] = fact.level;
  const recent = reviews.filter((review) => review.at <= at.getTime() && review.at > at.getTime() - 90 * 86_400_000);
  const both = recent.filter((review) => {
    const t = review.text.toLowerCase();
    return ws.signature.some((word) => t.includes(word)) && ws.locality.some((word) => t.includes(word));
  });
  const languageShare = recent.length ? both.length / recent.length : 0;
  levels["review-language"] = Math.min(1, languageShare / 0.15);
  const month = reviews.filter((review) => review.at <= at.getTime() && review.at > at.getTime() - 28 * 86_400_000).length;
  const perWeek = month / 4;
  levels["review-velocity"] = Math.min(1, perWeek / 4);
  const photoAge = daysBetween(parseKey(ws.lastPhotoUpload), at);
  levels["gbp-photos"] = photoAge <= 30 ? 1 : photoAge <= 90 ? 0.5 : 0;
  const postAge = daysBetween(parseKey(ws.lastGooglePost), at);
  levels["gbp-post"] = postAge <= 7 ? 1 : postAge <= 21 ? 0.5 : 0;
  for (const fix of done) if (fix.at <= at.getTime()) levels[fix.check] = 1;
  // A Google post only counts for a week.
  const post = done.filter((fix) => fix.check === "gbp-post" && fix.at <= at.getTime()).sort((a, b) => b.at - a.at)[0];
  if (post) levels["gbp-post"] = at.getTime() - post.at <= 7 * 86_400_000 ? 1 : levels["gbp-post"];
  return { levels, languageShare, perWeek, recentCount: recent.length, photoAge, postAge };
}

function score(levels: Record<string, number>) {
  const aeo = Object.entries(aeoWeights).reduce((sum, [id, w]) => sum + w * (levels[id] ?? 0), 0);
  const groups = seoGroupsDef.map((group) => ({
    id: group.id,
    title: group.title,
    score: Math.round(Object.entries(group.weights).reduce((sum, [id, w]) => sum + w * (levels[id] ?? 0), 0)),
    max: Object.values(group.weights).reduce((a, b) => a + b, 0),
  }));
  const seo = groups.reduce((sum, group) => sum + group.score, 0);
  return { aeo: Math.round(aeo), seo, total: Math.round(aeo) + seo, groups };
}

const engines = [
  { name: "ChatGPT", strict: 0.5 },
  { name: "Gemini", strict: 0.44 },
  { name: "Perplexity", strict: 0.6 },
  { name: "AI Overviews", strict: 0.4 },
] as const;

/** A check's full worth: its AEO weight plus its SEO weight, since some count for both. */
function weightOf(id: string) {
  return (aeoWeights[id] ?? 0) + seoGroupsDef.reduce((w, group) => w + (group.weights[id] ?? 0), 0);
}

const checkNotes: Record<string, { fail: string; pass: string }> = {
  "review-language": { fail: "Reviews rarely name the dish and road", pass: "Reviews name the dish" },
  "review-velocity": { fail: "Few new reviews", pass: "Steady new reviews" },
  "gbp-photos": { fail: "Photos are old", pass: "Fresh photos" },
  "gbp-post": { fail: "No recent Google post", pass: "Recent Google post" },
};

function note(ws: Workspace, id: string, pass: boolean) {
  const fact = ws.presence.find((item) => item.id === id);
  if (fact) return pass ? fact.passNote : fact.failNote;
  const n = checkNotes[id];
  return n ? (pass ? n.pass : n.fail) : id;
}

export function engineRows(ws: Workspace, levels: Record<string, number>, mode: "ai" | "seo") {
  return ws.queries[mode].map((query) => {
    const total = query.checks.reduce((sum, id) => sum + weightOf(id), 0);
    const coverage = query.checks.reduce((sum, id) => sum + weightOf(id) * (levels[id] ?? 0), 0) / (total || 1);
    const weakest = [...query.checks].sort((a, b) => (levels[a] ?? 0) - (levels[b] ?? 0))[0];
    const strongest = [...query.checks].sort((a, b) => (levels[b] ?? 0) - (levels[a] ?? 0))[0];
    return {
      question: query.question,
      coverage,
      weakest,
      engines: engines.map((engine, index) => {
        const mention: Mention = coverage >= engine.strict + 0.2 ? "ranked" : coverage >= engine.strict - 0.14 ? "mentioned" : "absent";
        let text: string;
        if (mode === "seo") {
          const rank = Math.max(1, Math.min(6, 1 + Math.round((1 - coverage) * 5) + (index % 2)));
          text = mention === "ranked" ? `Map pack #${Math.min(3, rank)}` : mention === "mentioned" ? `Local pack #${rank}` : note(ws, weakest, false);
        } else {
          text = mention === "ranked" ? note(ws, strongest, true) : mention === "mentioned" ? "Named, not ordered" : note(ws, weakest, false);
        }
        return { engine: engine.name, mention, note: text };
      }),
    };
  });
}

export function visibilityAudit(ws: Workspace, reviews: Review[], now: Date, done: DoneFix[]) {
  const current = checkLevels(ws, reviews, now, done);
  const s = score(current.levels);
  const trend = [21, 14, 7, 0].map((back) => {
    const at = addDays(now, -back);
    const point = score(checkLevels(ws, reviews, at, done).levels);
    return { n: shortDate(at), total: point.total, aeo: point.aeo, seo: point.seo };
  });
  const monthAgo = score(checkLevels(ws, reviews, addDays(now, -28), done).levels);
  // Every unmet check is a fix, worth its weight times the gap.
  const gaps = Object.keys(current.levels)
    .map((id) => ({ id, gain: Math.round(weightOf(id) * (1 - (current.levels[id] ?? 0))), level: current.levels[id] ?? 0 }))
    .filter((gap) => gap.gain >= 1)
    .sort((a, b) => b.gain - a.gain);
  return {
    ...s,
    levels: current.levels,
    languageShare: current.languageShare,
    reviewsPerWeek: current.perWeek,
    recentReviews: current.recentCount,
    photoAge: current.photoAge,
    postAge: current.postAge,
    trend,
    deltaMonth: s.total - monthAgo.total,
    ai: engineRows(ws, current.levels, "ai"),
    seoRows: engineRows(ws, current.levels, "seo"),
    gaps,
    isAeo: (id: string) => id in aeoWeights,
    seoGroupOf: (id: string) => seoGroupsDef.find((group) => id in group.weights)?.id ?? null,
  };
}

export type Audit = ReturnType<typeof visibilityAudit>;

export function bandLabel(total: number) {
  if (total >= 75) return "Showing up reliably";
  if (total >= 50) return "Showing up sometimes";
  if (total >= 30) return "Easy to miss";
  return "Hard to find";
}

export { readThemes };
