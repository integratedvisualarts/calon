"use client";

import { sales, searchTerms } from "@/data/demo-data";
import {
  actionLabel,
  matchingOpportunities,
  opportunitiesForType,
  opportunityTypeOrder,
  seeAllLabel,
  typeFromSlug,
  typeSlug,
  typeSource,
  typeTitle,
  type Opportunity,
  type OpportunityType,
} from "@/data/opportunities";
import { AreaSignals } from "@/components/area-signals";
import { Card, CardSkeleton, EmptyState, PageHeader, Pill, PrimaryButton, usePause } from "@/components/bits";
import { useStore } from "@/lib/store";
import { Inbox } from "lucide-react";
import { useState } from "react";

export function InsightsScreen() {
  const store = useStore();
  const pause = usePause(store.section ?? "insights");
  const [openId, setOpenId] = useState<string | null>(null);
  const [when, setWhen] = useState<Opportunity["when"]>("week");
  const type = typeFromSlug(store.section ?? "");
  const matched = matchingOpportunities();
  const open = matched.find((item) => item.id === openId) ?? null;
  if (!store.sources.sales) {
    return (
      <EmptyState
        title="Square isn’t connected"
        body="Connect Square POS in Profile to see what the week is suggesting."
        action={
          <button type="button" className="min-h-11 font-semibold text-saffron" onClick={() => store.go("profile")}>
            Connect Square POS
          </button>
        }
      />
    );
  }
  if (pause) {
    return (
      <div className="rise grid gap-4">
        <PageHeader kicker="Insights" title="This week" />
        <CardSkeleton />
      </div>
    );
  }
  if (type && open) {
    return (
      <div className="rise grid gap-4">
        <button type="button" className="min-h-11 justify-self-start font-medium text-[#7A5E28]" onClick={() => setOpenId(null)}>
          {typeTitle(type)}
        </button>
        <OpportunityDetail item={open} />
      </div>
    );
  }
  if (type) {
    const upcoming = opportunitiesForType(type, undefined, when);
    return (
      <div className="rise grid gap-4">
        <header className="grid gap-2">
          <h1 className="font-serif text-4xl leading-tight text-ink">
            {typeTitle(type)} · {upcoming.length} upcoming
          </h1>
          <p className="text-[0.9rem] text-[#5C564C]">{typeSource[type]}</p>
        </header>
        <div className="flex min-w-0 gap-2 overflow-x-auto" role="tablist" aria-label="Opportunity type">
          {opportunityTypeOrder.map((item) => (
            <button
              key={item}
              type="button"
              role="tab"
              aria-selected={item === type}
              onClick={() => store.replaceSection(typeSlug(item))}
              className={`h-11 shrink-0 rounded-full px-3 text-[0.85rem] font-medium ${
                item === type ? "bg-saffron text-saffron-ink" : "bg-surface text-[#5C564C]"
              }`}
            >
              {typeTitle(item)}
            </button>
          ))}
        </div>
        <div className="flex gap-2" role="group" aria-label="When">
          {(
            [
              ["week", "This week"],
              ["coming", "Coming up"],
              ["later", "Later"],
            ] as const
          ).map(([id, label]) => (
            <button
              key={id}
              type="button"
              onClick={() => setWhen(id)}
              className={`h-11 rounded-full px-3 text-[0.85rem] font-medium ${when === id ? "bg-saffron text-saffron-ink" : "bg-surface text-[#5C564C]"}`}
            >
              {label}
            </button>
          ))}
        </div>
        {upcoming.length === 0 ? (
          <EmptyState
            title={`Nothing coming up for ${typeTitle(type).toLowerCase()} ${when === "week" ? "this week" : when === "coming" ? "before New Year" : "later"}`}
            body="This filter is empty. The Home cards are unchanged."
            action={
              <button type="button" className="inline-flex h-11 items-center gap-2 font-semibold text-[#7A5E28]" onClick={() => store.go("opportunities")}>
                <Inbox className="size-5" aria-hidden="true" />
                See all opportunities
              </button>
            }
          />
        ) : (
          <ul className="grid gap-2">
            {upcoming.map((item) => (
              <li key={item.id}>
                <OpportunityCard item={item} inCategory onOpen={() => setOpenId(item.id)} />
              </li>
            ))}
          </ul>
        )}
      </div>
    );
  }
  return (
    <div className="rise grid gap-4">
      <PageHeader kicker="Insights" title="This week" lede="One opportunity for each type that fits this kitchen." />
      <Card className="grid gap-3 p-5">
        <Pill tone="saffron">Rota</Pill>
        <h2 className="font-serif text-2xl">{sales.staffHeadline}</h2>
        <p className="font-serif text-3xl text-[#1F4D3A]">17:00–21:00</p>
        <p>Tuesday doesn’t earn four on the floor unless lunch fills.</p>
        <button type="button" className="min-h-11 justify-self-start rounded-full bg-saffron px-4 font-semibold text-saffron-ink" onClick={() => store.go("sales")}>
          Open the till
        </button>
        <details className="text-[#5C564C]">
          <summary className="min-h-11 cursor-pointer font-medium text-[#7A5E28]">Details</summary>
          <ul className="mt-2 grid gap-2">
            {sales.staff.map((row) => (
              <li key={row.day}>
                <span className="font-medium">{row.day}.</span> {row.read}
              </li>
            ))}
          </ul>
        </details>
      </Card>
      <Card className="grid gap-3 p-5 opacity-80">
        <p className="text-[0.8rem] font-medium tracking-wide text-faint uppercase">Coming next</p>
        <h2 className="font-serif text-2xl text-mist">Cost per plate and margin</h2>
        <p className="text-mist">Connect stock to see food cost per dish. Plate cost isn’t on this account yet.</p>
        <button
          type="button"
          className="min-h-11 justify-self-start rounded-full border border-line px-4 font-medium"
          onClick={() => store.notify("We’ll tell you when plate cost is connected.")}
        >
          Notify me
        </button>
      </Card>
      <AreaSignals />
      <Card className="grid gap-3 p-5">
        <h2 className="font-serif text-2xl">What people type</h2>
        <ul className="grid gap-2">
          {searchTerms.map((item) => (
            <li key={item.term} className="rounded-xl bg-surface-2 px-3 py-3">
              <p className="font-medium">“{item.term}”</p>
              <p className="text-mist">{item.read}</p>
            </li>
          ))}
        </ul>
        <button type="button" className="h-11 justify-self-start font-semibold text-[#7A5E28]" onClick={() => store.openSection("visibility", "aeo")}>
          Open AEO
        </button>
        <button type="button" className="h-11 justify-self-start font-semibold text-[#7A5E28]" onClick={() => store.openSection("visibility", "seo")}>
          Open SEO
        </button>
      </Card>
      {opportunityTypeOrder.map((type) => {
        const group = opportunitiesForType(type);
        return (
          <section key={type} className="grid gap-2">
            <h2 className="text-[0.75rem] font-medium tracking-wide text-[#7A5E28] uppercase">{typeTitleSafe(type)}</h2>
            <ul className="grid gap-2">
              {group.map((item) => (
                <li key={item.id}>
                  <OpportunityCard item={item} onOpen={() => store.openSection("insights", typeSlug(type))} />
                </li>
              ))}
            </ul>
          </section>
        );
      })}
    </div>
  );
}

