export interface NavItem {
  label: string;
  /** null renders a non-link row with a "Coming soon" pill. */
  href?: string | null;
  description?: string | null;
  imageUrl?: string | null;
  gradient?: string | null;
  ctaLabel?: string | null;
}

export interface NavGroup {
  key: string;
  label: string;
  /** list = lede + divided link rows · cards = three photo cards. */
  style: "list" | "cards";
  kicker?: string | null;
  heading?: string | null;
  blurb?: string | null;
  items: NavItem[];
}

/**
 * TEDxNewy site header with mega-menu.
 * @startingPoint section="Navigation" subtitle="Site header with mega-menu panel" viewport="1280x420"
 */
export interface SiteHeaderProps {
  /** Ink lockup, for light bars. */
  logo: string;
  /** Reversed lockup, for the transparent bar over a dark hero. */
  logoLight: string;
  groups: NavGroup[];
  cta?: { label: string; href: string };
  /** True on the routes that open on a dark hero (/, /signal, flagship events). */
  darkHero?: boolean;
  /** Drive from scroll position: the bar lifts to opaque cream once past ~60px. */
  scrolled?: boolean;
}

export declare function SiteHeader(props: SiteHeaderProps): JSX.Element;
