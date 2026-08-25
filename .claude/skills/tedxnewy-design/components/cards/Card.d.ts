export interface CardProps {
  children: React.ReactNode;
  /** Site cards run 20-28px of padding. */
  padding?: number | string;
  /** Keep the hover lift. Turn it off for a card that isn't a link. */
  hoverable?: boolean;
  as?: "div" | "a" | "li" | "article";
  href?: string;
  style?: React.CSSProperties;
}

export declare function Card(props: CardProps): JSX.Element;
