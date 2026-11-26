"use client";

import {
  business,
  campaigns as seedCampaigns,
  chat,
  DATA_VERSION,
  type Variant,
} from "@/data/demo-data";
import { buildChannels, channelIds, type Campaign, type Shot } from "@/lib/channels";
import { fixCheckFor, refreshLive } from "@/data/live";
import { liveNow, tickMs } from "@/engine/clock";
import type { DoneFix } from "@/engine/visibility";
import { labelFor, parseLocation, viewKey, viewUrl, type Screen, type View } from "@/lib/history";
import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";

export type { Screen } from "@/lib/history";

export type SourceId = "google" | "reviews" | "sales" | "social";

type Reply = { text: string; approved: boolean };
type LogItem = { id: string; at: string; action: string; detail: string };
type Toast = { text: string; undo?: () => void } | null;
type ChatMessage = {
  id: string;
  role: "user" | "assistant";
  text: string;
  source?: string;
  bars?: { label: string; value: number }[];
  card?: { title: string; body: string };
};

const storageKey = "chai-social-workspace";

function nowLabel() {
  return new Intl.DateTimeFormat("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
    day: "numeric",
    month: "short",
  }).format(liveNow());
}

/** Approved visibility fixes count as done in the audit, from the moment they were approved. */
function doneFixes(campaigns: Campaign[]): DoneFix[] {
  return campaigns
    .filter((item) => item.id.startsWith("fix-") && (item.status === "scheduled" || item.status === "live" || item.status === "done"))
    .map((item) => ({ check: fixCheckFor(item.id) ?? "", at: item.approvedAt ?? 0 }))
    .filter((item) => item.check);
}

