import type { ReactNode, CSSProperties } from "react";

export type ButtonVariant = "primary" | "secondary" | "danger" | "ghost" | "dark" | "row";

/** The admin's pill button. */
export interface ButtonProps {
  /** primary = red page action; secondary = neutral wash; dark = ink confirm; danger = soft-red destructive; row/ghost = compact in-row actions. */
  variant?: ButtonVariant;
  children?: ReactNode;
  /** Leading icon node, usually an <Icon />. Replaced by a spinner while pending. */
  icon?: ReactNode;
  type?: "button" | "submit";
  disabled?: boolean;
  /** Server action in flight: disables and shows the spinner. */
  pending?: boolean;
  fullWidth?: boolean;
  onClick?: () => void;
  style?: CSSProperties;
}

export declare function Button(props: ButtonProps): JSX.Element;

export interface IconButtonProps {
  children?: ReactNode;
  ariaLabel: string;
  title?: string;
  /** "danger" turns the hover circle red, for destructive row actions. */
  tone?: "neutral" | "danger";
  disabled?: boolean;
  pending?: boolean;
  onClick?: () => void;
  type?: "button" | "submit";
}

export declare function IconButton(props: IconButtonProps): JSX.Element;
