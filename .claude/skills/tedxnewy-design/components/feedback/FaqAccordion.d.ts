export interface FaqItem {
  q: string;
  a: React.ReactNode;
}

export interface FaqAccordionProps {
  faqs: FaqItem[];
  /** dark = white text on a dark section (the site's usual) · light = ink on cream. */
  tone?: "dark" | "light";
}

export declare function FaqAccordion(props: FaqAccordionProps): JSX.Element;
