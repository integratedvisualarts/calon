import { business, type CampaignStatus } from "@/data/demo-data";

export type Shot = { id: string; dataUrl: string; note: string };

export type ChannelField = {
  key: string;
  label: string;
  value: string;
  multiline?: boolean;
  hint?: string;
};

export type ChannelView = {
  id: string;
  label: string;
  when: string;
  note: string;
  included: boolean;
  fields: ChannelField[];
};

export type Campaign = {
  id: string;
  title: string;
  actionLabel?: string;
  status: CampaignStatus;
  audience: string;
  timing: string;
  variants: { id: string; label: string; body: string }[];
  selectedVariant: string;
  fromScratch?: boolean;
  channels?: Record<
    string,
    {
      included?: boolean;
      fields: Record<string, string>;
      variants?: { id: string; label: string; body: string }[];
      selected?: string;
      spin?: number;
    }
  >;
  shots?: Shot[];
  sourceWhy?: string;
  sourceData?: string;
  linkedId?: string;
  builderStep?: number;
  creator?: "ai" | "team";
  brief?: { goal: string; budget: string; deadline: string; notes: string };
  schedule?: Record<string, { date: string; time: string }>;
  result?: { reach: string; clicks?: string; effect: string; note: string };
  /** When the owner approved it (demo clock). Approved fixes count as done in the visibility audit. */
  approvedAt?: number;
};

export const channelGroups = [
  { label: "Send", ids: ["sms", "whatsapp", "email"] },
  { label: "Post", ids: ["still", "reel", "google"] },
  { label: "Pay", ids: ["paid", "search"] },
  { label: "In the shop", ids: ["sign", "staff"] },
];

export const channelIds = channelGroups.flatMap((group) => group.ids);

function sentences(text: string) {
  const parts = text
    .split(/(?<=[.!?])\s+/)
    .map((part) => part.trim())
    .filter(Boolean);
  return parts.length > 0 ? parts : [text];
}

function clip(text: string, max: number) {
  const clean = text.replace(/\s+/g, " ").trim();
  return clean.length <= max ? clean : `${clean.slice(0, max - 1).trimEnd()}…`;
}

function capitalise(text: string) {
  const clean = text.replace(/\s+/g, " ").trim().replace(/\.$/, "");
  return clean ? `${clean.charAt(0).toUpperCase()}${clean.slice(1)}.` : "";
}

function leadWith(body: string, notes: string[]) {
  if (notes.length === 0) return body;
  const first = capitalise(notes[0]);
  return body.toLowerCase().includes(notes[0].toLowerCase()) ? body : `${first} ${body}`;
}

function smsCount(message: string) {
  const count = message.length;
  const segments = Math.max(1, Math.ceil(count / 160));
  return `${count} characters · ${segments} segment${segments === 1 ? "" : "s"}.`;
}

export function runOfShow(timing: string) {
  return [
    { when: timing, what: "Email and the Google post." },
    { when: "Two hours later", what: "SMS to people who opted in. WhatsApp carries the longer line." },
    { when: "Same afternoon", what: "Social still and a 15-second reel." },
    { when: "While the offer is on", what: "Search only if you have set a cap. Nothing spends itself." },
    { when: "On the day", what: "Window card, and the line the team actually says." },
  ];
}

