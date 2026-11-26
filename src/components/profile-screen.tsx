"use client";

import { connectors, planFeatures, plans, team, type Connector, type ConnectorStatus } from "@/data/account";
import { business } from "@/data/demo-data";
import { activeProfile } from "@/data/restaurant";
import { Card, PageHeader } from "@/components/bits";
import { useStore } from "@/lib/store";
import { MessageCircle } from "lucide-react";
import { useState } from "react";
import { TillUpload } from "@/components/till-upload";

export function ProfileScreen() {
  const store = useStore();
  return (
    <div className="rise grid gap-6">
      <PageHeader kicker="Profile" title={business.name} lede="Account, the feeds Calon reads, and the plan." />
      <button
        type="button"
        onClick={() => store.setChat(true)}
        className="inline-flex h-11 items-center justify-center gap-2 justify-self-start rounded-full bg-saffron px-4 font-semibold text-saffron-ink"
      >
        <MessageCircle className="size-5" aria-hidden="true" />
        Ask Calon
      </button>
      <Account />
      <TillUpload />
      <Connectors />
      <Plan />
    </div>
  );
}

function Account() {
  const rows = [
    ["Business name", business.name],
    ["Type", activeProfile.type],
    ["Cuisine", activeProfile.cuisine],
    ["Address", business.address],
    ["Owner", business.manager],
    ["Email", business.email || "Not added yet"],
    ["Phone", business.phone],
    ["Opening hours", business.websiteHours],
  ];
  return (
    <section className="grid gap-2" id="account">
      <h2 className="font-serif text-3xl text-[#F4EEE1]">Account details</h2>
      <Card className="grid gap-3 p-4">
        <dl className="grid gap-3">
          {rows.map(([label, value]) => (
            <div key={label} className="grid gap-0.5">
              <dt className="text-[0.75rem] text-[#5C564C]">{label}</dt>
              <dd className="text-[#2B2B2B]">{value}</dd>
            </div>
          ))}
        </dl>
        <div>
          <p className="text-[0.75rem] text-[#5C564C]">Team</p>
          <ul className="mt-1 grid gap-1">
            {team.map((person) => (
              <li key={person.name} className="flex items-center justify-between gap-3 text-[#2B2B2B]">
                <span>{person.name}</span>
                <span className="text-[0.85rem] text-[#5C564C]">{person.role}</span>
              </li>
            ))}
          </ul>
        </div>
        <button
          type="button"
          className="min-h-11 justify-self-start font-semibold text-[#7A5E28]"
          onClick={async () => {
            try {
              await fetch("/api/logout", { method: "POST" });
            } finally {
              window.location.assign("/login");
            }
          }}
        >
          Sign out
        </button>
      </Card>
    </section>
  );
}

function Connectors() {
  const store = useStore();
  const [open, setOpen] = useState<Connector | null>(null);
  const [local, setLocal] = useState<Record<string, ConnectorStatus>>({});
  function statusOf(item: Connector): ConnectorStatus {
    if (item.source) return store.sources[item.source] ? "Connected" : "Not connected";
    return local[item.id] ?? item.status;
  }
  function synced(item: Connector, status: ConnectorStatus) {
    if (status === "Connected" && item.synced === "Never") return "Just now";
    if (status !== "Connected" && !item.source) return item.synced;
    return item.synced;
  }
  return (
    <section className="grid gap-2" id="connectors">
      <h2 className="font-serif text-3xl text-[#F4EEE1]">Connectors</h2>
      <ul className="grid gap-2">
        {connectors.map((item) => {
          const status = statusOf(item);
          return (
            <li key={item.id}>
              <Card className="grid gap-2 p-4">
                <div className="flex items-start justify-between gap-3">
                  <h3 className="font-medium text-[#2B2B2B]">{item.label}</h3>
                  <span className="shrink-0 rounded-full bg-[#E7DFD0] px-2 py-1 text-[0.75rem] font-medium text-[#5C564C]">{status}</span>
                </div>
                <p className="text-[0.85rem] text-[#5C564C]">{item.detail}</p>
                <p className="text-[0.8rem] text-[#7A5E28]">Last synced {synced(item, status)}</p>
                <button
                  type="button"
                  onClick={() => setOpen(item)}
                  className="h-11 justify-self-start rounded-full border border-[#1F4D3A] px-4 text-[0.9rem] font-semibold text-[#1F4D3A]"
                >
                  {status === "Connected" ? "Manage" : "Connect"}
                </button>
              </Card>
            </li>
          );
        })}
      </ul>
      {open ? (
        <div className="fixed inset-0 z-50 grid items-end bg-black/50 sm:items-center" onClick={() => setOpen(null)}>
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="connector-title"
            className="grid gap-3 rounded-t-3xl bg-[#F4EEE1] p-5 text-[#2B2B2B] sm:mx-auto sm:w-full sm:max-w-md sm:rounded-3xl"
            onClick={(event) => event.stopPropagation()}
          >
            <h3 id="connector-title" className="font-serif text-3xl">
              {open.label}
            </h3>
            <p>{open.detail}</p>
            <p className="text-[0.9rem] text-[#5C564C]">Status {statusOf(open)}. Last synced {synced(open, statusOf(open))}.</p>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                className="h-11 rounded-full bg-saffron font-semibold text-saffron-ink"
                onClick={() => {
                  if (open.source) {
                    if (!store.sources[open.source]) store.toggleSource(open.source);
                  } else {
                    setLocal((current) => ({ ...current, [open.id]: "Connected" }));
                  }
                  store.notify(`${open.label} connected.`);
                  setOpen(null);
                }}
              >
                Connect
              </button>
              <button
                type="button"
                className="h-11 rounded-full border border-[#1F4D3A] font-semibold text-[#1F4D3A]"
                onClick={() => {
                  if (open.source && store.sources[open.source]) store.toggleSource(open.source);
                  else setLocal((current) => ({ ...current, [open.id]: "Not connected" }));
                  store.notify(`${open.label} disconnected.`);
                  setOpen(null);
                }}
              >
                Disconnect
              </button>
            </div>
            <button type="button" className="h-11 font-semibold text-[#7A5E28]" onClick={() => setOpen(null)}>
              Close
            </button>
          </div>
        </div>
      ) : null}
    </section>
  );
}

