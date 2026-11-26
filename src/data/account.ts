import { brand } from "@/data/brands";

export type ConnectorStatus = "Connected" | "Not connected" | "Upload template";

export type Connector = {
  id: string;
  label: string;
  status: ConnectorStatus;
  synced: string;
  detail: string;
  /** Ties a connector to the source switch that gates a screen. */
  source?: "google" | "reviews" | "sales" | "social";
};

export const team = [
  { name: brand.teamLead, role: "Owner" },
  { name: "Floor team", role: "Service" },
  { name: "Kitchen team", role: "Pass" },
];

export const connectors: Connector[] = [
  {
    id: "square",
    label: "Till data",
    status: "Connected",
    synced: "7 minutes ago",
    detail: "Till, covers and item sales.",
    source: "sales",
  },
  {
    id: "google",
    label: "Google Business Profile",
    status: "Connected",
    synced: "Today 06:00",
    detail: "Listing, hours and posts.",
    source: "google",
  },
  {
    id: "search",
    label: "Website / Search Console",
    status: "Not connected",
    synced: "Never",
    detail: "Site crawl and search queries.",
  },
  {
    id: "social",
    label: "Instagram and Facebook",
    status: "Connected",
    synced: "Yesterday 18:40",
    detail: "Posts wait here until you approve them.",
    source: "social",
  },
  {
    id: "deliveroo",
    label: "Deliveroo",
    status: "Upload template",
    synced: "Today 07:10",
    detail: "£148 of today’s delivery.",
  },
  {
    id: "uber",
    label: "Uber Eats",
    status: "Upload template",
    synced: "Today 07:10",
    detail: "£96 of today’s delivery.",
  },
  {
    id: "justeat",
    label: "Just Eat",
    status: "Upload template",
    synced: "Today 07:10",
    detail: "£66 of today’s delivery.",
  },
  {
    id: "bookings",
    label: "OpenTable or ResDiary",
    status: "Not connected",
    synced: "Never",
    detail: "Bookings are counted from the till until a booker is connected.",
  },
  {
    id: "tripadvisor",
    label: "Tripadvisor",
    status: "Not connected",
    synced: "Never",
    detail: "Service cues currently read Google reviews.",
  },
  {
    id: "met",
    label: "Met Office",
    status: "Connected",
    synced: "Today 05:00",
    detail: brand.weatherDetail,
  },
];

export const plans = {
  current: "pro" as const,
  nextBill: "18 December 2026",
  payment: "Card placeholder · •••• 4242",
  plus: {
    id: "plus" as const,
    name: "Plus",
    price: "£25",
    period: "month",
    line: "Opportunities for this kitchen.",
  },
  pro: {
    id: "pro" as const,
    name: "Pro",
    price: "£50",
    period: "month",
    line: "Opportunities, the campaign builder, and Send to the Calon Team.",
  },
};

export const planFeatures = [
  { feature: "Opportunity hub", plus: "Included", pro: "Included" },
  { feature: "Visibility, sales, festivals, events, food, service, weather", plus: "Included", pro: "Included" },
  { feature: "Campaign builder", plus: "—", pro: "Included" },
  { feature: "Create with AI", plus: "—", pro: "Included" },
  { feature: "Send to the Calon Team", plus: "—", pro: "Included · reply within 1 working day" },
  { feature: "Approve before anything posts", plus: "Included", pro: "Included" },
];
