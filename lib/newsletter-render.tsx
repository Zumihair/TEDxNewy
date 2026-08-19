/**
 * Server-only newsletter renderer. Turns a block list into an email-safe HTML
 * document using React Email, styled to match the transactional shell in
 * lib/email-templates.ts (cream page, 600px white card, dark footer; the
 * transactional shell's red accent rule is deliberately left out here). Adds two things the transactional shell doesn't have: a preheader
 * (inbox preview text) and a compliance unsubscribe footer.
 *
 * Do not import this from a client component.
 */
import {
  Body,
  Button,
  Column,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Img,
  Link,
  Preview,
  Row,
  Section,
  Text,
} from "@react-email/components";
import { render } from "@react-email/render";
import type { ReactNode } from "react";
import {
  CONTACT_EMAIL,
  LOGO_DARK_TEXT,
  LOGO_LIGHT_TEXT,
  SITE,
  SOCIALS,
  htmlToPlainText,
  styleRichBodyForEmail,
} from "@/lib/email-templates";
import {
  BLOCK_BACKGROUNDS,
  DIVIDER_COLOURS,
  ratioWidths,
  validateBlocks,
  type PreviewScheme,
  type BlockAlign,
  type BlockBg,
  type ButtonTheme,
  type ButtonVariant,
  type ColumnChild,
  type ImageWidth,
  type NewsletterBlock,
} from "@/lib/newsletter-blocks";

export type NewsletterRenderInput = {
  subject: string;
  preheader: string;
  blocks: unknown;
};

export type RenderOptions = {
  /** Absolute unsubscribe URL. Pass the %%UNSUB_URL%% placeholder to render
   *  once and substitute per recipient, or Mailchimp's *|UNSUB|* merge tag.
   *  Omit it for one-off transactional-style sends (e.g. Quick Compose) that
   *  have no unsubscribe token: the compliance footer sentence is then left
   *  out entirely. */
  unsubscribeUrl?: string;
  /** The date the email is (or will be) sent, used for the footer year. */
  sendDate: Date;
  /** Extra footer line, e.g. Mailchimp's *|LIST:ADDRESS|* merge tag (their
   *  compliance check requires the postal address in campaign content). */
  addressLine?: string;
  /** ADMIN PREVIEW ONLY. Pins the rendered document to one colour scheme so
   *  the preview toggle can show both without the viewer changing their OS
   *  setting. A real send must leave this undefined, or the email would carry
   *  one scheme's colours to every reader regardless of their device. */
  previewScheme?: PreviewScheme;
};

// Horizontal padding of the body Section. A full-bleed image cancels this with
// a matching negative margin to reach the card edges.
const BODY_PAD_X = 36;

// Brand red at body-copy weight on a near-black card is legible but muddy, so
// dark mode lifts it. Only used through the .e-body a / .e-accent rules.
const ACCENT_DARK = "#ff6f5e";

const BUTTON_THEME_IDS: ButtonTheme[] = ["red", "redDeep", "ink", "gradient"];

// Media queries for clients that support them (most modern mobile mail apps
// and the admin preview). Stacks column rows and lets the card go full width on
// narrow screens. Colour-scheme independent: everything that flips lives in
// DARK_RULES below.
const BASE_CSS = `
@media only screen and (max-width:600px) {
  .nl-col {
    display: block !important;
    width: 100% !important;
    max-width: 100% !important;
    padding: 0 0 16px 0 !important;
  }
  .nl-col-last { padding-bottom: 0 !important; }
}
`;

/**
 * A real dark-mode variant, as [selector, declarations] pairs rather than a
 * CSS string, because the same list has to be emitted three different ways:
 * inside the prefers-color-scheme query (what a reader gets), prefixed with
 * Outlook.com's [data-ogsb]/[data-ogsc] dark-mode attributes, and bare (no
 * query at all) for the admin's pinned dark preview. Writing it once means
 * those three can never drift.
 *
 * Every colour the blocks use is a fixed token, so in dark mode the whole card
 * flips to a dark surface and each token maps to a light-on-dark equivalent.
 * Light mode is untouched: the classes carry no styles of their own, so the
 * inline light values stay the default.
 *
 * The shared shell tokens (e-bg, e-card, e-ink, e-body, e-soft, e-muted,
 * e-btn-2, the logo swap) must keep the SAME VALUES as the hand-written block
 * in lib/email-templates.ts, since the two render the same brand: change one,
 * change both. The lists themselves are not mirrors and are not meant to be.
 * This one also covers what a block editor can choose (background tints,
 * button themes, rich-text links), which the fixed transactional layout has no
 * equivalent of; that file carries e-panel and e-border, which nothing here
 * renders. One value is deliberately allowed to differ: e-rule, a hairline,
 * predates this and is a flat colour here and a white alpha there.
 */
