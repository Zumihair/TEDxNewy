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
  validateBlocks,
  type NewsletterBlock,
  type NewsletterColumn,
} from "@/lib/newsletter-blocks";

export type NewsletterRenderInput = {
  subject: string;
  preheader: string;
  blocks: unknown;
};

export type RenderOptions = {
  /** Absolute unsubscribe URL. Pass the %%UNSUB_URL%% placeholder to render
   *  once and substitute per recipient. */
  unsubscribeUrl: string;
  /** The date the email is (or will be) sent, for countdown maths. */
  sendDate: Date;
};

// ---- countdown helpers (Australia/Sydney calendar days) ----

function daysUntil(targetDate: string, from: Date): number | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(targetDate)) return null;
  const todayStr = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Australia/Sydney",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(from);
  const today = Date.parse(`${todayStr}T00:00:00Z`);
  const target = Date.parse(`${targetDate}T00:00:00Z`);
  if (Number.isNaN(target) || Number.isNaN(today)) return null;
  return Math.round((target - today) / 86_400_000);
}

function formatTargetDate(targetDate: string): string {
  const t = Date.parse(`${targetDate}T00:00:00Z`);
  if (Number.isNaN(t)) return targetDate;
  return new Intl.DateTimeFormat("en-AU", {
    timeZone: "UTC",
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(new Date(t));
}

function countdownText(
  block: Extract<NewsletterBlock, { type: "countdown" }>,
  sendDate: Date,
): string {
  if (block.style === "units") {
    const p = remainingParts(block.targetDate, sendDate);
    if (!p) return formatTargetDate(block.targetDate);
    return `${p.days}d ${p.hours}h ${p.minutes}m ${p.seconds}s`;
  }
  if (block.style === "date") return formatTargetDate(block.targetDate);
  const days = daysUntil(block.targetDate, sendDate);
  if (days === null) return formatTargetDate(block.targetDate);
  if (days > 1) return `${days} days to go`;
  if (days === 1) return "1 day to go";
  if (days === 0) return "Today";
  return formatTargetDate(block.targetDate); // past: just show the date
}

/** Parse a countdown target into an instant. Accepts a full ISO datetime, or a
 *  bare date which is read as midnight Australia/Sydney. */
function parseTargetInstant(target: string): Date | null {
  if (!target) return null;
  if (/^\d{4}-\d{2}-\d{2}$/.test(target)) {
    // Bare date: anchor to Sydney midnight. AEST is +10, AEDT +11; +10 is close
    // enough for a bare-date units display (the days/date styles use exact
    // calendar-day maths instead).
    const t = Date.parse(`${target}T00:00:00+10:00`);
    return Number.isNaN(t) ? null : new Date(t);
  }
  const t = Date.parse(target);
  return Number.isNaN(t) ? null : new Date(t);
}

/** Whole days/hours/minutes/seconds remaining, floored at zero (past = all 0). */
function remainingParts(
  target: string,
  from: Date,
): { days: number; hours: number; minutes: number; seconds: number } | null {
  const t = parseTargetInstant(target);
  if (!t) return null;
  let ms = Math.max(0, t.getTime() - from.getTime());
  const days = Math.floor(ms / 86_400_000);
  ms -= days * 86_400_000;
  const hours = Math.floor(ms / 3_600_000);
  ms -= hours * 3_600_000;
  const minutes = Math.floor(ms / 60_000);
  ms -= minutes * 60_000;
  const seconds = Math.floor(ms / 1000);
  return { days, hours, minutes, seconds };
}

// ---- block components ----

function ColumnContent({ col }: { col: NewsletterColumn }) {
  if (col.kind === "image") {
    if (!col.src) return null;
    return (
      <Img
        src={col.src}
        alt={col.alt}
        style={{ width: "100%", height: "auto", display: "block", border: 0 }}
      />
    );
  }
  return (
    <div
      style={{ fontSize: "15px", lineHeight: 1.62, color: "#2a2521" }}
      dangerouslySetInnerHTML={{ __html: styleRichBodyForEmail(col.html) }}
    />
  );
}

function BlockView({
  block,
  sendDate,
}: {
  block: NewsletterBlock;
  sendDate: Date;
}) {
  switch (block.type) {
    case "header":
      return (
        <Section style={{ padding: "0 0 18px" }}>
          <Heading
            as={block.size === "lg" ? "h1" : "h2"}
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
        </Section>
      );

    case "text":
      return (
        <Section style={{ padding: "0 0 18px" }}>
          <div
            style={{ fontSize: "15px", lineHeight: 1.62, color: "#2a2521" }}
            dangerouslySetInnerHTML={{
              __html: styleRichBodyForEmail(block.html),
            }}
          />
        </Section>
      );

    case "image": {
      if (!block.src) return null;
      const img = (
        <Img
          src={block.src}
          alt={block.alt}
          style={{
            width: `${block.widthPct}%`,
            maxWidth: "100%",
            height: "auto",
            display: "inline-block",
            border: 0,
          }}
        />
      );
      return (
        <Section style={{ padding: "0 0 18px", textAlign: "center" }}>
          {block.href ? <Link href={block.href}>{img}</Link> : img}
        </Section>
      );
    }

    case "twoColumn":
      return (
        <Section style={{ padding: "0 0 18px" }}>
          <Row>
            <Column style={{ width: "50%", verticalAlign: "top", paddingRight: "10px" }}>
              <ColumnContent col={block.left} />
            </Column>
            <Column style={{ width: "50%", verticalAlign: "top", paddingLeft: "10px" }}>
              <ColumnContent col={block.right} />
            </Column>
          </Row>
        </Section>
      );

    case "button": {
      if (!block.href) return null;
      return (
        <Section style={{ padding: "6px 0 18px", textAlign: block.align }}>
          <Button
            href={block.href}
            style={{
              display: "inline-block",
              background: "#e02214",
              color: "#ffffff",
              textDecoration: "none",
              fontWeight: 600,
              fontSize: "14px",
              lineHeight: 1,
              padding: "13px 24px",
              borderRadius: "999px",
            }}
          >
            {block.label}
          </Button>
        </Section>
      );
    }

    case "video": {
      if (!block.thumbnailSrc || !block.href) return null;
      return (
        <Section style={{ padding: "0 0 18px", textAlign: "center" }}>
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
              style={{
                margin: "6px 0 0",
                fontSize: "13px",
                color: "#6b6459",
              }}
            >
              {block.caption}
            </Text>
          ) : null}
        </Section>
      );
    }

    case "countdown": {
      if (block.style === "units") {
        const p = remainingParts(block.targetDate, sendDate) ?? {
          days: 0,
          hours: 0,
          minutes: 0,
          seconds: 0,
        };
        const cells: [number, string][] = [
          [p.days, "Days"],
          [p.hours, "Hours"],
          [p.minutes, "Minutes"],
          [p.seconds, "Seconds"],
        ];
        return (
          <Section style={{ padding: "4px 0 18px", textAlign: "center" }}>
            <Text
              style={{
                margin: "0 0 10px",
                fontSize: "12px",
                fontWeight: 700,
                letterSpacing: "0.22em",
                textTransform: "uppercase",
                color: "#6b6459",
              }}
            >
              {block.label}
            </Text>
            <Row>
              {cells.map(([n, unit]) => (
                <Column key={unit} style={{ width: "25%", textAlign: "center" }}>
                  <div
                    style={{
                      margin: "0 4px",
                      background: "#141210",
                      borderRadius: "10px",
                      padding: "12px 0",
                    }}
                  >
                    <div
                      style={{
                        fontSize: "26px",
                        fontWeight: 700,
                        lineHeight: 1,
                        color: "#ffffff",
                      }}
                    >
                      {String(n).padStart(2, "0")}
                    </div>
                    <div
                      style={{
                        marginTop: "6px",
                        fontSize: "10px",
                        fontWeight: 600,
                        letterSpacing: "0.14em",
                        textTransform: "uppercase",
                        color: "#a59f93",
                      }}
                    >
                      {unit}
                    </div>
                  </div>
                </Column>
              ))}
            </Row>
          </Section>
        );
      }
      return (
        <Section style={{ padding: "4px 0 18px", textAlign: "center" }}>
          <Text
            style={{
              margin: 0,
              fontSize: "12px",
              fontWeight: 700,
              letterSpacing: "0.22em",
              textTransform: "uppercase",
              color: "#6b6459",
            }}
          >
            {block.label}
          </Text>
          <Text
            style={{
              margin: "6px 0 0",
              fontSize: "24px",
              fontWeight: 600,
              color: "#141210",
            }}
          >
            {countdownText(block, sendDate)}
          </Text>
        </Section>
      );
    }
  }
}

