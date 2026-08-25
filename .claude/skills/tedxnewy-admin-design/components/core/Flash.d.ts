import type { ReactNode } from "react";

export interface FlashProps {
  tone?: "ok" | "info" | "error";
  children?: ReactNode;
}

/** Inline result banner. The admin has no toast system — results appear in place. */
export declare function Flash(props: FlashProps): JSX.Element;