const DARK_RULES: [selector: string, declarations: string][] = [
  [".e-bg", "background:#100f0d !important;"],
  [".e-card", "background:#1c1a18 !important;"],
  [".e-ink", "color:#f4efe6 !important;"],
  [".e-body", "color:#cbc4b9 !important;"],
  [".e-soft", "color:#a79f93 !important;"],
  [".e-muted", "color:#a49b8f !important;"],
  [".e-rule", "border-top-color:#322e2a !important;"],
  // An ink divider is near-black: on a dark card it would vanish, so it flips
  // to the light hairline colour instead.
  [".e-rule-ink", "border-top-color:#f4efe6 !important;"],
  [".e-btn-2", "background:#2f2b27 !important;"],
  // The header wordmark swaps to the white version so "Newy" never disappears.
  [".e-logo-main", "display:none !important;"],
  [".e-logo-alt", "display:inline-block !important;"],
  // Brand red is the one accent that survives both surfaces, but at body-copy
  // size it reads muddy on near-black, so links and the video label lift to a
  // brighter red rather than staying at #e02214.
  [".e-body a", `color:${ACCENT_DARK} !important;`],
  [".e-accent", `color:${ACCENT_DARK} !important;`],
  // Standout block tints: deepen to dark-surface equivalents so text stays
  // readable when the card flips dark. Values come from BLOCK_BACKGROUNDS, so
  // the editor swatch and the rendered email cannot disagree.
  ...BLOCK_BACKGROUNDS.filter((b) => b.id !== "none").map(
    (b): [string, string] => [
      `.e-bg-${b.id}`,
      `background:${b.darkSwatch} !important;`,
    ],
  ),
  // Buttons. A near-black button is perfect on a light card and nearly
  // invisible on a dark one, so each theme carries a dark-mode fill rather
  // than being left to fend for itself.
  ...buttonDarkRules(),
];

/** Emit one dark-mode rule per button theme and variant. */
function buttonDarkRules(): [string, string][] {
  const out: [string, string][] = [];
  for (const theme of BUTTON_THEME_IDS) {
    for (const variant of ["solid", "outline"] as ButtonVariant[]) {
      const dark = buttonPaletteDark(theme)[variant];
      if (!dark) continue;
      out.push([`.${buttonClass(theme, variant)}`, dark]);
    }
  }
  return out;
}

/** The dark-mode rule list rendered as CSS text, each selector prefixed. */
function darkCss(prefix = ""): string {
  return DARK_RULES.map(([sel, decls]) => `${prefix}${sel} { ${decls} }`).join(
    "\n",
  );
}

/**
 * The document stylesheet. A real send gets the media query plus the
 * Outlook.com mirror, so the reader's own device decides. A preview render is
 * pinned instead: "dark" drops the query and applies the rules unconditionally,
 * "light" leaves them out entirely (so an admin on a dark-mode machine still
 * sees the light version).
 */
function styleSheet(previewScheme?: PreviewScheme): string {
  if (previewScheme === "light") return BASE_CSS;
  if (previewScheme === "dark") return `${BASE_CSS}\n${darkCss()}`;
  return [
    BASE_CSS,
    `@media (prefers-color-scheme: dark) {\n${darkCss()}\n}`,
    // [data-ogsc] (foreground) and [data-ogsb] (background) mirror it in
    // Outlook.com dark mode, which rewrites colours instead of honouring the
    // media query.
    darkCss("[data-ogsb] "),
    darkCss("[data-ogsc] "),
  ].join("\n");
}

// ---- standout block background ----

/** Light fill + the class carrying its dark partner, for each tint. Derived
 *  from BLOCK_BACKGROUNDS rather than restated, so the editor swatch, the
 *  painted surface and the dark rule can never disagree. */
