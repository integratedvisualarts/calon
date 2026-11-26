/**
 * Per-restaurant wording and fixed facts for the screens. The engine reads the workspace file;
 * this file holds what the interface itself says (rivals, sender names, hashtags, area notes).
 * A new pilot adds one entry here and one workspace file.
 */
import { activeId } from "@/data/current";

export type Rival = { id: string; name: string; miles: string; score: number; term: string; rating: string; reviews: number; gap: string };
export type AreaNote = { id: string; name: string; miles: number; kind: string; detail: string; source: string };
export type CopyDish = { keys: string[]; dish: string; offer: string; headline: string };

export type Brand = {
  monogram: string;
  typeLabel: string;
  category: string;
  websiteHours: string;
  orderHours: string;
  goals: string[];
  audiences: string[];
  voice: { warm: string; brief: string; local: string };
  sender: string;
  hashtags: string;
  keywords: string;
  /** Short place line: shown in headings and drafts. */
  place: string;
  /** Full line used in drafts, e.g. "Chefs of India, 134 Whitchurch Road". */
  nameAndPlace: string;
  /** The search phrase the home screen leads with. */
  focusTerm: string;
  /** Wording for the generated copy fallback. */
  signatureWords: string;
  signaturePair: string;
  rivals: Rival[];
  rivalNote: string;
  blogNote: string;
  adCity: string;
  adBid: string;
  areaTitle: string;
  areaBlurb: string;
  areaPlaces: AreaNote[];
  googleDetail: string;
  weatherDetail: string;
  copyDishes: CopyDish[];
  menuNotes: { verifiedDishes: string[]; fromPublicReviews: string[]; notVerified: string };
  teamLead: string;
};

