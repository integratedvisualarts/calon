"use client";

import { CalonLockup } from "@/components/brand";
import { business, productName, reviews } from "@/data/demo-data";
import { tabFor } from "@/lib/history";
import { useStore, type Screen } from "@/lib/store";
import { cn } from "cn";
import { Bell, ChevronLeft, House, Megaphone, MessageCircle, UserRound, LayoutGrid } from "lucide-react";
import { useEffect, useState, type ReactNode } from "react";
import { workspace } from "@/data/live";
import { dataLabel } from "@/engine/provenance";

const nav: { id: Screen; label: string; icon: typeof House }[] = [
  { id: "home", label: "Home", icon: House },
  { id: "opportunities", label: "Opportunities", icon: LayoutGrid },
  { id: "campaigns", label: "Campaigns", icon: Megaphone },
  { id: "profile", label: "Profile", icon: UserRound },
];

export function Shell({ children }: { children: ReactNode }) {
  const store = useStore();
  const [askHidden, setAskHidden] = useState(false);
  const waiting =
    (store.notifications.reviews ? reviews.newCount : 0) +
    (store.notifications.approvals ? store.campaigns.filter((item) => item.status === "awaiting").length : 0) +
    (store.notifications.opportunities ? 1 : 0);

  useEffect(() => {
    const section =
      store.section === "aeo"
        ? "AEO/GEO"
        : store.section === "seo"
          ? "SEO"
          : store.screen === "sales"
            ? "Sales"
            : store.screen === "visibility"
              ? "Visibility"
              : store.section
                ? store.section[0].toUpperCase() + store.section.slice(1)
                : "";
    const names: Record<string, string> = {
      home: "Home",
      opportunities: "Opportunities",
      campaigns: "Campaigns",
      profile: "Profile",
      reviews: "Reviews",
    };
    const page = store.notFound ? "Not found" : section ? section : (names[store.screen] ?? store.screen);
    document.title = `${page} · Calon`;
  }, [store.screen, store.section, store.notFound]);

  useEffect(() => {
    let last = window.scrollY;
    function onScroll() {
      const y = window.scrollY;
      setAskHidden(y > last && y > 48);
      last = y;
    }
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    if (!store.toast) return;
    const timer = window.setTimeout(() => store.clearToast(), 4200);
    return () => window.clearTimeout(timer);
  }, [store.toast, store]);

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (event.key !== "Escape") return;
      if (store.bellOpen) store.setBell(false);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [store]);

  return (
    <div className="min-h-screen bg-navy text-ink lg:flex">
      <aside className="sticky top-0 hidden h-screen w-60 shrink-0 flex-col border-r border-line bg-navy-2 lg:flex">
        <div className="px-4 py-5">
          <CalonLockup tone="cream" className="h-10 w-auto max-w-full" />
        </div>
        <nav className="grid min-h-0 flex-1 content-start gap-1 overflow-y-auto px-3" aria-label="Primary">
          {nav.map((item) => (
            <NavButton key={item.id} current={tabFor(store.screen) === item.id} onClick={() => store.go(item.id)} icon={item.icon} label={item.label} />
          ))}
        </nav>
        <div className="shrink-0 border-t border-line p-3">
          <button
            type="button"
            onClick={() => store.setChat(true)}
            className="flex min-h-11 w-full items-center justify-center gap-2 rounded-full bg-saffron px-4 font-semibold text-saffron-ink"
          >
            <MessageCircle className="size-5" aria-hidden="true" />
            Ask {productName}
          </button>
          <p className="px-4 py-2 text-center text-[0.8rem] text-faint" role="note">
            Nothing posts until you approve it.
          </p>
        </div>
      </aside>
      <div className="relative min-w-0 flex-1">
        <header className="sticky top-0 z-30 border-b border-line bg-navy/95 backdrop-blur">
          <div className="flex items-center gap-3 px-4 py-3 lg:px-8">
            {store.screen === "home" && !store.chatOpen ? (
              <CalonLockup tone="cream" className="h-8 w-auto max-w-[9.5rem] sm:max-w-none sm:h-9" />
            ) : (
              <button
                type="button"
                onClick={() => store.back()}
                className="inline-flex min-h-11 items-center gap-1 rounded-full pr-2 text-[#F4EEE1] hover:text-[#C4A15A] focus-visible:text-[#C4A15A] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#C4A15A]"
              >
                <ChevronLeft className="size-5" aria-hidden="true" />
                <span className="font-medium">{store.backLabel}</span>
              </button>
            )}
            <div className="min-w-0 flex-1 text-right sm:text-left">
              <p className="truncate font-semibold">{business.name}</p>
              <p className="truncate text-[0.8rem] text-mist">
                {business.typeLabel} · {business.town} · {dataLabel(workspace)}
              </p>
            </div>
            <button
              type="button"
              aria-label={waiting ? `Notifications, ${waiting} waiting` : "Notifications"}
              aria-expanded={store.bellOpen}
              onClick={() => store.setBell(!store.bellOpen)}
              className="relative grid size-11 place-items-center rounded-full border border-line bg-[#F4EEE1] text-[#1F4D3A]"
            >
              <Bell className="size-5" aria-hidden="true" />
              {waiting > 0 ? <span className="absolute top-2 right-2 size-2.5 rounded-full bg-coral" aria-hidden="true" /> : null}
            </button>
            {store.bellOpen ? <BellPanel /> : null}
          </div>
        </header>
        <main className={cn("min-w-0 overflow-x-hidden px-4 pt-4 lg:px-8 lg:pt-6 lg:pb-16", store.screen === "home" ? "pb-24" : "pb-44")}>
          <div className="mx-auto min-w-0 max-w-5xl">{children}</div>
        </main>
        <button
          type="button"
          onClick={() => store.setChat(true)}
          className={cn(
            "fixed right-4 bottom-20 z-40 min-h-14 items-center gap-2 rounded-full bg-saffron px-4 font-semibold text-saffron-ink shadow-[var(--shadow-lift)] lg:hidden",
            store.screen === "home" || askHidden ? "hidden" : "flex",
          )}
        >
          <MessageCircle className="size-5" aria-hidden="true" />
          Ask {productName}
        </button>
        <div className="fixed inset-x-0 bottom-0 z-30 border-t border-line bg-navy-2 lg:hidden">
          <nav className="grid grid-cols-4" aria-label="Primary">
            {nav.map((item) => {
              const Icon = item.icon;
              const current = tabFor(store.screen) === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => store.go(item.id)}
                  aria-current={current ? "page" : undefined}
                  className={cn("flex h-16 flex-col items-center justify-center gap-1 px-1 text-[0.62rem] leading-tight", current ? "text-saffron" : "text-faint")}
                >
                  <Icon className="size-5" aria-hidden="true" />
                  {item.label}
                </button>
              );
            })}
          </nav>
        </div>
        {store.toast ? (
          <div
            role="status"
            className="fixed top-20 left-1/2 z-50 flex w-[min(92vw,28rem)] -translate-x-1/2 items-center justify-between gap-3 rounded-card border border-line bg-[#F4EEE1] px-4 py-3 text-[#2B2B2B] shadow-[var(--shadow-lift)]"
          >
            <p>{store.toast.text}</p>
            {store.toast.undo ? (
              <button type="button" className="min-h-11 shrink-0 font-semibold text-saffron" onClick={store.toast.undo}>
                Undo
              </button>
            ) : null}
          </div>
        ) : null}
      </div>
    </div>
  );
}

