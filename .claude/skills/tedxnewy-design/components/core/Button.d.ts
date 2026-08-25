/**
 * TEDxNewy pill button.
 * @startingPoint section="Core" subtitle="Pill buttons in every brand variant" viewport="700x220"
 */
export interface ButtonProps {
  /**
   * primary = ink fill (default light-surface action) · red = brand red fill ·
   * secondary = ink outline, fills ink on hover · cream = cream fill for dark
   * sections · white / outline-light / ghost-light = for dark heroes ·
   * dark / outline-dark = ink treatments on cream.
   */
  variant?: "primary" | "red" | "secondary" | "cream" | "white" | "dark" | "outline-dark" | "outline-light" | "ghost-light";
  /** Renders an <a> instead of a <button>. */
  href?: string;
  children: React.ReactNode;
  /** Trailing Lucide glyph, usually "arrow-right". */
  icon?: "arrow-right" | "arrow-up-right" | "play" | "mail";
  disabled?: boolean;
  onClick?: () => void;
  type?: "button" | "submit";
  className?: string;
  style?: React.CSSProperties;
}

export declare function Button(props: ButtonProps): JSX.Element;
