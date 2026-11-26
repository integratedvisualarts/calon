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

const dishes: { keys: string[]; dish: string; offer: string; headline: string }[] = [
  {
    keys: ["thali", "veg", "sunday", "ball"],
    dish: "Vegetarian thali",
    headline: "Thali before the ball",
    offer: "Tables from 17:00, Sunday",
  },
  {
    keys: ["chai", "masala", "tea"],
    dish: "Masala chai",
    headline: "Masala chai, on the pass",
    offer: "Whitchurch Road, all day",
  },
  {
    keys: ["chaat", "samosa", "puri"],
    dish: "Samosa ragada chaat",
    headline: "Chaat, while it lasts",
    offer: "£6.95 · from 17:00",
  },
  {
    keys: ["kathi", "roll"],
    dish: "Kathi roll",
    headline: "Monday kathi roll",
    offer: "£9.95 · 12:00–15:00",
  },
];

export function generateCampaignCopy(hint: string): GeneratedCopy {
  const hay = hint.toLowerCase();
  const match = dishes.find((item) => item.keys.some((key) => hay.includes(key))) ?? dishes[0];
  const caption = `${match.headline}. ${match.offer}. Chai Social, 134 Whitchurch Road. Reply to book.`;
  return {
    dish: match.dish,
    title: match.headline,
    headline: match.headline,
    offer: match.offer,
    cta: "Book a table",
    hashtags: "#ChaiSocial #WhitchurchRoad #CardiffFood",
    caption,
    whatsapp: `${match.dish} is on. ${match.offer}. Reply BOOK and we’ll hold a table.`,
    google: `${match.headline}. ${match.offer}. 134 Whitchurch Road, Cardiff.`,
  };
}
