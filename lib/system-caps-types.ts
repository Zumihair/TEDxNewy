import type { CapStatus } from "@/lib/system-caps-math";

/** One small tile on /admin/system-caps. Plain data, so the tile component
 *  can be rendered with sample data. */
export type Tile = {
  key: string;
  label: string;
  /** live: read now. manual: last reading by hand (grey). setup: no reading. */
  kind: "live" | "manual" | "setup";
  /** The big text, e.g. "37%". */
  value: string;
  /** Small grey line, e.g. "2,298 / 50,000". */
  sub: string;
  /** Bar fill 0 to 100, or null for no bar. */
  pct: number | null;
  status: CapStatus;
  /** Shown on hover or long press (title attribute). */
  hint?: string;
};
