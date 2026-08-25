import type { ReactNode } from "react";

/** Trigger button + portalled overlay dialog — the standard "add a record" flow. */
export interface ModalProps {
  /** The button that opens it. Rendered as-is; the click is wired for you. */
  trigger: ReactNode;
  title: string;
  /** default 520px · wide 760px · xl 960px (charts, maps, data-dense content). */
  size?: "default" | "wide" | "xl";
  defaultOpen?: boolean;
  children?: ReactNode;
}

export declare function Modal(props: ModalProps): JSX.Element;
