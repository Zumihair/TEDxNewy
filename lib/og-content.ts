import type { OgCard } from "./og-card";

/**
 * The social card content for every page, in one place.
 *
 * Each `opengraph-image.tsx` is a four-line file that looks its page up here,
 * and `/dev/og` renders the whole catalogue for review, so this is the single
 * thing to edit when a card needs different words or a different photo.
 *
 * Writing notes:
 * - `title` is the ONLY prose on the card and is set very large. Four to six
 *   words. It is the card, not the page's `<title>`, which stays SEO-shaped
 *   ("Salons · TEDxNewy"). There is no description line by design: the
 *   platform prints the page's own `og:description` under the image, so a
 *   sentence inside the picture said the same thing twice.
 * - `image` is a repo path under `public/`. Event pages do not appear here:
 *   they pull their photo from the CMS at request time (see
 *   `app/events/[slug]/opengraph-image.tsx`).
 * - `alt` is real alt text, served as the image's alt attribute on socials.
 */

export type OgPage = OgCard & { alt: string };

/** Label shown in the `/dev/og` preview, purely for grouping the review. */
export type OgGroup =
  | "Main"
  | "Events"
  | "Recaps"
  | "Get involved"
  | "About"
  | "Utility";

export const OG_GROUPS: Record<string, OgGroup> = {
  "/": "Main",
  "/signal": "Main",
  "/talks": "Main",
  "/events": "Events",
  "/signature": "Events",
  "/salons": "Events",
  "/student-speaker-competition": "Events",
  "/youth-futures-lab": "Recaps",
  "/60-second-talk-night": "Recaps",
  "/newcastle-2050-salon": "Recaps",
  "/partner": "Get involved",
  "/sponsors": "Get involved",
  "/speak": "Get involved",
  "/volunteer": "Get involved",
  "/subscribe": "Get involved",
  "/contact": "Get involved",
  "/mission": "About",
  "/team": "About",
  "/press": "About",
  "/privacy": "Utility",
  "/terms": "Utility",
  "/code-of-conduct": "Utility",
  "/thanks": "Utility",
};

