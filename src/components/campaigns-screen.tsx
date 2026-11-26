"use client";

import { business, statusLabel, type CampaignStatus } from "@/data/demo-data";
import { builderChannels, builderSteps } from "@/data/builder-channels";
import { plans } from "@/data/account";
import { Card, EmptyState, PageHeader, Pill, PrimaryButton } from "@/components/bits";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { generateCampaignCopy } from "@/lib/campaign-copy";
import { campaignCatalog, sourceFor, type CampaignSource } from "@/lib/campaign-source";
import type { Campaign } from "@/lib/channels";
import { useStore } from "@/lib/store";
import { useState } from "react";
import { brand } from "@/data/brands";

const filters = ["draft", "team", "scheduled", "live", "done"] as const;

export function CampaignsScreen() {
  const store = useStore();
  if (store.upgradePrompt) return <UpgradePrompt />;
  const open = store.campaigns.find((item) => item.id === store.openCampaignId);
  if (open) return <Builder campaign={open} />;
  const list = store.campaigns
    .filter((item) => matches(store.campaignFilter, item.status))
    .slice()
    .sort((a, b) => rank(a.status) - rank(b.status));

  function blank() {
    if (store.plan !== "pro") {
      store.openOrCreate("blocked", () => ({
        id: "blocked",
        title: "",
        status: "draft",
        audience: "",
        timing: "",
        variants: [{ id: "a", label: "Straight", body: "" }],
      }));
      return;
    }
    const id = `blank-${Date.now()}`;
    store.openOrCreate(id, () => ({
      id,
      title: "",
      status: "draft",
      audience: business.audiences[0],
      timing: "",
      fromScratch: true,
      builderStep: 1,
      channels: Object.fromEntries(builderChannels.map((channel) => [channel.id, { included: false, fields: {} }])),
      variants: [{ id: "a", label: "Straight", body: "" }],
    }));
  }

  return (
    <div className="rise grid min-w-0 gap-4">
      <PageHeader kicker="Campaigns" title="Nothing goes out until you say so" lede="Pick a source, choose channels, then approve. Nothing is sent until you tap Approve." />
      <button type="button" onClick={blank} className="w-full text-left">
        <Card className="border-saffron p-5 transition hover:bg-surface-2">
          <p className="text-[0.8rem] font-medium tracking-wide text-saffron uppercase">New</p>
          <h2 className="mt-1 font-serif text-3xl">Start a campaign</h2>
          <p className="mt-1 text-mist">Pick an opportunity first. The builder is on Pro.</p>
        </Card>
      </button>
      <div className="flex min-w-0 gap-2 overflow-x-auto pb-1" role="tablist" aria-label="Campaign status">
        {filters.map((filter) => (
          <button
            key={filter}
            type="button"
            role="tab"
            aria-selected={store.campaignFilter === filter}
            onClick={() => store.setFilter(filter)}
            className={`min-h-11 shrink-0 rounded-full px-4 font-medium ${store.campaignFilter === filter ? "bg-saffron text-saffron-ink" : "bg-surface text-mist"}`}
          >
            {filterLabel(filter)}
          </button>
        ))}
      </div>
      {list.length === 0 ? (
        <EmptyState
          title="Nothing in this list"
          body="Approve a draft, or send a brief to the Calon Team."
          action={
            <button type="button" className="h-11 font-semibold text-[#7A5E28]" onClick={() => store.setFilter("draft")}>
              See drafts
            </button>
          }
        />
      ) : (
        <ul className="grid gap-3">
          {list.map((item) => (
            <li key={item.id}>
              <button type="button" onClick={() => store.openCampaign(item.id)} className="w-full text-left">
                <Card className="p-4 transition hover:border-saffron">
                  <div className="flex items-start justify-between gap-3">
                    <Pill tone={item.status === "done" || item.status === "live" ? "teal" : item.status === "scheduled" || item.status === "team" ? "saffron" : "neutral"}>
                      {statusLabel[item.status]}
                    </Pill>
                    <span className="text-[0.8rem] text-saffron">Open</span>
                  </div>
                  <h2 className="mt-2 font-serif text-2xl">{item.title.trim() || "Untitled campaign"}</h2>
                  <p className="text-mist">{item.timing || item.audience}</p>
                  {item.result && item.status === "done" ? (
                    <ul className="mt-3 grid gap-1 rounded-xl bg-surface-2 p-3 text-[0.85rem] text-[#2B2B2B]">
                      <li>Reach · {item.result.reach}</li>
                      <li>Clicks · {item.result.clicks ?? "—"}</li>
                      <li>Attributed · {item.result.effect}</li>
                    </ul>
                  ) : null}
                </Card>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function UpgradePrompt() {
  const store = useStore();
  return (
    <div className="rise grid gap-4">
      <PageHeader kicker="Pro" title="The campaign builder is on Pro" lede="Plus is £25/month and includes opportunities. Pro is £50/month and adds the builder." />
      <Card className="grid gap-3 p-5">
        <p className="text-[#2B2B2B]">Upgrade to build a campaign. This is a demo. No payment is taken.</p>
        <p className="text-[0.9rem] text-[#5C564C]">Current plan {store.plan === "pro" ? "Pro" : "Plus"}. Next billing date {plans.nextBill}.</p>
        <button type="button" className="h-11 rounded-full bg-saffron font-semibold text-saffron-ink" onClick={() => store.setPlan("pro")}>
          Upgrade to Pro · £50/month
        </button>
        <button type="button" className="h-11 font-semibold text-[#7A5E28]" onClick={() => store.dismissUpgrade()}>
          Stay on Plus
        </button>
      </Card>
    </div>
  );
}

function filterLabel(filter: (typeof filters)[number]) {
  if (filter === "team") return "With Calon Team";
  if (filter === "done") return "Completed";
  return statusLabel[filter];
}

function matches(filter: (typeof filters)[number], status: CampaignStatus) {
  if (filter === "draft") return status === "draft" || status === "awaiting";
  return status === filter;
}

function rank(status: CampaignStatus) {
  return { draft: 0, awaiting: 1, team: 2, scheduled: 3, live: 4, done: 5 }[status];
}

function Builder({ campaign }: { campaign: Campaign }) {
  const store = useStore();
  const step = Math.min(5, Math.max(1, campaign.builderStep ?? 1));
  const included = builderChannels.filter((channel) => campaign.channels?.[channel.id]?.included);
  function go(next: number) {
    store.patchCampaign(campaign.id, { builderStep: next });
  }
  return (
    <div className="rise grid min-w-0 gap-4">
      <PageHeader kicker={statusLabel[campaign.status]} title={campaign.title.trim() || "New campaign"} lede="Nothing is sent until you tap Approve." />
      <ol className="grid grid-cols-5 gap-1" aria-label="Builder steps">
        {builderSteps.map((label, index) => {
          const number = index + 1;
          const current = number === step;
          return (
            <li key={label}>
              <button
                type="button"
                onClick={() => go(number)}
                aria-current={current ? "step" : undefined}
                className={`grid h-14 w-full place-items-center rounded-xl px-1 text-center text-[0.65rem] leading-tight ${current ? "bg-saffron font-semibold text-saffron-ink" : "bg-surface text-[#5C564C]"}`}
              >
                {number}. {label}
              </button>
            </li>
          );
        })}
      </ol>
      {step === 1 ? <StepSource campaign={campaign} onNext={() => go(2)} /> : null}
      {step === 2 ? <StepChannels campaign={campaign} canNext={included.length > 0} onBack={() => go(1)} onNext={() => go(3)} /> : null}
      {step === 3 ? <StepWho campaign={campaign} onBack={() => go(2)} onAi={() => go(4)} /> : null}
      {step === 4 ? <StepContent campaign={campaign} onBack={() => go(3)} onNext={() => go(5)} /> : null}
      {step === 5 ? <StepApprove campaign={campaign} onBack={() => go(4)} /> : null}
    </div>
  );
}

function resolvedSource(campaign: Campaign): CampaignSource | undefined {
  return sourceFor(campaign.linkedId) || sourceFor(campaign.id);
}

function StepSource({ campaign, onNext }: { campaign: Campaign; onNext: () => void }) {
  const store = useStore();
  const linked = resolvedSource(campaign);
  const picked = Boolean(campaign.linkedId || linked || campaign.sourceWhy);
  const why = campaign.sourceWhy || linked?.why || "";
  const data = campaign.sourceData || linked?.data || "";
  const timing = campaign.timing || linked?.timing || "";
  const catalog = campaignCatalog();
  const kinds = [...new Set(catalog.map((item) => item.kind))];

  function choose(source: CampaignSource) {
    store.patchCampaign(campaign.id, {
      title: source.title,
      actionLabel: source.actionLabel,
      audience: source.audience,
      timing: source.timing,
      sourceWhy: source.why,
      sourceData: source.data,
      linkedId: source.id,
      fromScratch: false,
      variants: source.variants,
      selectedVariant: source.variants[0]?.id ?? "a",
    });
  }

  return (
    <Card className="grid gap-3 p-4">
      <h2 className="font-serif text-2xl text-[#2B2B2B]">Source</h2>
      {picked ? (
        <div className="grid gap-2 rounded-xl bg-[#F7F1E6] p-3 text-[#2B2B2B]">
          <p className="text-[0.75rem] font-medium tracking-wide text-[#7A5E28] uppercase">{linked?.kind || "Opportunity"}</p>
          <p className="font-medium">{campaign.title || linked?.title}</p>
          <p>
            <span className="text-[#5C564C]">Why. </span>
            {why}
          </p>
          <p>
            <span className="text-[#5C564C]">Data. </span>
            {data}
          </p>
          <p>
            <span className="text-[#5C564C]">Suggested timing. </span>
            {timing}
          </p>
        </div>
      ) : (
        <div className="grid gap-3">
          <p className="text-[#5C564C]">Pick an opportunity first. Visibility, sales, festivals, events, food, service and weather are all here.</p>
          {kinds.map((kind) => (
            <div key={kind} className="grid gap-1">
              <p className="text-[0.75rem] font-medium tracking-wide text-[#7A5E28] uppercase">{kind}</p>
              <ul className="grid gap-1">
                {catalog
                  .filter((item) => item.kind === kind)
                  .map((item) => (
                    <li key={item.id}>
                      <button type="button" onClick={() => choose(item)} className="min-h-11 w-full rounded-xl bg-[#F7F1E6] px-3 text-left text-[#2B2B2B]">
                        {item.title}
                      </button>
                    </li>
                  ))}
              </ul>
            </div>
          ))}
        </div>
      )}
      <PrimaryButton disabled={!picked} onClick={onNext}>
        Continue
      </PrimaryButton>
    </Card>
  );
}

function StepChannels({
  campaign,
  canNext,
  onBack,
  onNext,
}: {
  campaign: Campaign;
  canNext: boolean;
  onBack: () => void;
  onNext: () => void;
}) {
  const store = useStore();
  return (
    <Card className="grid gap-3 p-4">
      <h2 className="font-serif text-2xl text-[#2B2B2B]">Channels</h2>
      <p className="text-[#5C564C]">Pick one or more. You can change the set before you approve.</p>
      <ul className="grid gap-2">
        {builderChannels.map((channel) => {
          const on = Boolean(campaign.channels?.[channel.id]?.included);
          return (
            <li key={channel.id}>
              <button
                type="button"
                aria-pressed={on}
                onClick={() => store.tuneChannel(campaign.id, channel.id, { included: !on })}
                className={`flex min-h-11 w-full items-center justify-between gap-3 rounded-xl px-3 text-left ${on ? "bg-[#1F4D3A] text-[#F4EEE1]" : "bg-[#F7F1E6] text-[#2B2B2B]"}`}
              >
                <span>{channel.label}</span>
                <span className="shrink-0 text-[0.8rem]">{on ? "On" : "Off"}</span>
              </button>
            </li>
          );
        })}
      </ul>
      <div className="grid grid-cols-2 gap-2">
        <button type="button" onClick={onBack} className="h-11 rounded-full border border-[#1F4D3A] font-semibold text-[#1F4D3A]">
          Back
        </button>
        <PrimaryButton disabled={!canNext} onClick={onNext}>
          Continue
        </PrimaryButton>
      </div>
    </Card>
  );
}

function linesFor(seed: string, channel: string, spin: number) {
  const copy = generateCampaignCopy(seed);
  const options = [
    copy.caption,
    `${copy.headline}. ${copy.offer}. On ${channel}.`,
    `${copy.dish} this week. ${copy.cta}. ${channel}.`,
    `${brand.place}. ${copy.offer}. ${copy.cta}.`,
    `${copy.google} Via ${channel}.`,
  ];
  return [0, 1, 2].map((index) => ({
    id: ["a", "b", "c"][index],
    label: ["Straight", "Warmer", "Shorter"][index],
    body: options[(index + spin) % options.length],
  }));
}

function StepWho({ campaign, onBack, onAi }: { campaign: Campaign; onBack: () => void; onAi: () => void }) {
  const store = useStore();
  const [goal, setGoal] = useState(campaign.brief?.goal ?? campaign.title);
  const [budget, setBudget] = useState(campaign.brief?.budget ?? "");
  const [deadline, setDeadline] = useState(campaign.brief?.deadline ?? campaign.timing);
  const [notes, setNotes] = useState(campaign.brief?.notes ?? campaign.sourceWhy ?? "");
  const [sent, setSent] = useState(campaign.status === "team");
  const pro = store.plan === "pro";

  function createWithAi() {
    const seed = `${campaign.title} ${campaign.sourceWhy ?? ""} ${campaign.variants[0]?.body ?? ""}`;
    const channels = { ...campaign.channels };
    builderChannels.forEach((channel) => {
      const current = channels[channel.id] ?? { included: false, fields: {} };
      if (!current.included) return;
      const variants = linesFor(seed, channel.label, 0);
      channels[channel.id] = { ...current, fields: current.fields ?? {}, variants, selected: "a", spin: 0 };
    });
    store.patchCampaign(campaign.id, { creator: "ai", channels, builderStep: 4 });
    store.notify("Variants are ready for each channel. Nothing has been sent.");
    onAi();
  }

  return (
    <Card className="grid gap-3 p-4">
      <h2 className="font-serif text-2xl text-[#2B2B2B]">Who creates it?</h2>
      <button type="button" onClick={createWithAi} className="grid min-h-11 gap-1 rounded-xl bg-[#1F4D3A] px-4 py-3 text-left text-[#F4EEE1]">
        <span className="font-semibold">Create with AI</span>
        <span className="text-[0.85rem] text-[#E7DCC8]">Generates a variant for each channel now, in the app.</span>
      </button>
      <div className="grid gap-2 rounded-xl border border-[#C4A15A] p-3">
        <p className="font-semibold text-[#2B2B2B]">Send to Calon Team</p>
        <p className="text-[0.85rem] text-[#5C564C]">Consulting and planning. Included on Pro.</p>
        <Field label="Goal" value={goal} onChange={setGoal} />
        <Field label="Budget" value={budget} onChange={setBudget} />
        <Field label="Deadline" value={deadline} onChange={setDeadline} />
        <label className="grid gap-1">
          <span className="text-[0.85rem] font-medium text-[#2B2B2B]">Notes</span>
          <Textarea value={notes} rows={3} onChange={(event) => setNotes(event.target.value)} className="rounded-xl border-line bg-[#F7F1E6] p-3 text-base text-[#2B2B2B]" />
        </label>
        <button
          type="button"
          disabled={!pro || !goal.trim()}
          onClick={() => {
            store.sendToTeam(campaign.id, { goal, budget, deadline, notes });
            setSent(true);
          }}
          className="h-11 rounded-full bg-saffron font-semibold text-saffron-ink disabled:opacity-50"
        >
          Send to Calon Team
        </button>
        {sent ? <p className="font-medium text-[#1F4D3A]">Calon Team will reply within 1 working day.</p> : null}
      </div>
      <button type="button" onClick={onBack} className="h-11 justify-self-start font-semibold text-[#7A5E28]">
        Back
      </button>
    </Card>
  );
}

function StepContent({ campaign, onBack, onNext }: { campaign: Campaign; onBack: () => void; onNext: () => void }) {
  const store = useStore();
  const included = builderChannels.filter((channel) => campaign.channels?.[channel.id]?.included);
  const [active, setActive] = useState(included[0]?.id ?? "");
  const channel = included.find((item) => item.id === active) ?? included[0];
  if (!channel) {
    return (
      <Card className="grid gap-3 p-4">
        <p className="text-[#2B2B2B]">Pick at least one channel first.</p>
        <button type="button" onClick={onBack} className="h-11 font-semibold text-[#7A5E28]">
          Back
        </button>
      </Card>
    );
  }
  const record = campaign.channels?.[channel.id];
  const variants = record?.variants?.length ? record.variants : linesFor(`${campaign.title} ${campaign.sourceWhy ?? ""}`, channel.label, record?.spin ?? 0);
  const selected = variants.find((item) => item.id === (record?.selected ?? "a")) ?? variants[0];

  function write(nextVariants: { id: string; label: string; body: string }[], selectedId?: string, spin?: number) {
    store.patchCampaign(campaign.id, {
      channels: {
        ...campaign.channels,
        [channel.id]: {
          included: true,
          fields: record?.fields ?? {},
          variants: nextVariants,
          selected: selectedId ?? record?.selected ?? nextVariants[0]?.id,
          spin: spin ?? record?.spin ?? 0,
        },
      },
    });
  }

  return (
    <div className="grid min-w-0 gap-3">
      <div className="flex min-w-0 gap-2 overflow-x-auto" role="tablist" aria-label="Channel preview">
        {included.map((item) => (
          <button
            key={item.id}
            type="button"
            role="tab"
            aria-selected={item.id === channel.id}
            onClick={() => setActive(item.id)}
            className={`h-11 shrink-0 rounded-full px-3 text-[0.85rem] font-medium ${item.id === channel.id ? "bg-saffron text-saffron-ink" : "bg-surface text-[#5C564C]"}`}
          >
            {item.label}
          </button>
        ))}
      </div>
      <Card className="grid gap-3 p-4">
        <h2 className="font-serif text-2xl text-[#2B2B2B]">{channel.label}</h2>
        {variants.map((variant) => (
          <div key={variant.id} className="grid gap-2 rounded-xl bg-[#F7F1E6] p-3">
            <div className="flex items-center justify-between gap-2">
              <button
                type="button"
                onClick={() => write(variants, variant.id)}
                className={`h-11 rounded-full px-3 text-[0.85rem] font-semibold ${selected.id === variant.id ? "bg-[#1F4D3A] text-[#F4EEE1]" : "text-[#1F4D3A]"}`}
              >
                {variant.label}
              </button>
              <button
                type="button"
                className="h-11 font-semibold text-[#7A5E28]"
                onClick={() => {
                  const spin = (record?.spin ?? 0) + 1;
                  const next = linesFor(`${campaign.title} ${campaign.sourceWhy ?? ""} ${spin}`, channel.label, spin);
                  const merged = variants.map((item) => (item.id === variant.id ? next.find((line) => line.id === variant.id) ?? item : item));
                  write(merged, variant.id, spin);
                }}
              >
                Regenerate
              </button>
            </div>
            <Textarea
              value={variant.body}
              rows={3}
              onChange={(event) => write(variants.map((item) => (item.id === variant.id ? { ...item, body: event.target.value } : item)))}
              className="rounded-xl border-line bg-white p-3 text-base text-[#2B2B2B]"
            />
          </div>
        ))}
        <PhonePreview label={channel.label} body={selected.body} />
        <div className="grid grid-cols-2 gap-2">
          <button type="button" onClick={onBack} className="h-11 rounded-full border border-[#1F4D3A] font-semibold text-[#1F4D3A]">
            Back
          </button>
          <PrimaryButton onClick={onNext}>Continue</PrimaryButton>
        </div>
      </Card>
    </div>
  );
}

function StepApprove({ campaign, onBack }: { campaign: Campaign; onBack: () => void }) {
  const store = useStore();
  const included = builderChannels.filter((channel) => campaign.channels?.[channel.id]?.included);
  const locked = campaign.status === "scheduled" || campaign.status === "live" || campaign.status === "done";
  return (
    <Card className="grid gap-3 p-4">
      <h2 className="font-serif text-2xl text-[#2B2B2B]">Schedule and approve</h2>
      <p className="text-[#1F4D3A]">Nothing is sent until you tap Approve. It then sits in Campaigns as Scheduled.</p>
      <ul className="grid gap-3">
        {included.map((channel) => {
          const slot = campaign.schedule?.[channel.id] ?? { date: "2026-11-19", time: "11:00" };
          return (
            <li key={channel.id} className="grid gap-2 rounded-xl bg-[#F7F1E6] p-3">
              <p className="font-medium text-[#2B2B2B]">{channel.label}</p>
              <div className="grid grid-cols-2 gap-2">
                <label className="grid gap-1 text-[0.8rem] text-[#5C564C]">
                  Date
                  <input
                    type="date"
                    value={slot.date}
                    disabled={locked}
                    onChange={(event) =>
                      store.patchCampaign(campaign.id, {
                        schedule: { ...campaign.schedule, [channel.id]: { ...slot, date: event.target.value } },
                      })
                    }
                    className="h-11 rounded-xl border border-[#E7DFD0] bg-white px-2 text-[#2B2B2B]"
                  />
                </label>
                <label className="grid gap-1 text-[0.8rem] text-[#5C564C]">
                  Time
                  <input
                    type="time"
                    value={slot.time}
                    disabled={locked}
                    onChange={(event) =>
                      store.patchCampaign(campaign.id, {
                        schedule: { ...campaign.schedule, [channel.id]: { ...slot, time: event.target.value } },
                      })
                    }
                    className="h-11 rounded-xl border border-[#E7DFD0] bg-white px-2 text-[#2B2B2B]"
                  />
                </label>
              </div>
            </li>
          );
        })}
      </ul>
      {campaign.status === "scheduled" ? <p className="font-medium text-[#1F4D3A]">Scheduled. Nothing has been posted.</p> : null}
      <div className="grid gap-2 sm:grid-cols-2">
        <button
          type="button"
          className="h-11 rounded-full border border-[#1F4D3A] font-semibold text-[#1F4D3A]"
          onClick={() => {
            store.patchCampaign(campaign.id, { status: "draft" });
            store.setFilter("draft");
            store.notify("Draft saved. Nothing has been sent.");
          }}
        >
          Save as draft
        </button>
        <PrimaryButton
          disabled={locked || included.length === 0}
          onClick={() => {
            const first = included[0];
            const slot = first ? campaign.schedule?.[first.id] : undefined;
            if (slot) store.patchCampaign(campaign.id, { timing: `${slot.date} ${slot.time}` });
            store.approveCampaign(campaign.id);
          }}
        >
          Approve
        </PrimaryButton>
      </div>
      <button type="button" onClick={onBack} className="h-11 justify-self-start font-semibold text-[#7A5E28]">
        Back
      </button>
    </Card>
  );
}

function Field({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) {
  return (
    <label className="grid gap-1">
      <span className="text-[0.85rem] font-medium text-[#2B2B2B]">{label}</span>
      <Input value={value} onChange={(event) => onChange(event.target.value)} className="h-11 rounded-xl border-line bg-[#F7F1E6] px-3 text-base text-[#2B2B2B]" />
    </label>
  );
}

function PhonePreview({ label, body }: { label: string; body: string }) {
  return (
    <div className="mx-auto grid w-[min(100%,16rem)] gap-2">
      <p className="text-center text-[0.75rem] font-medium text-[#7A5E28]">{label} · live preview</p>
      <article className="overflow-hidden rounded-[1.6rem] border-4 border-[#1F4D3A] bg-[#0E2A20] text-[#F4EEE1]">
        <div className="grid aspect-[4/5] place-items-center border-b border-dashed border-[#C4A15A] bg-[#16382C] text-[#C4A15A]">Image</div>
        <div className="grid gap-2 p-3">
          <p className="text-[0.9rem] leading-snug">{body || "Variant"}</p>
        </div>
      </article>
    </div>
  );
}
