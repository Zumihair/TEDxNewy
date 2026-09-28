/**
 * Partners shown on `/signal/links`' Partners tile, ONLY. Will's explicit
 * ask (2026-09-29): a curated set for this page alone, not the CMS-driven
 * `getSponsors()` list `/signal` and `/sponsors` both use (see
 * `SIGNAL_SPONSOR_EXCLUDE`/`SIGNAL_LOGO_SCALE` in `signal-content.ts` for
 * that shared list) — so this file is deliberately separate, not an
 * extension of it, and nothing here can leak onto either of those pages.
 *
 * University of Newcastle and Henderson are the two names Will asked to
 * keep from the CMS list (logos re-downloaded from the live
 * `cms-uploads/sponsors/` files so this page no longer depends on the CMS
 * at all); Super Radio Network was dropped. Hey Zomi, Frekl, Newy Digital
 * and Sketch It Live are new, from the logo files Will supplied in
 * `1. Business/TEDx/new partner logos for event page/` (that source folder
 * no longer exists on disk as of 2026-09-30, since Will cleaned it up once
 * the processed files were copied in — the versions in
 * `public/images/signal-links/partners/` are the only copies now). Sketch
 * It Live's black background was removed via a border-connected flood
 * fill, distinct from its own disconnected black linework. **Hey Zomi's
 * original file had the same "padded square canvas" bug this repo has hit
 * before with Henderson/University of Newcastle** (see
 * `Source-Images/partners/README.md`): a 700x700 square canvas with the
 * actual logo only filling a 554x301 region in the middle, so at a fixed
 * HEIGHT cap the visible mark rendered far smaller than its neighbours'
 * tightly-cropped files (16% ink, measured, not eyeballed). Fixed
 * 2026-09-30 with a plain alpha-bbox trim, no added margin, same convention
 * as every other cropped file in this codebase.
 *
 * Website URLs verified, not guessed: University of Newcastle and Frekl
 * from prior work in this repo (`Source-Images/partners/README.md`),
 * Henderson from `2026/Grant Applications/PLANNING/_Reusable Content/
 * Narrative-Blocks.md` ("Henderson Advocacy"), Hey Zomi/Newy Digital/
 * Sketch It Live from a live web search on 2026-09-29.
 */

export type SignalLinksPartner = {
  name: string;
  logo: string;
  websiteUrl: string;
  /**
   * `primary`: University of Newcastle and Henderson, shown side by side,
   * larger, above a divider (Will's ask, 2026-09-29). `supporting`: the
   * other four, in a 2x2 grid below the divider. Drives both the modal's
   * tiered layout and the desktop hub card's "University + Henderson, then
   * + more" preview — so reordering or re-tiering this list is the only
   * change needed to change either.
   */
  tier: "primary" | "supporting";
  /**
   * Every logo renders through `brightness-0 invert` so it reads as a clean
   * white mark on the dark panel, regardless of its source colour, matching
   * every other logo treatment on this page. Sketch It Live is the one
   * exception: it's an illustration (a grayscale figure plus white
   * wordmark), not a flat wordmark, so inverting it would flatten the whole
   * drawing to a single white silhouette and erase every internal line.
   * It already reads correctly on a dark background as-is (it was designed
   * on a black canvas), so it keeps its native colours.
   */
  keepColor?: boolean;
  /**
   * Height multiplier on the shared cap, same idea as `SIGNAL_LOGO_SCALE`
   * in `signal-content.ts` but local to this file (this list doesn't read
   * that shared map, see the file note above). Two different reasons stack
   * multiplicatively here, not two separate fields:
   *
   * 1. Sketch It Live is a detailed illustration plus a small wordmark, not
   *    a flat wordmark like its neighbours: at the same cap the drawing was
   *    too small to read (verified on a rendered screenshot, not
   *    eyeballed), so its own baseline is 2x before anything else applies.
   * 2. **2026-09-30, Will's request: all four `supporting`-tier logos read
   *    20% smaller than the `primary` pair**, "acknowledging University of
   *    Newcastle and Henderson are more valuable partners." So every
   *    `supporting` entry's number already has that 0.8 folded in: Hey
   *    Zomi/Frekl/Newy Digital are `0.8` (their unscaled baseline is 1),
   *    Sketch It Live is `1.6` (its own 2x baseline times 0.8). Everyone
   *    else (the `primary` pair) defaults to 1, i.e. the full cap.
   */
  heightScale?: number;
};

export const SIGNAL_LINKS_PARTNERS: SignalLinksPartner[] = [
  {
    name: "University of Newcastle",
    logo: "/images/signal-links/partners/university-of-newcastle.svg",
    websiteUrl: "https://www.newcastle.edu.au",
    tier: "primary",
  },
  {
    name: "Henderson",
    logo: "/images/signal-links/partners/henderson.png",
    websiteUrl: "https://henderson.com.au",
    tier: "primary",
  },
  {
    name: "Hey Zomi",
    logo: "/images/signal-links/partners/hey-zomi.png",
    websiteUrl: "https://www.heyzomi.com",
    tier: "supporting",
    heightScale: 0.8,
  },
  {
    name: "Frekl",
    logo: "/images/signal-links/partners/frekl.png",
    websiteUrl: "https://www.frekl.com.au",
    tier: "supporting",
    heightScale: 0.8,
  },
  {
    name: "Newy Digital",
    logo: "/images/signal-links/partners/newy-digital.png",
    websiteUrl: "https://www.newydigital.com",
    tier: "supporting",
    heightScale: 0.8,
  },
  {
    name: "Sketch It Live",
    logo: "/images/signal-links/partners/sketch-it-live.png",
    websiteUrl: "http://sketchitlive.com.au",
    tier: "supporting",
    keepColor: true,
    heightScale: 1.6,
  },
];