const BG_SURFACE: Record<Exclude<BlockBg, "none">, { bg: string; cls: string }> =
  Object.fromEntries(
    BLOCK_BACKGROUNDS.filter((b) => b.id !== "none").map((b) => [
      b.id,
      { bg: b.swatch, cls: `e-bg-${b.id}` },
    ]),
  ) as Record<Exclude<BlockBg, "none">, { bg: string; cls: string }>;

/** Wrap a block's content in the vertical rhythm, and in a tinted rounded box
 *  when the block has a standout background. Each block case returns bare
 *  content (no bottom spacing of its own) so this owns the rhythm uniformly. */
function BlockWrapper({
  bg,
  children,
}: {
  bg?: BlockBg;
  children: ReactNode;
}) {
  if (!bg || bg === "none") {
    return <Section style={{ padding: "0 0 18px" }}>{children}</Section>;
  }
  const s = BG_SURFACE[bg];
  return (
    <Section style={{ padding: "0 0 18px" }}>
      <div
        className={s.cls}
        style={{
          background: s.bg,
          borderRadius: "12px",
          padding: "18px 20px",
        }}
      >
        {children}
      </div>
    </Section>
  );
}

// ---- shared content renderers (used by top-level blocks and column children) ----

/** Rich text. The toolbar writes alignment onto individual paragraphs, so this
 *  wrapper only carries the block's DEFAULT: `align` is legacy (drafts from
 *  before the toolbar had it) and text-align inherits, so a paragraph with its
 *  own style still wins. */
function TextContent({ html, align }: { html: string; align?: BlockAlign }) {
  return (
    <div
      className="e-body"
      style={{
        fontSize: "15px",
        lineHeight: 1.62,
        color: "#2a2521",
        textAlign: align ?? "left",
      }}
      dangerouslySetInnerHTML={{ __html: styleRichBodyForEmail(html) }}
    />
  );
}

function ImageContent({
  src,
  alt,
  widthPct,
}: {
  src: string;
  alt: string;
  widthPct: ImageWidth;
}) {
  if (!src) return null;
  // "full" only breaks out of the card at the top level; inside a column it is
  // just the full column width.
  const w = widthPct === "full" ? 100 : widthPct;
  return (
    <Img
      src={src}
      alt={alt}
      style={{
        width: `${w}%`,
        maxWidth: "100%",
        height: "auto",
        display: "inline-block",
        border: 0,
      }}
    />
  );
}

/** Solid colour + optional gradient + text colour for each button theme. The
 *  solid colour doubles as the Outlook fallback (Outlook ignores CSS
 *  gradients) and as the outline border/text colour. */
function buttonPalette(theme: ButtonTheme): {
  color: string;
  gradient?: string;
  fg: string;
} {
  switch (theme) {
    case "redDeep":
      return { color: "#2a0604", fg: "#ffffff" };
    case "ink":
      return { color: "#141210", fg: "#ffffff" };
    case "gradient":
      return {
        color: "#e02214",
        gradient: "linear-gradient(135deg,#e02214,#2a0604)",
        fg: "#ffffff",
      };
    case "red":
    default:
      return { color: "#e02214", fg: "#ffffff" };
  }
}

/**
 * What each theme becomes on a dark card, as CSS declarations for the dark
 * rules above. Undefined means the light value already contrasts and is left
 * alone (brand red on near-black), which keeps the stylesheet to the rules
 * that actually do something.
 *
 * The near-black themes INVERT rather than darken further: on #1c1a18 an ink
 * button is a dark shape on a dark card with only its label showing, which is
 * the bug this exists to fix. A light fill with dark text reads as the same
 * button, just the other way up.
 */
function buttonPaletteDark(theme: ButtonTheme): {
  solid?: string;
  outline?: string;
} {
  switch (theme) {
    case "redDeep":
      return {
        solid:
          "background-color:#f6e5e1 !important;background-image:none !important;color:#2a0604 !important;",
        outline: "border-color:#f0c4bb !important;color:#f0c4bb !important;",
      };
    case "ink":
      return {
        solid:
          "background-color:#f4efe6 !important;background-image:none !important;color:#141210 !important;",
        outline: "border-color:#f4efe6 !important;color:#f4efe6 !important;",
      };
    case "gradient":
      // The deep end of the light gradient is the half that disappears, so the
      // dark one runs bright red to brand red instead.
      return {
        solid:
          "background-color:#e02214 !important;background-image:linear-gradient(135deg,#ff5946,#c81b0f) !important;color:#ffffff !important;",
        outline: `border-color:${ACCENT_DARK} !important;color:${ACCENT_DARK} !important;`,
      };
    case "red":
    default:
      // A solid red button is vivid on both surfaces. Only the outline, which
      // is red-on-background rather than white-on-red, needs the lift.
      return {
        outline: `border-color:${ACCENT_DARK} !important;color:${ACCENT_DARK} !important;`,
      };
  }
}

