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
 * `1. Business/TEDx/new partner logos for event page/` (processed and
 * copied to `public/images/signal-links/partners/`, see that folder for
 * what each file originally was: Sketch It Live's black background was
 * removed via a border-connected flood fill, distinct from its own
 * disconnected black linework, and the others were just resized down from
 * multi-thousand-pixel sources).
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
   * that shared map, see the file note above). Sketch It Live is a detailed
   * illustration plus a small wordmark, not a flat wordmark like its
   * neighbours: at the same 32px cap the drawing was too small to read
   * (verified on a rendered screenshot, not eyeballed), so it gets a 2x
   * box. Everyone else defaults to 1.
   */
  heightScale?: number;
};

export const SIGNAL_LINKS_PARTNERS: SignalLinksPartner[] = [
  {
    name: "University of Newcastle",
    logo: "/images/signal-links/partners/university-of-newcastle.svg",
    websiteUrl: "https://www.newcastle.edu.au",
  },
  {
    name: "Henderson",
    logo: "/images/signal-links/partners/henderson.png",
    websiteUrl: "https://henderson.com.au",
  },
  {
    name: "Hey Zomi",
    logo: "/images/signal-links/partners/hey-zomi.png",
    websiteUrl: "https://www.heyzomi.com",
  },
  {
    name: "Frekl",
    logo: "/images/signal-links/partners/frekl.png",
    websiteUrl: "https://www.frekl.com.au",
  },
  {
    name: "Newy Digital",
    logo: "/images/signal-links/partners/newy-digital.png",
    websiteUrl: "https://www.newydigital.com",
  },
  {
    name: "Sketch It Live",
    logo: "/images/signal-links/partners/sketch-it-live.png",
    websiteUrl: "http://sketchitlive.com.au",
    keepColor: true,
    heightScale: 2,
  },
];
