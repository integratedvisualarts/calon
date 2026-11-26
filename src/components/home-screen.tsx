"use client";

import { business, sales, visibility } from "@/data/demo-data";
import { actionLabel, homeOpportunities, seeAllLabel, typeSlug, type Opportunity } from "@/data/opportunities";
import { visibilityIndex } from "@/data/visibility-tracks";
import { chaiSocialProfile } from "@/data/restaurant";
import { Card, CardSkeleton, EmptyState, PageHeader, mentionTone, usePause } from "@/components/bits";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { useStore } from "@/lib/store";
import { engineCards } from "@/lib/visibility-cards";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useEffect, useRef, useState } from "react";

const competitors = [
  {
    id: "mint",
    name: "Mint Leaf",
    miles: "0.4",
    score: 71,
    term: "chai near me",
    rating: "4.6",
    reviews: 320,
    gap: "The profile answers “chai near me” in the first sentence.",
  },
  {
    id: "cathays",
    name: "Cathays Street Food",
    miles: "0.7",
    score: 66,
    term: "Indian street food Cathays",
    rating: "4.4",
    reviews: 180,
    gap: "Street food and Cathays are in the business name.",
  },
  {
    id: "tiffin",
    name: "Church Road Tiffin",
    miles: "0.9",
    score: 52,
    term: "Diwali thali Cardiff",
    rating: "4.5",
    reviews: 96,
    gap: "A Diwali thali is already on their Google menu.",
  },
  {
    id: "heath",
    name: "Heath Open Kitchen",
    miles: "0.8",
    score: 61,
    term: "curry near me open now",
    rating: "4.3",
    reviews: 210,
    gap: "Site hours and the order page match.",
  },
] as const;

