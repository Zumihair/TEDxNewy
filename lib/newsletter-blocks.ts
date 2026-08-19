/**
 * Newsletter block schema. Shared by the editor (client), the actions that
 * persist blocks as jsonb, and the server renderer (lib/newsletter-render).
 * Keep this file free of server-only imports so client components can use it.
 */

export type ImageWidth = 40 | 60 | 80 | 100 | "full";

/** Optional standout background behind a block. Curated on-brand tints, each
 *  paired with a dark-surface equivalent the renderer swaps in when the
 *  reader's device is in dark mode. Free hex is deliberately not allowed:
 *  every tint has to have a partner on the other side. */
export type BlockBg = "none" | "cream" | "sand" | "blush" | "stone";

export const BLOCK_BACKGROUNDS: {
  id: BlockBg;
  label: string;
  /** Editor swatch + the surface the renderer paints in light mode. */
  swatch: string;
  /** What the same tint becomes on a dark card. Kept here rather than only in
   *  the renderer so the editor swatch can show both halves. */
  darkSwatch: string;
}[] = [
  { id: "none", label: "None", swatch: "transparent", darkSwatch: "transparent" },
  { id: "cream", label: "Cream", swatch: "#f4efe6", darkSwatch: "#26231f" },
  { id: "sand", label: "Sand", swatch: "#efe6d6", darkSwatch: "#2b2620" },
  { id: "blush", label: "Soft red", swatch: "#fbe7e5", darkSwatch: "#2f1a17" },
  { id: "stone", label: "Stone", swatch: "#eae4da", darkSwatch: "#22201d" },
];

/** Which colour scheme an admin preview is pinned to. Lives here rather than
 *  in the renderer because the preview UI is a client component and must not
 *  import the server-only render module. */
export type PreviewScheme = "light" | "dark";

/** Text alignment for a header. Undefined means left, which is what every
 *  block saved before this control existed renders as.
 *
 *  Text blocks (and text column children) also accept it, but nothing sets it
 *  any more: their alignment is per paragraph, written straight into the HTML
 *  by the rich text toolbar, which is finer grained than one value for the
 *  whole block. The field stays because drafts saved in between still carry
 *  it, and the renderer still honours it as the block's default. */
export type BlockAlign = "left" | "center" | "right";

export const BLOCK_ALIGNMENTS: { id: BlockAlign; label: string }[] = [
  { id: "left", label: "Left" },
  { id: "center", label: "Centre" },
  { id: "right", label: "Right" },
];

export type ButtonTheme = "red" | "redDeep" | "ink" | "gradient";
export type ButtonVariant = "solid" | "outline";

export const BUTTON_THEMES: {
  id: ButtonTheme;
  label: string;
  /** Editor swatch (a CSS background value, can be a gradient). */
  swatch: string;
  /** The fill the same theme takes on a dark card. A near-black theme flips to
   *  a light fill rather than staying dark, which is the whole point: the
   *  button has to contrast whichever mode the reader is in. Mirrors
   *  BUTTON_DARK in lib/newsletter-render. */
  darkSwatch: string;
}[] = [
  { id: "red", label: "Red", swatch: "#e02214", darkSwatch: "#e02214" },
  { id: "redDeep", label: "Deep red", swatch: "#2a0604", darkSwatch: "#f6e5e1" },
  { id: "ink", label: "Ink", swatch: "#141210", darkSwatch: "#f4efe6" },
  {
    id: "gradient",
    label: "Gradient",
    swatch: "linear-gradient(135deg,#e02214,#2a0604)",
    darkSwatch: "linear-gradient(135deg,#ff5946,#c81b0f)",
  },
];

/** A child that can live inside a column stack. Curated (text, image, button):
 *  deep arbitrary nesting is unreliable across mail clients. */
export type ColumnChild =
  | { id: string; kind: "text"; html: string; align?: BlockAlign }
  | { id: string; kind: "image"; src: string; alt: string; widthPct: ImageWidth }
  | {
      id: string;
      kind: "button";
      label: string;
      href: string;
      align: "left" | "center";
      theme: ButtonTheme;
      variant: ButtonVariant;
    };

export type ColumnChildKind = ColumnChild["kind"];

/** Column-width presets, keyed by column count. `widths` sum to ~100 and drive
 *  the renderer directly, so ratios are never computed at render time. */
export const COLUMN_RATIOS: Record<
  2 | 3,
  { id: string; label: string; widths: number[] }[]
