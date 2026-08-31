import type { ReactNode } from "react";

export interface FlashProps {
  tone?: "info" | "error";
  children?: ReactNode;
}

/** Inline banner for a standing notice. Action results are announced by Toast. */
export declare function Flash(props: FlashProps): JSX.Element;
