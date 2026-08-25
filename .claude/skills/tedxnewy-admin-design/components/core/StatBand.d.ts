import type { ReactNode } from "react";

export interface StatBandProps {
  /** BandStat children. */
  children?: ReactNode;
  /** 2-5. Tickets uses 5, Partners uses 4. */
  columns?: number;
}

/** The dark stat band at the top of a page: big display numbers on near-black. */
export declare function StatBand(props: StatBandProps): JSX.Element;

export interface BandStatProps {
  value: string;
  /** A full lowercase phrase, not a label: "organisations on the board". */
  label: string;
  /** Tints the number mint — for a total worth celebrating (confirmed value, Angel seats). */
  tone?: "good";
}

export declare function BandStat(props: BandStatProps): JSX.Element;
