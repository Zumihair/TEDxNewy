import type { ReactNode } from "react";

export interface FilterChipProps {
  active?: boolean;
  /** Colour pair for the inactive pill, so it previews the status it filters to. */
  passive?: { bg: string; fg: string };
  /** Rendered after the label as "· 12". */
  count?: number;
  title?: string;
  href?: string;
  onClick?: (e: React.MouseEvent) => void;
  children?: ReactNode;
}

/** Mono-caps filter pill. Ink-filled when active; hairline white and lifting on hover when not. */
export declare function FilterChip(props: FilterChipProps): JSX.Element;