function NavButton({
  current,
  onClick,
  icon: Icon,
  label,
}: {
  current: boolean;
  onClick: () => void;
  icon: typeof House;
  label: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-current={current ? "page" : undefined}
      className={cn(
        "flex min-h-11 items-center gap-3 rounded-xl px-3 text-left text-base",
        current ? "bg-[#F4EEE1] text-[#1F4D3A]" : "text-[#E7DCC8] hover:bg-[#1F4D3A] hover:text-[#F4EEE1]",
      )}
    >
      <Icon className="size-5 shrink-0" aria-hidden="true" />
      <span>
        <span className="block">{label}</span>
      </span>
    </button>
  );
}

function BellPanel() {
  const store = useStore();
  const awaiting = store.campaigns.filter((item) => item.status === "awaiting");
  return (
    <div className="absolute top-16 right-4 z-40 w-80 max-w-[80vw] rounded-card border border-line bg-navy-2 p-3 shadow-[var(--shadow-lift)]">
      <p className="mb-2 font-medium">Today</p>
      {store.rules.quiet ? (
        <p className="mb-2 text-[0.8rem] text-mist">Quiet hours are on. These would wait until 08:00. Shown here so you can still see them.</p>
      ) : null}
      <ul className="grid gap-2">
        {store.notifications.reviews ? (
          <li>
            <button type="button" className="w-full rounded-xl bg-surface px-3 py-3 text-left" onClick={() => store.go("reviews")}>
              {reviews.newCount} new reviews to read
            </button>
          </li>
        ) : null}
        {store.notifications.approvals && awaiting.length > 0 ? (
          <li>
            <button type="button" className="w-full rounded-xl bg-surface px-3 py-3 text-left" onClick={() => store.go("campaigns")}>
              {awaiting.length} campaign{awaiting.length === 1 ? "" : "s"} waiting for approval
            </button>
          </li>
        ) : null}
        {store.notifications.opportunities ? (
          <li>
            <button type="button" className="w-full rounded-xl bg-surface px-3 py-3 text-left" onClick={() => store.go("opportunities")}>
              {business.opportunity.title}
            </button>
          </li>
        ) : null}
      </ul>
    </div>
  );
}