function typeTitleSafe(type: OpportunityType) {
  return typeTitle(type);
}

function OpportunityCard({ item, onOpen, inCategory = false }: { item: Opportunity; onOpen: () => void; inCategory?: boolean }) {
  const store = useStore();
  return (
    <Card className="grid gap-2 p-4">
      <button type="button" onClick={onOpen} className="grid gap-1 text-left">
        <Pill tone="saffron">{`${item.type} · ${item.subtype}`}</Pill>
        <h3 className="font-serif text-2xl leading-tight text-[#2B2B2B]">{item.title}</h3>
        <p className="font-serif text-xl text-[#7A5E28]">{item.metric}</p>
        <p className="line-clamp-2 text-[0.9rem] text-[#5C564C]">{item.insight}</p>
        <p className="text-[0.75rem] text-[#7A5E28]">{item.fitReason}</p>
      </button>
      <div className="grid grid-cols-2 gap-2">
        <button
          type="button"
          onClick={() =>
            store.openOrCreate(item.campaign.id, () => ({
              id: item.campaign.id,
              title: item.campaign.title,
              actionLabel: actionLabel(item),
              status: "draft",
              audience: item.campaign.audience,
              timing: item.campaign.timing,
              sourceWhy: item.insight,
              sourceData: typeSource[item.type],
              variants: item.campaign.variants.map((variant) => ({ ...variant })),
            }))
          }
          className={`h-11 rounded-full bg-saffron px-2 text-[0.8rem] font-semibold text-saffron-ink ${inCategory ? "" : ""}`}
        >
          {actionLabel(item)}
        </button>
        <button
          type="button"
          onClick={onOpen}
          className="h-11 rounded-full border border-[#1F4D3A] px-2 text-[0.8rem] font-semibold text-[#1F4D3A]"
        >
          {inCategory ? "Details" : seeAllLabel(item.type)}
        </button>
      </div>
    </Card>
  );
}

function OpportunityDetail({ item }: { item: Opportunity }) {
  const store = useStore();
  return (
    <Card className="grid gap-3 p-5">
      <Pill tone="saffron">{`${item.type} · ${item.subtype}`}</Pill>
      <h2 className="font-serif text-3xl leading-tight text-[#2B2B2B]">{item.title}</h2>
      <p className="font-serif text-3xl text-[#7A5E28]">{item.metric}</p>
      <p className="text-[#2B2B2B]">{item.insight}</p>
      <p className="text-[0.9rem] text-[#7A5E28]">{item.fitReason}</p>
      <div className="grid grid-cols-2 gap-2">
        <PrimaryButton
          onClick={() =>
            store.openOrCreate(item.campaign.id, () => ({
              id: item.campaign.id,
              title: item.campaign.title,
              actionLabel: actionLabel(item),
              status: "draft",
              audience: item.campaign.audience,
              timing: item.campaign.timing,
              sourceWhy: item.insight,
              sourceData: typeSource[item.type],
              variants: item.campaign.variants.map((variant) => ({ ...variant })),
            }))
          }
        >
          {actionLabel(item)}
        </PrimaryButton>
        <button
          type="button"
          onClick={() => store.replaceSection(typeSlug(item.type))}
          className="h-11 rounded-full border border-[#1F4D3A] px-2 text-[0.85rem] font-semibold text-[#1F4D3A]"
        >
          {seeAllLabel(item.type)}
        </button>
      </div>
    </Card>
  );
}
