import { aeoFixes, seoGroups } from "@/data/visibility-tracks";
import { salesOpportunities, salesSnapshot } from "@/data/sales-opportunities";
import { matchingOpportunities, typeSource, type Opportunity } from "@/data/opportunities";

export type CampaignSource = {
  id: string;
  kind: string;
  title: string;
  why: string;
  data: string;
  timing: string;
  audience: string;
  actionLabel: string;
  variants: { id: string; label: string; body: string }[];
};

function fromOpportunity(item: Opportunity): CampaignSource {
  return {
    id: item.campaign.id,
    kind: item.type,
    title: item.title,
    why: item.insight,
    data: typeSource[item.type],
    timing: item.campaign.timing,
    audience: item.campaign.audience,
    actionLabel: item.actionLabel,
    variants: item.campaign.variants.map((variant) => ({ ...variant })),
  };
}

const aeoData = "Data from: ChatGPT, Gemini, Perplexity and AI Overviews.";
const seoData = "Data from: your website (site API/crawl), Google Search Console.";

export function campaignCatalog(): CampaignSource[] {
  const cues = matchingOpportunities().map(fromOpportunity);
  const sales = salesOpportunities.map((item) => ({
    id: item.id,
    kind: "Sales",
    title: item.title,
    why: item.insight,
    data: salesSnapshot.source,
    timing: item.timing,
    audience: item.audience,
    actionLabel: item.actionLabel,
    variants: item.variants.map((variant) => ({ ...variant })),
  }));
  const visibility = [
    ...aeoFixes.map((fix) => ({
      id: `fix-${fix.id}`,
      kind: "Visibility",
      title: fix.draftTitle,
      why: fix.detail,
      data: aeoData,
      timing: "When you approve",
      audience: "People searching nearby",
      actionLabel: fix.action,
      variants: [
        { id: "a", label: "Straight", body: fix.body },
        { id: "b", label: "Shorter", body: fix.title },
      ],
    })),
    ...seoGroups.flatMap((group) =>
      group.fixes.map((fix) => ({
        id: `fix-${fix.id}`,
        kind: "Visibility",
        title: fix.draftTitle,
        why: fix.detail,
        data: seoData,
        timing: "When you approve",
        audience: "People searching nearby",
        actionLabel: fix.action,
        variants: [
          { id: "a", label: "Straight", body: fix.body },
          { id: "b", label: "Shorter", body: fix.title },
        ],
      })),
    ),
  ];
  return [...visibility, ...sales, ...cues];
}

export function sourceFor(id: string | undefined): CampaignSource | undefined {
  if (!id) return undefined;
  return campaignCatalog().find((item) => item.id === id);
}
