export type IconName =
  | "arrow-right" | "arrow-up-right" | "arrow-left"
  | "chevron-down" | "chevron-left" | "chevron-right"
  | "menu" | "x" | "play" | "mail" | "map-pin" | "calendar" | "image";

export interface IconProps {
  /** Glyph name from the Lucide set the site uses. */
  name: IconName;
  /** Pixel box. Site uses 14 (inline), 16 (buttons/CTAs), 18-20 (standalone). */
  size?: number;
  /** Lucide default is 2; the site uses 2.25 inside red circle CTAs. */
  strokeWidth?: number;
  color?: string;
  style?: React.CSSProperties;
}

export declare function Icon(props: IconProps): JSX.Element;
