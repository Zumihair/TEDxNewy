import type { ReactNode } from "react";

/** Small value + label metric tile. */
export interface StatChipProps {
  value: string;
  label: string;
}

export declare function StatChip(props: StatChipProps): JSX.Element;

export interface StatChipGridProps {
  columns?: number;
  children?: ReactNode;
}

export declare function StatChipGrid(props: StatChipGridProps): JSX.Element;