export const OG_PAGES: Record<string, OgPage> = {
  "/": {
    eyebrow: "Newcastle · Awabakal & Worimi Country",
    title: "Ideas that refuse to sit still.",
    image: "/images/stage-dialogue.jpg",
    crop: 0.5,
    alt: "TEDxNewy · Ideas that refuse to sit still.",
  },

  "/signal": {
    eyebrow: "Signature",
    title: "Signal.",
    image: "/images/stage-welcome.jpg",
    alt: "Signal · TEDxNewy's 2026 signature event, 24 October at the Conservatorium of Music",
  },

  "/talks": {
    eyebrow: "Watch",
    title: "Every talk, in one place.",
    image: "/images/nav-all-talks.webp",
    alt: "TEDxNewy talks archive",
  },

  "/events": {
    eyebrow: "What's on",
    title: "Every event, past and coming.",
    image: "/images/nav-signature.webp",
    alt: "TEDxNewy events",
  },

  "/signature": {
    eyebrow: "Signature Events",
    title: "Our main stage, once a year.",
    image: "/images/past-2025.jpg",
    alt: "TEDxNewy Signature events",
  },

  "/salons": {
    eyebrow: "Salons",
    title: "Smaller rooms, sharper conversations.",
    image: "/images/salon-2050/group-discussion.webp",
    alt: "TEDxNewy Salons",
  },

  "/student-speaker-competition": {
    eyebrow: "Entries open",
    title: "Got an idea worth sharing?",
    image: "/images/youth-futures/yfl-student-speaker.webp",
    alt: "TEDxNewy 2026 Student Speaker Competition",
  },

  "/youth-futures-lab": {
    eyebrow: "Salon",
    title: "Youth Futures Lab.",
    image: "/images/youth-futures/yfl-card.webp",
    alt: "Youth Futures Lab · TEDxNewy · NUspace, University of Newcastle",
  },

  "/60-second-talk-night": {
    eyebrow: "Salon",
    title: "One idea. One minute.",
    image: "/images/talk-night/audience.webp",
    alt: "TEDxNewy 60-Second Talk Night · The Base, Newcastle West",
  },

  "/newcastle-2050-salon": {
    eyebrow: "Salon",
    title: "Newcastle 2050: What If?",
    image: "/images/salon-2050/community-event.webp",
    alt: "TEDxNewy Salon · Newcastle 2050: What If? · Q Building, Honeysuckle",
  },

  "/partner": {
    eyebrow: "Partner with us",
    title: "Back the next thinking from the Hunter.",
    image: "/images/salon-2050/new-connections.webp",
    alt: "Partner with TEDxNewy",
  },

  "/sponsors": {
    eyebrow: "Our partners",
    title: "The people who make it possible.",
    image: "/images/salon-2050/partner-university.webp",
    alt: "TEDxNewy partners",
  },

  "/speak": {
    eyebrow: "Nominate a speaker",
    title: "Who are we missing?",
    image: "/images/talk-night/speaker-2.webp",
    alt: "Nominate a speaker for TEDxNewy",
  },

  "/volunteer": {
    eyebrow: "Join the crew",
    title: "Every one of us is a volunteer.",
    // A real TEDxNewy-era crew shot, which the old participate/volunteers.webp
    // was not: that one has REFRAME TEDxCooksHill shirts across it. Portrait
    // source, so the window is a thin band and the crop value matters.
    image: "/images/youth-futures/yfl-crew.webp",
    crop: 0.22,
    alt: "Volunteer with TEDxNewy",
  },

  "/subscribe": {
    eyebrow: "Subscribe",
    title: "Get the next idea first.",
    image: "/images/talk-night/connecting-2.webp",
    crop: 0.28,
    alt: "Subscribe to TEDxNewy",
  },

  "/contact": {
    eyebrow: "Contact",
    title: "Say hello.",
    image: "/images/talk-night/connecting-3.webp",
    crop: 0.3,
    alt: "Contact TEDxNewy",
  },

  "/mission": {
    eyebrow: "Our mission",
    title: "Ideas worth spreading, from here.",
    // Our old TEDxCooksHill wordmark is visible on the stage here. That is
    // deliberate on this page: its description names the former identity, so
    // the photo reads as history rather than a branding slip.
    image: "/images/past-2024.jpg",
    crop: 0.5,
    alt: "The TEDxNewy mission",
  },

  "/team": {
    eyebrow: "Our team",
    title: "Meet the crew.",
    image: "/images/participate/partners.webp",
    alt: "The TEDxNewy team",
  },

  "/press": {
    eyebrow: "Press & media",
    title: "Everything you need to write about us.",
    image: "/images/talk-night/sign.webp",
    alt: "TEDxNewy press and media",
  },

  // Utility pages. No photograph on purpose: the brand gradient keeps them
  // clearly secondary, and none of them is a page anyone shares to sell
  // something. They still get a proper card rather than the site default.
  "/privacy": {
    eyebrow: "Legal",
    title: "Privacy.",
    image: null,
    alt: "TEDxNewy privacy policy",
  },

  "/terms": {
    eyebrow: "Legal",
    title: "Terms of use.",
    image: null,
    alt: "TEDxNewy terms of use",
  },

  "/code-of-conduct": {
    eyebrow: "Code of conduct",
    title: "How we show up.",
    image: null,
    alt: "TEDxNewy code of conduct",
  },

  "/thanks": {
    eyebrow: "Thank you",
    title: "You're on the list.",
    image: null,
    alt: "Thanks from TEDxNewy",
  },
};

/** Fallback for any event page whose CMS row has no hero image of its own. */
export const EVENT_FALLBACK_IMAGE = "/images/stage-welcome.jpg";