/** The class that carries a button's dark-mode rule. One per theme+variant, so
 *  a solid and an outline of the same colour can flip differently. */
function buttonClass(theme: ButtonTheme, variant: ButtonVariant): string {
  return `e-btn-${theme.toLowerCase()}-${variant === "outline" ? "o" : "s"}`;
}

function ButtonContent({
  label,
  href,
  align,
  theme,
  variant,
}: Extract<ColumnChild, { kind: "button" }>) {
  if (!href) return null;
  const p = buttonPalette(theme);
  const solid = variant !== "outline";
  return (
    <div style={{ textAlign: align }}>
      <Button
        href={href}
        className={buttonClass(theme, variant)}
        style={{
          display: "inline-block",
          // backgroundColor is the Outlook-safe fallback; backgroundImage is the
          // gradient (or none) layered on top for modern clients.
          backgroundColor: solid ? p.color : "transparent",
          backgroundImage: solid ? p.gradient ?? "none" : "none",
          color: solid ? p.fg : p.color,
          border: solid ? "none" : `2px solid ${p.color}`,
          textDecoration: "none",
          fontWeight: 600,
          fontSize: "14px",
          lineHeight: 1,
          padding: solid ? "13px 24px" : "11px 22px",
          borderRadius: "999px",
        }}
      >
        {label}
      </Button>
    </div>
  );
}

/** One column child (text / image / button). Images centre inside the column. */
function ColumnChildView({ child }: { child: ColumnChild }) {
  switch (child.kind) {
    case "text":
      return <TextContent html={child.html} align={child.align} />;
    case "image":
      return child.src ? (
        <div style={{ textAlign: "center" }}>
          <ImageContent src={child.src} alt={child.alt} widthPct={child.widthPct} />
        </div>
      ) : null;
    case "button":
      return <ButtonContent {...child} />;
  }
}

/** A vertical stack of children inside one column, with spacing between them. */
function ColumnStack({ stack }: { stack: ColumnChild[] }) {
  return (
    <>
      {stack.map((child, i) => (
        <div
          key={child.id}
          style={{ paddingBottom: i === stack.length - 1 ? 0 : "14px" }}
        >
          <ColumnChildView child={child} />
        </div>
      ))}
    </>
  );
}

// ---- block rendering ----

/** The bare content for a block (no outer spacing: BlockWrapper owns that). */
function BlockView({ block }: { block: NewsletterBlock }) {
  switch (block.type) {
    case "header":
      return (
        <Heading
          as={block.size === "lg" ? "h1" : "h2"}
          className="e-ink"
          style={{
            margin: 0,
            fontSize: block.size === "lg" ? "23px" : "19px",
            lineHeight: 1.22,
            fontWeight: 600,
            color: "#141210",
            letterSpacing: "-0.01em",
            textAlign: block.align ?? "left",
          }}
        >
          {block.text}
        </Heading>
      );

    case "text":
      return <TextContent html={block.html} align={block.align} />;

    case "image": {
      if (!block.src) return null;
      // Full-bleed only when there's no standout box to break out of.
      const fullBleed = block.widthPct === "full" && !block.bg;
      if (fullBleed) {
        const img = (
          <Img
            src={block.src}
            alt={block.alt}
            style={{
              width: "100%",
              maxWidth: "100%",
              height: "auto",
              display: "block",
              border: 0,
            }}
          />
        );
        return (
          <div style={{ margin: `0 -${BODY_PAD_X}px` }}>
            {block.href ? <Link href={block.href}>{img}</Link> : img}
          </div>
        );
      }
      const img = (
        <ImageContent src={block.src} alt={block.alt} widthPct={block.widthPct} />
      );
      return (
        <div style={{ textAlign: "center" }}>
          {block.href ? <Link href={block.href}>{img}</Link> : img}
        </div>
      );
    }

    case "columns": {
      const widths = ratioWidths(block.cols.length, block.ratio);
      const last = block.cols.length - 1;
      return (
        <Row>
          {block.cols.map((stack, i) => (
            <Column
              key={i}
              className={i === last ? "nl-col nl-col-last" : "nl-col"}
              style={{
                width: `${widths[i] ?? Math.floor(100 / block.cols.length)}%`,
                verticalAlign: block.valign,
                paddingRight: i === last ? 0 : "10px",
                paddingLeft: i === 0 ? 0 : "10px",
              }}
            >
              <ColumnStack stack={stack} />
            </Column>
          ))}
        </Row>
      );
    }

    case "button":
      return <ButtonContent {...toButtonChild(block)} />;

    case "video": {
      if (!block.thumbnailSrc || !block.href) return null;
      return (
        <div style={{ textAlign: "center" }}>
          <Link href={block.href} style={{ textDecoration: "none" }}>
            <Img
              src={block.thumbnailSrc}
              alt={block.caption || "Watch the video"}
              style={{
                width: "100%",
                maxWidth: "100%",
                height: "auto",
                display: "block",
                border: 0,
                borderRadius: "10px",
              }}
            />
            <span
              className="e-accent"
              style={{
                display: "inline-block",
                marginTop: "10px",
                fontSize: "13px",
                fontWeight: 600,
                color: "#e02214",
              }}
            >
              &#9658; Watch the video
            </span>
          </Link>
          {block.caption ? (
            <Text
              className="e-soft"
              style={{ margin: "6px 0 0", fontSize: "13px", color: "#6b6459" }}
            >
              {block.caption}
            </Text>
          ) : null}
        </div>
      );
    }

    case "divider":
      return <DividerView block={block} />;
  }
}

