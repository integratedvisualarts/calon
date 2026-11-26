export const builderChannels = [
  { id: "instagram", label: "Instagram" },
  { id: "facebook", label: "Facebook" },
  { id: "google", label: "Google Business Profile post" },
  { id: "blog", label: "Website/blog" },
  { id: "email", label: "Email/SMS" },
  { id: "print", label: "In-store/print" },
  { id: "delivery", label: "Delivery app promo (Deliveroo, Uber Eats, Just Eat)" },
] as const;

export type BuilderChannelId = (typeof builderChannels)[number]["id"];

export const builderSteps = ["Source", "Channels", "Who", "Content", "Approve"] as const;