function log(action: string, detail: string): LogItem {
  return {
    id: `log-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    at: nowLabel(),
    action,
    detail,
  };
}

function seed(): Campaign[] {
  return seedCampaigns.map((item) => ({
    ...item,
    selectedVariant: item.variants[0]?.id ?? "a",
    variants: item.variants.map((variant) => ({ ...variant })),
  }));
}

type State = {
  hydrated: boolean;
  /** Bumps every time the live feed recomputes, so every screen re-reads the data. */
  tick: number;
  screen: Screen;
  mode: "ai" | "seo";
  sources: Record<SourceId, boolean>;
  goals: string[];
  voice: { warm: number; brief: number; local: number };
  rules: { replies: boolean; quiet: boolean };
  notifications: { reviews: boolean; opportunities: boolean; approvals: boolean };
  campaigns: Campaign[];
  campaignFilter: "draft" | "scheduled" | "live" | "team" | "done";
  plan: "plus" | "pro";
  upgradePrompt: boolean;
  openCampaignId: string | null;
  section: string | null;
  notFound: boolean;
  replies: Record<string, Reply>;
  log: LogItem[];
  chatOpen: boolean;
  messages: ChatMessage[];
  bellOpen: boolean;
  toast: Toast;
  backLabel: string;
};

function initial(): State {
  return {
    hydrated: false,
    tick: 0,
    screen: "home",
    mode: "ai",
    sources: { google: true, reviews: true, sales: true, social: true },
    goals: [...business.goals],
    voice: { warm: 70, brief: 40, local: 62 },
    rules: { replies: true, quiet: false },
    notifications: { reviews: true, opportunities: true, approvals: true },
    campaigns: seed(),
    campaignFilter: "draft",
    plan: "pro",
    upgradePrompt: false,
    openCampaignId: null,
    section: null,
    notFound: false,
    replies: {},
    log: [log("Account opened", "Nothing has been posted.")],
    chatOpen: false,
    messages: [],
    bellOpen: false,
    toast: null,
    backLabel: "Home",
  };
}

type PatchCampaign = (id: string, patch: Partial<Campaign>) => void;

type Api = State & {
  go: (screen: Screen) => void;
  setMode: (mode: "ai" | "seo") => void;
  toggleSource: (id: SourceId) => void;
  toggleGoal: (goal: string) => void;
  setVoice: (key: "warm" | "brief" | "local", value: number) => void;
  setRule: (key: "replies" | "quiet", value: boolean) => void;
  setNote: (key: "reviews" | "opportunities" | "approvals", value: boolean) => void;
  setFilter: (filter: State["campaignFilter"]) => void;
  openCampaign: (id: string | null) => void;
  editVariant: (id: string, variantId: string, body: string) => void;
  selectVariant: (id: string, variantId: string) => void;
  patchCampaign: PatchCampaign;
  tuneChannel: (
    id: string,
    channelId: string,
    change: { included?: boolean; clear?: boolean; field?: { key: string; value: string } },
  ) => void;
  addShot: (id: string, shot: Shot) => void;
  noteShot: (id: string, shotId: string, note: string) => void;
  leadShot: (id: string, shotId: string) => void;
  removeShot: (id: string, shotId: string) => void;
  openOrCreate: (id: string, factory: () => Omit<Campaign, "selectedVariant"> & { variants: Variant[] }) => void;
  sendToTeam: (id: string, brief: { goal: string; budget: string; deadline: string; notes: string }) => void;
  setPlan: (plan: "plus" | "pro") => void;
  dismissUpgrade: () => void;
  submitCampaign: (id: string) => void;
  approveCampaign: (id: string) => void;
  rejectCampaign: (id: string) => void;
  saveReply: (id: string, text: string, approved: boolean) => void;
  setChat: (open: boolean) => void;
  sendChat: (text: string) => void;
  setBell: (open: boolean) => void;
  clearToast: () => void;
  notify: (text: string) => void;
  resetDemo: () => void;
  openSection: (screen: Screen, section: string | null) => void;
  replaceSection: (section: string | null) => void;
  back: () => void;
};

const Ctx = createContext<Api | null>(null);

export function StoreProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<State>(initial);
  const latest = useRef(state);
  latest.current = state;
  const doneKey = doneFixes(state.campaigns)
    .map((item) => `${item.check}@${item.at}`)
    .join("|");

  // The live feed: recompute the snapshot on a timer and whenever an approved fix changes the audit.
  useEffect(() => {
    if (!state.hydrated) return;
    const run = () => {
      refreshLive(doneFixes(latest.current.campaigns));
      setState((current) => ({ ...current, tick: current.tick + 1 }));
    };
    run();
    const timer = window.setInterval(run, tickMs());
    return () => window.clearInterval(timer);
  }, [state.hydrated, doneKey]);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(storageKey);
      if (!raw) {
        setState((current) => ({ ...current, hydrated: true }));
        return;
      }
      const saved = JSON.parse(raw) as { version?: number; state?: Partial<State> };
      if (saved.version !== DATA_VERSION || !saved.state) {
        localStorage.removeItem(storageKey);
        setState((current) => ({ ...current, hydrated: true }));
        return;
      }
      const next = saved.state;
      setState((current) => ({
        ...current,
        ...next,
        hydrated: true,
        campaigns:
          Array.isArray(next.campaigns) && next.campaigns.length > 0
            ? next.campaigns.map((item) => ({ ...item, shots: item.shots?.map((shot) => ({ ...shot, dataUrl: "" })) }))
            : current.campaigns,
        screen: "home",
        openCampaignId: null,
        chatOpen: false,
        bellOpen: false,
        toast: null,
        messages: [],
        backLabel: "Home",
      }));
    } catch {
      setState((current) => ({ ...current, hydrated: true }));
    }
  }, []);

  useEffect(() => {
    if (!state.hydrated) return;
    const persist = {
      version: DATA_VERSION,
      state: {
        screen: state.screen,
        mode: state.mode,
        sources: state.sources,
        goals: state.goals,
        voice: state.voice,
        rules: state.rules,
        notifications: state.notifications,
        campaigns: state.campaigns.map((item) => ({ ...item, shots: [] })),
        campaignFilter: state.campaignFilter,
        plan: state.plan,
        openCampaignId: state.openCampaignId,
        replies: state.replies,
        log: state.log.slice(0, 24),
      },
    };
    try {
      localStorage.setItem(storageKey, JSON.stringify(persist));
    } catch {
      /* demo only */
    }
  }, [state]);

  const api = useMemo<Api>(() => {
    const patch = (partial: Partial<State>) => setState((current) => ({ ...current, ...partial }));
    const pushLog = (current: State, action: string, detail: string) => [log(action, detail), ...current.log];

    return {
      ...state,
      go: (screen) => patch({ screen, section: null, notFound: false, bellOpen: false, chatOpen: false, openCampaignId: null }),
      openSection: (screen, section) => patch({ screen, section, notFound: false, bellOpen: false, chatOpen: false, openCampaignId: null }),
      replaceSection: (section) => {
        navBridge.replace = true;
        patch({ section, notFound: false });
      },
      setMode: (mode) => patch({ mode }),
      toggleSource: (id) =>
        setState((current) => {
          const on = !current.sources[id];
          const label =
            id === "google" ? "Google Business Profile" : id === "reviews" ? "Google reviews" : id === "sales" ? "Till data" : "Instagram and Facebook";
          return {
            ...current,
            sources: { ...current.sources, [id]: on },
            log: pushLog(current, on ? "Source connected" : "Source disconnected", `${label}. This browser only.`),
          };
        }),
      toggleGoal: (goal) =>
        setState((current) => ({
          ...current,
          goals: current.goals.includes(goal) ? current.goals.filter((item) => item !== goal) : [...current.goals, goal],
        })),
      setVoice: (key, value) => setState((current) => ({ ...current, voice: { ...current.voice, [key]: value } })),
      setRule: (key, value) => setState((current) => ({ ...current, rules: { ...current.rules, [key]: value } })),
      setNote: (key, value) =>
        setState((current) => ({ ...current, notifications: { ...current.notifications, [key]: value } })),
      setFilter: (campaignFilter) => patch({ campaignFilter, openCampaignId: null }),
      openCampaign: (openCampaignId) => {
        if (openCampaignId && state.plan === "plus") {
          patch({ upgradePrompt: true, screen: "campaigns", openCampaignId: null, section: null, notFound: false, bellOpen: false, chatOpen: false });
          return;
        }
        if (openCampaignId === null && navBridge.depth > 0 && history.state?.calon?.openCampaignId) {
          history.back();
          return;
        }
        patch({ openCampaignId, upgradePrompt: false, screen: "campaigns", section: null, notFound: false, bellOpen: false, chatOpen: false });
      },
      editVariant: (id, variantId, body) =>
        setState((current) => ({
          ...current,
          campaigns: current.campaigns.map((item) =>
            item.id === id
              ? { ...item, variants: item.variants.map((variant) => (variant.id === variantId ? { ...variant, body } : variant)) }
              : item,
          ),
        })),
      selectVariant: (id, variantId) =>
        setState((current) => ({
          ...current,
          campaigns: current.campaigns.map((item) => (item.id === id ? { ...item, selectedVariant: variantId } : item)),
        })),
      patchCampaign: (id, campaignPatch) =>
        setState((current) => ({
          ...current,
          campaigns: current.campaigns.map((item) => (item.id === id ? { ...item, ...campaignPatch } : item)),
        })),
      tuneChannel: (id, channelId, change) =>
        setState((current) => ({
          ...current,
          campaigns: current.campaigns.map((item) => {
            if (item.id !== id) return item;
            const previous = item.channels?.[channelId] ?? { included: !item.fromScratch, fields: {} };
            const fields = change.clear
              ? {}
              : change.field
                ? { ...previous.fields, [change.field.key]: change.field.value }
                : previous.fields;
            return {
              ...item,
              channels: {
                ...item.channels,
                [channelId]: { ...previous, included: change.included ?? previous.included, fields },
              },
            };
          }),
        })),
      addShot: (id, shot) =>
        setState((current) => ({
          ...current,
          campaigns: current.campaigns.map((item) =>
            item.id === id ? { ...item, shots: [...(item.shots ?? []), shot].slice(0, 3) } : item,
          ),
        })),
      noteShot: (id, shotId, note) =>
        setState((current) => ({
          ...current,
          campaigns: current.campaigns.map((item) =>
            item.id === id
              ? { ...item, shots: (item.shots ?? []).map((shot) => (shot.id === shotId ? { ...shot, note } : shot)) }
              : item,
          ),
        })),
      leadShot: (id, shotId) =>
        setState((current) => ({
          ...current,
          campaigns: current.campaigns.map((item) => {
            if (item.id !== id) return item;
            const shots = item.shots ?? [];
            const lead = shots.find((shot) => shot.id === shotId);
            return lead ? { ...item, shots: [lead, ...shots.filter((shot) => shot.id !== shotId)] } : item;
          }),
        })),
      removeShot: (id, shotId) =>
        setState((current) => ({
          ...current,
          campaigns: current.campaigns.map((item) =>
            item.id === id ? { ...item, shots: (item.shots ?? []).filter((shot) => shot.id !== shotId) } : item,
          ),
        })),
      openOrCreate: (id, factory) =>
        setState((current) => {
          if (current.plan === "plus") {
            return {
              ...current,
              upgradePrompt: true,
              screen: "campaigns",
              openCampaignId: null,
              section: null,
              notFound: false,
              bellOpen: false,
              chatOpen: false,
            };
          }
          if (current.campaigns.some((item) => item.id === id)) {
            return { ...current, openCampaignId: id, screen: "campaigns", section: null, notFound: false, bellOpen: false, chatOpen: false };
          }
          const created = factory();
          const campaign: Campaign = {
            ...created,
            selectedVariant: created.variants[0]?.id ?? "a",
            builderStep: created.builderStep ?? 1,
          };
          return {
            ...current,
            campaigns: [campaign, ...current.campaigns],
            openCampaignId: id,
            screen: "campaigns",
            section: null,
            notFound: false,
            bellOpen: false,
            chatOpen: false,
            toast: { text: "Draft ready. Nothing will be posted until you approve it." },
          };
        }),
      sendToTeam: (id, brief) =>
        setState((current) => {
          if (current.plan !== "pro") {
            return { ...current, toast: { text: "Send to the Calon Team is included on Pro." } };
          }
          const title = current.campaigns.find((item) => item.id === id)?.title || "Campaign";
          return {
            ...current,
            campaigns: current.campaigns.map((item) =>
              item.id === id ? { ...item, status: "team", creator: "team", brief, builderStep: 3 } : item,
            ),
            campaignFilter: "team",
            log: pushLog(current, "Sent to Calon Team", `“${title}”. Reply within 1 working day. Nothing has been posted.`),
            toast: { text: "Calon Team will reply within 1 working day." },
          };
        }),
      setPlan: (plan) =>
        setState((current) => ({
          ...current,
          plan,
          upgradePrompt: false,
          log: pushLog(current, "Plan", plan === "pro" ? "Chai Social is on Pro. Demo only. No payment taken." : "Chai Social is on Plus. Demo only. No payment taken."),
          toast: { text: plan === "pro" ? "Pro · £50/month. Demo only. No payment taken." : "Plus · £25/month. Demo only. No payment taken." },
        })),
      dismissUpgrade: () => patch({ upgradePrompt: false }),
      submitCampaign: (id) =>
        setState((current) => {
          const title = current.campaigns.find((item) => item.id === id)?.title || "Campaign";
          return {
            ...current,
            campaigns: current.campaigns.map((item) => (item.id === id ? { ...item, status: "awaiting" } : item)),
            log: pushLog(current, "Sent for approval", `“${title}” is waiting. It has not been posted.`),
            toast: { text: "Waiting for your approval. Nothing has been posted." },
          };
        }),
      approveCampaign: (id) =>
        setState((current) => {
          const item = current.campaigns.find((campaign) => campaign.id === id);
          if (!item || item.status === "scheduled" || item.status === "done") return current;
          const previous = item.status;
          return {
            ...current,
            campaigns: current.campaigns.map((campaign) =>
              campaign.id === id ? { ...campaign, status: "scheduled", approvedAt: liveNow().getTime() } : campaign,
            ),
            campaignFilter: "scheduled",
            log: pushLog(current, "Approved", `“${item.title}” is scheduled. It has not been posted.`),
            toast: {
              text: "Approved and scheduled. It has not been posted.",
              undo: () => {
                setState((latest) => ({
                  ...latest,
                  campaigns: latest.campaigns.map((campaign) =>
                    campaign.id === id ? { ...campaign, status: previous } : campaign,
                  ),
                  toast: { text: "Approval undone. It’s a draft again." },
                }));
              },
            },
          };
        }),
      rejectCampaign: (id) =>
        setState((current) => {
          const item = current.campaigns.find((campaign) => campaign.id === id);
          if (!item) return current;
          const previous = item.status;
          return {
            ...current,
            campaigns: current.campaigns.map((campaign) =>
              campaign.id === id ? { ...campaign, status: "draft" } : campaign,
            ),
            campaignFilter: "draft",
            log: pushLog(current, "Rejected", `“${item.title}” went back to drafts. Nothing was sent.`),
            toast: {
              text: "Rejected. It’s back in drafts.",
              undo: () => {
                setState((latest) => ({
                  ...latest,
                  campaigns: latest.campaigns.map((campaign) =>
                    campaign.id === id ? { ...campaign, status: previous } : campaign,
                  ),
                  toast: { text: "Rejection undone." },
                }));
              },
            },
          };
        }),
      saveReply: (id, text, approved) =>
        setState((current) => ({
          ...current,
          replies: { ...current.replies, [id]: { text, approved } },
          log: approved
            ? pushLog(current, "Reply approved", "Copied. Paste it into Google. Calon does not post it.")
            : current.log,
          toast: approved ? { text: "Approved and copied. Nothing was posted." } : current.toast,
        })),
      setChat: (chatOpen) => {
        if (!chatOpen && navBridge.depth > 0 && history.state?.calon?.chatOpen) {
          history.back();
          return;
        }
        patch({ chatOpen, bellOpen: false });
      },
      sendChat: (text) => {
        const trimmed = text.trim();
        if (!trimmed) return;
        const hit = chat.find((item) => item.keywords.some((keyword) => trimmed.toLowerCase().includes(keyword)));
        const userMessage: ChatMessage = { id: `u-${Date.now()}`, role: "user", text: trimmed };
        const answer: ChatMessage = hit
          ? {
              id: `a-${Date.now()}`,
              role: "assistant",
              text: hit.answer,
              source: hit.source,
              bars: hit.bars,
              card: hit.card,
            }
          : {
              id: `a-${Date.now()}`,
              role: "assistant",
              text: "I can answer from your till data, Google and the rota. Try one of the questions below.",
              source: "Chai Social account",
            };
        setState((current) => ({ ...current, messages: [...current.messages, userMessage, answer] }));
      },
      setBell: (bellOpen) => patch({ bellOpen, chatOpen: false }),
      clearToast: () => patch({ toast: null }),
      notify: (text) => patch({ toast: { text } }),
      resetDemo: () => {
        try {
          localStorage.removeItem(storageKey);
        } catch {
          /* ignore */
        }
        navBridge.stack = [{ screen: "home", openCampaignId: null, chatOpen: false, section: null, notFound: false }];
        navBridge.depth = 0;
        history.replaceState({ calon: navBridge.stack[0] }, "", "/");
        setState({ ...initial(), hydrated: true });
      },
      back: () => {
        if (navBridge.depth > 0) history.back();
        else patch({ screen: "home", section: null, notFound: false, openCampaignId: null, chatOpen: false, bellOpen: false, backLabel: "Home" });
      },
    };
  }, [state]);

  useEffect(() => {
    if (!state.hydrated || navBridge.booted) return;
    navBridge.booted = true;
    const fromUrl = parseLocation(window.location.pathname);
    navBridge.ignore = true;
    navBridge.stack = [fromUrl];
    navBridge.depth = 0;
    window.history.replaceState({ calon: fromUrl }, "", viewUrl(fromUrl));
    setState((current) => ({
      ...current,
      screen: fromUrl.screen,
      openCampaignId: fromUrl.openCampaignId,
      chatOpen: fromUrl.chatOpen,
      section: fromUrl.section,
      notFound: fromUrl.notFound,
      backLabel: "Home",
    }));
    window.setTimeout(() => {
      navBridge.ignore = false;
    }, 0);
  }, [state.hydrated]);

  useEffect(() => {
    if (!state.hydrated || !navBridge.booted || navBridge.ignore) return;
    const view: View = {
      screen: state.screen,
      openCampaignId: state.openCampaignId,
      chatOpen: state.chatOpen,
      section: state.section,
      notFound: state.notFound,
    };
    const current = window.history.state?.calon as View | undefined;
    if (current && viewKey(current) === viewKey(view)) return;
    if (navBridge.replace) {
      navBridge.replace = false;
      navBridge.stack[Math.max(0, navBridge.stack.length - 1)] = view;
      window.history.replaceState({ calon: view }, "", viewUrl(view));
      return;
    }
    const previous = navBridge.stack[navBridge.stack.length - 1];
    navBridge.stack.push(view);
    navBridge.depth = navBridge.stack.length - 1;
    window.history.pushState({ calon: view }, "", viewUrl(view));
    setState((existing) => ({ ...existing, backLabel: labelFor(previous) }));
  }, [state.hydrated, state.screen, state.openCampaignId, state.chatOpen, state.section, state.notFound]);

  useEffect(() => {
    function onPop(event: PopStateEvent) {
      const view = (event.state?.calon as View | undefined) ?? {
        screen: "home" as const,
        openCampaignId: null,
        chatOpen: false,
        section: null,
        notFound: false,
      };
      navBridge.ignore = true;
      if (navBridge.stack.length > 1) navBridge.stack.pop();
      navBridge.depth = Math.max(0, navBridge.stack.length - 1);
      const previous = navBridge.stack[navBridge.stack.length - 2];
      setState((current) => ({
        ...current,
        screen: view.screen,
        openCampaignId: view.openCampaignId,
        chatOpen: view.chatOpen,
        section: view.section ?? null,
        notFound: view.notFound ?? false,
        bellOpen: false,
        backLabel: labelFor(previous),
      }));
      window.setTimeout(() => {
        navBridge.ignore = false;
      }, 0);
    }
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, []);

  return <Ctx.Provider value={api}>{children}</Ctx.Provider>;
}

const navBridge: { stack: View[]; depth: number; ignore: boolean; booted: boolean; replace: boolean } = {
  stack: [],
  depth: 0,
  ignore: false,
  booted: false,
  replace: false,
};

export function useStore() {
  const value = useContext(Ctx);
  if (!value) throw new Error("Store missing");
  return value;
}

export function selectedBody(campaign: Campaign) {
  return campaign.variants.find((variant) => variant.id === campaign.selectedVariant)?.body ?? campaign.variants[0]?.body ?? "";
}

export function includedCount(campaign: Campaign) {
  const body = selectedBody(campaign);
  return buildChannels(campaign, body).filter((channel) => channel.included).length;
}

void channelIds;
