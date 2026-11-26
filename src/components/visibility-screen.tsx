"use client";

import { visibility } from "@/data/demo-data";
import { aeoFixes, seoGroups, visibilityCopy, visibilityIndex, type TrackFix } from "@/data/visibility-tracks";
import { Card, EmptyState, mentionTone, PageHeader, PrimaryButton, ScoreRing } from "@/components/bits";
import { useStore } from "@/lib/store";
import { engineCards } from "@/lib/visibility-cards";
import { useMemo, useState } from "react";
import { brand } from "@/data/brands";

export function VisibilityScreen() {
  const store = useStore();
  if (!store.sources.google) {
    return <EmptyState title="No listing" body="Connect Google Business Profile." />;
  }
  if (store.section === "aeo") return <AeoPage />;
  if (store.section === "seo") return <SeoPage />;
  return <VisibilityHome />;
}

function draftFrom(fix: TrackFix, sourceData: string) {
  return {
    id: `fix-${fix.id}`,
    title: fix.draftTitle,
    actionLabel: fix.action,
    status: "draft" as const,
    audience: "People searching nearby",
    timing: "When you approve",
    sourceWhy: fix.detail,
    sourceData,
    variants: [
      { id: "a", label: "Straight", body: fix.body },
      { id: "b", label: "Shorter", body: fix.title },
    ],
  };
}

function VisibilityHome() {
  const store = useStore();
  const [rivals, setRivals] = useState(false);
  const cards = engineCards("ai");
  const ranked = cards.filter((card) => card.mention === "ranked").length;
  const mentioned = cards.filter((card) => card.mention === "mentioned").length;
  const missing = cards.filter((card) => card.mention === "absent").length;
  return (
    <div className="rise grid gap-4">
      <PageHeader kicker="Visibility" title={visibilityCopy.title} lede={visibilityCopy.lede} />
      <Card className="flex items-center gap-4 p-4">
        <ScoreRing score={visibilityIndex.total} label="Visibility" />
        <div>
          <p className="font-serif text-3xl text-[#2B2B2B]">{visibility.ai.label}</p>
          <p className="text-[#1F4D3A]">{visibilityCopy.updated}</p>
        </div>
      </Card>
      <div className="grid gap-2 sm:grid-cols-2">
        <button type="button" onClick={() => store.openSection("visibility", "aeo")} className="text-left">
          <Card className="grid h-full gap-2 p-4 transition hover:border-saffron">
            <p className="text-[0.75rem] font-medium tracking-wide text-[#7A5E28] uppercase">AEO/GEO · AI answers</p>
            <p className="font-serif text-4xl text-[#2B2B2B]">{visibilityIndex.aeo}</p>
            <p className="text-[0.9rem] text-[#5C564C]">
              ChatGPT, Gemini, Perplexity, AI Overviews. {ranked} ranked, {mentioned} mentioned, {missing} missing.
            </p>
            <p className="text-[0.85rem] text-[#2B2B2B]">{visibilityCopy.topAeo}</p>
          </Card>
        </button>
        <button type="button" onClick={() => store.openSection("visibility", "seo")} className="text-left">
          <Card className="grid h-full gap-2 p-4 transition hover:border-saffron">
            <p className="text-[0.75rem] font-medium tracking-wide text-[#7A5E28] uppercase">SEO · Search</p>
            <p className="font-serif text-4xl text-[#2B2B2B]">{visibilityIndex.seo}</p>
            <p className="text-[0.9rem] text-[#5C564C]">Google ranking, the map pack, on-page and off-page.</p>
            <p className="text-[0.85rem] text-[#2B2B2B]">{visibilityCopy.topSeo}</p>
            <p className="text-[0.8rem] text-[#5C564C]">Data from: your website (site API/crawl), Google Search Console.</p>
          </Card>
        </button>
      </div>
      <button
        type="button"
        onClick={() => setRivals(true)}
        className="h-11 rounded-full border border-[#1F4D3A] text-[0.95rem] font-semibold text-[#1F4D3A]"
      >
        Competitors
      </button>
      {rivals ? <CompetitorNote onClose={() => setRivals(false)} /> : null}
    </div>
  );
}

