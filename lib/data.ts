export type Speaker = {
  slug: string;
  name: string;
  title: string;
  talk: string;
  blurb: string;
  accent: "red" | "amber" | "coast" | "harbor";
  year: number;
  image?: string;
};

export type Talk = {
  id: string;
  speaker: string;
  title: string;
  /** Event year — drives the year filter on /watch and labelling. */
  year: number;
  /** Event name — "Reframe" for 2025, "Beyond Boundaries" for 2024. */
  event: "Reframe" | "Beyond Boundaries";
  youtubeId: string;
  /** One-line description (optional). */
  blurb?: string;
  /** Optional slug if there's a matching /speakers/[slug] page. */
  speakerSlug?: string;
};

export type Sponsor = {
  name: string;
  tier: "Presenting" | "Platinum" | "Gold" | "Community";
  blurb?: string;
};

export type Salon = {
  id: string;
  title: string;
  tagline: string;
  date: string;
  shortDate: string;
  venue: string;
  status: "Upcoming" | "Sold out" | "Past";
  accent: "coast" | "amber" | "red";
  image?: string;
};

export const ORG = {
  name: "TEDxNewy",
  legalName: "Newcastle Ideas Network Limited",
  acn: "694 346 319",
  email: "hello@tedxnewy.com.au",
  url: "tedxnewy.com.au",
  formerly: "Formerly TEDxCooksHill",
  handles: {
    instagram: "@tedxnewy",
    tiktok: "@tedxnewy",
    linkedin: "@tedxnewy",
    facebook: "@tedxnewy",
  },
  licence:
    "This independent TEDx event is operated under a free licence from TED.",
  acknowledgment:
    "TEDxNewy is staged on the land of the Awabakal and Worimi people. We pay our respects to Elders past, present and emerging, and acknowledge their continuing connection to land, waters and culture. Sovereignty was never ceded.",
} as const;

export const SEASON = {
  name: "TEDxNewy 2026",
  tagline: "Ideas that refuse to sit still.",
  city: "Newcastle, Australia",
  country: "Awabakal & Worimi Country",
  description: "A four-event season across 2026. One announced, three to come.",
} as const;

export type SeasonEvent = {
  id: string;
  kind: "Salon" | "Main stage" | "Special";
  status: "Announced" | "Coming soon" | "Past";
  title: string;
  shortDate?: string;
  longDate?: string;
  venue?: string;
  blurb?: string;
  href?: string;
  external?: boolean;
  image?: string;
};

/**
 * The 2026 season — one Salon confirmed, three further events TBA.
 * Source for the salon: https://tedxnewy.salon
 */
export const season2026: SeasonEvent[] = [
  {
    id: "salon-2050",
    kind: "Salon",
    status: "Past",
    title: "Newcastle 2050: What If?",
    shortDate: "30 APR",
    longDate: "Thursday 30 April 2026 · 6pm",
    venue: "Q Building · Honeysuckle",
    blurb:
      "An evening of bold questions, creative thinking and new perspectives. Three themed rooms exploring how we move, live and experience Newcastle in 2050 — through live discussion, interactive screens and hands-on activities.",
    href: "/salons",
    image: "/images/salon-whatif.jpg",
  },
  {
    id: "tba-2",
    kind: "Special",
    status: "Coming soon",
    title: "Event two",
    blurb: "The second of four 2026 events — to be announced.",
  },
  {
    id: "tba-3",
    kind: "Special",
    status: "Coming soon",
    title: "Event three",
    blurb: "The third of four 2026 events — to be announced.",
  },
  {
    id: "tba-4",
    kind: "Main stage",
    status: "Coming soon",
    title: "Event four",
    blurb: "The fourth of four 2026 events — to be announced.",
  },
];

/**
 * 2025 speaker lineup — TEDxCooksHill: Reframe (Conservatorium of Music).
 * Talk titles, taglines and bios pending — drop them in by editing this array.
 */
