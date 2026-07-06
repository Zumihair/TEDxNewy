/**
 * Newsletter block schema. Shared by the editor (client), the actions that
 * persist blocks as jsonb, and the server renderer (lib/newsletter-render).
 * Keep this file free of server-only imports so client components can use it.
 */

export type ImageWidthPct = 40 | 60 | 80 | 100;

export type NewsletterColumn =
  | { kind: "text"; html: string }
  | { kind: "image"; src: string; alt: string };

export type NewsletterBlock =
  | { id: string; type: "header"; text: string; size: "lg" | "md" }
  | { id: string; type: "text"; html: string }
  | {
      id: string;
      type: "image";
      src: string;
      alt: string;
      widthPct: ImageWidthPct;
      href?: string;
    }
  | {
      id: string;
      type: "twoColumn";
      left: NewsletterColumn;
      right: NewsletterColumn;
    }
  | {
      id: string;
      type: "button";
      label: string;
      href: string;
      align: "left" | "center";
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
      type: "countdown";
      // Either a date (YYYY-MM-DD) for the days/date styles, or a full ISO
      // datetime for the units style (which needs a time to count h/m/s).
      targetDate: string;
      label: string;
      style: "days" | "date" | "units";
    }
  | { id: string; type: "divider" };

export type BlockType = NewsletterBlock["type"];

export const BLOCK_TYPES: { type: BlockType; label: string; hint: string }[] = [
  { type: "header", label: "Header", hint: "A heading line" },
  { type: "text", label: "Text", hint: "A rich text paragraph" },
  { type: "image", label: "Image", hint: "A single image, sized" },
  { type: "twoColumn", label: "Two columns", hint: "Text and/or image side by side" },
  { type: "button", label: "Button", hint: "A call-to-action link" },
  { type: "video", label: "Video", hint: "A thumbnail that links out" },
  { type: "countdown", label: "Countdown", hint: "Days until a date" },
  { type: "divider", label: "Divider", hint: "A horizontal line" },
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
    case "twoColumn":
      return `${block.left.kind} / ${block.right.kind}`;
    case "button":
      return block.label || "(no label)";
    case "video":
      return block.caption || block.href || "(no video yet)";
    case "countdown":
      return `${block.label || "Countdown"} to ${block.targetDate || "(no date)"}`;
    case "divider":
      return "Horizontal line";
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
    case "twoColumn":
      return {
        id,
        type,
        left: { kind: "text", html: "<p>Left column.</p>" },
        right: { kind: "text", html: "<p>Right column.</p>" },
      };
    case "button":
      return { id, type, label: "Learn more", href: "", align: "center" };
    case "video":
      return { id, type, href: "", thumbnailSrc: "", caption: "" };
    case "countdown":
      return { id, type, targetDate: "", label: "Time to go", style: "units" };
    case "divider":
      return { id, type };
  }
}

function stripTags(html: string): string {
  return html
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

const WIDTHS: ImageWidthPct[] = [40, 60, 80, 100];

/**
 * Coerce untrusted jsonb (or editor state) into a clean NewsletterBlock[].
 * Drops anything malformed rather than throwing, so a bad row can never crash
 * a render or a send.
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
  switch (r.type) {
    case "header":
      return {
        id,
        type: "header",
        text: str(r.text),
        size: r.size === "md" ? "md" : "lg",
      };
    case "text":
      return { id, type: "text", html: str(r.html) };
    case "image":
      return {
        id,
        type: "image",
        src: str(r.src),
        alt: str(r.alt),
        widthPct: WIDTHS.includes(r.widthPct as ImageWidthPct)
          ? (r.widthPct as ImageWidthPct)
          : 100,
        ...(str(r.href) ? { href: str(r.href) } : {}),
      };
    case "twoColumn":
      return {
        id,
        type: "twoColumn",
        left: coerceColumn(r.left),
        right: coerceColumn(r.right),
      };
    case "button":
      return {
        id,
        type: "button",
        label: str(r.label),
        href: str(r.href),
        align: r.align === "left" ? "left" : "center",
      };
    case "video":
      return {
        id,
        type: "video",
        href: str(r.href),
        thumbnailSrc: str(r.thumbnailSrc),
        ...(str(r.caption) ? { caption: str(r.caption) } : {}),
      };
    case "countdown":
      return {
        id,
        type: "countdown",
        targetDate: str(r.targetDate),
        label: str(r.label),
        style:
          r.style === "date" ? "date" : r.style === "units" ? "units" : "days",
      };
    case "divider":
      return { id, type: "divider" };
    default:
      return null;
  }
}

function coerceColumn(raw: unknown): NewsletterColumn {
  if (raw && typeof raw === "object") {
    const r = raw as Record<string, unknown>;
    if (r.kind === "image") {
      return {
        kind: "image",
        src: typeof r.src === "string" ? r.src : "",
        alt: typeof r.alt === "string" ? r.alt : "",
      };
    }
    if (r.kind === "text") {
      return { kind: "text", html: typeof r.html === "string" ? r.html : "" };
    }
  }
  return { kind: "text", html: "" };
}
