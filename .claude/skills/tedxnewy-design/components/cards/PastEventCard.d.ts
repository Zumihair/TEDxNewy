/**
 * Past-event card, for dark maroon sections.
 * @startingPoint section="Cards" subtitle="Photo-led past event card row" viewport="700x420"
 */
export interface PastEventCardProps {
  href?: string;
  /** Omit to get the deliberate PhotoPending placeholder. */
  image?: string;
  imageAlt?: string;
  /** Kind gradient behind the photo: var(--grad-flagship|--grad-salon|--grad-special). */
  imageGradient?: string;
  /** Date or eyebrow line, e.g. "30 April 2026". */
  date: string;
  title: string;
  /** Venue or event-line under the title. */
  subtitle?: string;
  cta?: string;
}

export declare function PastEventCard(props: PastEventCardProps): JSX.Element;