export function HomeScreen() {
  const store = useStore();
  const pause = usePause("home");
  const [text, setText] = useState("");
  const [rivalsOpen, setRivalsOpen] = useState(false);
  if (!store.sources.google) {
    return (
      <EmptyState
        title="Your day is empty"
        body="Connect Google Business Profile to see today."
        action={
          <button type="button" className="min-h-11 justify-self-start font-semibold text-saffron" onClick={() => store.go("profile")}>
            Open profile
          </button>
        }
      />
    );
  }
  const score = visibility.ai;
  const engines = engineCards("ai").slice(0, 3);
  const slides = homeOpportunities(chaiSocialProfile);
  function launch(item: Opportunity) {
    const seed = item.campaign;
    store.openOrCreate(seed.id, () => ({
      id: seed.id,
      title: seed.title,
      actionLabel: actionLabel(item),
      status: "draft",
      audience: seed.audience,
      timing: seed.timing,
      variants: seed.variants.map((variant) => ({ ...variant })),
    }));
  }
  return (
    <div className="rise grid w-full min-w-0 grid-cols-1 gap-4">
      <PageHeader kicker={business.freshness} title={business.greeting} lede={business.lede} />
      {pause ? <CardSkeleton /> : null}
      {pause ? null : (
      <>
      <Card className="grid min-w-0 gap-2 overflow-hidden p-4">
        <div className="flex items-center gap-2">
          <GoldScore score={score.score} />
          <div className="min-w-0">
            <p className="text-[0.75rem] font-medium tracking-wide text-[#7A5E28] uppercase">Visibility</p>
            <p className="font-serif text-2xl leading-tight text-[#2B2B2B]">{score.label}</p>
            <p className="text-[#1F4D3A]">{score.deltaText}</p>
          </div>
        </div>
        <div className="grid min-w-0 grid-cols-3 items-stretch gap-2">
          {engines.map((card) => {
            const tone = mentionTone(card.mention);
            return (
              <button
                key={card.id}
                type="button"
                onClick={() => store.openSection("visibility", "aeo")}
                className="flex h-full min-h-28 min-w-0 flex-col gap-2 rounded-xl bg-navy-2 p-2 text-left transition hover:border-saffron motion-safe:active:scale-[0.99]"
              >
                <span className="text-[0.62rem] font-medium tracking-wide text-[#C4A15A] uppercase">AEO</span>
                <span className="truncate text-[0.75rem] leading-4 font-medium text-[#F4EEE1]">{card.engine}</span>
                <span
                  className={`w-fit rounded-full px-1.5 text-[0.62rem] leading-4 font-medium uppercase ${
                    card.mention === "ranked"
                      ? "bg-[#1F4D3A] text-[#D7E7D4]"
                      : card.mention === "mentioned"
                        ? "bg-[#C4A15A]/25 text-[#F4EEE1]"
                        : "bg-[#8C4034] text-[#F4EEE1]"
                  }`}
                >
                  {tone.label}
                </span>
                <span className="min-h-8 text-[0.8rem] leading-4 font-semibold text-[#F4EEE1]">{card.note}</span>
                <span className="mt-auto text-[0.7rem] leading-4 text-[#E7DCC8]">{tone.label}</span>
              </button>
            );
          })}
        </div>
        <div className="grid grid-cols-2 gap-2">
          <button type="button" onClick={() => store.openSection("visibility", "aeo")} className="grid h-14 rounded-xl bg-navy-2 px-2 py-1 text-left">
            <span className="text-[0.68rem] font-medium tracking-wide text-[#C4A15A] uppercase">AEO</span>
            <span className="font-serif text-xl leading-none text-[#F4EEE1]">{visibilityIndex.aeo}</span>
          </button>
          <button type="button" onClick={() => store.openSection("visibility", "seo")} className="grid h-14 rounded-xl bg-navy-2 px-2 py-1 text-left">
            <span className="text-[0.68rem] font-medium tracking-wide text-[#C4A15A] uppercase">SEO</span>
            <span className="font-serif text-xl leading-none text-[#F4EEE1]">{visibilityIndex.seo}</span>
          </button>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <button type="button" onClick={() => store.openSection("visibility", null)} className="h-11 rounded-full bg-saffron px-2 text-[0.9rem] font-semibold text-saffron-ink">
            Improve score
          </button>
          <button type="button" onClick={() => setRivalsOpen(true)} className="h-11 rounded-full border border-[#1F4D3A] px-2 text-[0.9rem] font-semibold text-[#1F4D3A]">
            Competitors
          </button>
        </div>
      </Card>
      <CompetitorSheet
        open={rivalsOpen}
        onOpenChange={setRivalsOpen}
        onTarget={(rival) => {
          setRivalsOpen(false);
          store.openOrCreate(`opp-rival-${rival.id}`, () => ({
            id: `opp-rival-${rival.id}`,
            title: `Target “${rival.term}”`,
            actionLabel: "Target this term",
            status: "draft",
            audience: "People searching nearby",
            timing: "Thursday 11:00",
            variants: [
              { id: "a", label: "Straight", body: `Chai Social, 134 Whitchurch Road. For “${rival.term}”: vegetarian thali, masala chai, dinner until 22:00. Reply to book.` },
              { id: "b", label: "Warmer", body: `Looking for ${rival.term}? We’re on Whitchurch Road. The vegetarian thali and masala chai are on. Reply and we’ll hold a table.` },
              { id: "c", label: "Shorter", body: `${rival.term}. Chai Social, Whitchurch Road. Thali and masala chai. Reply to book.` },
            ],
          }));
        }}
      />
      <button type="button" onClick={() => store.go("sales")} className="text-left">
        <Card className="grid gap-2 p-5 transition hover:border-saffron">
          <p className="text-[0.8rem] font-medium tracking-wide text-saffron uppercase">Till pulse</p>
          <p className="font-serif text-4xl leading-none">{sales.yesterday}</p>
          <p className="text-[0.8rem] text-mist">Today so far</p>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            {business.kpis.map((kpi) => (
              <div key={kpi.id} className="rounded-xl bg-navy-2 px-3 py-2">
                <p className="text-[0.75rem] text-faint">{kpi.label}</p>
                <p className="font-serif text-2xl">{kpi.value}</p>
                <p className={`text-[0.75rem] ${kpi.tone === "up" ? "text-teal" : "text-mist"}`}>{kpi.hint}</p>
              </div>
            ))}
          </div>
          <div className="grid grid-cols-3 items-end gap-2 text-[0.68rem] leading-tight text-[#5C564C]">
            <p>
              <span className="block font-medium text-[#1F4D3A]">{business.pulse.vsLabel}</span>
              {business.pulse.vsLine}
            </p>
            <div>
              <div className="flex h-2 overflow-hidden rounded-full" aria-hidden="true">
                <div className="h-full bg-[#1F4D3A]" style={{ width: `${business.pulse.dinePct}%` }} />
                <div className="h-full bg-[#C4A15A]" style={{ width: `${business.pulse.deliveryPct}%` }} />
              </div>
              <p className="mt-1">Dine {business.pulse.dinePct} · Delivery {business.pulse.deliveryPct}</p>
            </div>
            <p>
              <span className="block font-medium text-[#2B2B2B]">Booked {business.pulse.booked}</span>
              Walk-in {business.pulse.walkIn}
            </p>
          </div>
          <p className="text-[0.8rem] text-faint">{business.pulse.sync}</p>
        </Card>
      </button>
      <InsightCarousel
        cards={slides.map((item) => ({
          id: item.id,
          chip: `${item.type} · ${item.subtype}`,
          line: item.title,
          metric: item.metric,
          why: item.insight,
          fit: item.fitReason,
          action: actionLabel(item),
          seeAll: seeAllLabel(item.type),
          lead: item.type === "Festival",
          onClick: () => launch(item),
          onSeeAll: () => {
            sessionStorage.setItem("calon-home-slide", String(slides.findIndex((slide) => slide.id === item.id)));
            store.openSection("insights", typeSlug(item.type));
          },
        }))}
      />
      <form
        className="flex h-12 items-center gap-2 rounded-full border border-line bg-navy-2 pr-1 pl-4"
        onSubmit={(event) => {
          event.preventDefault();
          const next = text.trim();
          setText("");
          store.setChat(true);
          if (next) store.sendChat(next);
        }}
      >
        <label className="min-w-0 flex-1">
          <span className="sr-only">Ask Calon</span>
          <input
            value={text}
            onChange={(event) => setText(event.target.value)}
            placeholder="Ask Calon"
            className="h-10 w-full bg-transparent text-base text-[#F4EEE1] outline-none placeholder:text-[#E7DCC8]"
          />
        </label>
        <button type="submit" className="h-10 shrink-0 rounded-full bg-saffron px-4 font-semibold text-saffron-ink">
          Ask
        </button>
      </form>
      </>
      )}
    </div>
  );
}

