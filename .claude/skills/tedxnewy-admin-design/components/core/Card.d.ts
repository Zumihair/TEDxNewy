import type { ReactNode, CSSProperties } from "react";

export interface CardProps {
  children?: ReactNode;
  /** Adds the standard 20px body padding. Leave off when the card holds a divided row list. */
  padded?: boolean;
  className?: string;
  style?: CSSProperties;
}

/** White card on the cream page: hairline ink border, 12px radius, warm shadow. */
export declare function Card(props: CardProps): JSX.Element;