/**
 * The four divider looks. Each is plain block-level HTML with inline styles
 * (no flex, no pseudo-elements) so Outlook renders them the same as everyone
 * else. Colour carries a dark-mode class where the light-mode value would
 * disappear on a dark card: `e-rule` for the soft hairline (already flipped
 * in the stylesheet) and `e-rule-ink` for ink. Red needs no flip.
 */
function DividerView({
  block,
}: {
  block: Extract<NewsletterBlock, { type: "divider" }>;
}) {
  const hex = DIVIDER_COLOURS.find((c) => c.id === block.colour)?.hex ?? "#efe9dd";
  const ruleClass =
    block.colour === "soft" ? "e-rule" : block.colour === "ink" ? "e-rule-ink" : "";
  // The X glyph reuses the text colour classes, which already flip in dark
  // mode, rather than a border colour.
  const glyphClass =
    block.colour === "soft" ? "e-soft" : block.colour === "ink" ? "e-ink" : "";

  switch (block.style) {
    case "accent":
      return (
        <div
          style={{
            height: "3px",
            width: "46px",
            background: hex,
            borderRadius: "2px",
          }}
        />
      );

    case "short":
      return (
        <Hr
          className={ruleClass}
          style={{
            margin: "0 auto",
            width: "70%",
            border: "none",
            borderTop: `1px solid ${hex}`,
          }}
        />
      );

    case "x":
      // A three-cell table: hairline, glyph, hairline. Row/Column render as
      // a real <table>, which is the only layout Outlook can be trusted with.
      return (
        <Row>
          <Column style={{ verticalAlign: "middle" }}>
            <div className={ruleClass} style={{ borderTop: `1px solid ${hex}` }} />
          </Column>
          <Column style={{ width: "44px", verticalAlign: "middle" }}>
            <div
              className={glyphClass}
              style={{
                textAlign: "center",
                fontSize: "15px",
                lineHeight: "15px",
                fontWeight: 700,
                color: hex,
              }}
            >
              &#10005;
            </div>
          </Column>
          <Column style={{ verticalAlign: "middle" }}>
            <div className={ruleClass} style={{ borderTop: `1px solid ${hex}` }} />
          </Column>
        </Row>
      );

    case "thin":
    default:
      return (
        <Hr
          className={ruleClass}
          style={{ margin: 0, border: "none", borderTop: `1px solid ${hex}` }}
        />
      );
  }
}

/** A top-level button block reuses the shared ButtonContent (same shape as a
 *  column-child button). */
function toButtonChild(
  block: Extract<NewsletterBlock, { type: "button" }>,
): Extract<ColumnChild, { kind: "button" }> {
  return {
    id: block.id,
    kind: "button",
    label: block.label,
    href: block.href,
    align: block.align,
    theme: block.theme,
    variant: block.variant,
  };
}

