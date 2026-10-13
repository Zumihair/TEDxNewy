/**
 * Tiny helpers for writing newsletter drafts as code. Each helper returns a
 * block in exactly the shape `lib/newsletter-blocks.ts` stores, and
 * `build.mts` runs the finished list through that file's own
 * `validateBlocks`, so a typo here is normalised or dropped the same way the
 * editor would, never saved as junk.
 *
 * Block ids only need to be unique within one newsletter. They are derived
 * from the draft slug plus position, so re-running the build gives the same
 * SQL every time.
 */
import type {
  BlockBg,
  ButtonTheme,
  ButtonVariant,
  ColumnChild,
  DividerColour,
  DividerStyle,
  ImageRatio,
  ImageWidth,
  NewsletterBlock,
} from "../../lib/newsletter-blocks";

export type Draft = {
  /** Used for the file name and block ids. Lowercase, hyphens. */
  slug: string;
  /** Internal name shown in the campaigns list. Also the "already inserted?"
   *  key, so keep it unique and stable. */
  title: string;
  subject: string;
  preheader: string;
  /** "subscribers" (everyone), "ticket-purchasers", or
   *  "subscribers-not-ticket-purchasers". */
  audience: "subscribers" | "ticket-purchasers" | "subscribers-not-ticket-purchasers";
  blocks: (n: Next) => NewsletterBlock[];
};

export type Next = () => string;

export const SITE = "https://tedxnewy.com.au";
/** Hosted newsletter images live in public/images/newsletter/. */
export const img = (file: string) => `${SITE}/images/newsletter/${file}`;

export function makeNext(slug: string): Next {
  let i = 0;
  return () => `${slug}-${String(++i).padStart(2, "0")}`;
}

type Common = { bg?: BlockBg };

export const header = (
  id: string,
  text: string,
  o: { size?: "lg" | "md"; align?: "left" | "center" | "right" } & Common = {},
): NewsletterBlock => ({
  id,
  type: "header",
  text,
  size: o.size ?? "lg",
  ...(o.align ? { align: o.align } : {}),
  ...(o.bg ? { bg: o.bg } : {}),
});

/** `html` is the editor's rich text: <p>, <strong>, <a href>, <ul><li>. */
export const text = (
  id: string,
  html: string,
  o: { align?: "left" | "center" | "right" } & Common = {},
): NewsletterBlock => ({
  id,
  type: "text",
  html,
  ...(o.align ? { align: o.align } : {}),
  ...(o.bg ? { bg: o.bg } : {}),
});

export const image = (
  id: string,
  src: string,
  alt: string,
  o: { width?: ImageWidth; ratio?: ImageRatio; href?: string } & Common = {},
): NewsletterBlock => ({
  id,
  type: "image",
  src,
  alt,
  widthPct: o.width ?? 100,
  ...(o.ratio ? { ratio: o.ratio } : {}),
  ...(o.href ? { href: o.href } : {}),
  ...(o.bg ? { bg: o.bg } : {}),
});

export const button = (
  id: string,
  label: string,
  href: string,
  o: {
    theme?: ButtonTheme;
    variant?: ButtonVariant;
    align?: "left" | "center";
  } & Common = {},
): NewsletterBlock => ({
  id,
  type: "button",
  label,
  href,
  align: o.align ?? "center",
  theme: o.theme ?? "red",
  variant: o.variant ?? "solid",
  ...(o.bg ? { bg: o.bg } : {}),
});

export const divider = (
  id: string,
  style: DividerStyle = "short",
  colour: DividerColour = "soft",
): NewsletterBlock => ({ id, type: "divider", style, colour });

export const video = (
  id: string,
  href: string,
  thumbnailSrc: string,
  caption = "",
): NewsletterBlock => ({ id, type: "video", href, thumbnailSrc, caption });

/** Child builders for `columns`. */
export const cText = (id: string, html: string): ColumnChild => ({
  id,
  kind: "text",
  html,
});
export const cImage = (
  id: string,
  src: string,
  alt: string,
  o: { width?: ImageWidth; ratio?: ImageRatio } = {},
): ColumnChild => ({
  id,
  kind: "image",
  src,
  alt,
  widthPct: o.width ?? 100,
  ...(o.ratio ? { ratio: o.ratio } : {}),
});
export const cButton = (
  id: string,
  label: string,
  href: string,
  o: { theme?: ButtonTheme; variant?: ButtonVariant } = {},
): ColumnChild => ({
  id,
  kind: "button",
  label,
  href,
  align: "left",
  theme: o.theme ?? "red",
  variant: o.variant ?? "solid",
});

/** `ratio` is a COLUMN_RATIOS id: "50-50", "33-66", "66-33", "40-60", "60-40"
 *  for two columns; "33-33-33", "25-50-25", "50-25-25", "25-25-50" for three. */
export const columns = (
  id: string,
  cols: ColumnChild[][],
  o: { ratio?: string; valign?: "top" | "middle" | "bottom" } & Common = {},
): NewsletterBlock => ({
  id,
  type: "columns",
  cols,
  ratio: o.ratio ?? (cols.length === 3 ? "33-33-33" : "50-50"),
  valign: o.valign ?? "top",
  ...(o.bg ? { bg: o.bg } : {}),
});