export const speakers: Speaker[] = [
  {
    slug: "brittney-saunders",
    name: "Brittney Saunders",
    title: "Founder · Fayt the Label · Creator",
    talk: "Talk title to be added",
    blurb: "Talk description to be added.",
    accent: "red",
    year: 2025,
    image: "/images/speakers/brittney-saunders.png",
  },
  {
    slug: "cameron-lee",
    name: "Cameron Lee",
    title: "Title to be added",
    talk: "Talk title to be added",
    blurb: "Talk description to be added.",
    accent: "amber",
    year: 2025,
    image: "/images/speakers/cameron-lee.png",
  },
  {
    slug: "charanya-ramakrishnan",
    name: "Charanya Ramakrishnan",
    title: "Title to be added",
    talk: "Talk title to be added",
    blurb: "Talk description to be added.",
    accent: "coast",
    year: 2025,
    image: "/images/speakers/charanya-ramakrishnan.png",
  },
  {
    slug: "daniel-beard",
    name: "Dr Daniel Beard",
    title: "Title to be added",
    talk: "Talk title to be added",
    blurb: "Talk description to be added.",
    accent: "harbor",
    year: 2025,
    image: "/images/speakers/daniel-beard.png",
  },
  {
    slug: "ennia-jones",
    name: "Ennia Jones",
    title: "Title to be added",
    talk: "Talk title to be added",
    blurb: "Talk description to be added.",
    accent: "red",
    year: 2025,
    image: "/images/speakers/ennia-jones.png",
  },
  {
    slug: "frank-greeff",
    name: "Frank Greeff",
    title: "Tech founder · New father",
    talk: "Talk title to be added",
    blurb: "Talk description to be added.",
    accent: "coast",
    year: 2025,
    image: "/images/speakers/frank-greeff.png",
  },
  {
    slug: "harry-garside",
    name: "Harry Garside",
    title: "Olympic boxer · Author",
    talk: "Talk title to be added",
    blurb: "Talk description to be added.",
    accent: "amber",
    year: 2025,
    image: "/images/speakers/harry-garside.png",
  },
  {
    slug: "jack-henderson",
    name: "Jack Henderson",
    title: "Title to be added",
    talk: "Talk title to be added",
    blurb: "Talk description to be added.",
    accent: "red",
    year: 2025,
    image: "/images/speakers/jack-henderson.png",
  },
  {
    slug: "kate-cashman",
    name: "Dr Kate Cashman",
    title: "Title to be added",
    talk: "Talk title to be added",
    blurb: "Talk description to be added.",
    accent: "harbor",
    year: 2025,
    image: "/images/speakers/kate-cashman.png",
  },
  {
    slug: "tristan-mclindon",
    name: "Tristan McLindon",
    title: "Title to be added",
    talk: "Talk title to be added",
    blurb: "Talk description to be added.",
    accent: "amber",
    year: 2025,
    image: "/images/speakers/tristan-mclindon.png",
  },
];

/**
 * Talk archive — TEDxCooksHill talks on YouTube.
 * 2024 Beyond Boundaries: all 11 talks live.
 * 2025 Reframe: 6 of 10 live; remaining four roll out through 2026.
 */