> = {
  2: [
    { id: "50-50", label: "50 / 50", widths: [50, 50] },
    { id: "33-66", label: "33 / 66", widths: [33, 67] },
    { id: "66-33", label: "66 / 33", widths: [67, 33] },
    { id: "40-60", label: "40 / 60", widths: [40, 60] },
    { id: "60-40", label: "60 / 40", widths: [60, 40] },
  ],
  3: [
    { id: "33-33-33", label: "Even thirds", widths: [33, 34, 33] },
    { id: "25-50-25", label: "25 / 50 / 25", widths: [25, 50, 25] },
    { id: "50-25-25", label: "50 / 25 / 25", widths: [50, 25, 25] },
    { id: "25-25-50", label: "25 / 25 / 50", widths: [25, 25, 50] },
  ],
};

/** The width array for a column block, falling back to an even split. */
export function ratioWidths(count: number, ratio: string): number[] {
  const key = count === 3 ? 3 : 2;
  const found = COLUMN_RATIOS[key].find((r) => r.id === ratio);
  if (found) return found.widths;
  return COLUMN_RATIOS[key][0].widths;
}

export type ColumnValign = "top" | "middle" | "bottom";

/**
 * Divider looks. `thin` is the original full-width hairline and stays the
 * default, so every divider saved before these options existed renders
 * exactly as it did.
 */
export type DividerStyle = "thin" | "accent" | "short" | "x";
export type DividerColour = "soft" | "ink" | "red";

export const DIVIDER_STYLES: {
  id: DividerStyle;
  label: string;
  hint: string;
}[] = [
  { id: "thin", label: "Hairline", hint: "Full width, barely there" },
  { id: "accent", label: "Accent bar", hint: "Short and chunky, on the left" },
  { id: "short", label: "Short line", hint: "70% width, centred" },
  { id: "x", label: "X mark", hint: "A centred ✕ between two hairlines" },
];

export const DIVIDER_COLOURS: {
  id: DividerColour;
  label: string;
  /** Light-mode swatch, also what the renderer paints. */
  hex: string;
}[] = [
  { id: "soft", label: "Soft", hex: "#efe9dd" },
  { id: "ink", label: "Ink", hex: "#141210" },
  { id: "red", label: "Red", hex: "#e02214" },
];

export type NewsletterBlock =
  | {
      id: string;
      type: "header";
      text: string;
      size: "lg" | "md";
      align?: BlockAlign;
      bg?: BlockBg;
    }
  | { id: string; type: "text"; html: string; align?: BlockAlign; bg?: BlockBg }
  | {
      id: string;
      type: "image";
      src: string;
      alt: string;
      widthPct: ImageWidth;
      href?: string;
      bg?: BlockBg;
    }
  | {
      id: string;
      type: "columns";
      cols: ColumnChild[][];
      ratio: string;
      valign: ColumnValign;
      bg?: BlockBg;
    }
  | {
      id: string;
      type: "button";
      label: string;
      href: string;
      align: "left" | "center";
      theme: ButtonTheme;
      variant: ButtonVariant;
      bg?: BlockBg;
    }
  | {
      id: string;
      type: "video";
      href: string;
      thumbnailSrc: string;
      caption?: string;
    }
  | {
      id: string;
      type: "divider";
      style: DividerStyle;
      colour: DividerColour;
    };

export type BlockType = NewsletterBlock["type"];

export const BLOCK_TYPES: { type: BlockType; label: string; hint: string }[] = [
  { type: "header", label: "Header", hint: "A heading line" },
  { type: "text", label: "Text", hint: "A rich text paragraph" },
  { type: "image", label: "Image", hint: "A single image, sized" },
  {
    type: "columns",
    label: "Columns",
    hint: "Stack text, images and buttons side by side",
  },
  { type: "button", label: "Button", hint: "A call-to-action link" },
  { type: "video", label: "Video", hint: "A thumbnail that links out" },
  { type: "divider", label: "Divider", hint: "A line or mark between sections" },
];

/** A short one-line summary of a block for the editor's collapsed card. */
export function blockSummary(block: NewsletterBlock): string {
  switch (block.type) {
    case "header":
      return block.text || "(empty header)";
    case "text":
      return stripTags(block.html).slice(0, 80) || "(empty text)";
    case "image":
      return block.alt || block.src || "(no image yet)";
    case "columns": {
      const ratio = block.cols.length === 3 ? "thirds" : block.ratio;
      return `${block.cols.length} columns · ${ratio}`;
    }
    case "button":
      return block.label || "(no label)";
    case "video":
      return block.caption || block.href || "(no video yet)";
    case "divider": {
      const style = DIVIDER_STYLES.find((s) => s.id === block.style);
      const colour = DIVIDER_COLOURS.find((c) => c.id === block.colour);
      return `${style?.label ?? "Hairline"} · ${colour?.label ?? "Soft"}`;
    }
  }
}

