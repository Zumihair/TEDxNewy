/**
 * Retired: the design system has one accent (red) and neutral surfaces, so the
 * old per-section colour families are gone. Every key now resolves to the same
 * neutral theme; the module stays only so older pages keep compiling, and can
 * be deleted once nothing imports it.
 */
export type SectionTheme = {
  key: string;
  ink: string;
  onDark: string;
  chipBg: string;
  chipFg: string;
  border: string;
  borderHover: string;
  tint: string;
};

const NEUTRAL: SectionTheme = {
  key: "neutral",
  ink: "#000000",
  onDark: "#ffffff",
  chipBg: "#f4efe6",
  chipFg: "#000000",
  border: "rgba(0,0,0,0.10)",
  borderHover: "rgba(0,0,0,0.22)",
  tint: "rgba(0,0,0,0.03)",
};

export const THEMES: Record<string, SectionTheme> = {
  coast: NEUTRAL,
  red: NEUTRAL,
  green: NEUTRAL,
  amber: NEUTRAL,
  grey: NEUTRAL,
};

export function sectionThemeFor(_pathname: string | null | undefined): SectionTheme {
  return NEUTRAL;
}
