export interface CircleArrowLinkProps {
  href?: string;
  children: React.ReactNode;
  /** sm 36px · md 40px · lg 48px circle. */
  size?: "sm" | "md" | "lg";
  /** Label colour. White on dark surfaces, var(--ink) on cream. */
  color?: string;
  style?: React.CSSProperties;
}

export declare function CircleArrowLink(props: CircleArrowLinkProps): JSX.Element;
