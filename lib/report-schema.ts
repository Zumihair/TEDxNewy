/**
 * Impact report content model.
 *
 * Pure: no server imports, no React. Shared by the admin editor (client),
 * the server actions that save it, and the renderer that turns it into the
 * printable HTML behind the PDF. The shape mirrors the hand-built
 * "Newcastle 2050" impact PDFs (Aug 2026): one statement per page, poster
 * type, event photos, a numbers page, a feedback page and a close.
 *
 * Everything the report shows is stored in `config`, so a report keeps
 * reading the same after the underlying feedback or photo set changes. The
 * data helpers only supply *defaults* when a report is first created.
 */

export type ReportTone = "cream" | "dark" | "tint";
export type ReportKind = "overview" | "highlight";
export type ReportStatus = "draft" | "final";

export type ReportStat = { value: string; label: string };
export type ReportPartner = { name: string; label: string };
export type ReportTestimonial = { text: string; name: string };
export type ReportPhoto = { url: string; caption: string };

export type ReportStatement = {
  id: string;
  /** "01", "02"... shown small above the headline. */
  number: string;
  headline: string;
  body: string;
  quote: string;
  quoteSource: string;
  /** Optional photo. When set the page is photo-on-top, text below. */
  photoUrl: string;
  tone: ReportTone;
};

export type ReportConfig = {
  version: 1;
  /** Accent hex. Overview reports use TEDx red; highlight reports pick a room colour. */
  accent: string;
  /** Short line in the page-corner marker on every page. */
  footerLabel: string;
  cover: {
    photoUrl: string;
    /** Top-right stamp, e.g. "Impact report / Salon 1 · Season 2026". */
    stamp: string;
    kicker: string;
    title: string;
    lead: string;
  };
  numbers: {
    enabled: boolean;
    kicker: string;
    stats: ReportStat[];
    note: string;
  };
  photos: {
    enabled: boolean;
    kicker: string;
    title: string;
    items: ReportPhoto[];
  };
  statements: ReportStatement[];
  feedback: {
    enabled: boolean;
    kicker: string;
    title: string;
    /** Rating and yes/no tiles computed from the responses at creation time. */
    stats: ReportStat[];
    testimonials: ReportTestimonial[];
  };
  close: {
    kicker: string;
    title: string;
    body: string;
    partners: ReportPartner[];
    nextLabel: string;
    nextText: string;
    linkLabel: string;
    linkUrl: string;
    showAcknowledgement: boolean;
  };
};

export const ACCENTS: { label: string; value: string }[] = [
  { label: "TEDx red", value: "#e02214" },
  { label: "Coast blue", value: "#17607a" },
  { label: "Green", value: "#2f6b41" },
  { label: "Plum", value: "#6b4a8f" },
  { label: "Amber", value: "#a86412" },
  { label: "Ink", value: "#141210" },
];

export const TONES: { label: string; value: ReportTone }[] = [
  { label: "Cream", value: "cream" },
  { label: "Dark", value: "dark" },
  { label: "Accent", value: "tint" },
];

export function newStatementId(): string {
  return `s_${Math.random().toString(36).slice(2, 9)}`;
}

export function emptyStatement(index: number): ReportStatement {
  return {
    id: newStatementId(),
    number: String(index + 1).padStart(2, "0"),
    headline: "",
    body: "",
    quote: "",
    quoteSource: "",
    photoUrl: "",
    tone: index % 2 === 1 ? "dark" : "cream",
  };
}

/** A blank-but-valid config. Defaults from live data are layered on top. */
export function blankConfig(): ReportConfig {
  return {
    version: 1,
    accent: "#e02214",
    footerLabel: "",
    cover: { photoUrl: "", stamp: "", kicker: "", title: "", lead: "" },
    numbers: { enabled: true, kicker: "The night in numbers", stats: [], note: "" },
    photos: {
      enabled: true,
      kicker: "How the night was captured",
      title: "",
      items: [],
    },
    statements: [],
    feedback: {
      enabled: false,
      kicker: "What the room told us",
      title: "",
      stats: [],
      testimonials: [],
    },
    close: {
      kicker: "Thank you",
      title: "",
      body: "",
      partners: [],
      nextLabel: "What happens next",
      nextText: "",
      linkLabel: "",
      linkUrl: "",
      showAcknowledgement: true,
    },
  };
}

