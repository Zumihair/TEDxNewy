/**
 * The public header navigation, defined in code.
 *
 * This is the single source of truth for the header menus. To change a menu,
 * edit this file. getNavConfig() in lib/cms-content.ts returns this structure
 * as-is, with one exception: the "Upcoming" menu is filled from announced
 * events (status = announced + show_in_nav) so publishing an event in
 * /admin/events keeps the header in sync. If there are no such events (or
 * Supabase is unreachable), the static Upcoming items below are used instead.
 */

import { SIGNAL_LIVE } from "./feature-flags";

export type NavItemConfig = {
  label: string;
  href: string | null;
  description: string | null;
  badge: string | null;
  imageUrl: string | null;
  gradient: string | null;
  ctaLabel: string | null;
};

export type NavGroupConfig = {
  key: string;
  label: string;
  style: "list" | "cards";
  kicker: string | null;
  heading: string | null;
  blurb: string | null;
  items: NavItemConfig[];
};

export type NavConfig = NavGroupConfig[];

/** Build a list style row with the common optional fields defaulted. */
function listItem(
  label: string,
  href: string | null,
  description: string | null,
  badge: string | null = null,
): NavItemConfig {
  return {
    label,
    href,
    description,
    badge,
    imageUrl: null,
    gradient: null,
    ctaLabel: null,
  };
}

/** Build a card style item with an image, gradient and CTA label. */
function cardItem(
  label: string,
  href: string,
  description: string,
  imageUrl: string,
  gradient: string,
  ctaLabel: string,
): NavItemConfig {
  return {
    label,
    href,
    description,
    badge: null,
    imageUrl,
    gradient,
    ctaLabel,
  };
}

export const NAV_FALLBACK: NavConfig = [
  {
    key: "upcoming",
    label: "Upcoming",
    style: "list",
    kicker: "On the horizon",
    heading: "What's coming up",
    blurb: "The events we're building toward across the season.",
    items: [
      listItem(
        "Student Speaker Competition",
        "/student-speaker-competition",
        "Submissions close 6 September",
      ),
      // Signal's page isn't linked yet — show it as an unclickable "Coming
      // soon" row (href: null) until SIGNAL_LIVE, then it links to /signal.
      listItem(
        "Signal",
        SIGNAL_LIVE ? "/signal" : null,
        "24 October · Conservatorium of Music",
      ),
    ],
  },
  {
    key: "past",
    label: "Past Events",
    style: "cards",
    kicker: null,
    heading: null,
    blurb: null,
    items: [
      cardItem(
        "Signature",
        "/signature",
        "Our flagship main stage, year on year",
        "/images/nav-signature.webp",
        "linear-gradient(135deg, #2a0604 0%, #8c0d05 50%, #b91404 100%)",
        "Explore Signature",
      ),
      cardItem(
        "Salons",
        "/salons",
        "Our intimate idea nights",
        // Reuses a photo already loaded on /newcastle-2050-salon (rather
        // than the otherwise-unused salon-whatif.jpg) so this card's image
        // is far more likely to already be warm in the visitor's cache
        // instead of a cold fetch the moment the menu opens.
        "/images/salon-2050/community-event.webp",
        "linear-gradient(135deg, #1f4a5c 0%, #0c2430 60%, #050f15 100%)",
        "Explore salons",
      ),
      cardItem(
        "All Talks",
        "/talks",
        "Watch every TEDxNewy talk",
        // stage-benjie.jpg was an unoptimised ~450KB JPG; this is a properly
        // sized/compressed WebP, same reasoning as the Salons swap above.
        "/images/nav-all-talks.webp",
        "linear-gradient(135deg, #2a3a88 0%, #1f1f4a 50%, #050818 100%)",
        "Watch talks",
      ),
    ],
  },
  {
    key: "participate",
    label: "Participate",
    style: "cards",
    kicker: null,
    heading: null,
    blurb: null,
    items: [
      cardItem(
        "Volunteer with us",
        "/volunteer",
        "Be part of the season",
        "/images/stage-dialogue.jpg",
        "linear-gradient(135deg, #1f4a5c 0%, #0c2430 60%, #050f15 100%)",
        "Learn more",
      ),
      cardItem(
        "Partner with us",
        "/partner",
        "Back the season",
        "/images/participate/partners.webp",
        "linear-gradient(135deg, #2a0604 0%, #8c0d05 50%, #b91404 100%)",
        "Start a conversation",
      ),
      cardItem(
        "Nominate a speaker",
        "/speak",
        "Tell us who we're missing",
        "/images/stage-benjie.jpg",
        "linear-gradient(135deg, #2a3a88 0%, #1f1f4a 50%, #050818 100%)",
        "Learn more",
      ),
    ],
  },
  {
    key: "about",
    label: "About",
    style: "list",
    kicker: "About TEDxNewy",
    heading: "Who we are",
    blurb: "What we stand for and the people behind the season.",
    items: [
      listItem("Mission", "/mission", "What TEDxNewy stands for"),
      listItem("Sponsors", "/sponsors", "The partners behind the season"),
      listItem("Team", "/team", "The volunteer crew"),
    ],
  },
];