const chai: Brand = {
  monogram: "CS",
  typeLabel: "Restaurant",
  category: "Indian restaurant",
  websiteHours: "Lunch 12:00–15:00 · dinner 17:00–22:00",
  orderHours: "Order page: 12:00–14:45 and 17:00–21:45",
  goals: ["Fill the quiet sittings", "Turn wet days into delivery", "Get mentioned for masala chai nearby"],
  audiences: [
    "Groups of 4–8 within 2 miles",
    "Past delivery guests within 1.5 miles",
    "Cathays and Whitchurch Road, within a mile",
    "Past guests within 2 miles",
  ],
  voice: {
    warm: "Come in early. We’ll look after the table, and the chai is on.",
    brief: "Vegetarian thali, Whitchurch Road. Reply to book.",
    local: "If you’re between Cathays and Whitchurch Road, we’ve kept early tables.",
  },
  sender: "ChaiSocial",
  hashtags: "#CardiffFood #ChaiSocial #WhitchurchRoad",
  keywords: `chai near me
desi street food cardiff
indian restaurant whitchurch road
masala chai cardiff
vegetarian thali cardiff`,
  place: "Whitchurch Road",
  nameAndPlace: "Chefs of India, 134 Whitchurch Road",
  focusTerm: "chai near me",
  signatureWords: "vegetarian thali, masala chai",
  signaturePair: "The vegetarian thali and masala chai",
  rivals: [
    { id: "mint", name: "Mint Leaf", miles: "0.4", score: 71, term: "chai near me", rating: "4.6", reviews: 320, gap: "The profile answers “chai near me” in the first sentence." },
    { id: "cathays", name: "Cathays Street Food", miles: "0.7", score: 66, term: "Indian street food Cathays", rating: "4.4", reviews: 180, gap: "Street food and Cathays are in the business name." },
    { id: "tiffin", name: "Church Road Tiffin", miles: "0.9", score: 52, term: "Diwali thali Cardiff", rating: "4.5", reviews: 96, gap: "A Diwali thali is already on their Google menu." },
    { id: "heath", name: "Heath Open Kitchen", miles: "0.8", score: 61, term: "curry near me open now", rating: "4.3", reviews: 210, gap: "Site hours and the order page match." },
  ],
  rivalNote: "Mint Leaf leads “chai near me” because the profile answers it in the first sentence.",
  blogNote: "A Cardiff food blog post is the off-page suggestion: chai and the thali on Whitchurch Road.",
  adCity: "Cardiff",
  adBid: "Recent Cardiff clicks on these terms sit around £0.40–£1.20.",
  areaTitle: "Around Whitchurch Road",
  areaBlurb: "Footfall, the campus calendar and the categories on this stretch.",
  areaPlaces: [
    {
      id: "campus",
      name: "Cardiff University, Cathays",
      miles: 1,
      kind: "Campus",
      detail:
        "Autumn semester for undergraduate modular programmes runs to Sunday 31 January 2027. Christmas break starts Saturday 19 December. Cathays is about a mile south of the door.",
      source: "Cardiff University semester dates, 2026/27, marked provisional",
    },
    {
      id: "heath",
      name: "University Hospital of Wales",
      miles: 0.8,
      kind: "Footfall",
      detail: "Heath is under a mile north. Shift changes bring early dinners and delivery along Whitchurch Road.",
      source: "University Hospital of Wales, Heath",
    },
    {
      id: "centre",
      name: "Cardiff Castle and the city centre",
      miles: 2,
      kind: "Season",
      detail: "Christmas shopping pulls evening trade about two miles south. Whitchurch Road keeps people who want a table without the centre.",
      source: "Public holiday calendars. Market dates change each year.",
    },
    {
      id: "categories",
      name: "Nearby categories, not named rivals",
      miles: 0.4,
      kind: "Category",
      detail:
        "On this stretch of Whitchurch Road and toward Crwys Road: other Indian restaurants, student dessert and coffee cafés, and delivery-only curry kitchens that appear for “curry near me”.",
      source: "Category read of the street. Names are deliberately not listed.",
    },
  ],
  googleDetail: "Hours, category, photos and the Whitchurch Road listing.",
  weatherDetail: "Forecast for Whitchurch Road, set against past wet days.",
  copyDishes: [
    { keys: ["thali", "veg", "sunday", "ball"], dish: "Vegetarian thali", headline: "Thali before the ball", offer: "Tables from 17:00, Sunday" },
    { keys: ["chai", "masala", "tea"], dish: "Masala chai", headline: "Masala chai, on the pass", offer: "Whitchurch Road, all day" },
    { keys: ["chaat", "samosa", "puri"], dish: "Samosa ragada chaat", headline: "Chaat, while it lasts", offer: "£6.95 · from 17:00" },
    { keys: ["kathi", "roll"], dish: "Kathi roll", headline: "Monday kathi roll", offer: "£9.95 · 12:00–15:00" },
  ],
  menuNotes: {
    verifiedDishes: [
      "Veg samosa £5.95",
      "Onion bhaji £6.95",
      "Samosa ragada chaat £6.95",
      "Dahi puri chaat £6.95",
      "Paneer kathi roll £9.95",
      "Chicken kathi roll £9.95",
      "Choley batura £10.95",
      "Aloo batura £9.95",
      "Chicken tikka masala £10.95",
      "Club curry meal, vegetable £9.95",
      "Lucknawi lamb chop £8.95",
    ],
    fromPublicReviews: ["Vegetarian thali", "Masala chai", "Garlic naan", "Cobra on draught", "Guava mocktail"],
    notVerified: "Prices for the thali, chai, naan and drinks are working assumptions until the till is connected.",
  },
  teamLead: "Rajendra",
};