// ---- the email document ----

export function NewsletterEmail({
  subject,
  preheader,
  blocks,
  unsubscribeUrl,
  sendDate,
}: {
  subject: string;
  preheader: string;
  blocks: NewsletterBlock[];
  unsubscribeUrl: string;
  sendDate: Date;
}) {
  const year = new Intl.DateTimeFormat("en-AU", {
    timeZone: "Australia/Sydney",
    year: "numeric",
  }).format(sendDate);

  return (
    <Html lang="en">
      <Head>
        <title>{subject}</title>
        <meta name="color-scheme" content="light only" />
      </Head>
      {preheader ? <Preview>{preheader}</Preview> : null}
      <Body
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
            style={{
              width: "600px",
              maxWidth: "100%",
              background: "#ffffff",
              borderRadius: "18px",
              overflow: "hidden",
            }}
          >
            {/* header */}
            <Section style={{ padding: "34px 36px 0", textAlign: "center" }}>
              <Link href={SITE}>
                <Img
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
            <Section style={{ padding: "22px 36px 30px" }}>
              {blocks.map((b) => (
                <BlockView key={b.id} block={b} sendDate={sendDate} />
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
                You are receiving this because you subscribed at tedxnewy.com.au.{" "}
                <Link
                  href={unsubscribeUrl}
                  style={{ color: "#8a8278", textDecoration: "underline" }}
                >
                  Unsubscribe
                </Link>
                <br />
                &copy; {year} Newcastle Ideas Network Limited &middot; ACN 694 346 319
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

/** Build a readable plain-text part from the blocks. */
function blocksToText(
  blocks: NewsletterBlock[],
  sendDate: Date,
  unsubscribeUrl: string,
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
      case "twoColumn":
        for (const col of [b.left, b.right]) {
          if (col.kind === "text") parts.push(htmlToPlainText(col.html));
          else if (col.alt) parts.push(col.alt);
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
      case "countdown":
        parts.push(`${b.label}: ${countdownText(b, sendDate)}`);
        break;
    }
  }
  parts.push(`\n--\nUnsubscribe: ${unsubscribeUrl}`);
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
    />,
  );
  const text = blocksToText(blocks, opts.sendDate, opts.unsubscribeUrl);
  return { html, text };
}
