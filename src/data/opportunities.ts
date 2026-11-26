import type { Variant } from "@/data/demo-data";
import { activeProfile, type RestaurantProfile } from "@/data/restaurant";

export enum OpportunityType {
  Festival = "Festival",
  Event = "Event",
  Food = "Food",
  Service = "Service",
  Weather = "Weather",
}

export const opportunityTypeOrder: OpportunityType[] = [
  OpportunityType.Festival,
  OpportunityType.Event,
  OpportunityType.Food,
  OpportunityType.Service,
  OpportunityType.Weather,
];

/** Used when an opportunity does not set its own label. */
export const defaultActionLabel: Record<OpportunityType, string> = {
  [OpportunityType.Festival]: "Start festival prep",
  [OpportunityType.Event]: "Plan the night",
  [OpportunityType.Food]: "Push this dish",
  [OpportunityType.Service]: "Reply and fix",
  [OpportunityType.Weather]: "Prep the forecast",
};

export function actionLabel(item: Pick<Opportunity, "type" | "actionLabel">): string {
  return item.actionLabel || defaultActionLabel[item.type];
}

const seeAllName: Record<OpportunityType, string> = {
  [OpportunityType.Festival]: "festivals",
  [OpportunityType.Event]: "events",
  [OpportunityType.Food]: "food",
  [OpportunityType.Service]: "service",
  [OpportunityType.Weather]: "weather",
};

export function seeAllLabel(type: OpportunityType): string {
  return `See all ${seeAllName[type]}`;
}

export function typeTitle(type: OpportunityType): string {
  return {
    [OpportunityType.Festival]: "Festivals",
    [OpportunityType.Event]: "Events",
    [OpportunityType.Food]: "Food",
    [OpportunityType.Service]: "Service",
    [OpportunityType.Weather]: "Weather",
  }[type];
}

export const typeSource: Record<OpportunityType, string> = {
  [OpportunityType.Festival]: "Data from: local community and event calendars.",
  [OpportunityType.Event]: "Data from: local calendars and event sites.",
  [OpportunityType.Food]: "Data from: POS item sales.",
  [OpportunityType.Service]: "Data from: Google reviews and Tripadvisor.",
  [OpportunityType.Weather]: "Data from: Met Office forecast plus your sales history.",
};

export function typeSlug(type: OpportunityType): string {
  return type.toLowerCase();
}

export function typeFromSlug(slug: string): OpportunityType | null {
  return opportunityTypeOrder.find((type) => type.toLowerCase() === slug.toLowerCase()) ?? null;
}

export type CampaignSeed = {
  id: string;
  title: string;
  audience: string;
  timing: string;
  variants: Variant[];
};

export type Opportunity = {
  id: string;
  type: OpportunityType;
  /** Higher is shown first inside a category. */
  priority: number;
  /** week = through Sun 22 Nov. coming = before New Year. later = 2027. */
  when: "week" | "coming" | "later";
  subtype: string;
  /** Overview line. */
  title: string;
  /** Why, drawn from the account figures. */
  insight: string;
  metric: string;
  /** Why this fits the restaurant’s type and cuisine. */
  fitReason: string;
  /** Short verb for the button and the draft header. Falls back to defaultActionLabel. */
  actionLabel: string;
  /** Tags the restaurant must share. Score is the share that match. */
  tags: readonly string[];
  /** Home shows this one when several of the type match. */
  featured?: boolean;
  confidence?: "Low" | "Moderate" | "High";
  evidence?: string;
  campaign: CampaignSeed;
};

/**
 * Live catalogue, generated and ranked by the engine (src/engine/snapshot.ts) and written by
 * src/data/live.ts. A pub, a steakhouse or a café carries different tags and is offered a
 * different set: match day and Burns Night for a pub, not a Diwali thali.
 */
export const opportunities: Opportunity[] = [];

/** Share of the opportunity’s tags that this restaurant carries. 0–1. */
export function relevance(opportunity: Opportunity, profile: RestaurantProfile): number {
  if (opportunity.tags.length === 0) return 0;
  const hits = opportunity.tags.filter((tag) => profile.tags.includes(tag)).length;
  return hits / opportunity.tags.length;
}

/** Only opportunities that fit this type and cuisine. Others would see a different set. */
export function matchingOpportunities(profile: RestaurantProfile = activeProfile, minimum = 0.5): Opportunity[] {
  return opportunities
    .map((item) => ({ item, score: relevance(item, profile) }))
    .filter((row) => row.score >= minimum)
    .sort((a, b) => {
      const typeDelta = opportunityTypeOrder.indexOf(a.item.type) - opportunityTypeOrder.indexOf(b.item.type);
      if (typeDelta !== 0) return typeDelta;
      return b.item.priority - a.item.priority || b.score - a.score;
    })
    .map((row) => row.item);
}

/** One surfaced opportunity per type, featured first, in Festival → Weather order. */
export function opportunitiesForType(
  type: OpportunityType,
  profile: RestaurantProfile = activeProfile,
  when?: Opportunity["when"],
): Opportunity[] {
  return matchingOpportunities(profile)
    .filter((item) => item.type === type && (!when || item.when === when))
    .sort((a, b) => b.priority - a.priority);
}

export function homeOpportunities(profile: RestaurantProfile = activeProfile): Opportunity[] {
  const matched = matchingOpportunities(profile);
  return opportunityTypeOrder.flatMap((type) => {
    const pool = matched.filter((item) => item.type === type);
    const pick = pool.find((item) => item.featured) ?? pool[0];
    return pick ? [pick] : [];
  });
}