type Rival = (typeof competitors)[number];

function CompetitorSheet({
  open,
  onOpenChange,
  onTarget,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onTarget: (rival: Rival) => void;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[min(85vh,40rem)] overflow-y-auto bg-[#F4EEE1] text-[#2B2B2B] max-sm:inset-x-0 max-sm:top-auto max-sm:bottom-0 max-sm:max-w-none max-sm:translate-x-0 max-sm:translate-y-0 max-sm:rounded-t-3xl max-sm:rounded-b-none sm:max-w-lg">
        <DialogTitle className="pr-8 font-serif text-2xl text-[#2B2B2B]">Nearby competitors</DialogTitle>
        <DialogDescription className="text-[#5C564C]">
          Compared with your score of {visibilityIndex.total}. Their edge is on-page markup. A guest post would close the AEO gap.
        </DialogDescription>
        <ul className="grid gap-2">
          {competitors.map((rival) => {
            const delta = rival.score - visibilityIndex.total;
            return (
              <li key={rival.id} className="grid gap-1 rounded-xl bg-[#E7DFD0] p-3">
                <div className="flex items-baseline justify-between gap-2">
                  <p className="font-medium">{rival.name}</p>
                  <p className="text-[0.75rem] text-[#5C564C]">{rival.miles} miles</p>
                </div>
                <p className="text-[0.85rem]">
                  Score {rival.score}{" "}
                  <span className="text-[#7A5E28]">
                    {delta > 0 ? `+${delta}` : delta} vs {visibilityIndex.total}
                  </span>
                </p>
                <p className="text-[0.85rem]">“{rival.term}”</p>
                <p className="text-[0.8rem] text-[#5C564C]">
                  {rival.rating} · {rival.reviews} reviews
                </p>
                <p className="text-[0.85rem]">{rival.gap}</p>
                <button type="button" onClick={() => onTarget(rival)} className="mt-1 h-10 rounded-full bg-[#1F4D3A] font-semibold text-[#F4EEE1]">
                  Target this term
                </button>
              </li>
            );
          })}
        </ul>
      </DialogContent>
    </Dialog>
  );
}

function GoldScore({ score }: { score: number }) {
  const radius = 28;
  const circ = 2 * Math.PI * radius;
  const offset = circ * (1 - Math.max(0, Math.min(100, score)) / 100);
  return (
    <div className="relative grid size-[4.75rem] shrink-0 place-items-center" role="img" aria-label={`Visibility ${score} out of 100`}>
      <svg viewBox="0 0 72 72" className="absolute inset-0 -rotate-90">
        <circle cx="36" cy="36" r={radius} stroke="#E7DFD0" strokeWidth="5" fill="none" />
        <circle
          cx="36"
          cy="36"
          r={radius}
          className="score-ring"
          stroke="#C4A15A"
          strokeWidth="5"
          fill="none"
          strokeLinecap="round"
          strokeDasharray={circ}
          strokeDashoffset={offset}
          style={{ ["--ring-circ" as string]: String(circ) }}
        />
      </svg>
      <span className="grid justify-items-center leading-none">
        <span className="font-serif text-3xl text-[#7A5E28]">{score}</span>
        <span className="text-[0.62rem] text-[#5C564C]">/100</span>
      </span>
    </div>
  );
}

type Cue = {
  id: string;
  chip: string;
  line: string;
  metric: string;
  why: string;
  fit: string;
  action: string;
  seeAll: string;
  lead?: boolean;
  onClick: () => void;
  onSeeAll: () => void;
};

function InsightCarousel({ cards }: { cards: Cue[] }) {
  const scroller = useRef<HTMLDivElement>(null);
  const [index, setIndex] = useState(() => {
    if (typeof window === "undefined") return 0;
    const saved = Number(sessionStorage.getItem("calon-home-slide") || 0);
    return Number.isFinite(saved) ? saved : 0;
  });

  function width() {
    const el = scroller.current;
    const card = el?.firstElementChild as HTMLElement | undefined;
    if (!el || !card) return 1;
    const gap = Number.parseFloat(getComputedStyle(el).columnGap || "0") || 0;
    return card.offsetWidth + gap;
  }

  function sync() {
    const el = scroller.current;
    if (!el) return;
    const next = Math.min(cards.length - 1, Math.max(0, Math.round(el.scrollLeft / width())));
    sessionStorage.setItem("calon-home-slide", String(next));
    setIndex(next);
  }

  useEffect(() => {
    const saved = Number(sessionStorage.getItem("calon-home-slide") || 0);
    const el = scroller.current;
    const card = el?.children[saved] as HTMLElement | undefined;
    if (!el || !card || !saved) return;
    el.scrollTo({ left: card.offsetLeft, behavior: "auto" });
  }, []);

  function go(next: number) {
    const el = scroller.current;
    if (!el) return;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    el.scrollTo({ left: next * width(), behavior: reduced ? "auto" : "smooth" });
  }

  return (
    <div className="grid w-full min-w-0 max-w-sm gap-2 overflow-x-hidden">
      <div className="relative min-w-0 overflow-x-hidden [container-type:inline-size]">
        <div
          ref={scroller}
          onScroll={sync}
          className="flex w-full min-w-0 snap-x snap-mandatory overflow-x-auto scroll-smooth overscroll-x-contain motion-reduce:scroll-auto [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
          aria-label="Insights"
        >
          {cards.map((card) => (
            <article
              key={card.id}
              onClick={card.onSeeAll}
              className={`box-border flex aspect-square w-[calc(100cqw-28px)] max-w-[calc(100cqw-28px)] min-w-0 shrink-0 basis-[calc(100cqw-28px)] snap-start flex-col justify-between rounded-card bg-surface p-3 text-[#2B2B2B] shadow-[var(--shadow-lift)] ${
                card.lead ? "border-2 border-[#C4A15A]" : "border border-line"
              }`}
            >
              <span
                className={`inline-flex w-fit max-w-full rounded-full px-2 py-0.5 text-[0.62rem] leading-4 font-medium tracking-wide uppercase ${
                  card.lead ? "bg-[#C4A15A]/20 text-[#7A5E28]" : "bg-[#E7DFD0] text-[#5C564C]"
                }`}
              >
                {card.chip}
              </span>
              <h2 className="line-clamp-2 font-serif text-xl leading-tight break-words">{card.line}</h2>
              <p className="font-serif text-lg leading-tight text-[#7A5E28]">{card.metric}</p>
              <p className="line-clamp-2 min-w-0 break-words text-[0.75rem] leading-snug text-[#5C564C]">{card.why}</p>
              <p className="text-[0.68rem] leading-4 text-[#7A5E28]">{card.fit}</p>
              <div className="grid grid-cols-2 gap-1">
                <button
                  type="button"
                  onClick={(event) => {
                    event.stopPropagation();
                    card.onClick();
                  }}
                  className="box-border h-11 rounded-full bg-saffron px-1 text-center text-[0.68rem] leading-tight font-semibold text-saffron-ink"
                >
                  {card.action}
                </button>
                <button
                  type="button"
                  onClick={(event) => {
                    event.stopPropagation();
                    card.onSeeAll();
                  }}
                  className="box-border h-11 rounded-full border border-[#1F4D3A] px-1 text-center text-[0.68rem] leading-tight font-semibold text-[#1F4D3A]"
                >
                  {card.seeAll}
                </button>
              </div>
            </article>
          ))}
        </div>
        <button
          type="button"
          className="absolute top-1/2 left-1 hidden size-9 -translate-y-1/2 place-items-center rounded-full bg-[#0E2A20]/80 text-[#F4EEE1] md:grid"
          aria-label="Previous insight"
          onClick={() => go(Math.max(0, index - 1))}
        >
          <ChevronLeft className="size-4" aria-hidden="true" />
        </button>
        <button
          type="button"
          className="absolute top-1/2 right-1 hidden size-9 -translate-y-1/2 place-items-center rounded-full bg-[#0E2A20]/80 text-[#F4EEE1] md:grid"
          aria-label="Next insight"
          onClick={() => go(Math.min(cards.length - 1, index + 1))}
        >
          <ChevronRight className="size-4" aria-hidden="true" />
        </button>
      </div>
      <div className="flex justify-center gap-1" role="tablist" aria-label="Insight cards">
        {cards.map((card, i) => (
          <button
            key={card.chip}
            type="button"
            role="tab"
            aria-selected={i === index}
            aria-label={card.chip}
            onClick={() => go(i)}
            className="grid size-6 place-items-center"
          >
            <span className={`block h-1.5 rounded-full ${i === index ? "w-4 bg-[#C4A15A]" : "w-1.5 bg-[#5C564C]/50"}`} />
          </button>
        ))}
      </div>
    </div>
  );
}
