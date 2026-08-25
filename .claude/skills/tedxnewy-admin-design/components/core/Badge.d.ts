import type { ReactNode } from "react";

export type BadgeTone = "neutral" | "red" | "live" | "soon" | "draft" | "scheduled";

export interface BadgeProps {
  tone?: BadgeTone;
  children?: ReactNode;
}

/** Tiny uppercase status pill. Shows DERIVED lifecycle status only — never the hand-chosen stage. */
export declare function Badge(props: BadgeProps): JSX.Element;
