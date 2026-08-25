export interface ParticipateCardProps {
  href?: string;
  title: string;
  /** One or two plain-spoken sentences. */
  body?: string;
  image?: string;
  /** Fallback gradient behind the photo. */
  gradient?: string;
  cta?: string;
  /** "4/5" in the Participate row, "4/3" in the nav mega-menu cards. */
  ratio?: string;
}

export declare function ParticipateCard(props: ParticipateCardProps): JSX.Element;
