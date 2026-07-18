/**
 * Static fallback for the public header navigation.
 *
 * getNavConfig() in lib/cms-content.ts reads the live cms_nav_groups /
 * cms_nav_items tables (plus announced events) and returns this constant if
 * anything goes wrong or the tables do not exist yet, so the header always
 * renders. It mirrors the hand-built menu that shipped before Phase 4, so the
 * site looks identical during the window before the migration is applied.
 */

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
        "Submissions close 15 August",
      ),
      listItem(
        "Youth Futures Lab",
        "/youth-futures-lab",
        "7 August · NUspace",
      ),
      listItem(
        "Flagship TEDxNewy 2026",
        null,
        "24 October · Conservatorium of Music",
        "Coming soon",
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
        "Talks",
        "/talks",
        "Watch every TEDxNewy talk",
        "/images/past-2025.jpg",
        "linear-gradient(135deg, #2a3a88 0%, #1f1f4a 50%, #050818 100%)",
        "Watch talks",
      ),
      cardItem(
        "Salons",
        "/salons",
        "Our intimate idea nights",
        "/images/salon-whatif.jpg",
        "linear-gradient(135deg, #1f4a5c 0%, #0c2430 60%, #050f15 100%)",
        "Explore salons",
      ),
      cardItem(
        "Speakers",
        "/speakers",
        "Past TEDxNewy voices",
        "/images/stage-benjie.jpg",
        "linear-gradient(135deg, #2a0604 0%, #8c0d05 50%, #b91404 100%)",
        "Meet the speakers",
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
        "Join the crew",
        "/images/stage-dialogue.jpg",
        "linear-gradient(135deg, #1f4a5c 0%, #0c2430 60%, #050f15 100%)",
        "Learn more",
      ),
      cardItem(
        "Partner with us",
        "/partner",
        "Support the season",
        "/images/youth-futures/yfl-brand.jpg",
        "linear-gradient(135deg, #2a0604 0%, #8c0d05 50%, #b91404 100%)",
        "Start a conversation",
      ),
      cardItem(
        "Nominate a speaker",
        "/speak",
        "Tell us who we're missing",
        "/images/stage-welcome.jpg",
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
