/**
 * Screen data for the signed-in restaurant.
 *
 * Identity comes from the workspace file (src/engine/workspaces) and wording from src/data/brands.ts,
 * chosen by the workspace the sign-in set. Facts for the two demo restaurants were checked on public pages.
 *
 * Every figure (sales, covers, reviews, visibility, opportunities, results) is NOT typed here.
 * The engine in `src/engine` computes it from the till, reviews, weather and calendar, and
 * `src/data/live.ts` writes it into these objects on every tick.
 */

import { brand } from "@/data/brands";
import { activeWorkspace } from "@/data/current";

export const DATA_VERSION = 3;
export const demoLabel = "";
export const productName = "Calon";
export const productTagline = "Growth with heart. Built in Wales.";

export type Tone = "up" | "down" | "neutral" | "alert";
export type Mention = "ranked" | "mentioned" | "absent";
export type SourceStatus = "strong" | "thin" | "missing";
export type CampaignStatus = "draft" | "awaiting" | "scheduled" | "live" | "team" | "done";
export type Variant = { id: string; label: string; body: string };

export type EngineRow = { engine: string; mention: Mention; note: string };
export type Prompt = { question: string; engines: EngineRow[] };
export type Kpi = { id: string; label: string; value: string; hint: string; tone: Tone };

export const statusLabel: Record<CampaignStatus, string> = {
  draft: "Draft",
  awaiting: "Draft",
  scheduled: "Scheduled",
  live: "Live",
  team: "With Calon Team",
  done: "Completed",
};

export const business = {
  name: activeWorkspace.name,
  monogram: brand.monogram,
  typeLabel: brand.typeLabel,
  town: activeWorkspace.town,
  manager: brand.teamLead,
  category: brand.category,
  address: activeWorkspace.address,
  phone: activeWorkspace.phone,
  email: activeWorkspace.email,
  websiteHours: brand.websiteHours,
  orderHours: brand.orderHours,
  // Live, written by the engine.
  greeting: "",
  lede: "",
  freshness: "",
  kpis: [] as Kpi[],
  pulse: {
    vsLabel: "",
    vsLine: "",
    dinePct: 0,
    deliveryPct: 0,
    booked: 0,
    walkIn: 0,
    sync: "",
  },
  opportunity: {
    kicker: "Top opportunity today",
    title: "",
    body: "",
    effect: "",
    confidence: "Moderate" as "Low" | "Moderate" | "High",
    warning: "",
    basedOn: "",
  },
  goals: brand.goals,
  audiences: brand.audiences,
  timings: ["Today", "Tomorrow 11:00", "Thursday 11:00", "Monday 11:00"],
  voice: brand.voice,
  sender: brand.sender,
  cta: "Book a table",
  staffWhen: "When you seat a group",
  hashtags: brand.hashtags,
  keywords: brand.keywords,
};

export const sales = {
  yesterdayLabel: "",
  yesterday: "",
  yesterdayPounds: 0,
  weekAhead: "",
  note: "",
  days: [] as { label: string; value: number }[],
  strong: "",
  weak: "",
  goodsTitle: "Dishes and drinks",
  goods: [] as { name: string; detail: string; figure: string }[],
  extras: [] as { name: string; figure: string }[],
  channelTitle: "Booked, walk-in, delivery",
  channelNote: "",
  channels: [] as { name: string; share: string }[],
  staffTitle: "Staffing against sales",
  staffNote: "",
  staffHeadline: "",
  staffCols: ["Floor", "Kitchen"],
  staff: [] as { day: string; a: string; b: string; read: string }[],
  homeSalesHint: "",
};

export const visibility = {
  ai: { score: 0, delta: 0, deltaText: "", label: "", trend: [] as { n: string; v: number }[] },
  seo: { score: 0, delta: 0, label: "", trend: [] as { n: string; v: number }[] },
  prompts: { ai: [] as Prompt[], seo: [] as Prompt[] },
  sources: [] as { name: string; status: SourceStatus; detail: string }[],
};

export type ReviewTheme = {
  name: string;
  count: number;
  tone: "up" | "down";
  severity: "High" | "Medium" | "Low";
  trend: "Rising" | "Stable" | "New" | "Falling";
  quotes: string[];
  action: string;
  draft: string;
};

export type ReviewItem = { id: string; name: string; stars: number; when: string; text: string; themes: string[]; draft: string };

export const reviews = {
  score: 0,
  count: 0,
  newCount: 0,
  sinceLabel: "Monday",
  publicNote: "",
  trend: [] as { n: string; v: number }[],
  themes: [] as ReviewTheme[],
  items: [] as ReviewItem[],
};

export type SeedCampaign = {
  id: string;
  title: string;
  status: CampaignStatus;
  audience: string;
  timing: string;
  variants: Variant[];
  result?: { reach: string; clicks: string; effect: string; note: string };
};

/** Seeded from the engine: past campaigns measured in the till, plus today’s best opportunities. */
export const campaigns: SeedCampaign[] = [];

export type ChatEntry = {
  id: string;
  prompt: string;
  keywords: string[];
  answer: string;
  source: string;
  bars?: { label: string; value: number }[];
  card?: { title: string; body: string };
};

/** Ask Calon. Each answer is written from the current snapshot, not stored. */
export const chat: ChatEntry[] = [];

export type AreaSignal = {
  id: string;
  name: string;
  miles: number;
  kind: string;
  detail: string;
  source: string;
};

export const areaRadii = [1, 2, 5] as const;

/** Places that shape trade around the door. Dated events are added from the calendar. */
export const areaPlaces: AreaSignal[] = brand.areaPlaces.map((p) => ({ ...p }));

export const areaSignals: AreaSignal[] = [...areaPlaces];

export const searchTerms: { term: string; read: string }[] = [];

export const connectedSources = [
  { id: "google" as const, label: "Google Business Profile", detail: brand.googleDetail },
  { id: "reviews" as const, label: "Google reviews", detail: "" },
  { id: "sales" as const, label: "Till data", detail: "" },
  { id: "social" as const, label: "Instagram and Facebook", detail: "Posts wait here until you approve them." },
];

export const menuNotes = brand.menuNotes;
