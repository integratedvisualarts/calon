import type { MenuItem, Workspace } from "../types";

/**
 * Brothers Contemporary Indian Cuisine, Pontyclun. DEMO workspace.
 *
 * Public facts (brothersuk.co.uk and the restaurant's own full menu, September 2026): name, phone,
 * town, weekly opening pattern, and the dish names and prices marked priceVerified.
 *
 * Modelled for the demo, NOT the restaurant's real figures: seats and tables, demand levels, rota,
 * review history, web-presence levels and past campaigns. Their Click & Collect orders are shown
 * through the delivery channels in this demo. Desserts and the set menu are not loaded yet; the soft drink is modelled.
 * The street address and email are not published on their site, so they are left blank here.
 *
 * Opening hours are modelled as one lunch and one dinner window; the days the restaurant is closed
 * or lunch-free carry zero covers in baseCovers (Monday closed, Tuesday to Thursday dinner only).
 */
const menu: MenuItem[] = [
  // Drinks: cocktail, wine and beer prices read from the March 2026 drinks menu; soft drink is modelled.
  { id: "cocktail", name: "Cocktail", price: 10.95, priceVerified: true, course: "drink", veg: true, weight: 3, dinnerWeight: 4, lunchWeight: 1.4, aliases: ["cocktail"], hero: true },
  { id: "wine", name: "Glass of wine (175ml)", price: 7.45, priceVerified: true, course: "drink", veg: true, weight: 2.6, aliases: ["wine"] },
  { id: "lager", name: "Cobra", price: 6.45, priceVerified: true, course: "drink", veg: true, weight: 2.2, aliases: ["beer", "lager", "cobra"] },
  { id: "soft", name: "Soft drink", price: 3.5, priceVerified: false, course: "drink", veg: true, weight: 2, aliases: ["soft drink"] },
  // Starters
  { id: "papad", name: "Assorted papad & chutney", price: 6.45, priceVerified: true, course: "starter", veg: true, weight: 2, aliases: ["papad", "poppadom"] },
  { id: "veg-bhaji", name: "Vegetable bhaji", price: 6.95, priceVerified: true, course: "starter", veg: true, weight: 1.6, aliases: ["bhaji"] },
  { id: "veg-samosa", name: "Vegetable samosa", price: 7.95, priceVerified: true, course: "starter", veg: true, weight: 2, aliases: ["samosa"] },
  { id: "papdi-chaat", name: "Papdi chaat", price: 7.95, priceVerified: true, course: "starter", veg: true, weight: 2.2, aliases: ["chaat", "papdi"], hero: true },
  { id: "samosa-chaat", name: "Samosa chaat", price: 7.95, priceVerified: true, course: "starter", veg: true, weight: 2, aliases: ["chaat", "samosa chaat"] },
  { id: "chilli-chicken", name: "Chilli chicken", price: 9.95, priceVerified: true, course: "starter", veg: false, weight: 2.4, aliases: ["chilli chicken"] },
  { id: "paneer-chilli", name: "Paneer chilli", price: 8.95, priceVerified: true, course: "starter", veg: true, weight: 1.6, aliases: ["paneer chilli"] },
  { id: "chicken-wings", name: "Chicken wings", price: 8.95, priceVerified: true, course: "starter", veg: false, weight: 1.4, aliases: ["wings"] },
  { id: "fish-amritsari", name: "Fish Amritsari", price: 8.95, priceVerified: true, course: "starter", veg: false, weight: 1.5, aliases: ["fish", "amritsari"] },
  // Tandoor
  { id: "chicken-tikka", name: "Chicken tikka", price: 11.95, priceVerified: true, course: "starter", veg: false, weight: 2.6, aliases: ["tikka", "chicken tikka"] },
  { id: "murgh-malai", name: "Murgh malai", price: 11.95, priceVerified: true, course: "starter", veg: false, weight: 1.6, aliases: ["malai"] },
  { id: "seekh", name: "Lamb seekh kebab", price: 11.95, priceVerified: true, course: "starter", veg: false, weight: 1.7, aliases: ["seekh", "kebab"] },
  { id: "lamb-chops", name: "Lamb chops", price: 16.45, priceVerified: true, course: "starter", veg: false, weight: 2, dinnerWeight: 2.6, lunchWeight: 1, aliases: ["lamb chops"], hero: true },
  { id: "tiger-prawns", name: "Chargrilled tandoori tiger prawns", price: 16.45, priceVerified: true, course: "starter", veg: false, weight: 1.8, aliases: ["prawns", "tiger prawns"], hero: true },
  { id: "salmon-tikka", name: "Salmon tikka", price: 15.45, priceVerified: true, course: "starter", veg: false, weight: 1.2, aliases: ["salmon"] },
  { id: "broccoli", name: "Tandoori broccoli", price: 9.95, priceVerified: true, course: "starter", veg: true, weight: 1.2, aliases: ["broccoli"] },
  { id: "paneer-tikka", name: "Paneer tikka", price: 10.95, priceVerified: true, course: "starter", veg: true, weight: 1.4, aliases: ["paneer tikka"] },
  // Mains
  { id: "butter-chicken", name: "Butter chicken", price: 16.45, priceVerified: true, course: "main", veg: false, weight: 4, comfort: 0.3, aliases: ["butter chicken"], hero: true },
  { id: "ctm", name: "Chicken tikka masala", price: 16.45, priceVerified: true, course: "main", veg: false, weight: 3.4, comfort: 0.3, aliases: ["tikka masala"] },
  { id: "jalfrezi", name: "Chicken jalfrezi", price: 16.45, priceVerified: true, course: "main", veg: false, weight: 1.8, aliases: ["jalfrezi"] },
  { id: "rogan-josh", name: "Lamb rogan josh", price: 17.45, priceVerified: true, course: "main", veg: false, weight: 2.6, comfort: 0.2, aliases: ["rogan josh"] },
  { id: "lamb-shank", name: "Lamb shank", price: 25.95, priceVerified: true, course: "main", veg: false, weight: 1.6, dinnerWeight: 2.2, lunchWeight: 0.8, aliases: ["lamb shank"], hero: true },
  { id: "andhra-salmon", name: "Andhra salmon curry", price: 19.45, priceVerified: true, course: "main", veg: false, weight: 1.3, aliases: ["salmon curry"] },
  { id: "goan-prawns", name: "Goan prawns", price: 19.95, priceVerified: true, course: "main", veg: false, weight: 1.4, aliases: ["goan prawns"] },
  { id: "saag-paneer", name: "Saag paneer", price: 13.95, priceVerified: true, course: "main", veg: true, weight: 2, comfort: 0.2, aliases: ["saag paneer"] },
  { id: "paneer-makhni", name: "Paneer makhni", price: 13.95, priceVerified: true, course: "main", veg: true, weight: 1.8, aliases: ["paneer makhni"] },
  { id: "aloo-gobi", name: "Aloo gobi", price: 13.45, priceVerified: true, course: "main", veg: true, weight: 1.2, aliases: ["aloo gobi"] },
  { id: "daal", name: "Daal tadka", price: 11.95, priceVerified: true, course: "main", veg: true, weight: 1.6, aliases: ["daal", "dal"] },
  { id: "chicken-biryani", name: "Chicken dum biryani", price: 23.95, priceVerified: true, course: "main", veg: false, weight: 2.2, aliases: ["biryani"] },
  { id: "lamb-biryani", name: "Lamb biryani", price: 24.95, priceVerified: true, course: "main", veg: false, weight: 1.4, aliases: ["lamb biryani"] },
  { id: "veg-biryani", name: "Vegetable biryani", price: 19.95, priceVerified: true, course: "main", veg: true, weight: 1, aliases: ["veg biryani"] },
  // Sides and breads
  { id: "basmati", name: "Basmati rice", price: 3.95, priceVerified: true, course: "side", veg: true, weight: 3, aliases: ["rice"] },
  { id: "pilau", name: "Pilau rice", price: 4.95, priceVerified: true, course: "side", veg: true, weight: 2.4, aliases: ["pilau"] },
  { id: "bread-basket", name: "Artisan bread basket", price: 12.95, priceVerified: true, course: "side", veg: true, weight: 2.2, aliases: ["naan", "bread basket"] },
  { id: "chilli-cheese-naan", name: "Chilli & cheese naan", price: 5.95, priceVerified: true, course: "side", veg: true, weight: 1.2, aliases: ["cheese naan"] },
  { id: "raita", name: "Raita", price: 3.5, priceVerified: true, course: "side", veg: true, weight: 1.6, aliases: ["raita"] },
  { id: "masala-fries", name: "Masala fries", price: 4.45, priceVerified: true, course: "side", veg: true, weight: 1, aliases: ["fries"] },
];

