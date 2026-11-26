"use client";

import { aeoFixes, seoGroups, visibilityIndex } from "@/data/visibility-tracks";
import { salesOpportunities, salesSnapshot } from "@/data/sales-opportunities";
import {
  opportunitiesForType,
  opportunityTypeOrder,
  typeSource,
  typeSlug,
  typeTitle,
  OpportunityType,
} from "@/data/opportunities";
import { Card, PageHeader } from "@/components/bits";
import { useStore } from "@/lib/store";

const typeBlurb: Record<OpportunityType, string> = {
  [OpportunityType.Festival]: "Diwali, Christmas, New Year, and the local community calendar.",
  [OpportunityType.Event]: "Match day, concerts, payday, and rooms nearby.",
  [OpportunityType.Food]: "Best and low sellers, new dishes, new menus.",
  [OpportunityType.Service]: "Historical and latest reviews.",
  [OpportunityType.Weather]: "The forecast set against past sales on similar weather.",
};

export function OpportunitiesScreen() {
  const store = useStore();
  const visibilityOpen = aeoFixes.length + seoGroups.reduce((sum, group) => sum + group.fixes.length, 0);
  const cards: { id: string; title: string; score: string; count: string; source: string; onOpen: () => void }[] = [
    {
      id: "visibility",
      title: "Visibility",
      score: `${visibilityIndex.total}/100`,
      count: `${visibilityOpen} open`,
      source: "Data from: AI engines, your website and Google Search Console.",
      onOpen: () => store.openSection("visibility", null),
    },
    {
      id: "sales",
      title: "Sales",
      score: `${salesSnapshot.daily} today`,
      count: `${salesOpportunities.length} open`,
      source: "Data from: Square POS API, or upload a standard template.",
      onOpen: () => store.go("sales"),
    },
    ...opportunityTypeOrder.map((type) => ({
      id: typeSlug(type),
      title: typeTitle(type),
      score: typeBlurb[type],
      count: `${opportunitiesForType(type).length} open`,
      source: typeSource[type],
      onOpen: () => store.openSection("insights", typeSlug(type)),
    })),
  ];
  return (
    <div className="rise grid gap-4">
      <PageHeader kicker="Opportunities" title="Seven places to act" lede="Each one names its source. The button on a cue opens a campaign, still unsent." />
      <ul className="grid gap-3 sm:grid-cols-2">
        {cards.map((card) => (
          <li key={card.id}>
            <button type="button" onClick={card.onOpen} className="h-full w-full text-left">
              <Card className="grid h-full gap-2 p-4 transition hover:border-saffron">
                <div className="flex items-start justify-between gap-3">
                  <h2 className="font-serif text-3xl leading-none text-[#2B2B2B]">{card.title}</h2>
                  <span className="shrink-0 rounded-full bg-[#E7DFD0] px-2 py-1 text-[0.75rem] font-medium text-[#5C564C]">{card.count}</span>
                </div>
                <p className="text-[0.95rem] text-[#1F4D3A]">{card.score}</p>
                <p className="text-[0.8rem] text-[#5C564C]">{card.source}</p>
              </Card>
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
