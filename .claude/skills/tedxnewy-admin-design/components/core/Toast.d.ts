import type { ReactNode } from "react";

export type ToastTone = "success" | "error" | "warning";

export interface ToastProps {
  tone?: ToastTone;
  children?: ReactNode;
  onDismiss?: () => void;
}

/** The result of an action, risen from the bottom edge. Standing notices are Flash. */
export declare function Toast(props: ToastProps): JSX.Element;