// ------------------------------------------------------------------
// Parsing: anything that came out of jsonb is untrusted. Every field
// falls back to the blank default rather than throwing, so a half-saved
// or older config still renders.
// ------------------------------------------------------------------

function str(v: unknown, fallback = ""): string {
  return typeof v === "string" ? v : fallback;
}
function bool(v: unknown, fallback: boolean): boolean {
  return typeof v === "boolean" ? v : fallback;
}
function tone(v: unknown, fallback: ReportTone): ReportTone {
  return v === "cream" || v === "dark" || v === "tint" ? v : fallback;
}
function list<T>(v: unknown, map: (x: unknown) => T | null): T[] {
  if (!Array.isArray(v)) return [];
  const out: T[] = [];
  for (const item of v) {
    const m = map(item);
    if (m) out.push(m);
  }
  return out;
}
function obj(v: unknown): Record<string, unknown> {
  return v && typeof v === "object" && !Array.isArray(v)
    ? (v as Record<string, unknown>)
    : {};
}

export function parseConfig(input: unknown): ReportConfig {
  const base = blankConfig();
  const c = obj(input);
  const cover = obj(c.cover);
  const numbers = obj(c.numbers);
  const photos = obj(c.photos);
  const feedback = obj(c.feedback);
  const close = obj(c.close);

  return {
    version: 1,
    accent: /^#[0-9a-fA-F]{6}$/.test(str(c.accent)) ? str(c.accent) : base.accent,
    footerLabel: str(c.footerLabel),
    cover: {
      photoUrl: str(cover.photoUrl),
      stamp: str(cover.stamp),
      kicker: str(cover.kicker),
      title: str(cover.title),
      lead: str(cover.lead),
    },
    numbers: {
      enabled: bool(numbers.enabled, true),
      kicker: str(numbers.kicker, base.numbers.kicker),
      stats: list(numbers.stats, (x) => {
        const o = obj(x);
        const value = str(o.value);
        const label = str(o.label);
        return value || label ? { value, label } : null;
      }),
      note: str(numbers.note),
    },
    photos: {
      enabled: bool(photos.enabled, true),
      kicker: str(photos.kicker, base.photos.kicker),
      title: str(photos.title),
      items: list(photos.items, (x) => {
        const o = obj(x);
        const url = str(o.url);
        return url ? { url, caption: str(o.caption) } : null;
      }),
    },
    statements: list(c.statements, (x) => {
      const o = obj(x);
      return {
        id: str(o.id) || newStatementId(),
        number: str(o.number),
        headline: str(o.headline),
        body: str(o.body),
        quote: str(o.quote),
        quoteSource: str(o.quoteSource),
        photoUrl: str(o.photoUrl),
        tone: tone(o.tone, "cream"),
      };
    }),
    feedback: {
      enabled: bool(feedback.enabled, false),
      kicker: str(feedback.kicker, base.feedback.kicker),
      title: str(feedback.title),
      stats: list(feedback.stats, (x) => {
        const o = obj(x);
        const value = str(o.value);
        const label = str(o.label);
        return value || label ? { value, label } : null;
      }),
      testimonials: list(feedback.testimonials, (x) => {
        const o = obj(x);
        const text = str(o.text);
        return text ? { text, name: str(o.name) } : null;
      }),
    },
    close: {
      kicker: str(close.kicker, base.close.kicker),
      title: str(close.title),
      body: str(close.body),
      partners: list(close.partners, (x) => {
        const o = obj(x);
        const name = str(o.name);
        return name ? { name, label: str(o.label) } : null;
      }),
      nextLabel: str(close.nextLabel, base.close.nextLabel),
      nextText: str(close.nextText),
      linkLabel: str(close.linkLabel),
      linkUrl: str(close.linkUrl),
      showAcknowledgement: bool(close.showAcknowledgement, true),
    },
  };
}

/** How many pages the report will print to. Mirrors the renderer's order. */
export function pageCount(c: ReportConfig): number {
  let n = 1; // cover
  if (c.numbers.enabled) n += 1;
  if (c.photos.enabled && c.photos.items.length > 0) n += 1;
  n += c.statements.length;
  if (c.feedback.enabled) n += 1;
  n += 1; // close
  return n;
}