const brothersBrand: Brand = {
  monogram: "BC",
  typeLabel: "Restaurant",
  category: "Indian restaurant",
  websiteHours: "Lunch 12:00–15:00 · dinner 17:00–22:00 (Tuesday to Sunday)",
  orderHours: "Click & Collect: see the website",
  goals: ["Fill the quiet midweek sittings", "Win Christmas party bookings", "Be named for tandoor and special occasions"],
  audiences: [
    "Groups of 6–12 within 8 miles",
    "Past Click & Collect guests within 5 miles",
    "Pontyclun and Hawthorn, within 5 miles",
    "Past guests within 8 miles",
  ],
  voice: {
    warm: "Come and celebrate with us. We’ll look after the table.",
    brief: "Contemporary Indian, Pontyclun. Reply to book.",
    local: "If you’re in Pontyclun or Hawthorn, we’ve kept tables for you.",
  },
  sender: "Brothers",
  hashtags: "#Pontyclun #SouthWalesFood #BrothersIndian",
  keywords: `indian restaurant pontyclun
best indian near me south wales
tandoori restaurant pontyclun
special occasion dinner south wales
indian takeaway pontyclun`,
  place: "Pontyclun",
  nameAndPlace: "Brothers Contemporary Indian Cuisine, Pontyclun",
  focusTerm: "indian restaurant pontyclun",
  signatureWords: "tandoor, butter chicken",
  signaturePair: "The tandoor and the butter chicken",
  rivals: [
    { id: "r1", name: "Village curry house (sample)", miles: "1.2", score: 63, term: "indian restaurant pontyclun", rating: "4.4", reviews: 240, gap: "Town name is in the Google title." },
    { id: "r2", name: "Llantrisant Indian kitchen (sample)", miles: "3.4", score: 58, term: "tandoori restaurant near me", rating: "4.3", reviews: 150, gap: "Tandoori dishes are marked up on the menu page." },
    { id: "r3", name: "Takeaway-only kitchen (sample)", miles: "2.0", score: 49, term: "curry near me open now", rating: "4.2", reviews: 310, gap: "Hours match everywhere online." },
  ],
  rivalNote: "Sample rivals only. Calon will name the real nearby restaurants once the Google listing is connected.",
  blogNote: "A South Wales food blog post is the off-page suggestion: the tandoor and a special-occasion table in Pontyclun.",
  adCity: "South Wales",
  adBid: "Sample range until the ad account is connected: £0.40–£1.20 a click.",
  areaTitle: "Around Pontyclun",
  areaBlurb: "Events, the season and the categories nearby. Sample read until real data is connected.",
  areaPlaces: [
    {
      id: "village",
      name: "Pontyclun and Hawthorn",
      miles: 1,
      kind: "Local",
      detail: "Most weekday trade is local. Sunday lunch and Christmas parties bring wider groups.",
      source: "Sample read. Replaced by the restaurant’s own postcode data.",
    },
    {
      id: "rail",
      name: "Pontyclun station",
      miles: 0.5,
      kind: "Footfall",
      detail: "Commuter flow runs past the door. Early evening on weekdays is the quiet slot to fill.",
      source: "Sample read.",
    },
    {
      id: "season",
      name: "Christmas party season",
      miles: 5,
      kind: "Season",
      detail: "Work and family groups book from the start of December. Large tables go first.",
      source: "Public holiday calendars. Dates change each year.",
    },
    {
      id: "categories",
      name: "Nearby categories, not named rivals",
      miles: 3,
      kind: "Category",
      detail: "Other Indian restaurants, takeaways and gastro-pubs across Pontyclun, Llantrisant and Pontypridd.",
      source: "Category read of the area. Names are deliberately not listed.",
    },
  ],
  googleDetail: "Hours, category, photos and the Pontyclun listing.",
  weatherDetail: "Forecast for Pontyclun, set against past wet days.",
  copyDishes: [
    { keys: ["tandoor", "grill", "kebab", "tikka"], dish: "From the tandoor", headline: "From the tandoor", offer: "Pontyclun, dinner from 17:00" },
    { keys: ["butter", "chicken", "curry"], dish: "Butter chicken", headline: "Butter chicken night", offer: "Tuesday to Sunday" },
    { keys: ["christmas", "party", "group", "book"], dish: "Christmas tables", headline: "Christmas party tables", offer: "Groups of 6 and over" },
    { keys: ["sunday", "lunch"], dish: "Sunday lunch", headline: "Sunday lunch, unhurried", offer: "12:00–15:00" },
  ],
  menuNotes: {
    verifiedDishes: ["Butter chicken £16.45", "Tandoor and mains from the September 2026 menu", "Cobra £6.45", "Cocktails £10.95"],
    fromPublicReviews: ["Tandoor", "Butter chicken", "Goan prawns", "Cocktails"],
    notVerified: "Desserts and the set menu are not loaded yet. Covers, rota and demand are modelled until the till is connected.",
  },
  teamLead: "Dominic",
};

export const brands: Record<string, Brand> = {
  "chai-social": chai,
  "brothers-pontyclun": brothersBrand,
};

export const brand: Brand = brands[activeId] ?? chai;
