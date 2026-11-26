import type { Variant } from "@/data/demo-data";

export type SalesOpportunity = {
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

/** Till patterns that become campaigns, highest priority first. Written by src/data/live.ts. */
export const salesOpportunities: SalesOpportunity[] = [];

/** Today’s till, computed from orders. Written by src/data/live.ts. */
export const salesSnapshot = {
  daily: "",
  dailyNote: "",
  covers: "",
  coversNote: "",
  average: "",
  bookings: "",
  walkIns: "",
  bookingsTonight: "",
  deliveryTotal: "",
  room: "",
  apps: [] as { name: string; figure: string }[],
  days: [] as { label: string; value: number; read: string }[],
  peaks: "",
  good: "",
  bad: "",
  source: "Data from: your till export (CSV upload).",
};
