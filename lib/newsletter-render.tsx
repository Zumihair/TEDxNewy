/**
 * Server-only newsletter renderer. Turns a block list into an email-safe HTML
 * document using React Email, styled to match the transactional shell in
 * lib/email-templates.ts (cream page, 600px white card, red accent bar, dark
 * footer). Adds two things the transactional shell doesn't have: a preheader
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
  ratioWidths,
  validateBlocks,
  type BlockBg,
  type ButtonTheme,
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
};

// Horizontal padding of the body Section. A full-bleed image cancels this with
// a matching negative margin to reach the card edges.
const BODY_PAD_X = 36;

// Media queries for clients that support them (most modern mobile mail apps
// and the admin preview). Stacks column rows and lets the card go full width on
// narrow screens.
const MOBILE_CSS = `
@media only screen and (max-width:600px) {
  .nl-col {
    display: block !important;
    width: 100% !important;
    max-width: 100% !important;
    padding: 0 0 16px 0 !important;
  }
  .nl-col-last { padding-bottom: 0 !important; }
}
/* A real dark-mode variant. Every colour the blocks use is a fixed token, so
   in dark mode the whole card flips to a dark surface and each token maps to a
   light-on-dark equivalent via these classes. Light mode is untouched. The
   header wordmark swaps to the white version so "Newy" never disappears.
   [data-ogsc] (foreground) and [data-ogsb] (background) mirror it in
   Outlook.com dark mode. Kept in lockstep with lib/email-templates.ts. */
@media (prefers-color-scheme: dark) {
  .e-bg { background:#100f0d !important; }
  .e-card { background:#1c1a18 !important; }
  .e-ink { color:#f4efe6 !important; }
  .e-body { color:#cbc4b9 !important; }
  .e-soft { color:#a79f93 !important; }
  .e-muted { color:#a49b8f !important; }
  .e-rule { border-top-color:#322e2a !important; }
  .e-btn-2 { background:#2f2b27 !important; }
  .e-logo-main { display:none !important; }
  .e-logo-alt { display:inline-block !important; }
  /* Standout block tints: deepen to dark-surface equivalents so text stays
     readable when the card flips dark. */
  .e-bg-cream { background:#26231f !important; }
  .e-bg-sand { background:#2a2620 !important; }
  .e-bg-blush { background:#2e1a17 !important; }
  .e-bg-stone { background:#26231f !important; }
}
[data-ogsb] .e-bg { background:#100f0d !important; }
[data-ogsb] .e-card { background:#1c1a18 !important; }
[data-ogsc] .e-ink { color:#f4efe6 !important; }
[data-ogsc] .e-body { color:#cbc4b9 !important; }
[data-ogsc] .e-soft { color:#a79f93 !important; }
[data-ogsc] .e-muted { color:#a49b8f !important; }
[data-ogsb] .e-btn-2 { background:#2f2b27 !important; }
[data-ogsc] .e-logo-main { display:none !important; }
[data-ogsc] .e-logo-alt { display:inline-block !important; }
[data-ogsb] .e-bg-cream { background:#26231f !important; }
[data-ogsb] .e-bg-sand { background:#2a2620 !important; }
[data-ogsb] .e-bg-blush { background:#2e1a17 !important; }
[data-ogsb] .e-bg-stone { background:#26231f !important; }
`;

// ---- standout block background ----

const BG_SURFACE: Record<Exclude<BlockBg, "none">, { bg: string; cls: string }> =
  {
    cream: { bg: "#f4efe6", cls: "e-bg-cream" },
    sand: { bg: "#efe6d6", cls: "e-bg-sand" },
    blush: { bg: "#fbe7e5", cls: "e-bg-blush" },
    stone: { bg: "#eae4da", cls: "e-bg-stone" },
  };

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

function TextContent({ html }: { html: string }) {
  return (
    <div
      className="e-body"
      style={{ fontSize: "15px", lineHeight: 1.62, color: "#2a2521" }}
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
      return <TextContent html={child.html} />;
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
          }}
        >
          {block.text}
        </Heading>
      );

    case "text":
      return <TextContent html={block.html} />;

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
      return (
        <Hr
          className="e-rule"
          style={{ margin: 0, border: "none", borderTop: "1px solid #efe9dd" }}
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
}: {
  subject: string;
  preheader: string;
  blocks: NewsletterBlock[];
  unsubscribeUrl?: string;
  sendDate: Date;
  addressLine?: string;
}) {
  const year = new Intl.DateTimeFormat("en-AU", {
    timeZone: "Australia/Sydney",
    year: "numeric",
  }).format(sendDate);

  return (
    <Html lang="en">
      <Head>
        <title>{subject}</title>
        <meta name="color-scheme" content="light dark" />
        <meta name="supported-color-schemes" content="light dark" />
        <meta name="viewport" content="width=device-width,initial-scale=1" />
        <style dangerouslySetInnerHTML={{ __html: MOBILE_CSS }} />
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
        <Section style={{ padding: "28px 14px" }}>
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
            <Section style={{ padding: "22px 36px 0" }}>
              <div
                style={{
                  height: "3px",
                  width: "46px",
                  background: "#e02214",
                  borderRadius: "2px",
                }}
              />
            </Section>

            {/* body */}
            <Section style={{ padding: `22px ${BODY_PAD_X}px 30px` }}>
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
    />,
  );
  const text = blocksToText(blocks, opts.unsubscribeUrl);
  return { html, text };
}
