import { brand } from "@/data/brands";
import { activeWorkspace } from "@/data/current";

export type GeneratedCopy = {
  dish: string;
  title: string;
  headline: string;
  offer: string;
  cta: string;
  hashtags: string;
  caption: string;
  whatsapp: string;
  google: string;
};

const dishes: { keys: string[]; dish: string; offer: string; headline: string }[] = brand.copyDishes;

export function generateCampaignCopy(hint: string): GeneratedCopy {
  const hay = hint.toLowerCase();
  const match = dishes.find((item) => item.keys.some((key) => hay.includes(key))) ?? dishes[0];
  const caption = `${match.headline}. ${match.offer}. ${brand.nameAndPlace}. Reply to book.`;
  return {
    dish: match.dish,
    title: match.headline,
    headline: match.headline,
    offer: match.offer,
    cta: "Book a table",
    hashtags: brand.hashtags,
    caption,
    whatsapp: `${match.dish} is on. ${match.offer}. Reply BOOK and we’ll hold a table.`,
    google: `${match.headline}. ${match.offer}. ${activeWorkspace.address}.`,
  };
}