function Plan() {
  const store = useStore();
  return (
    <section className="grid gap-3" id="plan">
      <h2 className="font-serif text-3xl text-[#F4EEE1]">Plan and billing</h2>
      <div className="grid gap-3 sm:grid-cols-2">
        <PlanCard
          name={plans.plus.name}
          price={plans.plus.price}
          line={plans.plus.line}
          current={store.plan === "plus"}
        />
        <PlanCard name={plans.pro.name} price={plans.pro.price} line={plans.pro.line} current={store.plan === "pro"} />
      </div>
      <Card className="grid gap-2 p-4">
        <h3 className="font-medium text-[#2B2B2B]">What’s included</h3>
        <ul className="grid gap-2">
          {planFeatures.map((row) => (
            <li key={row.feature} className="grid gap-1 border-b border-[#E7DFD0] pb-2 text-[0.9rem] last:border-0">
              <span className="text-[#2B2B2B]">{row.feature}</span>
              <span className="text-[#5C564C]">
                Plus {row.plus} · Pro {row.pro}
              </span>
            </li>
          ))}
        </ul>
        <div className="grid gap-1 rounded-xl bg-[#F7F1E6] p-3">
          <p className="text-[0.75rem] text-[#5C564C]">Current plan</p>
          <p className="font-medium text-[#2B2B2B]">{store.plan === "pro" ? "Pro · £50/month" : "Plus · £25/month"}</p>
          <p className="text-[0.75rem] text-[#5C564C]">Payment method</p>
          <p className="text-[#2B2B2B]">{plans.payment}</p>
          <p className="text-[0.75rem] text-[#5C564C]">Next billing date</p>
          <p className="text-[#2B2B2B]">{plans.nextBill}</p>
          <p className="text-[0.8rem] text-[#5C564C]">Demo only. No payment is taken.</p>
        </div>
        <p className="text-[0.9rem] text-[#2B2B2B]">
          Plus is £25/month for opportunities. Pro is £50/month for opportunities plus the campaign builder. Send to the Calon Team is included on Pro.
        </p>
        <div className="flex flex-wrap gap-2">
          <button type="button" onClick={() => store.setPlan("plus")} className="h-11 rounded-full border border-[#1F4D3A] px-4 font-semibold text-[#1F4D3A]">
            Downgrade to Plus
          </button>
          <button type="button" onClick={() => store.setPlan("pro")} className="h-11 rounded-full bg-saffron px-4 font-semibold text-saffron-ink">
            Upgrade to Pro
          </button>
        </div>
      </Card>
    </section>
  );
}

function PlanCard({ name, price, line, current }: { name: string; price: string; line: string; current: boolean }) {
  return (
    <Card className={`grid gap-1 p-4 ${current ? "border-[#C4A15A]" : ""}`}>
      <div className="flex items-center justify-between gap-2">
        <h3 className="font-serif text-3xl text-[#2B2B2B]">{name}</h3>
        {current ? <span className="rounded-full bg-[#1F4D3A] px-2 py-1 text-[0.75rem] font-semibold text-[#F4EEE1]">Current</span> : null}
      </div>
      <p className="font-serif text-4xl text-[#7A5E28]">
        {price}
        <span className="text-base text-[#5C564C]">/month</span>
      </p>
      <p className="text-[0.9rem] text-[#5C564C]">{line}</p>
    </Card>
  );
}
