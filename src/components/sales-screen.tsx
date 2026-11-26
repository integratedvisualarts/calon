"use client";

import { salesSnapshot, salesOpportunities } from "@/data/sales-opportunities";
import { Card, EmptyState, PageHeader } from "@/components/bits";
import { useStore } from "@/lib/store";

export function SalesScreen() {
  const store = useStore();
  if (!store.sources.sales) {
    return (
      <EmptyState
        title="Square isn’t connected"
        body="Connect Square POS in Profile, or upload a sales template."
        action={
          <button type="button" className="min-h-11 font-semibold text-saffron" onClick={() => store.go("profile")}>
            Connect Square POS
          </button>
        }
      />
    );
  }
  const max = Math.max(...salesSnapshot.days.map((day) => day.value), 1);
  const ranked = salesOpportunities.slice().sort((a, b) => b.priority - a.priority);
  return (
    <div className="rise grid min-w-0 gap-4">
      <PageHeader kicker="Sales" title={salesSnapshot.daily} lede={salesSnapshot.source} />
      <div className="grid grid-cols-2 gap-2">
        <Stat label="Covers" value={salesSnapshot.covers} note={`Average ${salesSnapshot.average}`} />
        <Stat label="Dine-in" value={salesSnapshot.room} note={salesSnapshot.dailyNote} />
        <Stat label="Booked" value={salesSnapshot.bookings} note={salesSnapshot.bookingsTonight} />
        <Stat label="Walk-in" value={salesSnapshot.walkIns} note={salesSnapshot.coversNote} />
      </div>
      <section className="grid gap-2">
        <h2 className="font-serif text-2xl text-ink">Third-party delivery</h2>
        <Card className="grid gap-2 p-4">
          <p className="font-medium text-[#2B2B2B]">
            {salesSnapshot.deliveryTotal} <span className="text-[0.85rem] font-normal text-[#5C564C]">across the apps</span>
          </p>
          <ul className="grid gap-2">
            {salesSnapshot.apps.map((app) => (
              <li key={app.name} className="flex items-center justify-between gap-3 text-[#2B2B2B]">
                <span>{app.name}</span>
                <span className="tabular-nums">{app.figure}</span>
              </li>
            ))}
          </ul>
        </Card>
      </section>
      <section className="grid gap-2">
        <h2 className="font-serif text-2xl text-ink">Time and date</h2>
        <Card className="grid gap-2 p-4">
          <ul className="grid gap-2">
            {salesSnapshot.days.map((day) => (
              <li key={day.label} className="grid grid-cols-[2.2rem_1fr_auto] items-center gap-2 text-[#2B2B2B]">
                <span className="text-[0.8rem]">{day.label}</span>
                <span className="h-2 overflow-hidden rounded-full bg-[#E7DFD0]" aria-hidden="true">
                  <span className="block h-full bg-[#1F4D3A]" style={{ width: `${Math.round((day.value / max) * 100)}%` }} />
                </span>
                <span className="text-[0.8rem] tabular-nums">£{day.value.toLocaleString("en-GB")}</span>
              </li>
            ))}
          </ul>
          <p className="text-[0.85rem] text-[#1F4D3A]">{salesSnapshot.good}</p>
          <p className="text-[0.85rem] text-[#5C564C]">{salesSnapshot.bad}</p>
          <p className="text-[0.85rem] text-[#5C564C]">{salesSnapshot.peaks}</p>
        </Card>
      </section>
      <section className="grid gap-2">
        <h2 className="font-serif text-2xl text-ink">Opportunities</h2>
        <ul className="grid gap-2">
          {ranked.map((item) => (
            <li key={item.id}>
              <Card className="grid gap-2 p-4">
                <h3 className="font-serif text-2xl leading-tight text-[#2B2B2B]">{item.title}</h3>
                <p className="font-serif text-xl text-[#7A5E28]">{item.metric}</p>
                <p className="text-[0.9rem] text-[#5C564C]">{item.insight}</p>
                <button
                  type="button"
                  onClick={() =>
                    store.openOrCreate(item.id, () => ({
                      id: item.id,
                      title: item.title,
                      actionLabel: item.actionLabel,
                      status: "draft",
                      audience: item.audience,
                      timing: item.timing,
                      sourceWhy: item.insight,
                      sourceData: salesSnapshot.source,
                      variants: item.variants.map((variant) => ({ ...variant })),
                    }))
                  }
                  className="h-11 rounded-full bg-saffron px-3 text-[0.9rem] font-semibold text-saffron-ink"
                >
                  {item.actionLabel}
                </button>
              </Card>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}

function Stat({ label, value, note }: { label: string; value: string; note: string }) {
  return (
    <Card className="grid gap-1 p-3">
      <p className="text-[0.75rem] text-[#5C564C]">{label}</p>
      <p className="font-serif text-2xl leading-none text-[#2B2B2B]">{value}</p>
      <p className="text-[0.75rem] text-[#5C564C]">{note}</p>
    </Card>
  );
}
