/** Shared engine types. The engine is pure TypeScript: no React, no network. */

export type Course = "drink" | "starter" | "main" | "side";
export type Channel = "dine-in" | "deliveroo" | "uber" | "justeat";
export type Service = "lunch" | "dinner";

export type MenuItem = {
  id: string;
  name: string;
  price: number;
  /** True when the price was read from a public menu page. */
  priceVerified: boolean;
  course: Course;
  veg: boolean;
  /** Relative choice weight inside its course. */
  weight: number;
  lunchWeight?: number;
  dinnerWeight?: number;
  /** Extra pull on wet days and for delivery. */
  comfort?: number;
  /** Weekly drift in demand, e.g. 0.02 = +2% a week. */
  drift?: number;
  /** Words reviewers use for this item. */
  aliases?: string[];
  hero?: boolean;
};

export type Rota = { floor: number; kitchen: number };

export type CalendarKind = "festival" | "event" | "campus" | "payday" | "season";

export type CalendarEntry = {
  id: string;
  name: string;
  kind: CalendarKind;
  /** Local date key YYYY-MM-DD. */
  date: string;
  /** Optional last day for multi-day entries. */
  end?: string;
  time?: string;
  venue?: string;
  miles?: number;
  /** Tags a restaurant should share for this to fit. */
  tags: string[];
  /** Expected effect on dine-in covers for the matching service, e.g. 0.25 = +25%. */
  lift: number;
  service: Service | "day";
  /** Delivery effect, if different. */
  deliveryLift?: number;
  closed?: boolean;
  source: string;
  provisional?: boolean;
  /** One line a campaign can lean on. */
  angle?: string;
  hero?: string;
};

export type PresenceFact = {
  id: string;
  label: string;
  /** 0–1. How well this is already done. Computed facts override. */
  level: number;
  failNote: string;
  passNote: string;
};

export type Workspace = {
  id: string;
  name: string;
  owner: string;
  type: string;
  cuisine: string;
  town: string;
  street: string;
  address: string;
  phone: string;
  email: string;
  tags: string[];
  /** Opening windows as minutes after midnight. Last orders are 15 minutes before close. */
  hours: Record<Service, { open: number; close: number }>;
  closedDates: string[];
  tables: number;
  seats: number;
  rota: Record<number, Rota>;
  /** Peak-hour covers one floor person can look after comfortably. */
  coversPerFloorHour: number;
  /** Typical dine-in covers by weekday (0 = Sunday). */
  baseCovers: Record<number, Record<Service, number>>;
  /** Typical delivery orders by weekday. */
  baseDelivery: Record<number, number>;
  platformMix: Record<Exclude<Channel, "dine-in">, number>;
  weeklyGrowth: number;
  menu: MenuItem[];
  calendar: CalendarEntry[];
  /** Campaigns that already ran, with the lift they had in the till. */
  campaignHistory: { id: string; title: string; date: string; service: Service; extraCovers: number; item?: string; audience: string }[];
  reviewBaseline: { count: number; average: number; before: string };
  /** First day delivery bags shipped with the new lids. Leaks are likelier after this. */
  packagingChange?: string;
  presence: PresenceFact[];
  /** Date the Google listing last had a post. */
  lastGooglePost: string;
  lastPhotoUpload: string;
  signature: string[];
  locality: string[];
  queries: { ai: { question: string; checks: string[] }[]; seo: { question: string; checks: string[] }[] };
  audiences: { groups: string; delivery: string; local: string; past: string; staff: string };
  firstNames: string[];
  /** The words this restaurant uses for itself in drafted copy. */
  voice: {
    /** The drink or pairing named beside the hero dish, e.g. "masala chai". */
    drink: string;
    /** Wet-day delivery line, e.g. "Choley batura, a vegetable curry and masala chai". */
    wetLine: string;
    /** Short wet-day pair, e.g. "choley and chai". */
    wetShort: string;
    /** What guests praise besides the welcome, e.g. "the masala chai or the chaat". */
    praise: string;
    /** Title for that praise opportunity. */
    praiseTitle: string;
    /** Draft lines for the praise campaign (three variants; {street} is replaced). */
    praiseLines: [string, string, string];
    /** Tag shown in "Fits: ..." for this house style. */
    house: string;
    /** Photo list, e.g. "chai". */
    photoWord: string;
    /** Who is away in the quiet weeks, e.g. "students". */
    awayWho: string;
  };
};

export type OrderLine = { item: string; qty: number; price: number };

export type Order = {
  id: string;
  /** When the bill closed and the till recorded it (epoch ms). */
  at: number;
  /** When the table sat down or the delivery order came in (epoch ms). */
  seatedAt: number;
  day: string;
  service: Service;
  channel: Channel;
  covers: number;
  booked: boolean;
  lines: OrderLine[];
  total: number;
};

export type Weather = {
  date: string;
  rainMm: number;
  tempC: number;
  wet: boolean;
  cold: boolean;
  label: string;
  forecast: boolean;
};

export type Review = {
  id: string;
  name: string;
  stars: number;
  at: number;
  day: string;
  /** The day of the visit or order the review is about. */
  visitDay: string;
  text: string;
  themes: string[];
  channel: Channel;
  source: "Google" | "Tripadvisor";
};

export type Confidence = "Low" | "Moderate" | "High";
