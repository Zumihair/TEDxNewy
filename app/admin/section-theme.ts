/**
 * One colour identity per admin section, shared by the dashboard family tiles
 * and the page headers, so a section reads the same wherever it appears:
 *   - Content pages  → coast blue
 *   - Community      → red
 *   - Settings/tools → green
 *   - Forms inbox    → amber
 *
 * Pure data + a lookup (no client/server directive), so it imports cleanly into
 * both server pages and client components.
 */
export type SectionTheme = {
  key: string;
  /** eyebrow / accent colour (on light backgrounds) */
  ink: string;
  /** brighter variant that reads well on the dark sidebar */
  onDark: string;
  /** icon-chip fill + icon colour */
  chipBg: string;
  chipFg: string;
  /** tile border, resting + hover, in the family hue */
  border: string;
  borderHover: string;
  /** very soft background wash */
  tint: string;
};

export const THEMES: Record<string, SectionTheme> = {
  coast: {
    key: "coast",
    ink: "#1f4a5c",
    onDark: "#49a7c4",
    chipBg: "#e8f0f3",
    chipFg: "#1f4a5c",
    border: "rgba(31,74,92,0.22)",
    borderHover: "rgba(31,74,92,0.48)",
    tint: "rgba(31,74,92,0.06)",
  },
  red: {
    key: "red",
    ink: "#b91404",
    onDark: "#ff3626",
    chipBg: "#fde9e7",
    chipFg: "#b91404",
    border: "rgba(185,20,4,0.20)",
    borderHover: "rgba(185,20,4,0.46)",
    tint: "rgba(224,34,20,0.06)",
  },
  green: {
    key: "green",
    ink: "#2f6f4e",
    onDark: "#52b788",
    chipBg: "#e7f1ea",
    chipFg: "#2f6f4e",
    border: "rgba(47,111,78,0.24)",
    borderHover: "rgba(47,111,78,0.50)",
    tint: "rgba(47,111,78,0.06)",
  },
  amber: {
    key: "amber",
    ink: "#a16207",
    onDark: "#e6a93c",
    chipBg: "#faf0e2",
    chipFg: "#a66a1d",
    border: "rgba(166,106,29,0.22)",
    borderHover: "rgba(166,106,29,0.48)",
    tint: "rgba(166,106,29,0.06)",
  },
};

// Second path segment (/admin/<segment>/...) → theme key. Nested routes like
// /admin/forms/talk-night or /admin/emails/history inherit their section.
const SEGMENT_THEME: Record<string, string> = {
  events: "coast",
  talks: "coast",
  speakers: "coast",
  team: "coast",
  sponsors: "coast",
  documents: "coast",
  emails: "red",
  calendar: "red",
  newsletter: "red",
  "subscriber-flow": "red",
  subscribers: "red",
  socials: "red",
  notifications: "green",
  admins: "green",
  forms: "amber",
};

/** The theme for a given admin pathname, defaulting to red (the brand hue). */
export function sectionThemeFor(pathname: string | null | undefined): SectionTheme {
  const seg = (pathname ?? "").split("/")[2] ?? "";
  return THEMES[SEGMENT_THEME[seg] ?? "red"];
}