export const talks: Talk[] = [
  // ---------- 2025 — Reframe ----------
  {
    id: "brittney-saunders-power-in-quitting",
    speaker: "Brittney Saunders",
    speakerSlug: "brittney-saunders",
    title: "The power in quitting",
    year: 2025,
    event: "Reframe",
    youtubeId: "OBZEoBhAZnk",
    blurb:
      "Reframing quitting as exploration — and why walking away from one thing can be the bravest way to find the next.",
  },
  {
    id: "harry-garside-training-in-discomfort",
    speaker: "Harry Garside",
    speakerSlug: "harry-garside",
    title: "Training in discomfort",
    year: 2025,
    event: "Reframe",
    youtubeId: "GV473JK59zY",
    blurb:
      "An Olympic boxer on building the muscle of discomfort — and what happens when growth becomes a practice, not an accident.",
  },
  {
    id: "frank-greeff-raising-humans",
    speaker: "Frank Greeff",
    speakerSlug: "frank-greeff",
    title: "Raising humans in an AI world",
    year: 2025,
    event: "Reframe",
    youtubeId: "FFZa2HTKW4I",
    blurb:
      "A tech founder and new father on parenting at the intersection of childhood and accelerating intelligence.",
  },
  {
    id: "tristan-mclindon-distraction-illusion",
    speaker: "Tristan McLindon",
    speakerSlug: "tristan-mclindon",
    title: "The distraction illusion",
    year: 2025,
    event: "Reframe",
    youtubeId: "6IdR52JWM9c",
    blurb:
      "A magician on attention — our most valuable and limited resource — and the quiet ways it's being hijacked and sold.",
  },
  {
    id: "ennia-jones-change-our-minds-about-swimming",
    speaker: "Ennia Jones",
    speakerSlug: "ennia-jones",
    title: "It's time to change our minds about swimming",
    year: 2025,
    event: "Reframe",
    youtubeId: "zyDia2jzpvg",
    blurb:
      "On reframing who belongs in the water — and how trauma-informed, community-led swim programs build belonging in inclusive spaces.",
  },
  {
    id: "daniel-beard-brain-plumbing",
    speaker: "Dr Daniel Beard",
    speakerSlug: "daniel-beard",
    title: "How the brain's hidden plumbing could transform stroke treatment",
    year: 2025,
    event: "Reframe",
    youtubeId: "aG_r2j5Mkwo",
    blurb:
      "A neurovascular researcher on the unseen flow inside our skulls — and a new therapy that could save brain tissue during stroke.",
  },

  // ---------- 2024 — Beyond Boundaries ----------
  {
    id: "magdalena-hoeller-second-language",
    speaker: "Magdalena Hoeller",
    title: "Why love is harder in a second language",
    year: 2024,
    event: "Beyond Boundaries",
    youtubeId: "Ijdva7j6Q9E",
    blurb:
      "A linguist on what happens to intimacy, identity and \"I love you\" when you say it in a language you didn't grow up in.",
  },
  {
    id: "dan-ballard-validation-to-value",
    speaker: "Dan Ballard",
    title: "Validation to value: the paradox of being likeable",
    year: 2024,
    event: "Beyond Boundaries",
    youtubeId: "z8uXhyHwMvw",
    blurb:
      "A communication mentor on the tradeoff between being liked and being useful — and how to lead from the second one.",
  },
  {
    id: "trudi-boatwright-play",
    speaker: "Trudi Boatwright",
    title: "Why play is for everyone and not just kids",
    year: 2024,
    event: "Beyond Boundaries",
    youtubeId: "178nWmbgjmM",
    blurb:
      "An organisational play designer on how grown teams solve hard problems faster when they remember how to play.",
  },
  {
    id: "stefanie-costi-victim-mentality",
    speaker: "Stefanie Costi",
    title: "Do you have a victim mentality at work?",
    year: 2024,
    event: "Beyond Boundaries",
    youtubeId: "XwWfEjvWG48",
    blurb:
      "An anti-bullying lawyer on the line between being wronged and staying stuck — and a route through.",
  },
  {
    id: "dave-nixon-intergenerational-health",
    speaker: "Dave Nixon",
    title: "Habits for intergenerational health",
    year: 2024,
    event: "Beyond Boundaries",
    youtubeId: "ZvWnghrESo0",
    blurb:
      "A four-step method for building health and performance that lasts beyond one generation.",
  },
  {
    id: "david-sivyer-circular-food",
    speaker: "David Sivyer",
    title: "A circular economy approach to food waste",
    year: 2024,
    event: "Beyond Boundaries",
    youtubeId: "Qe_JCwlGZ54",
    blurb:
      "On turning the food we throw out into the food we grow next — urban farms, black soldier fly larvae, and a different shape of waste.",
  },
  {
    id: "mariam-mohammed-cycles-of-violence",
    speaker: "Mariam Mohammed",
    title: "How to break cycles of violence",
    year: 2024,
    event: "Beyond Boundaries",
    youtubeId: "jAw-mr2fCuE",
    blurb:
      "An entrepreneur and advocate on why healthy, thriving adults don't choose violence — and how we get more of them.",
  },
  {
    id: "craig-smith-ai-neurodiverse",
    speaker: "Craig Smith",
    title: "Unlocking potential: AI for neurodiverse minds",
    year: 2024,
    event: "Beyond Boundaries",
    youtubeId: "WCqCMUAmpuc",
    blurb:
      "An autism education specialist on AI as a cognitive sidekick — and what schools could be if every learner had one.",
  },
  {
    id: "declan-edwards-how-to-be-happy",
    speaker: "Declan Edwards",
    title: "How to be happy: 3 common misconceptions and their solutions",
    year: 2024,
    event: "Beyond Boundaries",
    youtubeId: "5p3g6jNEmOg",
    blurb:
      "A happiness researcher on what we keep getting wrong about feeling good — and three simple corrections.",
  },
  {
    id: "tim-stewart-public-health",
    speaker: "Dr Tim Stewart",
    title: "A unique approach to the public health crisis",
    year: 2024,
    event: "Beyond Boundaries",
    youtubeId: "8pK7bLT03xA",
    blurb:
      "An emergency physician on why so many ED visits don't need to be ED visits — and a new model in between GP and hospital.",
  },
  {
    id: "heston-russell-veterans-purpose",
    speaker: "Heston Russell",
    title: "Helping returning veterans rediscover their purpose",
    year: 2024,
    event: "Beyond Boundaries",
    youtubeId: "E58tW0tKeVo",
    blurb:
      "A former Special Forces commando on what happens to identity after service — and why purpose is the work that follows.",
  },
];