export const brothers: Workspace = {
  id: "brothers-pontyclun",
  name: "Brothers Contemporary Indian Cuisine",
  owner: "The Brothers team",
  type: "Contemporary Indian restaurant",
  cuisine: "Modern Indian, tandoor and Welsh ingredients",
  town: "Pontyclun",
  street: "Pontyclun",
  address: "Pontyclun, South Wales",
  phone: "01443 846888",
  email: "",
  tags: ["indian", "contemporary", "tandoor", "seafood", "special-occasion", "groups", "pontyclun", "local", "cocktails"],
  hours: {
    lunch: { open: 12 * 60, close: 15 * 60 },
    dinner: { open: 17 * 60, close: 22 * 60 },
  },
  closedDates: ["2026-12-25", "2026-12-26", "2027-12-25", "2027-12-26"],
  tables: 14,
  seats: 48,
  rota: {
    0: { floor: 3, kitchen: 3 },
    1: { floor: 0, kitchen: 0 },
    2: { floor: 2, kitchen: 3 },
    3: { floor: 2, kitchen: 3 },
    4: { floor: 3, kitchen: 3 },
    5: { floor: 4, kitchen: 4 },
    6: { floor: 5, kitchen: 4 },
  },
  coversPerFloorHour: 4,
  baseCovers: {
    0: { lunch: 26, dinner: 16 },
    1: { lunch: 0, dinner: 0 },
    2: { lunch: 0, dinner: 10 },
    3: { lunch: 0, dinner: 12 },
    4: { lunch: 0, dinner: 16 },
    5: { lunch: 10, dinner: 36 },
    6: { lunch: 20, dinner: 46 },
  },
  baseDelivery: { 0: 4, 1: 0, 2: 3, 3: 4, 4: 6, 5: 8, 6: 8 },
  platformMix: { deliveroo: 0.34, uber: 0.33, justeat: 0.33 },
  weeklyGrowth: 0.004,
  menu,
  calendar: [
    { id: "xmas-season-2026", name: "Christmas party season", kind: "season", date: "2026-12-01", end: "2026-12-23", tags: ["groups"], lift: 0.18, service: "dinner", source: "Seasonal pattern", angle: "Work and family groups book in December", hero: "lamb-shank" },
    { id: "christmas-2026", name: "Christmas", kind: "festival", date: "2026-12-25", tags: ["local", "groups"], lift: 0, service: "day", closed: true, source: "Public holiday calendar", angle: "Party tables before the 23rd; closed 25–26 December" },
    { id: "nye-2026", name: "New Year’s Eve", kind: "festival", date: "2026-12-31", tags: ["groups", "special-occasion"], lift: 0.34, service: "dinner", source: "Public holiday calendar", angle: "A tasting table before midnight", hero: "tiger-prawns" },
    { id: "burns-2027", name: "Burns Night", kind: "festival", date: "2027-01-25", tags: ["scottish", "whisky", "pub"], lift: 0.2, service: "dinner", source: "Public calendar" },
    { id: "valentines-2027", name: "Valentine’s Day", kind: "festival", date: "2027-02-14", tags: ["special-occasion", "local"], lift: 0.3, service: "dinner", source: "Public calendar", angle: "Dinner for two with the tandoor platter", hero: "tiger-prawns" },
    { id: "stdavid-2027", name: "St David’s Day", kind: "festival", date: "2027-03-01", tags: ["local", "pontyclun"], lift: 0.06, service: "day", source: "Public calendar", angle: "Welsh ingredients from the tandoor" },
    { id: "mothers-2027", name: "Mother’s Day (UK)", kind: "festival", date: "2027-03-07", tags: ["local", "groups", "special-occasion"], lift: 0.3, service: "lunch", source: "Public calendar", angle: "A Sunday lunch table for the family", hero: "butter-chicken" },
    { id: "eid-fitr-2027", name: "Eid al-Fitr", kind: "festival", date: "2027-03-10", tags: ["south-asian", "groups"], lift: 0.2, service: "dinner", source: "Expected date, subject to moon sighting", provisional: true, angle: "Family tables after Ramadan", hero: "chicken-biryani" },
    { id: "holi-2027", name: "Holi", kind: "festival", date: "2027-03-22", tags: ["indian", "vegetarian"], lift: 0.14, service: "dinner", source: "Public festival calendar", angle: "A colourful vegetarian table", hero: "papdi-chaat" },
    { id: "easter-2027", name: "Easter Sunday", kind: "festival", date: "2027-03-28", tags: ["local", "groups"], lift: 0.12, service: "lunch", source: "Public holiday calendar" },
    { id: "vaisakhi-2027", name: "Vaisakhi", kind: "festival", date: "2027-04-14", tags: ["north-indian", "south-asian", "indian"], lift: 0.15, service: "dinner", source: "Public festival calendar", angle: "Harvest festival, a North Indian table", hero: "butter-chicken" },
    { id: "eid-adha-2027", name: "Eid al-Adha", kind: "festival", date: "2027-05-16", tags: ["south-asian", "groups"], lift: 0.18, service: "dinner", source: "Expected date, subject to moon sighting", provisional: true, hero: "lamb-biryani" },
    { id: "diwali-2027", name: "Diwali", kind: "festival", date: "2027-10-29", tags: ["indian"], lift: 0.3, service: "dinner", source: "Public festival calendar, provisional", provisional: true, angle: "The festival of lights, a celebration table", hero: "lamb-shank" },
  ],
  campaignHistory: [
    { id: "seed-done", title: "Midweek tandoor tasting", date: "2026-11-11", service: "dinner", extraCovers: 6, item: "chicken-tikka", audience: "Past guests within 8 miles" },
    { id: "seed-sunday", title: "Sunday lunch table", date: "2026-11-15", service: "lunch", extraCovers: 9, item: "butter-chicken", audience: "Past guests within 8 miles" },
  ],
  reviewBaseline: { count: 201, average: 4.9, before: "2026-08-24" },
  presence: [
    { id: "gbp-description", label: "Profile answers the question", level: 0.6, failNote: "Named, not ordered", passNote: "Ranked from the profile" },
    { id: "faq", label: "FAQ an engine can quote", level: 0.3, failNote: "Nothing to quote", passNote: "Quoted from the FAQ" },
    { id: "menu-schema", label: "Menu marked up", level: 0.2, failNote: "Menu only in PDFs", passNote: "Menu items cited" },
    { id: "hours-consistent", label: "One set of hours", level: 0.5, failNote: "Hours clash", passNote: "Shown as open" },
    { id: "nap", label: "Same phone everywhere", level: 1, failNote: "Phone differs", passNote: "Listing matches" },
    { id: "local-lists", label: "Cited on South Wales lists", level: 0.6, failNote: "Not on local lists", passNote: "Cited from a local list" },
    { id: "title-locality", label: "Titles name the town", level: 0.5, failNote: "Title misses the town", passNote: "Title matches the town" },
    { id: "page-speed", label: "Menu page loads fast", level: 0.6, failNote: "Slow menu page", passNote: "Fast menu page" },
    { id: "backlinks", label: "A food blog links in", level: 0.4, failNote: "No local link", passNote: "Local link" },
    { id: "gbp-category", label: "Primary category", level: 1, failNote: "Category unclear", passNote: "Category matches" },
  ],
  lastGooglePost: "2026-10-20",
  lastPhotoUpload: "2026-09-30",
  signature: ["tandoor", "lamb shank", "tiger prawns"],
  locality: ["pontyclun", "hawthorn", "llantrisant", "pontypridd"],
  queries: {
    ai: [
      { question: "best indian restaurant near Pontyclun", checks: ["gbp-description", "review-language", "nap", "menu-schema"] },
      { question: "special occasion dinner South Wales", checks: ["faq", "menu-schema", "local-lists", "review-language"] },
      { question: "indian restaurant open Sunday lunch", checks: ["hours-consistent", "faq", "gbp-description"] },
    ],
    seo: [
      { question: "indian restaurant pontyclun", checks: ["gbp-category", "nap", "title-locality", "review-velocity"] },
      { question: "tandoori restaurant near me", checks: ["review-language", "gbp-photos", "gbp-post", "title-locality"] },
      { question: "curry near me open now", checks: ["hours-consistent", "gbp-post", "page-speed"] },
    ],
  },
  audiences: {
    groups: "Groups of 4–8 within 8 miles",
    delivery: "Past Click & Collect guests within 5 miles",
    local: "Pontyclun and Hawthorn, within 5 miles",
    past: "Past guests within 8 miles",
    staff: "The floor team",
  },
  firstNames: [
    "Megan", "Arun", "Lewis", "Priya", "Rhys", "Sana", "Tom", "Aisha", "Gethin", "Nisha", "Owen", "Hannah",
    "Ravi", "Ffion", "Imran", "Chloe", "Dev", "Seren", "Kiran", "Ben", "Zara", "Iolo", "Meera", "Sam",
  ],
  voice: {
    drink: "a Cobra",
    wetLine: "Butter chicken, a vegetable curry and a Cobra",
    wetShort: "butter chicken and a Cobra",
    praise: "the tandoor or the welcome",
    praiseTitle: "Guests name the tandoor",
    praiseLines: [
      "Guests come back for the tandoor and the prawns. Both are on this week, {street}.",
      "“Came back for the tandoor.” We hear it a lot. Come and find out why.",
      "Tandoor. Tiger prawns. {street}.",
    ],
    house: "contemporary Indian",
    photoWord: "tandoor",
    awayWho: "regulars",
  },
};
