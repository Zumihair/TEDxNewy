export interface EventRowProps {
  href?: string;
  image?: string;
  imageAlt?: string;
  imageGradient?: string;
  /** Uppercase eyebrow, e.g. "Salon" or "Signature". */
  label?: string;
  labelAccent?: "red" | "neutral";
  title: string;
  /** Date and venue line. */
  meta?: string;
  description?: string;
  linkLabel?: string;
}

export declare function EventRow(props: EventRowProps): JSX.Element;