// ---- the email document ----

export function NewsletterEmail({
  subject,
  preheader,
  blocks,
  unsubscribeUrl,
  sendDate,
  addressLine,
  previewScheme,
}: {
  subject: string;
  preheader: string;
  blocks: NewsletterBlock[];
  unsubscribeUrl?: string;
  sendDate: Date;
  addressLine?: string;
  previewScheme?: PreviewScheme;
}) {
  const year = new Intl.DateTimeFormat("en-AU", {
    timeZone: "Australia/Sydney",
    year: "numeric",
  }).format(sendDate);

  return (
    <Html lang="en">
      <Head>
        <title>{subject}</title>
        {/* A pinned preview declares the one scheme it is showing, so the
            client (or the preview iframe) doesn't try to adapt it a second
            time on top of what we already painted. */}
        <meta
          name="color-scheme"
          content={previewScheme ?? "light dark"}
        />
        <meta
          name="supported-color-schemes"
          content={previewScheme ?? "light dark"}
        />
        <meta name="viewport" content="width=device-width,initial-scale=1" />
        <style
          dangerouslySetInnerHTML={{ __html: styleSheet(previewScheme) }}
        />
      </Head>
      {preheader ? <Preview>{preheader}</Preview> : null}
      <Body
        className="e-bg"
        style={{
          margin: 0,
          padding: 0,
          background: "#f4efe6",
          fontFamily:
            "-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif",
        }}
      >
        {/* The page surround carries e-bg as well as <Body>. React Email's Body
            renders an inner table cell that copies the body's inline style but
            NOT its className, so on a dark device the cream from that cell sat
            around the card while everything else had flipped. Painting this
            table covers it. */}
        <Section className="e-bg" style={{ background: "#f4efe6", padding: "28px 14px" }}>
          <Container
            className="e-card"
            style={{
              width: "100%",
              maxWidth: "600px",
              background: "#ffffff",
              borderRadius: "18px",
              overflow: "hidden",
            }}
          >
            {/* header */}
            <Section style={{ padding: "34px 36px 0", textAlign: "center" }}>
              <Link href={SITE}>
                <Img
                  className="e-logo-main"
                  src={LOGO_DARK_TEXT}
                  alt="TEDxNewy"
                  width="170"
                  style={{
                    width: "170px",
                    maxWidth: "62%",
                    height: "auto",
                    display: "inline-block",
                    border: 0,
                  }}
                />
                <Img
                  className="e-logo-alt"
                  src={LOGO_LIGHT_TEXT}
                  alt="TEDxNewy"
                  width="170"
                  style={{
                    width: "170px",
                    maxWidth: "62%",
                    height: "auto",
                    display: "none",
                    border: 0,
                  }}
                />
              </Link>
            </Section>
            {/* body. No accent rule under the wordmark: it read as a stray
                horizontal bar at the top of every email, and there was no way
                to remove it from inside the block editor. */}
            <Section style={{ padding: `28px ${BODY_PAD_X}px 30px` }}>
              {blocks.map((b) => (
                <BlockWrapper key={b.id} bg={"bg" in b ? b.bg : undefined}>
                  <BlockView block={b} />
                </BlockWrapper>
              ))}
            </Section>

            {/* footer */}
            <Section style={{ background: "#141210", padding: "30px 36px" }}>
              <Link href={SITE}>
                <Img
                  src={LOGO_LIGHT_TEXT}
                  alt="TEDxNewy"
                  width="124"
                  style={{
                    width: "124px",
                    height: "auto",
                    display: "block",
                    border: 0,
                    marginBottom: "18px",
                  }}
                />
              </Link>
              <div style={{ fontSize: "13px", lineHeight: 1.6 }}>
                {SOCIALS.map((s) => (
                  <Link
                    key={s.label}
                    href={s.href}
                    style={{
                      display: "inline-block",
                      marginRight: "16px",
                      textDecoration: "none",
                    }}
                  >
                    <Img
                      src={s.icon}
                      alt={s.label}
                      width="22"
                      height="22"
                      style={{
                        width: "22px",
                        height: "22px",
                        display: "inline-block",
                        border: 0,
                        verticalAlign: "middle",
                      }}
                    />
                  </Link>
                ))}
              </div>
              <div style={{ marginTop: "12px", fontSize: "13px", lineHeight: 1.6 }}>
                <Link
                  href={`mailto:${CONTACT_EMAIL}`}
                  style={{ color: "#f4efe6", textDecoration: "none" }}
                >
                  {CONTACT_EMAIL}
                </Link>
                <span style={{ color: "#5a534b" }}>&nbsp;&middot;&nbsp;</span>
                <Link href={SITE} style={{ color: "#f4efe6", textDecoration: "none" }}>
                  tedxnewy.com.au
                </Link>
              </div>
              <Hr
                style={{
                  margin: "20px 0 16px",
                  border: "none",
                  borderTop: "1px solid rgba(255,255,255,0.1)",
                }}
              />
              <div
                style={{
                  fontSize: "11.5px",
                  lineHeight: 1.7,
                  color: "#8a8278",
                }}
              >
                {/* The subscribe/unsubscribe sentence only applies to list
                    mail. One-off compose sends pass no unsubscribeUrl, so the
                    whole sentence (and its address line) is left out, keeping
                    just the copyright and Privacy/Code of Conduct lines. */}
                {unsubscribeUrl ? (
                  <>
                    {"You are receiving this because you subscribed at tedxnewy.com.au. "}
                    <Link
                      href={unsubscribeUrl}
                      style={{ color: "#8a8278", textDecoration: "underline" }}
                    >
                      Unsubscribe
                    </Link>
                    {addressLine ? (
                      <>
                        <br />
                        {addressLine}
                      </>
                    ) : null}
                    <br />
                  </>
                ) : null}
                {/* One string, one text node: adjacent JSX text nodes get
                    comment separators in the rendered HTML, and some mail
                    clients eat the whitespace at that boundary. */}
                {`© ${year} Newcastle Ideas Network Limited · ACN 694 346 319`}
                <br />
                <Link
                  href={`${SITE}/privacy`}
                  style={{ color: "#8a8278", textDecoration: "underline" }}
                >
                  Privacy
                </Link>
                <span style={{ color: "#5a534b" }}>&nbsp;&middot;&nbsp;</span>
                <Link
                  href={`${SITE}/code-of-conduct`}
                  style={{ color: "#8a8278", textDecoration: "underline" }}
                >
                  Code of Conduct
                </Link>
              </div>
            </Section>
          </Container>
        </Section>
      </Body>
    </Html>
  );
}

