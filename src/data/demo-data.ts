/**
 * Chai Social workspace data.
 *
 * Fixed facts live here: identity, contact details, hours and voice. They were checked on public pages:
 * - Chai Social, 134 Whitchurch Road, Cardiff CF14 3LZ · 029 2062 0333 · info@chaisocial.co.uk
 * - Website hours: 12:00–15:00 and 17:00–22:00 (chaisocial.co.uk)
 * - Order page hours are tighter: 12:00–14:45 and 17:00–21:45 (chaisocial.slerp.com)
 *
 * Every figure (sales, covers, reviews, visibility, opportunities, results) is NOT typed here.
 * The engine in `src/engine` computes it from the till, reviews, weather and calendar, and
 * `src/data/live.ts` writes it into these objects on every tick.
 */

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
  name: "Chai Social",
  monogram: "CS",
  typeLabel: "Restaurant",
  town: "Cardiff",
  manager: "Rajendra",
  category: "Indian restaurant",
  address: "134 Whitchurch Road, Cardiff CF14 3LZ",
  phone: "029 2062 0333",
  email: "info@chaisocial.co.uk",
  websiteHours: "Lunch 12:00–15:00 · dinner 17:00–22:00",
  orderHours: "Order page: 12:00–14:45 and 17:00–21:45",
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
  goals: [
    "Fill the quiet sittings",
    "Turn wet days into delivery",
    "Get mentioned for masala chai nearby",
  ],
  audiences: [
    "Groups of 4–8 within 2 miles",
    "Past delivery guests within 1.5 miles",
    "Cathays and Whitchurch Road, within a mile",
    "Past guests within 2 miles",
  ],
  timings: ["Today", "Tomorrow 11:00", "Thursday 11:00", "Monday 11:00"],
  voice: {
    warm: "Come in early. We’ll look after the table, and the chai is on.",
    brief: "Vegetarian thali, Whitchurch Road. Reply to book.",
    local: "If you’re between Cathays and Whitchurch Road, we’ve kept early tables.",
  },
  sender: "ChaiSocial",
  cta: "Book a table",
  staffWhen: "When you seat a group",
  hashtags: "#CardiffFood #ChaiSocial #WhitchurchRoad",
  keywords: `chai near me
desi street food cardiff
indian restaurant whitchurch road
masala chai cardiff
vegetarian thali cardiff`,
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
export const areaPlaces: AreaSignal[] = [
  {
    id: "campus",
    name: "Cardiff University, Cathays",
    miles: 1,
    kind: "Campus",
    detail:
      "Autumn semester for undergraduate modular programmes runs to Sunday 31 January 2027. Christmas break starts Saturday 19 December. Cathays is about a mile south of the door.",
    source: "Cardiff University semester dates, 2026/27, marked provisional",
  },
  {
    id: "heath",
    name: "University Hospital of Wales",
    miles: 0.8,
    kind: "Footfall",
    detail: "Heath is under a mile north. Shift changes bring early dinners and delivery along Whitchurch Road.",
    source: "University Hospital of Wales, Heath",
  },
  {
    id: "centre",
    name: "Cardiff Castle and the city centre",
    miles: 2,
    kind: "Season",
    detail:
      "Christmas shopping pulls evening trade about two miles south. Whitchurch Road keeps people who want a table without the centre.",
    source: "Public holiday calendars. Market dates change each year.",
  },
  {
    id: "categories",
    name: "Nearby categories, not named rivals",
    miles: 0.4,
    kind: "Category",
    detail:
      "On this stretch of Whitchurch Road and toward Crwys Road: other Indian restaurants, student dessert and coffee cafés, and delivery-only curry kitchens that appear for “curry near me”.",
    source: "Category read of the street. Names are deliberately not listed.",
  },
];

export const areaSignals: AreaSignal[] = [...areaPlaces];

export const searchTerms: { term: string; read: string }[] = [];

export const connectedSources = [
  { id: "google" as const, label: "Google Business Profile", detail: "Hours, category, photos and the Whitchurch Road listing." },
  { id: "reviews" as const, label: "Google reviews", detail: "" },
  { id: "sales" as const, label: "Square POS", detail: "" },
  { id: "social" as const, label: "Instagram and Facebook", detail: "Posts wait here until you approve them." },
];

export const menuNotes = {
  verifiedDishes: [
    "Veg samosa £5.95",
    "Onion bhaji £6.95",
    "Samosa ragada chaat £6.95",
    "Dahi puri chaat £6.95",
    "Paneer kathi roll £9.95",
    "Chicken kathi roll £9.95",
    "Choley batura £10.95",
    "Aloo batura £9.95",
    "Chicken tikka masala £10.95",
    "Club curry meal, vegetable £9.95",
    "Lucknawi lamb chop £8.95",
  ],
  fromPublicReviews: ["Vegetarian thali", "Masala chai", "Garlic naan", "Cobra on draught", "Guava mocktail"],
  notVerified: "Prices for the thali, chai, naan and drinks are working assumptions until the till is connected.",
};
