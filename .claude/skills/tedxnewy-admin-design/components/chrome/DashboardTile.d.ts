import type { ReactNode } from "react";

/** A dashboard tile in its family's hue. */
export interface DashboardTileProps {
  section?: "yellow" | "coast" | "red" | "green" | "grey";
  icon?: ReactNode;
  title: string;
  /** Live record count. Omit for a tool. */
  count?: number;
  /** A tool with no meaningful count — shows an open arrow instead. */
  tool?: boolean;
  /** The one primary action per dashboard, rendered as a full-red tile. */
  feature?: boolean;
  href?: string;
  onClick?: () => void;
}

export declare function DashboardTile(props: DashboardTileProps): JSX.Element;

export interface PulseTileProps {
  label: string;
  value: string;
  sub?: string;
  /** 0-100 renders a slim progress bar under the number. */
  pct?: number;
  /** Sets the number in brand red — the hero stat of the row. */
  accent?: boolean;
  href?: string;
}

export declare function PulseTile(props: PulseTileProps): JSX.Element;
