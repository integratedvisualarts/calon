import { typeFromSlug, typeSlug, typeTitle, type OpportunityType } from "@/data/opportunities";

export type Screen = "home" | "opportunities" | "visibility" | "insights" | "campaigns" | "reviews" | "profile" | "sales";

export type View = {
  screen: Screen;
  openCampaignId: string | null;
  chatOpen: boolean;
  /** Insight type slug, or "aeo" / "seo" on Visibility. */
  section: string | null;
  notFound: boolean;
};

const screens: Screen[] = ["home", "opportunities", "visibility", "insights", "campaigns", "reviews", "profile", "sales"];

export const screenLabel: Record<Screen, string> = {
  home: "Home",
  opportunities: "Opportunities",
  visibility: "Visibility",
  insights: "Opportunities",
  campaigns: "Campaigns",
  reviews: "Reviews",
  profile: "Profile",
  sales: "Sales",
};

export function viewKey(view: View) {
  return `${view.screen}|${view.section ?? ""}|${view.openCampaignId ?? ""}|${view.chatOpen ? "ask" : ""}|${view.notFound ? "missing" : ""}`;
}

export function viewUrl(view: View) {
  if (view.notFound) return "/not-found";
  if (view.chatOpen) return "/ask";
  if (view.screen === "campaigns" && view.openCampaignId) {
    return `/campaigns/${encodeURIComponent(view.openCampaignId)}`;
  }
  if (view.screen === "visibility" && (view.section === "aeo" || view.section === "seo")) {
    return `/opportunities/visibility/${view.section}`;
  }
  if (view.screen === "visibility") return "/opportunities/visibility";
  if (view.screen === "insights" && view.section) return `/opportunities/${view.section}`;
  if (view.screen === "insights" || view.screen === "opportunities") return "/opportunities";
  if (view.screen === "sales") return "/opportunities/sales";
  if (view.screen === "home") return "/";
  return `/${view.screen}`;
}

export function labelFor(view: View | undefined) {
  if (!view) return "Home";
  if (view.notFound) return "Home";
  if (view.chatOpen) return "Ask Calon";
  if (view.openCampaignId) return "Campaigns";
  if (view.screen === "visibility" && view.section === "aeo") return "AEO/GEO";
  if (view.screen === "visibility" && view.section === "seo") return "SEO";
  if (view.screen === "visibility") return "Visibility";
  if (view.screen === "sales") return "Sales";
  if (view.screen === "insights" && view.section) {
    const type = typeFromSlug(view.section);
    return type ? typeTitle(type) : "Opportunities";
  }
  if (view.screen === "insights") return "Opportunities";
  return screenLabel[view.screen];
}

/** Tab that should look selected. Visibility, sales and the old insight routes sit under Opportunities. */
export function tabFor(screen: Screen): "home" | "opportunities" | "campaigns" | "profile" {
  if (screen === "home" || screen === "campaigns" || screen === "profile") return screen;
  return "opportunities";
}

function blank(partial: Partial<View> & Pick<View, "screen">): View {
  return {
    screen: partial.screen,
    openCampaignId: partial.openCampaignId ?? null,
    chatOpen: partial.chatOpen ?? false,
    section: partial.section ?? null,
    notFound: partial.notFound ?? false,
  };
}

function typeSection(slug: string) {
  const type = typeFromSlug(slug);
  return type ? typeSlug(type as OpportunityType) : null;
}

export function parseLocation(pathname: string): View {
  const parts = pathname.split("/").filter(Boolean);
  if (parts.length === 0) return blank({ screen: "home" });
  if (parts[0] === "ask" && parts.length === 1) return blank({ screen: "home", chatOpen: true });
  if (parts[0] === "campaigns" && parts[1]) {
    return blank({ screen: "campaigns", openCampaignId: decodeURIComponent(parts[1]) });
  }
  if (parts[0] === "opportunities" && parts.length === 1) return blank({ screen: "opportunities" });
  if (parts[0] === "opportunities" && parts[1] === "visibility" && parts.length === 2) return blank({ screen: "visibility" });
  if (parts[0] === "opportunities" && parts[1] === "visibility" && parts.length === 3 && (parts[2] === "aeo" || parts[2] === "seo")) {
    return blank({ screen: "visibility", section: parts[2] });
  }
  if (parts[0] === "opportunities" && parts[1] === "sales" && parts.length === 2) return blank({ screen: "sales" });
  if (parts[0] === "opportunities" && parts.length === 2 && typeSection(parts[1])) {
    return blank({ screen: "insights", section: typeSection(parts[1]) });
  }
  if (parts[0] === "visibility" && parts.length === 1) return blank({ screen: "visibility" });
  if (parts[0] === "visibility" && parts.length === 2 && (parts[1] === "aeo" || parts[1] === "seo")) {
    return blank({ screen: "visibility", section: parts[1] });
  }
  if (parts[0] === "insights" && parts.length === 1) return blank({ screen: "opportunities" });
  if (parts[0] === "insights" && parts[1] === "type" && parts[2] && typeSection(parts[2])) {
    return blank({ screen: "insights", section: typeSection(parts[2]) });
  }
  if (parts[0] === "sales" && parts.length === 1) return blank({ screen: "sales" });
  if (parts.length === 1 && screens.includes(parts[0] as Screen)) {
    return blank({ screen: parts[0] as Screen });
  }
  return blank({ screen: "home", notFound: true });
}
