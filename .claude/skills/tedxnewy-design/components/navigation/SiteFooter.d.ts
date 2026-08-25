export interface FooterColumn {
  title: string;
  items: { label: string; href: string }[];
}

export interface FooterSocial {
  label: string;
  href: string;
  /** Path to one of public/brand/social/*.png (white set for this dark footer). */
  icon: string;
}

export interface SiteFooterProps {
  /** Reversed lockup: public/brand/tedxnewy-white.png. */
  logo?: string;
  /** Big brand line. The site uses "Ideas change everything." */
  tagline?: string;
  /** Three columns: Explore / Participate / About. */
  columns: FooterColumn[];
  socials?: FooterSocial[];
  /** Approved Acknowledgment of Country wording. Required on the real site. */
  acknowledgment?: string;
  access?: string;
  /** Copyright line: legal name, ACN, "formerly TEDxCooksHill". */
  legal?: React.ReactNode;
  legalLinks?: { label: string; href: string }[];
}

export declare function SiteFooter(props: SiteFooterProps): JSX.Element;