export const sponsors: Sponsor[] = [
  {
    name: "University of Newcastle",
    tier: "Presenting",
    blurb:
      "Our longest-standing partner. Research, venue and teaching support — and the reason half our talks get proper peer review.",
  },
  {
    name: "Henderson",
    tier: "Platinum",
    blurb:
      "Civic and cultural partner backing the main stage and speaker development.",
  },
  {
    name: "Frekl",
    tier: "Platinum",
    blurb: "Digital product partner powering ticketing and waitlist.",
  },
  {
    name: "Newy Digital",
    tier: "Gold",
    blurb: "Design and web partner.",
  },
  { name: "NBN News", tier: "Gold" },
  { name: "Civic Theatre", tier: "Gold" },
  { name: "City of Newcastle", tier: "Gold" },
  { name: "Renew Newcastle", tier: "Community" },
  { name: "Hunter Writers Centre", tier: "Community" },
  { name: "Awabakal Ltd", tier: "Community" },
  { name: "HMRI", tier: "Community" },
  { name: "Hunter TAFE", tier: "Community" },
  { name: "The Herald", tier: "Community" },
  { name: "Coal Loader Centre", tier: "Community" },
];

/**
 * The 2026 Salon series — only Newcastle 2050: What If? is announced.
 * Source: https://tedxnewy.salon
 */
export const salons: Salon[] = [
  {
    id: "salon-2050",
    title: "Newcastle 2050: What If?",
    tagline:
      "An evening of bold questions, creative thinking and new perspectives — three themed rooms imagining the future of our city.",
    date: "Thursday · 30 April 2026",
    shortDate: "30 APR 2026",
    venue: "Q Building · Honeysuckle · 6pm",
    status: "Past",
    accent: "coast",
    image: "/images/salon-whatif.jpg",
  },
];

export function speakerBySlug(slug: string) {
  return speakers.find((s) => s.slug === slug);
}