/** Generate a stable id for a new block. */
function newId(): string {
  if (
    typeof globalThis.crypto !== "undefined" &&
    typeof globalThis.crypto.randomUUID === "function"
  ) {
    return globalThis.crypto.randomUUID();
  }
  // Fallback for older runtimes; ids only need to be unique within one draft.
  return `b_${Math.floor(Math.random() * 1e9).toString(36)}`;
}

/** Build a new column child of the given kind, pre-filled with defaults. */
export function createColumnChild(kind: ColumnChildKind): ColumnChild {
  const id = newId();
  switch (kind) {
    case "text":
      return { id, kind, html: "<p></p>" };
    case "image":
      return { id, kind, src: "", alt: "", widthPct: 100 };
    case "button":
      return {
        id,
        kind,
        label: "Learn more",
        href: "",
        align: "center",
        theme: "red",
        variant: "solid",
      };
  }
}

/** Build a new block of the given type, pre-filled with sensible defaults. */
export function createBlock(type: BlockType): NewsletterBlock {
  const id = newId();
  switch (type) {
    case "header":
      return { id, type, text: "Your heading", size: "lg" };
    case "text":
      return { id, type, html: "<p>Write something here.</p>" };
    case "image":
      return { id, type, src: "", alt: "", widthPct: 100 };
    case "columns":
      return {
        id,
        type,
        cols: [[createColumnChild("text")], [createColumnChild("text")]],
        ratio: "50-50",
        valign: "top",
      };
    case "button":
      return {
        id,
        type,
        label: "Learn more",
        href: "",
        align: "center",
        theme: "red",
        variant: "solid",
      };
    case "video":
      return { id, type, href: "", thumbnailSrc: "", caption: "" };
    case "divider":
      return { id, type, style: "thin", colour: "soft" };
  }
}

