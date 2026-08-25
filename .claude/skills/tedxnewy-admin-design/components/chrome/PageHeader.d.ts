import type { ReactNode } from "react";

export type Section = "yellow" | "coast" | "red" | "green" | "grey";

/** The header at the top of every admin page, coloured by its section. */
export interface PageHeaderProps {
  /** yellow = Content, coast = Management, red = Community, green = Settings, grey = Overview/Forms. */
  section?: Section;
  /** Mono caps label above the title, with a section-coloured bar. */
  eyebrow?: string;
  title: string;
  description?: ReactNode;
  /** Renders a mono caps "Back" link above the title. */
  backHref?: string;
  /** Right-aligned page actions — usually one primary Button plus a Modal trigger. */
  actions?: ReactNode;
}

export declare function PageHeader(props: PageHeaderProps): JSX.Element;

export interface SectionLabelProps {
  section?: Section;
  children?: ReactNode;
}

/** Small sub-heading with a section-coloured dot. */
export declare function SectionLabel(props: SectionLabelProps): JSX.Element;