export function buildChannels(campaign: Campaign, body: string): ChannelView[] {
  const notes = (campaign.shots ?? []).map((shot) => shot.note.trim()).filter(Boolean);
  const hasPhoto = (campaign.shots ?? []).length > 0;
  const message = leadWith(body, notes);
  const parts = sentences(message);
  const first = parts[0] ?? message;
  const middle = notes[1] ? capitalise(notes[1]) : (parts[1] ?? "Say it once, plainly, and stop.");
  const end = notes[2] ? capitalise(notes[2]) : (parts[2] ?? `${business.name}. ${campaign.timing}.`);
  const photoLine = notes[0] ? capitalise(notes[0]) : "";
  const headline = clip(photoLine || first, 70);
  const photoNote = hasPhoto
    ? photoLine
      ? "Built from the photo you added. Change the note and this follows, unless you have edited the field."
      : "Your photo is on the preview. Name it and the words will follow."
    : "Add a photo you took and this will use it.";
  const sms = `${clip(sentences(message)[0] ?? message, 137)} Reply STOP to opt out.`;

  const base: ChannelView[] = [
    {
      id: "sms",
      label: "SMS",
      when: "Two hours after the email",
      note: "One segment where we can. Opt-out is on the line. Not sent.",
      included: true,
      fields: [
        { key: "sender", label: "Sender", value: business.sender, hint: "11 characters, the usual SMS limit." },
        { key: "message", label: "Message", value: sms, multiline: true, hint: smsCount(sms) },
      ],
    },
    {
      id: "whatsapp",
      label: "WhatsApp",
      when: "With the SMS",
      note: "Longer than the text. Quick replies are drafts, not buttons that fire.",
      included: true,
      fields: [
        { key: "message", label: "Message", value: message, multiline: true },
        { key: "reply1", label: "Quick reply", value: business.cta },
        { key: "reply2", label: "Quick reply", value: "Not this time" },
      ],
    },
    {
      id: "email",
      label: "Email",
      when: campaign.timing,
      note: "Subject, preheader and a single button. Nothing is sent.",
      included: true,
      fields: [
        { key: "from", label: "From", value: business.name },
        { key: "subject", label: "Subject", value: clip(campaign.title || "Chai Social", 58) },
        { key: "preheader", label: "Preheader", value: clip(photoLine || first, 90) },
        { key: "body", label: "Body", value: message, multiline: true },
        { key: "cta", label: "Button", value: business.cta },
      ],
    },
    {
      id: "still",
      label: "Social still",
      when: "Same afternoon",
      note: photoNote,
      included: true,
      fields: [
        { key: "headline", label: "On the image", value: headline, multiline: true },
        { key: "caption", label: "Caption", value: message, multiline: true },
        { key: "tags", label: "Hashtags", value: business.hashtags },
        { key: "alt", label: "Alt text", value: photoLine ? `${business.name}. ${photoLine}` : `${business.name}. ${headline}` },
      ],
    },
    {
      id: "reel",
      label: "Reel",
      when: "Same afternoon",
      note: hasPhoto
        ? "Storyboard on your photo. Calon does not cut the film."
        : "A 15-second storyboard. Add a photo and it becomes the frames.",
      included: true,
      fields: [
        { key: "hook", label: "0–3s · hook", value: photoLine || first, multiline: true },
        { key: "middle", label: "3–9s · the offer", value: middle, multiline: true },
        { key: "proof", label: "9–13s · the limit", value: end, multiline: true },
        { key: "end", label: "13–15s · where", value: `${business.name} · ${business.town}` },
        { key: "caption", label: "Caption", value: message, multiline: true },
        { key: "cover", label: "Cover line", value: clip(photoLine || campaign.title || "Chai Social", 32) },
      ],
    },
    {
      id: "paid",
      label: "Paid social",
      when: "Only if you set a cap",
      note: "Boosts the still or the reel. Off until you set a daily cap.",
      included: true,
      fields: [
        { key: "creative", label: "Creative", value: "Social still" },
        { key: "objective", label: "Objective", value: "Visits and replies" },
        { key: "audience", label: "Audience", value: campaign.audience },
        { key: "placement", label: "Placements", value: "Instagram and Facebook feeds" },
        { key: "budget", label: "Daily cap", value: "Not set", hint: "Nothing is spent until you set this and approve." },
      ],
    },
    {
      id: "google",
      label: "Google post",
      when: campaign.timing,
      note: "A Google Business Profile post, ready when you approve.",
      included: true,
      fields: [
        { key: "title", label: "Title", value: clip(campaign.title || "Chai Social", 58) },
        { key: "body", label: "Post", value: message, multiline: true },
        { key: "button", label: "Button", value: business.cta },
      ],
    },
    {
      id: "search",
      label: "Keyword bidding",
      when: "While the offer is on",
      note: "Search ads for this offer, from your Google Ads account.",
      included: true,
      fields: [
        { key: "h1", label: "Headline 1", value: clip(photoLine || campaign.title || "Chai Social", 30), hint: "30 characters in a live ad." },
        { key: "h2", label: "Headline 2", value: clip(business.name, 30) },
        { key: "h3", label: "Headline 3", value: clip("Whitchurch Road", 30) },
        { key: "d1", label: "Description", value: clip(first, 90), multiline: true, hint: "90 characters in a live ad." },
        { key: "d2", label: "Description 2", value: clip(`${campaign.audience}. ${campaign.timing}.`, 90), multiline: true },
        { key: "keywords", label: "Keywords", value: business.keywords, multiline: true, hint: "Phrase match. One a line." },
        { key: "budget", label: "Daily cap", value: "Not set" },
        { key: "bid", label: "Bid note", value: "Recent Cardiff clicks on these terms sit around £0.40–£1.20." },
      ],
    },
    {
      id: "sign",
      label: "In-store sign",
      when: "On the day",
      note: "Window on Whitchurch Road. Big type, few words.",
      included: true,
      fields: [
        { key: "headline", label: "Headline", value: headline, multiline: true },
        { key: "sub", label: "Small print", value: `${business.name} · ${campaign.timing}` },
      ],
    },
    {
      id: "staff",
      label: "Staff line",
      when: business.staffWhen,
      note: "What someone on the floor can say without reading the email.",
      included: true,
      fields: [
        { key: "when", label: "When", value: business.staffWhen },
        {
          key: "line",
          label: "Say this",
          value: photoLine ? `If they ask about the photo: ${photoLine} Then: ${first}` : first,
          multiline: true,
        },
      ],
    },
  ];

  return base.map((channel) => {
    const saved = campaign.channels?.[channel.id];
    const included = campaign.fromScratch ? saved?.included === true : saved?.included !== false;
    return {
      ...channel,
      included,
      fields: channel.fields.map((field) => {
        const value = saved?.fields[field.key] ?? field.value;
        return {
          ...field,
          value,
          hint: channel.id === "sms" && field.key === "message" ? smsCount(value) : field.hint,
        };
      }),
    };
  });
}

export function fieldValue(channel: ChannelView, key: string) {
  return channel.fields.find((field) => field.key === key)?.value ?? "";
}
