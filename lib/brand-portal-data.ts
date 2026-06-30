// Static brand reference content for the team brand portal: colours to copy,
// ready-made statements to copy, and the logo set to download.

export type Swatch = { name: string; hex: string; note?: string; light?: boolean };

export const COLOUR_GROUPS: { title: string; swatches: Swatch[] }[] = [
  {
    title: "Core",
    swatches: [
      { name: "TED Red", hex: "#E62B1E", note: "Print: Pantone 485" },
      { name: "Web Red", hex: "#e02214", note: "On-screen red" },
      { name: "Black", hex: "#000000", light: false },
      { name: "White", hex: "#ffffff", light: true },
    ],
  },
  {
    title: "Reds",
    swatches: [
      { name: "Red Bright", hex: "#ff3626" },
      { name: "Red Mid", hex: "#b91404" },
      { name: "Red Dark", hex: "#8c0d05" },
      { name: "Red Deep", hex: "#2a0604" },
    ],
  },
  {
    title: "Neutrals",
    swatches: [
      { name: "Cream", hex: "#f4efe6", light: true },
      { name: "Cream Light", hex: "#f9f5ec", light: true },
      { name: "Ink", hex: "#141210" },
      { name: "Ink 2", hex: "#2a2521" },
      { name: "Ink 3", hex: "#6b6459" },
    ],
  },
];

export type Statement = { label: string; text: string };

export const STATEMENT_GROUPS: { title: string; items: Statement[] }[] = [
  {
    title: "Taglines",
    items: [
      { label: "Primary", text: "Ideas worth spreading, from Newcastle." },
      { label: "Season", text: "Ideas that refuse to sit still." },
      { label: "Lockup tagline", text: "x = independently organized TED event" },
    ],
  },
  {
    title: "Descriptions",
    items: [
      {
        label: "One line",
        text: "TEDxNewy is an independently licensed TED event in Newcastle, on Awabakal and Worimi Country. Ideas worth spreading, from the Hunter.",
      },
      {
        label: "What is TEDx",
        text: "In the spirit of ideas worth spreading, TED created a program called TEDx: local, self-organized events that bring people together to share a TED-like experience. Our event is TEDxNewy, where x = independently organized TED event.",
      },
    ],
  },
  {
    title: "Required lines",
    items: [
      { label: "Licence", text: "This independent TEDx event is operated under licence from TED." },
      { label: "Acknowledgement of Country", text: "An independently licensed TED event on Awabakal and Worimi Country." },
      {
        label: "Acknowledgement (full)",
        text: "TEDxNewy is staged on the land of the Awabakal and Worimi people. We pay our respects to Elders past, present and emerging, and acknowledge their continuing connection to land, waters and culture. Sovereignty was never ceded.",
      },
    ],
  },
  {
    title: "Organisation",
    items: [
      { label: "Legal entity", text: "Newcastle Ideas Network Limited" },
      { label: "ABN", text: "71 694 346 319" },
      { label: "ACN", text: "694 346 319" },
      { label: "Email", text: "hello@tedxnewy.com.au" },
    ],
  },
];

export const EVENT_FORMATS = ["Standard", "Salon", "Youth"] as const;
export const COLOURWAYS: { key: string; label: string; note: string }[] = [
  { key: "black", label: "Primary", note: "red + dark · on light" },
  { key: "white", label: "Reversed", note: "red + white · on dark" },
  { key: "mono", label: "Mono white", note: "all white · on red / photos" },
];

// /brand/lockups/TEDxNewy-{event}-{key}.png  (+ .svg for black/white/mono)
export function lockupPath(event: string, key: string, ext: "png" | "svg") {
  return `/brand/lockups/TEDxNewy-${event}-${key}.${ext}`;
}