function stripTags(html: string): string {
  return html
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

const WIDTHS: ImageWidth[] = [40, 60, 80, 100, "full"];
const BG_IDS: BlockBg[] = ["none", "cream", "sand", "blush", "stone"];
const BUTTON_THEME_IDS: ButtonTheme[] = ["red", "redDeep", "ink", "gradient"];

function coerceWidth(v: unknown): ImageWidth {
  return WIDTHS.includes(v as ImageWidth) ? (v as ImageWidth) : 100;
}

function coerceBg(v: unknown): BlockBg | undefined {
  return v && BG_IDS.includes(v as BlockBg) && v !== "none"
    ? (v as BlockBg)
    : undefined;
}

function coerceButtonTheme(v: unknown): ButtonTheme {
  return BUTTON_THEME_IDS.includes(v as ButtonTheme) ? (v as ButtonTheme) : "red";
}

function coerceButtonVariant(v: unknown): ButtonVariant {
  return v === "outline" ? "outline" : "solid";
}

/** Alignment is stored only when it is not the default, so a block written
 *  before the control existed keeps exactly the JSON it had. */
function coerceAlign(v: unknown): BlockAlign | undefined {
  return v === "center" || v === "right" ? v : undefined;
}

/**
 * Coerce untrusted jsonb (or editor state) into a clean NewsletterBlock[].
 * Drops anything malformed rather than throwing, so a bad row can never crash
 * a render or a send. Legacy `twoColumn`/`countdown` blocks are handled here:
 * twoColumn is migrated to the columns container; countdown falls through to
 * null and is dropped.
 */
export function validateBlocks(input: unknown): NewsletterBlock[] {
  if (!Array.isArray(input)) return [];
  const out: NewsletterBlock[] = [];
  for (const raw of input) {
    const block = coerceBlock(raw);
    if (block) out.push(block);
  }
  return out;
}

function coerceBlock(raw: unknown): NewsletterBlock | null {
  if (!raw || typeof raw !== "object") return null;
  const r = raw as Record<string, unknown>;
  const id = typeof r.id === "string" && r.id ? r.id : newId();
  const str = (v: unknown) => (typeof v === "string" ? v : "");
  const bg = coerceBg(r.bg);
  switch (r.type) {
    case "header": {
      const align = coerceAlign(r.align);
      return {
        id,
        type: "header",
        text: str(r.text),
        size: r.size === "md" ? "md" : "lg",
        ...(align ? { align } : {}),
        ...(bg ? { bg } : {}),
      };
    }
    case "text": {
      const align = coerceAlign(r.align);
      return {
        id,
        type: "text",
        html: str(r.html),
        ...(align ? { align } : {}),
        ...(bg ? { bg } : {}),
      };
    }
    case "image":
      return {
        id,
        type: "image",
        src: str(r.src),
        alt: str(r.alt),
        widthPct: coerceWidth(r.widthPct),
        ...(str(r.href) ? { href: str(r.href) } : {}),
        ...(bg ? { bg } : {}),
      };
    case "columns":
      return coerceColumns(id, r, bg);
    case "twoColumn":
      // Legacy: fold the two fixed slots into the columns container.
      return {
        id,
        type: "columns",
        cols: [
          [legacyColumnToChild(r.left)],
          [legacyColumnToChild(r.right)],
        ],
        ratio: "50-50",
        valign: "top",
      };
    case "button":
      return {
        id,
        type: "button",
        label: str(r.label),
        href: str(r.href),
        align: r.align === "left" ? "left" : "center",
        theme: coerceButtonTheme(r.theme),
        variant: coerceButtonVariant(r.variant),
        ...(bg ? { bg } : {}),
      };
    case "video":
      return {
        id,
        type: "video",
        href: str(r.href),
        thumbnailSrc: str(r.thumbnailSrc),
        ...(str(r.caption) ? { caption: str(r.caption) } : {}),
      };
    case "divider":
      // Both fields fall back to the pre-options look, so old dividers are
      // untouched by the upgrade.
      return {
        id,
        type: "divider",
        style: DIVIDER_STYLES.some((s) => s.id === r.style)
          ? (r.style as DividerStyle)
          : "thin",
        colour: DIVIDER_COLOURS.some((c) => c.id === r.colour)
          ? (r.colour as DividerColour)
          : "soft",
      };
    default:
      // Unknown (e.g. the retired `countdown`) is dropped.
      return null;
  }
}

function coerceColumns(
  id: string,
  r: Record<string, unknown>,
  bg: BlockBg | undefined,
): NewsletterBlock {
  const rawCols = Array.isArray(r.cols) ? r.cols : [];
  let cols: ColumnChild[][] = rawCols
    .filter(Array.isArray)
    .slice(0, 3)
    .map((stack) =>
      (stack as unknown[]).map(coerceColumnChild).filter(Boolean) as ColumnChild[],
    );
  // Always keep at least two columns so ratios/layout stay valid.
  while (cols.length < 2) cols.push([createColumnChild("text")]);
  const count = cols.length === 3 ? 3 : 2;
  const ratio = COLUMN_RATIOS[count].some((x) => x.id === r.ratio)
    ? (r.ratio as string)
    : COLUMN_RATIOS[count][0].id;
  const valign: ColumnValign =
    r.valign === "middle" ? "middle" : r.valign === "bottom" ? "bottom" : "top";
  return { id, type: "columns", cols, ratio, valign, ...(bg ? { bg } : {}) };
}

function coerceColumnChild(raw: unknown): ColumnChild | null {
  if (!raw || typeof raw !== "object") return null;
  const r = raw as Record<string, unknown>;
  const id = typeof r.id === "string" && r.id ? r.id : newId();
  const str = (v: unknown) => (typeof v === "string" ? v : "");
  if (r.kind === "image") {
    return {
      id,
      kind: "image",
      src: str(r.src),
      alt: str(r.alt),
      widthPct: coerceWidth(r.widthPct),
    };
  }
  if (r.kind === "button") {
    return {
      id,
      kind: "button",
      label: str(r.label),
      href: str(r.href),
      align: r.align === "left" ? "left" : "center",
      theme: coerceButtonTheme(r.theme),
      variant: coerceButtonVariant(r.variant),
    };
  }
  // Default to text.
  const align = coerceAlign(r.align);
  return { id, kind: "text", html: str(r.html), ...(align ? { align } : {}) };
}

/** Migrate one legacy twoColumn slot ({kind:text|image}) to a ColumnChild. */
function legacyColumnToChild(raw: unknown): ColumnChild {
  const id = newId();
  if (raw && typeof raw === "object") {
    const r = raw as Record<string, unknown>;
    if (r.kind === "image") {
      return {
        id,
        kind: "image",
        src: typeof r.src === "string" ? r.src : "",
        alt: typeof r.alt === "string" ? r.alt : "",
        widthPct: 100,
      };
    }
    if (r.kind === "text") {
      return { id, kind: "text", html: typeof r.html === "string" ? r.html : "" };
    }
  }
  return { id, kind: "text", html: "" };
}
