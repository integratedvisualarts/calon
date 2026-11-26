/** Written by src/data/live.ts from the engine’s visibility audit. AEO max 50, SEO max 50. */
export const visibilityIndex = { total: 0, aeo: 0, seo: 0 };

export type TrackFix = {
  id: string;
  title: string;
  detail: string;
  priority: "High" | "Medium";
  impact: string;
  action: string;
  draftTitle: string;
  body: string;
};

export const aeoFixes: TrackFix[] = [];

export const seoGroups: { id: string; title: string; score: number; fixes: TrackFix[] }[] = [];

/** Lines on the Visibility screens that depend on the audit. */
export const visibilityCopy = {
  title: "",
  lede: "",
  updated: "",
  topAeo: "",
  topSeo: "",
  seoLede: "",
  blog: null as TrackFix | null,
  rivalNote: "",
};