/** Flatten one column child to plain text. */
function childToText(child: ColumnChild): string {
  switch (child.kind) {
    case "text":
      return htmlToPlainText(child.html);
    case "image":
      return child.alt;
    case "button":
      return child.href ? `${child.label}: ${child.href}` : child.label;
  }
}

/** Build a readable plain-text part from the blocks. */
function blocksToText(
  blocks: NewsletterBlock[],
  unsubscribeUrl?: string,
): string {
  const parts: string[] = [];
  for (const b of blocks) {
    switch (b.type) {
      case "header":
        if (b.text) parts.push(b.text);
        break;
      case "text":
        parts.push(htmlToPlainText(b.html));
        break;
      case "image":
        if (b.alt) parts.push(b.alt);
        break;
      case "columns":
        for (const stack of b.cols) {
          for (const child of stack) {
            const t = childToText(child);
            if (t) parts.push(t);
          }
        }
        break;
      case "button":
        if (b.href) parts.push(`${b.label}: ${b.href}`);
        break;
      case "video":
        parts.push(
          [b.caption, b.href].filter(Boolean).join(" ") || "Watch the video",
        );
        break;
      case "divider":
        parts.push("----------");
        break;
    }
  }
  if (unsubscribeUrl) parts.push(`\n--\nUnsubscribe: ${unsubscribeUrl}`);
  return parts.filter(Boolean).join("\n\n").trim();
}

/** Render a newsletter to email-safe html + a plain-text fallback. */
export async function renderNewsletter(
  input: NewsletterRenderInput,
  opts: RenderOptions,
): Promise<{ html: string; text: string }> {
  const blocks = validateBlocks(input.blocks);
  const html = await render(
    <NewsletterEmail
      subject={input.subject}
      preheader={input.preheader}
      blocks={blocks}
      unsubscribeUrl={opts.unsubscribeUrl}
      sendDate={opts.sendDate}
      addressLine={opts.addressLine}
      previewScheme={opts.previewScheme}
    />,
  );
  const text = blocksToText(blocks, opts.unsubscribeUrl);
  return { html, text };
}
