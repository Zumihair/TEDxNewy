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
  speakerSlug: string;
  speaker: string;
  title: string;
  year: number;
  length: string;
  youtubeId?: string;
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
 * Talk archive — populated when TEDxCooksHill / TEDxNewy YouTube uploads land.
 * For now empty; the /watch page renders an editorial "coming soon" treatment.
 */
export const talks: Talk[] = [];

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