function CompetitorNote({ onClose }: { onClose: () => void }) {
  return (
    <Card className="grid gap-2 p-4">
      <p className="font-medium text-[#2B2B2B]">Competitors sit on Home.</p>
      <p className="text-[0.9rem] text-[#5C564C]">{brand.rivalNote}</p>
      <button type="button" onClick={onClose} className="h-11 justify-self-start font-semibold text-[#7A5E28]">
        Close
      </button>
    </Card>
  );
}

function AeoPage() {
  const store = useStore();
  const cards = useMemo(() => engineCards("ai"), [store.tick]);
  return (
    <div className="rise grid gap-4">
      <PageHeader
        kicker="AEO/GEO"
        title="AI answers"
        lede={`${visibilityIndex.aeo} of the 58 index. Scoring and fixes across ChatGPT, Gemini, Perplexity and AI Overviews.`}
      />
      <ul className="grid gap-2">
        {cards.map((card) => {
          const tone = mentionTone(card.mention);
          return (
            <li key={card.id}>
              <Card className="grid gap-1 p-4 text-[#2B2B2B]">
                <div className="flex items-center justify-between gap-2">
                  <p className="font-medium">{card.engine}</p>
                  <span className="rounded-full bg-[#E7DFD0] px-2 text-[0.75rem] font-medium text-[#5C564C]">{tone.label}</span>
                </div>
                <p className="text-[0.95rem] text-[#5C564C]">
                  {card.hook}. {card.note}.
                </p>
              </Card>
            </li>
          );
        })}
      </ul>
      <section className="grid gap-2">
        <h2 className="font-serif text-2xl text-[#2B2B2B]">Fixes</h2>
        {aeoFixes.map((fix) => (
          <FixCard
            key={fix.id}
            fix={fix}
            onAction={() => store.openOrCreate(`fix-${fix.id}`, () => draftFrom(fix, "Data from: ChatGPT, Gemini, Perplexity and AI Overviews."))}
          />
        ))}
      </section>
    </div>
  );
}

function SeoPage() {
  const store = useStore();
  return (
    <div className="rise grid gap-4">
      <PageHeader
        kicker="SEO"
        title="Search"
        lede={visibilityCopy.seoLede}
      />
      {seoGroups.map((group) => (
        <section key={group.id} className="grid gap-2">
          <h2 className="font-serif text-2xl text-[#2B2B2B]">
            {group.title} <span className="text-[#7A5E28]">{group.score}</span>
          </h2>
          {group.fixes.map((fix) => (
            <FixCard key={fix.id} fix={fix} onAction={() => store.openOrCreate(`fix-${fix.id}`, () => draftFrom(fix, "Data from: your website (site API/crawl), Google Search Console."))} />
          ))}
        </section>
      ))}
      {visibilityCopy.blog ? (
      <Card className="grid gap-2 p-4">
        <p className="text-[0.75rem] font-medium tracking-wide text-[#7A5E28] uppercase">Blog and guest content</p>
        <p className="text-[#2B2B2B]">{brand.blogNote}</p>
        <PrimaryButton
          onClick={() =>
            store.openOrCreate("fix-seo-blogs", () =>
              draftFrom(visibilityCopy.blog!, "Data from: your website (site API/crawl), Google Search Console."),
            )
          }
        >
          Pitch the blog
        </PrimaryButton>
      </Card>
      ) : null}
    </div>
  );
}

function FixCard({ fix, onAction }: { fix: TrackFix; onAction: () => void }) {
  return (
    <Card className="grid gap-1 p-4 text-[#2B2B2B]">
      <div className="flex items-center justify-between gap-2">
        <p className="font-medium">{fix.title}</p>
        <span className="text-[0.75rem] text-[#7A5E28]">{fix.priority}</span>
      </div>
      <p className="text-[0.9rem] text-[#5C564C]">{fix.detail}</p>
      <p className="text-[0.8rem]">Impact: {fix.impact}</p>
      <button type="button" onClick={onAction} className="mt-1 h-11 rounded-full bg-saffron font-semibold text-saffron-ink">
        {fix.action}
      </button>
    </Card>
  );
}
