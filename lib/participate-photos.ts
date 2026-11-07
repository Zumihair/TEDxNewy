/**
 * THE photos for the three participate pages (/volunteer, /partner, /speak).
 * One place, so a photo can never differ between where it is shown:
 *   - the page hero            (app/volunteer, app/partner, app/speak)
 *   - the homepage cards       (app/page.tsx, "Make 2027 with us")
 *   - the header Participate menu (lib/nav-fallback.ts)
 *   - the social share previews (lib/og-content.ts, via the opengraph-image files)
 * To change one, edit it HERE and nowhere else. `crop` is the share-preview
 * window's vertical position (0 top, 1 bottom); `position` is the on-page
 * object-position for the hero.
 */
export const PARTICIPATE_PHOTOS = {
  volunteer: {
    src: "/images/participate/volunteer-hero.webp",
    alt: "The TEDxNewy volunteer team on the Signal stage, October 2026",
    position: "center 60%",
    crop: 0.55,
  },
  partner: {
    src: "/images/participate/partners-hero.webp",
    alt: "TEDxNewy tote bags at Signal, October 2026",
    position: "center 30%",
    crop: 0.4,
  },
  speak: {
    src: "/images/participate/speak-hero.webp",
    alt: "A TEDxNewy host on stage at Signal, October 2026",
    position: "center 30%",
    crop: 0.15,
  },
} as const;
