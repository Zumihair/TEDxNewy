/**
 * Single source of truth for every transactional email the site sends.
 *
 * Two kinds, one shared branded shell (logo header + dark footer):
 *  - Notifications  → to the admin team when a form comes in.
 *  - Confirmations  → to the person who submitted.
 *
 * The API routes import these builders so the live emails and the local
 * preview at /dev/emails always match. Revise copy here and both update.
 */

export type EmailContent = {
  subject: string;
  text: string;
  /** Branded HTML body. */
  html?: string;
};

// --- Brand constants -------------------------------------------------
// Some are exported so the newsletter renderer (lib/newsletter-render.tsx)
// shares the exact same brand values as the transactional shell here.
export const SITE = "https://tedxnewy.com.au";
const ADMIN = `${SITE}/admin`;
export const LOGO_DARK_TEXT = `${SITE}/brand/tedxnewy-black.png`; // for light backgrounds
export const LOGO_LIGHT_TEXT = `${SITE}/brand/tedxnewy-white.png`; // for dark backgrounds
export const CONTACT_EMAIL = "hello@tedxnewy.com.au";
// Public-facing reply address. Youth Futures uses its own (see YFL_EMAIL).
const REPLY_EMAIL = "hello@tedxnewy.com.au";
const YFL_EMAIL = "activations@tedxnewy.com.au";
export const SOCIALS: { label: string; href: string; icon: string }[] = [
  {
    label: "Instagram",
    href: "https://instagram.com/tedxnewy",
    icon: `${SITE}/brand/social/instagram.png`,
  },
  {
    label: "TikTok",
    href: "https://tiktok.com/@tedxnewy",
    icon: `${SITE}/brand/social/tiktok.png`,
  },
  {
    label: "LinkedIn",
    href: "https://www.linkedin.com/company/tedxnewy",
    icon: `${SITE}/brand/social/linkedin.png`,
  },
];

const DOT = `<span style="color:#5a534b">&nbsp;·&nbsp;</span>`;

function escapeHtml(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function firstName(full: string): string {
  return full.trim().split(/\s+/)[0] || "there";
}

// --- Shared building blocks -----------------------------------------

/** The master branded HTML wrapper. `heading` and `bodyHtml` are trusted HTML. */
function emailShell(o: {
  eyebrow: string;
  heading: string;
  bodyHtml: string;
  cta?: { href: string; label: string };
}): string {
  const year = new Date().getFullYear();
  const cta = o.cta
    ? `<div style="margin-top:26px"><a href="${o.cta.href}" style="display:inline-block;background:#e02214;color:#ffffff;text-decoration:none;font-weight:600;font-size:14px;line-height:1;padding:13px 24px;border-radius:999px">${escapeHtml(
        o.cta.label,
      )} &rarr;</a></div>`
    : "";
  const socials = SOCIALS.map(
    (s) =>
      `<a href="${s.href}" style="display:inline-block;margin-right:16px;text-decoration:none"><img src="${s.icon}" alt="${s.label}" width="22" height="22" style="width:22px;height:22px;display:inline-block;border:0;vertical-align:middle" /></a>`,
  ).join("");

  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width,initial-scale=1" />
  <meta name="color-scheme" content="light dark" />
  <meta name="supported-color-schemes" content="light dark" />
  <title>${escapeHtml(o.eyebrow)}</title>
  <style>
    /* A real dark-mode variant. Every colour the body copy uses is a fixed
       token, so in dark mode the whole card flips to a dark surface and each
       token maps to a light-on-dark equivalent via these classes. Light mode
       is untouched (the classes carry no styles of their own; the inline
       light values remain the default). The header wordmark swaps to the white
       version so "Newy" never disappears. [data-ogsc] (foreground) and
       [data-ogsb] (background) mirror it in Outlook.com dark mode.

       The shell tokens below (e-bg, e-card, e-ink, e-body, e-soft, e-muted,
       e-btn-2, the logo swap) share their values with DARK_RULES in
       lib/newsletter-render.tsx, which paints the same brand for block-built
       email: change a value here, change it there. Neither list is a mirror
       of the other, though. e-panel and e-border are this layout's own, the
       block editor's tints and button themes are that one's, and e-rule has
       always differed. */
    @media (prefers-color-scheme: dark) {
      .e-bg { background:#100f0d !important; }
      .e-card { background:#1c1a18 !important; }
      .e-ink { color:#f4efe6 !important; }
      .e-body { color:#cbc4b9 !important; }
      .e-soft { color:#a79f93 !important; }
      .e-muted { color:#a49b8f !important; }
      .e-border { border-bottom-color:#322e2a !important; }
      .e-rule { border-top-color:rgba(255,255,255,0.12) !important; }
      .e-panel { background:#26221e !important; }
      .e-btn-2 { background:#2f2b27 !important; }
      .e-logo-main { display:none !important; }
      .e-logo-alt { display:inline-block !important; }
    }
    [data-ogsb] .e-bg { background:#100f0d !important; }
    [data-ogsb] .e-card { background:#1c1a18 !important; }
    [data-ogsc] .e-ink { color:#f4efe6 !important; }
    [data-ogsc] .e-body { color:#cbc4b9 !important; }
    [data-ogsc] .e-soft { color:#a79f93 !important; }
    [data-ogsc] .e-muted { color:#a49b8f !important; }
    [data-ogsb] .e-panel { background:#26221e !important; }
    [data-ogsb] .e-btn-2 { background:#2f2b27 !important; }
    [data-ogsc] .e-logo-main { display:none !important; }
    [data-ogsc] .e-logo-alt { display:inline-block !important; }
  </style>
</head>
<body class="e-bg" style="margin:0;padding:0;background:#f4efe6;-webkit-font-smoothing:antialiased;-webkit-text-size-adjust:100%">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" class="e-bg" style="background:#f4efe6">
    <tr>
      <td align="center" style="padding:28px 14px">
        <table role="presentation" width="600" cellpadding="0" cellspacing="0" class="e-card" style="width:600px;max-width:100%;background:#ffffff;border-radius:18px;overflow:hidden;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif">
          <tr>
            <td style="padding:34px 36px 0;text-align:center">
              <a href="${SITE}" style="text-decoration:none"><img class="e-logo-main" src="${LOGO_DARK_TEXT}" alt="TEDxNewy" width="170" style="width:170px;max-width:62%;height:auto;display:inline-block;border:0" /><img class="e-logo-alt" src="${LOGO_LIGHT_TEXT}" alt="TEDxNewy" width="170" style="width:170px;max-width:62%;height:auto;display:none;border:0" /></a>
            </td>
          </tr>
          <tr>
            <td style="padding:22px 36px 0">
              <div style="height:3px;width:46px;background:#e02214;border-radius:2px"></div>
            </td>
          </tr>
          <tr>
            <td style="padding:18px 36px 34px">
              <h1 class="e-ink" style="margin:0;font-size:23px;line-height:1.22;font-weight:600;color:#141210;letter-spacing:-0.01em">${o.heading}</h1>
              <div class="e-body" style="margin-top:16px;font-size:15px;line-height:1.62;color:#2a2521">${o.bodyHtml}</div>
              ${cta}
            </td>
          </tr>
          <tr>
            <td style="background:#141210;padding:30px 36px">
              <a href="${SITE}" style="text-decoration:none"><img src="${LOGO_LIGHT_TEXT}" alt="TEDxNewy" width="124" style="width:124px;height:auto;display:block;border:0;margin-bottom:18px" /></a>
              <div style="font-size:13px;line-height:1.6">${socials}</div>
              <div style="margin-top:12px;font-size:13px;line-height:1.6">
                <a href="mailto:${CONTACT_EMAIL}" style="color:#f4efe6;text-decoration:none">${CONTACT_EMAIL}</a>${DOT}<a href="${SITE}" style="color:#f4efe6;text-decoration:none">tedxnewy.com.au</a>
              </div>
              <div style="margin-top:20px;padding-top:16px;border-top:1px solid rgba(255,255,255,0.1);font-size:11.5px;line-height:1.7;color:#8a8278">
                &copy; ${year} Newcastle Ideas Network Limited${DOT}ACN 694 346 319${DOT}Formerly TEDxCooksHill<br />
                <a href="${SITE}/privacy" style="color:#8a8278;text-decoration:underline">Privacy</a>${DOT}<a href="${SITE}/code-of-conduct" style="color:#8a8278;text-decoration:underline">Code of Conduct</a>
              </div>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

/** Key/value recap table for short fields (notifications). Middle-aligned. */
function kvTable(rows: ([string, string | null | undefined] | null)[]): string {
  return fieldTable(
    rows.map((r) => (r ? { label: r[0], value: r[1] } : null)),
  );
}

type Field = {
  label: string;
  value: string | null | undefined;
  /** Multi-line value (message, idea): top-align and preserve line breaks. */
  multiline?: boolean;
};

/**
 * Label/value table. Single-line rows are middle-aligned so the label sits
 * level with its value; multi-line rows top-align and wrap.
 */
function fieldTable(rows: (Field | null)[]): string {
  const cells = rows
    .filter((r): r is Field => !!r && r.value != null && r.value !== "")
    .map((r) => {
      const va = r.multiline ? "top" : "middle";
      // Label and value share font-size + line-height so they align exactly;
      // the label is distinguished by weight + colour, not by size.
      return `<tr>
          <td class="e-ink e-border" style="padding:9px 18px 9px 0;border-bottom:1px solid #efe9dd;font-size:14px;line-height:1.5;font-weight:700;color:#141210;vertical-align:${va};white-space:nowrap">${escapeHtml(
            r.label,
          )}</td>
          <td class="e-body e-border" style="padding:9px 0;border-bottom:1px solid #efe9dd;font-size:14px;line-height:1.5;font-weight:400;color:#2a2521;vertical-align:${va}${
            r.multiline ? ";white-space:pre-wrap" : ""
          }">${escapeHtml(String(r.value))}</td>
        </tr>`;
    })
    .join("");
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;margin-top:8px">${cells}</table>`;
}

/** A labelled block for longer free text (messages, ideas, notes). */
function longBlock(label: string, text: string): string {
  return `<div style="margin-top:18px">
    <div class="e-muted" style="font-size:10.5px;font-weight:700;letter-spacing:0.12em;text-transform:uppercase;color:#8a8278;font-family:ui-monospace,Menlo,monospace">${escapeHtml(
      label,
    )}</div>
    <div class="e-ink" style="margin-top:7px;font-size:14px;line-height:1.6;color:#141210;white-space:pre-wrap">${escapeHtml(
      text,
    )}</div>
  </div>`;
}

function p(text: string): string {
  return `<p style="margin:0 0 14px">${text}</p>`;
}

/** Build a plain-text fallback from labelled rows. */
function plainLines(
  intro: string[],
  rows: ([string, string | null | undefined] | null)[],
): string {
  const fields = rows
    .filter((r): r is [string, string] => !!r && r[1] != null && r[1] !== "")
    .map(([k, v]) => `${k}: ${v}`);
  return [...intro, ...(fields.length ? ["", ...fields] : [])].join("\n");
}

// =====================================================================
// Admin notifications — one per form
// =====================================================================

function notification(o: {
  subject: string;
  eyebrow: string;
  heading: string;
  lead: string;
  rows: ([string, string | null | undefined] | null)[];
  long?: { label: string; text: string }[];
  adminPath: string;
  textIntro: string[];
}): EmailContent {
  const longHtml = (o.long ?? [])
    .filter((b) => b.text)
    .map((b) => longBlock(b.label, b.text))
    .join("");
  const longText = (o.long ?? [])
    .filter((b) => b.text)
    .map((b) => `\n${b.label}:\n${b.text}`)
    .join("\n");
  return {
    subject: o.subject,
    text: `${plainLines(o.textIntro, o.rows)}${longText}\n\nOpen in admin: ${ADMIN}${o.adminPath}`,
    html: emailShell({
      eyebrow: o.eyebrow,
      heading: o.heading,
      bodyHtml: `${p(o.lead)}${kvTable(o.rows)}${longHtml}`,
      cta: { href: `${ADMIN}${o.adminPath}`, label: "Open in admin" },
    }),
  };
}

export function notifyContact(d: {
  fullName: string;
  email: string;
  phone?: string | null;
  message: string;
}): EmailContent {
  return notification({
    subject: `New contact message: ${d.fullName}`,
    eyebrow: "New submission · Contact",
    heading: "New contact message",
    lead: `${escapeHtml(d.fullName)} sent a message through the contact form.`,
    rows: [
      ["Name", d.fullName],
      ["Email", d.email],
      ["Phone", d.phone ?? null],
    ],
    long: [{ label: "Message", text: d.message }],
    adminPath: "/forms/contact",
    textIntro: [`${d.fullName} sent a message through the contact form.`],
  });
}

export function notifyNominate(d: {
  nomineeName: string;
  nomineeTitle: string;
  nomineeLocation?: string | null;
  nominatorName: string;
  nominatorEmail: string;
  relationship?: string | null;
  link?: string | null;
  idea: string;
}): EmailContent {
  return notification({
    subject: `New speaker nomination: ${d.nomineeName}`,
    eyebrow: "New submission · Speakers",
    heading: "New speaker nomination",
    lead: `${escapeHtml(d.nominatorName)} nominated ${escapeHtml(
      d.nomineeName,
    )} for the TEDxNewy stage.`,
    rows: [
      ["Nominee", `${d.nomineeName} (${d.nomineeTitle})`],
      ["Where they're from", d.nomineeLocation ?? null],
      ["Nominator", d.nominatorName],
      ["Email", d.nominatorEmail],
      ["Relationship", d.relationship ?? null],
      ["Link", d.link ?? null],
    ],
    long: [{ label: "The idea", text: d.idea }],
    adminPath: "/forms/nominations",
    textIntro: [`${d.nominatorName} nominated ${d.nomineeName}.`],
  });
}

export function notifyPartner(d: {
  organisation: string;
  contactName: string;
  role?: string | null;
  email: string;
  phone?: string | null;
  tier?: string | null;
  message: string;
}): EmailContent {
  return notification({
    subject: `New partner enquiry: ${d.organisation}`,
    eyebrow: "New submission · Sponsors",
    heading: "New partner enquiry",
    lead: `${escapeHtml(d.organisation)} enquired about partnering with TEDxNewy.`,
    rows: [
      ["Organisation", d.organisation],
      ["Contact", `${d.contactName}${d.role ? ` (${d.role})` : ""}`],
      ["Email", d.email],
      ["Phone", d.phone ?? null],
      ["Tier", d.tier ?? null],
    ],
    long: [{ label: "Message", text: d.message }],
    adminPath: "/forms/sponsors",
    textIntro: [`${d.organisation} enquired about partnering.`],
  });
}

export function notifySubscribe(d: {
  email: string;
  source: string;
}): EmailContent {
  return notification({
    subject: `New subscriber: ${d.email}`,
    eyebrow: "New submission · Subscribers",
    heading: "New newsletter subscriber",
    lead: `Someone just joined the TEDxNewy mailing list.`,
    rows: [
      ["Email", d.email],
      ["Source", d.source],
    ],
    adminPath: "/subscribers",
    textIntro: [`New subscriber joined the mailing list.`],
  });
}

export function notifyApply(d: {
  firstName: string;
  lastName: string;
  email: string;
  phone?: string | null;
  location?: string | null;
  availability: string;
  note?: string | null;
}): EmailContent {
  return notification({
    subject: `New volunteer application: ${d.firstName} ${d.lastName}`,
    eyebrow: "New submission · Volunteers",
    heading: "New volunteer application",
    lead: `${escapeHtml(d.firstName)} ${escapeHtml(
      d.lastName,
    )} applied to volunteer with TEDxNewy.`,
    rows: [
      ["Name", `${d.firstName} ${d.lastName}`],
      ["Email", d.email],
      ["Phone", d.phone ?? null],
      ["Where they're based", d.location ?? null],
      ["Time they can give", d.availability],
    ],
    long: d.note ? [{ label: "Note", text: d.note }] : [],
    adminPath: "/forms/volunteers",
    textIntro: [`${d.firstName} ${d.lastName} applied to volunteer.`],
  });
}

export function notifyYouthFutures(d: {
  schoolName: string;
  suburb: string;
  contactName: string;
  contactRole: string;
  email: string;
  phone: string;
  studentCount: number;
  yearLevels: string;
  marketingConsent: boolean;
  comments?: string | null;
}): EmailContent {
  return notification({
    subject: `New Youth Futures Lab EOI: ${d.schoolName}`,
    eyebrow: "New submission · Youth Futures Lab",
    heading: "New Youth Futures Lab EOI",
    lead: `${escapeHtml(
      d.schoolName,
    )} registered interest in the 2026 Youth Futures Lab.`,
    rows: [
      ["School", d.schoolName],
      ["Suburb", d.suburb],
      ["Contact", `${d.contactName} (${d.contactRole})`],
      ["Email", d.email],
      ["Phone", d.phone],
      ["Students", String(d.studentCount)],
      ["Year levels", d.yearLevels],
      ["Marketing OK", d.marketingConsent ? "Yes" : "No"],
    ],
    long: d.comments ? [{ label: "Comments", text: d.comments }] : [],
    adminPath: "/forms/youth-futures",
    textIntro: [`${d.schoolName} registered interest in Youth Futures Lab.`],
  });
}

export function notifyStudentSpeaker(d: {
  fullName: string;
  email: string;
  phone: string;
  school: string;
  postCode: string;
  city: string;
  talkTitle: string;
  videoUrl: string;
}): EmailContent {
  return notification({
    subject: `New Student Speaker entry: ${d.fullName} (${d.school})`,
    eyebrow: "New submission · Student Speaker",
    heading: "New Student Speaker entry",
    lead: `${escapeHtml(
      d.fullName,
    )} entered the 2026 Student Speaker Competition.`,
    rows: [
      ["Name", d.fullName],
      ["Email", d.email],
      ["Phone", d.phone],
      ["School", d.school],
      ["City", `${d.city} ${d.postCode}`],
      ["Talk title", d.talkTitle],
      ["Video", d.videoUrl],
    ],
    adminPath: "/forms/student-speaker",
    textIntro: [`${d.fullName} entered the Student Speaker Competition.`],
  });
}

const TALK_NIGHT_INTEREST: Record<string, string> = {
  speak: "Speak (share a 60-second idea)",
  listen: "Listen (come along for the night)",
};

export function notifyTalkNight(d: {
  fullName: string;
  email: string;
  phone?: string | null;
  attendanceType: string;
  idea?: string | null;
  reason?: string | null;
  guestName?: string | null;
  guestEmail?: string | null;
  guestAttendanceType?: string | null;
  guestIdea?: string | null;
  guestReason?: string | null;
}): EmailContent {
  const interest = TALK_NIGHT_INTEREST[d.attendanceType] ?? d.attendanceType;
  const guestInterest = d.guestAttendanceType
    ? TALK_NIGHT_INTEREST[d.guestAttendanceType] ?? d.guestAttendanceType
    : null;
  return notification({
    subject: `New 60-Second Talk Night EOI: ${d.fullName}`,
    eyebrow: "New submission · 60-Second Talk Night",
    heading: "New 60-Second Talk Night EOI",
    lead: `${escapeHtml(
      d.fullName,
    )} registered interest in the 60-Second Talk Night.`,
    rows: [
      ["Name", d.fullName],
      ["Email", d.email],
      ["Phone", d.phone ?? null],
      ["Interest", interest],
      ["Guest", d.guestName ?? null],
      ["Guest email", d.guestEmail ?? null],
      ["Guest interest", guestInterest],
    ],
    long: [
      ...(d.idea ? [{ label: "Their idea", text: d.idea }] : []),
      ...(d.reason ? [{ label: "Why they want to come", text: d.reason }] : []),
      ...(d.guestIdea ? [{ label: "Guest's idea", text: d.guestIdea }] : []),
      ...(d.guestReason
        ? [{ label: "Why the guest wants to come", text: d.guestReason }]
        : []),
    ],
    adminPath: "/forms/talk-night",
    textIntro: [
      `${d.fullName} registered interest in the 60-Second Talk Night (${interest})${
        d.guestName ? `, plus guest ${d.guestName}` : ""
      }.`,
    ],
  });
}

// =====================================================================
// Submitter confirmations — branded HTML
// =====================================================================

export function confirmContact(d: {
  fullName: string;
  email: string;
  phone?: string | null;
  message: string;
}): EmailContent {
  const name = firstName(d.fullName);
  return {
    subject: "We got your message · TEDxNewy",
    text: plainLines(
      [
        `Hi ${name},`,
        ``,
        `Thanks for reaching out to TEDxNewy. Your message is with our team and we'll get back to you as soon as we can.`,
        ``,
        `For your records, here's what you sent:`,
      ],
      [
        ["Name", d.fullName],
        ["Email", d.email],
        ["Phone", d.phone ?? null],
        ["Message", d.message],
      ],
    ),
    html: emailShell({
      eyebrow: "We got your message",
      heading: `Thanks, ${escapeHtml(name)}.`,
      bodyHtml: `${p(
        "Thanks for reaching out to TEDxNewy. Your message is with our team and we&rsquo;ll get back to you as soon as we can.",
      )}${p(
        `You can reply to this email or write to <a href="mailto:${REPLY_EMAIL}" style="color:#e02214;text-decoration:none">${REPLY_EMAIL}</a> any time.`,
      )}${fieldTable([
        { label: "Email", value: d.email },
        { label: "Phone", value: d.phone ?? null },
        { label: "Message", value: d.message, multiline: true },
      ])}`,
    }),
  };
}

export function confirmNominate(d: {
  nominatorName: string;
  nomineeName: string;
  nomineeTitle: string;
  idea: string;
}): EmailContent {
  const name = firstName(d.nominatorName);
  return {
    subject: "Thanks for your nomination · TEDxNewy",
    text: plainLines(
      [
        `Hi ${name},`,
        ``,
        `Thanks for nominating ${d.nomineeName} for the TEDxNewy stage. Great talks start with someone spotting a great idea, so thank you for spotting this one.`,
        ``,
        `Curation is a careful and considered process, and we may not be able to get back to everyone. If the talk is aligned, or we need more information, we'll reach out.`,
        ``,
        `What you nominated:`,
      ],
      [
        ["Nominee", `${d.nomineeName} (${d.nomineeTitle})`],
        ["The idea", d.idea],
      ],
    ),
    html: emailShell({
      eyebrow: "Nomination received",
      heading: `Thanks for the nomination, ${escapeHtml(name)}.`,
      bodyHtml: `${p(
        `Thanks for nominating <strong>${escapeHtml(
          d.nomineeName,
        )}</strong> for the TEDxNewy stage. Great talks start with someone spotting a great idea, so thank you for spotting this one.`,
      )}${p(
        "Curation is a careful and considered process, and we may not be able to get back to everyone. If the talk is aligned, or we need more information, we&rsquo;ll reach out.",
      )}${fieldTable([
        { label: "Nominee", value: `${d.nomineeName} (${d.nomineeTitle})` },
        { label: "The idea", value: d.idea, multiline: true },
      ])}`,
    }),
  };
}

export function confirmPartner(d: {
  contactName: string;
  organisation: string;
  tier?: string | null;
}): EmailContent {
  const name = firstName(d.contactName);
  return {
    subject: "Your partnership enquiry · TEDxNewy",
    text: plainLines(
      [
        `Hi ${name},`,
        ``,
        `Thanks for your interest in partnering with TEDxNewy. We've received your enquiry on behalf of ${d.organisation} and we'll be in touch soon.`,
        ``,
        `What you sent:`,
      ],
      [
        ["Organisation", d.organisation],
        ["Tier of interest", d.tier ?? null],
      ],
    ),
    html: emailShell({
      eyebrow: "Partnership enquiry received",
      heading: `Thanks, ${escapeHtml(name)}.`,
      bodyHtml: `${p(
        `Thanks for your interest in partnering with TEDxNewy. We&rsquo;ve received your enquiry on behalf of <strong>${escapeHtml(
          d.organisation,
        )}</strong>.`,
      )}${p(
        "We&rsquo;ll be in touch soon. If anything&rsquo;s time-sensitive, just reply to this email.",
      )}${fieldTable([
        { label: "Organisation", value: d.organisation },
        { label: "Tier of interest", value: d.tier ?? null },
      ])}`,
    }),
  };
}

export function confirmSubscribe(): EmailContent {
  return {
    subject: "You're subscribed · TEDxNewy",
    text: [
      `Welcome to TEDxNewy.`,
      ``,
      `Thanks for subscribing. You'll be first to hear about new talks, events, speaker line-ups and the next TEDxNewy. No spam, just ideas worth spreading.`,
      ``,
      `Explore past talks: ${SITE}/talks`,
    ].join("\n"),
    html: emailShell({
      eyebrow: "You're on the list",
      heading: "Welcome to TEDxNewy.",
      bodyHtml: `${p(
        "Thanks for subscribing. You&rsquo;ll be first to hear about new talks, events, speaker line-ups and the next TEDxNewy.",
      )}${p(
        "No spam, just ideas worth spreading. While you wait, dive into the talks from our past events.",
      )}`,
      cta: { href: `${SITE}/talks`, label: "Explore past talks" },
    }),
  };
}

export function confirmApply(d: {
  firstName: string;
  lastName: string;
  availability: string;
}): EmailContent {
  return {
    subject: "Your volunteer application · TEDxNewy",
    text: plainLines(
      [
        `Hi ${d.firstName},`,
        ``,
        `Thanks for applying to volunteer with TEDxNewy. Our events run on people like you.`,
        ``,
        `We're always on the lookout for talent and support, but it's all about fit. If your submission aligns with what we're looking for, we'll be in touch.`,
        ``,
        `What you submitted:`,
      ],
      [
        ["Name", `${d.firstName} ${d.lastName}`],
        ["Time you can give", d.availability],
      ],
    ),
    html: emailShell({
      eyebrow: "Application received",
      heading: `Thanks for stepping up, ${escapeHtml(d.firstName)}.`,
      bodyHtml: `${p(
        "Thanks for applying to volunteer with TEDxNewy. Our events run on people like you.",
      )}${p(
        "We&rsquo;re always on the lookout for talent and support, but it&rsquo;s all about fit. If your submission aligns with what we&rsquo;re looking for, we&rsquo;ll be in touch.",
      )}${fieldTable([
        { label: "Name", value: `${d.firstName} ${d.lastName}` },
        { label: "Time you can give", value: d.availability },
      ])}`,
    }),
  };
}

export function confirmYouthFutures(d: {
  contactName: string;
  schoolName: string;
  studentCount: number;
  yearLevels: string;
}): EmailContent {
  const name = firstName(d.contactName);
  return {
    subject: "Your Youth Futures Lab EOI · TEDxNewy",
    text: [
      `Hi ${name},`,
      ``,
      `Thanks for registering ${d.schoolName} for the 2026 Youth Futures Lab. We've received your expression of interest.`,
      ``,
      `We'll review all expressions of interest at the conclusion of the EOI period. We'd love to accept every school, but it's important we have a cross section of voices and representation at this event, so we may not be able to accept all schools that apply.`,
      ``,
      `What you submitted:`,
      `  School:        ${d.schoolName}`,
      `  Students:      ${d.studentCount}`,
      `  Year levels:   ${d.yearLevels}`,
      ``,
      `Event details:`,
      `  Friday, 7 August 2026, 9:30 am to 2:30 pm`,
      `  University of Newcastle, NUspace City Campus, Room X-101`,
      `  Free for selected schools`,
      `  Note: morning tea and lunch are not provided. Students bring their own food or use the university cafe.`,
      ``,
      `Any questions or concerns can be directed to ${YFL_EMAIL}.`,
    ].join("\n"),
    html: emailShell({
      eyebrow: "Youth Futures Lab · EOI received",
      heading: `EOI received. Thanks ${escapeHtml(name)}.`,
      bodyHtml: `${p(
        `Thanks for registering <strong>${escapeHtml(
          d.schoolName,
        )}</strong> for the 2026 Youth Futures Lab. We&rsquo;ve received your expression of interest.`,
      )}${p(
        "We&rsquo;ll review all expressions of interest at the conclusion of the EOI period. We&rsquo;d love to accept every school, but it&rsquo;s important we have a cross section of voices and representation at this event, so we may not be able to accept all schools that apply.",
      )}${fieldTable([
        { label: "School", value: d.schoolName },
        { label: "Students", value: String(d.studentCount) },
        { label: "Year levels", value: d.yearLevels },
      ])}
      <div class="e-muted" style="margin-top:18px;font-size:10.5px;font-weight:700;letter-spacing:0.12em;text-transform:uppercase;color:#8a8278;font-family:ui-monospace,Menlo,monospace">Event details</div>
      <ul class="e-ink" style="margin:8px 0 0;padding-left:20px;font-size:14px;line-height:1.6;color:#141210">
        <li><strong>Friday, 7 August 2026</strong>, 9:30 am to 2:30 pm</li>
        <li>University of Newcastle, NUspace City Campus, Room X-101</li>
        <li>Free for selected schools</li>
        <li class="e-soft" style="margin-top:6px;color:#6b6459">Morning tea and lunch are not provided. Students bring their own food or use the university cafe on campus.</li>
      </ul>
      <p class="e-soft" style="margin:18px 0 0;color:#6b6459">Any questions or concerns can be directed to <a href="mailto:${YFL_EMAIL}" style="color:#e02214;text-decoration:none">${YFL_EMAIL}</a>.</p>`,
    }),
  };
}

export function confirmStudentSpeaker(d: {
  fullName: string;
  talkTitle: string;
  school: string;
}): EmailContent {
  const name = firstName(d.fullName);
  return {
    subject: "Your Student Speaker entry · TEDxNewy",
    text: [
      `Hi ${name},`,
      ``,
      `Thanks for entering the 2026 TEDxNewy Student Speaker Competition. Your talk "${d.talkTitle}" is in. We'll be in touch as judging progresses.`,
      ``,
      `What you submitted:`,
      `  Name:        ${d.fullName}`,
      `  School:      ${d.school}`,
      `  Talk title:  ${d.talkTitle}`,
      ``,
      `What happens next:`,
      `  Entries close 6 September 2026.`,
      `  Our team reviews every submission. Finalists hear back by email.`,
      `  Finalists may be invited to deliver their talk at TEDxNewy 2026 in front of a live audience.`,
      ``,
      `Questions? Reply to this email or write to ${REPLY_EMAIL}.`,
    ].join("\n"),
    html: emailShell({
      eyebrow: "Student Speaker Competition · Entry received",
      heading: `Entry received. Thanks ${escapeHtml(name)}.`,
      bodyHtml: `${p(
        `Thanks for entering the 2026 TEDxNewy Student Speaker Competition. Your talk &ldquo;<strong>${escapeHtml(
          d.talkTitle,
        )}</strong>&rdquo; is in. We&rsquo;ll be in touch as judging progresses.`,
      )}${fieldTable([
        { label: "Name", value: d.fullName },
        { label: "School", value: d.school },
        { label: "Talk title", value: d.talkTitle },
      ])}
      <div class="e-muted" style="margin-top:18px;font-size:10.5px;font-weight:700;letter-spacing:0.12em;text-transform:uppercase;color:#8a8278;font-family:ui-monospace,Menlo,monospace">What happens next</div>
      <ul class="e-ink" style="margin:8px 0 0;padding-left:20px;font-size:14px;line-height:1.6;color:#141210">
        <li>Entries close <strong>6 September 2026</strong>.</li>
        <li>Our team reviews every submission. Finalists hear back by email.</li>
        <li>Finalists may be invited to deliver their talk at TEDxNewy 2026 in front of a live audience.</li>
      </ul>`,
    }),
  };
}

export function confirmTalkNight(d: {
  fullName: string;
  attendanceType: string;
  guestName?: string | null;
}): EmailContent {
  const name = firstName(d.fullName);
  const interest = TALK_NIGHT_INTEREST[d.attendanceType] ?? d.attendanceType;
  const speaking = d.attendanceType === "speak";
  const speakerNote = speaking
    ? "Because you'd like to speak, we'll be in touch with a few details on how the 60-second talks run once your place is confirmed."
    : "We'll send everything you need to know closer to the night.";
  const intimateNote =
    "This is an intimate evening and spots are limited, so we'll be in touch soon to confirm your place.";
  const guestLine = d.guestName
    ? `We've also noted your guest, ${d.guestName}. Their spot is part of the same registration.`
    : null;
  return {
    subject: "Your 60-Second Talk Night registration · TEDxNewy",
    text: [
      `Hi ${name},`,
      ``,
      `Thanks for registering for the TEDxNewy 60-Second Talk Night. We've got your registration.`,
      ``,
      intimateNote,
      ``,
      `What you told us:`,
      `  Interest:  ${interest}`,
      ...(d.guestName ? [`  Guest:     ${d.guestName}`] : []),
      ``,
      speakerNote,
      ...(guestLine ? [``, guestLine] : []),
      ``,
      `Event details:`,
      `  Thursday 16 July 2026, 6:00pm to 8:00pm`,
      `  Newcastle West`,
      `  Free · limited spots`,
      ``,
      `Any questions? Just reply to this email or write to ${REPLY_EMAIL}.`,
    ].join("\n"),
    html: emailShell({
      eyebrow: "60-Second Talk Night · Registration received",
      heading: `Registration received. Thanks ${escapeHtml(name)}.`,
      bodyHtml: `${p(
        "Thanks for registering for the TEDxNewy 60-Second Talk Night. We&rsquo;ve got your registration.",
      )}${p(intimateNote)}${fieldTable([
        { label: "Interest", value: interest },
        { label: "Guest", value: d.guestName ?? null },
      ])}${p(speakerNote)}${guestLine ? p(escapeHtml(guestLine)) : ""}
      <div class="e-muted" style="margin-top:18px;font-size:10.5px;font-weight:700;letter-spacing:0.12em;text-transform:uppercase;color:#8a8278;font-family:ui-monospace,Menlo,monospace">Event details</div>
      <ul class="e-ink" style="margin:8px 0 0;padding-left:20px;font-size:14px;line-height:1.6;color:#141210">
        <li><strong>Thursday 16 July 2026</strong>, 6:00pm to 8:00pm</li>
        <li>Newcastle West</li>
        <li>Free · limited spots</li>
      </ul>
      <p class="e-soft" style="margin:18px 0 0;color:#6b6459">Any questions? Just reply to this email or write to <a href="mailto:${REPLY_EMAIL}" style="color:#e02214;text-decoration:none">${REPLY_EMAIL}</a>.</p>`,
    }),
  };
}

/** Small email-safe building blocks for richer transactional emails. */
// Section labels share the red, semibold look of the partner "Visit" links
// (just not linked), so the email reads as one system.
const EYEBROW_STYLE = "font-size:13.5px;font-weight:600;color:#e02214";

function emailButton(
  href: string,
  label: string,
  variant: "primary" | "secondary" = "primary",
): string {
  const bg = variant === "primary" ? "#e02214" : "#141210";
  // The secondary (ink) button would vanish on a dark card, so it carries the
  // .e-btn-2 class that lifts it to a visible raised surface in dark mode.
  const cls = variant === "primary" ? "" : ' class="e-btn-2"';
  return `<div style="margin-top:20px"><a href="${href}"${cls} style="display:inline-block;background:${bg};color:#ffffff;text-decoration:none;font-weight:600;font-size:14px;line-height:1;padding:13px 24px;border-radius:999px">${escapeHtml(
    label,
  )} &rarr;</a></div>`;
}

function emailDivider(): string {
  return `<div class="e-rule" style="margin:26px 0;border-top:1px solid rgba(20,18,16,0.10)"></div>`;
}

function emailEyebrow(text: string, marginTop = 0): string {
  return `<div style="margin-top:${marginTop}px;${EYEBROW_STYLE}">${escapeHtml(
    text,
  )}</div>`;
}

function emailLeadP(html: string): string {
  return `<p class="e-body" style="margin:8px 0 0;font-size:15px;line-height:1.62;color:#2a2521">${html}</p>`;
}

/** Directors' sign-off, shared by the post-event follow-up emails. */
function emailSignOff(): string {
  return `<p class="e-body" style="margin:26px 0 0;font-size:15px;line-height:1.62;color:#2a2521">Thanks again,<br /><strong>Will + Jake</strong><br /><span class="e-soft" style="color:#6b6459">TEDxNewy Directors</span></p>`;
}
const SIGN_OFF_TEXT = ["Thanks again,", "Will + Jake", "TEDxNewy Directors"];

export type FeedbackPartner = {
  name: string;
  role: string;
  blurb: string;
  url?: string;
  logoUrl?: string;
  /** Render height of the logo in px. Set per logo so square + wide marks
   *  read at a consistent visual weight. */
  logoHeight?: number;
};

export type FeedbackEmailExtras = {
  recap?: { url: string; label: string; heading: string; body: string };
  partnersHeading?: string;
  partners?: FeedbackPartner[];
};

function partnerCardHtml(pnr: FeedbackPartner): string {
  // The logo is the wordmark, so it stands in for the name. Height-normalise
  // it so a square mark and a wide mark sit at a consistent visual weight.
  const brand = pnr.logoUrl
    ? `<img src="${pnr.logoUrl}" alt="${escapeHtml(pnr.name)}" style="height:${
        pnr.logoHeight ?? 44
      }px;width:auto;max-width:82%;display:block;border:0" />`
    : `<div class="e-ink" style="font-size:17px;font-weight:600;color:#141210">${escapeHtml(
        pnr.name,
      )}</div>`;
  const role = `<div class="e-muted" style="margin-top:${
    pnr.logoUrl ? 16 : 4
  }px;font-size:10px;font-weight:700;letter-spacing:0.14em;text-transform:uppercase;color:#8a8278;font-family:ui-monospace,Menlo,monospace">${escapeHtml(
    pnr.role,
  )}</div>`;
  const blurb = `<p class="e-body" style="margin:10px 0 0;font-size:14px;line-height:1.62;color:#2a2521">${escapeHtml(
    pnr.blurb,
  )}</p>`;
  const link = pnr.url
    ? `<div style="margin-top:12px"><a href="${pnr.url}" style="color:#e02214;text-decoration:none;font-weight:600;font-size:13.5px">Visit ${escapeHtml(
        pnr.name,
      )} &rarr;</a></div>`
    : "";
  return `<div class="e-panel" style="margin-top:14px;padding:24px;background:#f9f5ec;border-radius:16px">${brand}${role}${blurb}${link}</div>`;
}

/** Talk Night follow-up extras: recap plug + partner thank-yous. */
export const TALK_NIGHT_FEEDBACK_EXTRAS: FeedbackEmailExtras = {
  recap: {
    url: `${SITE}/60-second-talk-night`,
    label: "Watch the recap",
    heading: "Relive the night",
    body: "The video recap, the full line-up of all the speakers, and more from the evening are up on the event page.",
  },
  partnersHeading: "With huge thanks to our partners",
  partners: [
    {
      name: "The Base Health",
      role: "Venue partner",
      blurb:
        "Thank you to The Base Health for opening their doors and giving us such a warm space to gather. Beyond the venue, the work they do for wellbeing across our community matters enormously, and we were proud to share the night with them.",
      url: "https://www.thebasehealth.com.au/",
      logoUrl: `${SITE}/images/partners/the-base.png`,
      logoHeight: 68,
    },
    {
      name: "Newy Digital",
      role: "Media partner",
      blurb:
        "And a massive thank you to Newy Digital, our media partner, for their ongoing support and for turning around such high quality content so quickly. They capture our events beautifully so we can share them with everyone who couldn't be in the room. We're grateful to work with the best in the business.",
      url: "https://www.newydigital.com/",
      logoUrl: `${SITE}/images/partners/newy-digital.png`,
      logoHeight: 30,
    },
  ],
};

/**
 * Post-event follow-up + feedback request, sent to each attendee with their
 * own tokenised link. Editorial order: thanks, relive the night, then the
 * feedback ask, then partner thank-yous. Generic across events; pass `extras`
 * to turn on the recap plug + partner sections.
 */
export function feedbackRequestEmail(d: {
  fullName: string;
  eventTitle: string;
  url: string;
  extras?: FeedbackEmailExtras;
}): EmailContent {
  const name = firstName(d.fullName);
  const title = d.eventTitle;
  const extras = d.extras;

  // The recap is gated behind the form: no recap link in the email, just a
  // cheeky nudge that it's waiting once they've shared their thoughts. The
  // feedback thank-you page is what actually links them through to the recap.
  const gated = !!extras?.recap;
  const feedbackLead = gated
    ? "The full recap of the night, and the line-up of every speaker, is ready and waiting for you. But first, we&rsquo;d love a couple of minutes of your thoughts, it genuinely shapes what we do next. Share your feedback and it&rsquo;s all yours."
    : "We&rsquo;re always trying to make our events better, and your honest take helps more than anything. It only takes about two minutes.";
  const feedbackHtml = `${emailEyebrow(
    "Just 2 minutes of your time",
    20,
  )}${emailLeadP(feedbackLead)}${emailButton(
    d.url,
    "Share your feedback",
    "primary",
  )}`;

  // Section 3 (optional): partner thank-yous.
  const partnersHtml =
    extras?.partners && extras.partners.length
      ? `${emailDivider()}${emailEyebrow(
          "Thank you",
        )}<div class="e-ink" style="margin-top:6px;font-size:18px;font-weight:600;color:#141210;letter-spacing:-0.01em">${escapeHtml(
          extras.partnersHeading ?? "With thanks to our partners",
        )}</div>${extras.partners.map(partnerCardHtml).join("")}`
      : "";

  // Section 4 (optional): a forward-looking close, shown on richer sends.
  const hasExtras = !!(
    extras?.recap ||
    (extras?.partners && extras.partners.length)
  );
  const closingHtml = hasExtras
    ? `${emailDivider()}${emailEyebrow("Still to come")}${emailLeadP(
        "This is just the start. We&rsquo;ll keep sharing more from the night, photos and the individual talks, as they become available, so keep an eye on the event page.",
      )}`
    : "";

  const feedbackLeadText = gated
    ? `The full recap of the night, and the line-up of every speaker, is ready and waiting for you. But first, we'd love a couple of minutes of your thoughts, it genuinely shapes what we do next. Share your feedback and it's all yours:`
    : `We're always trying to make our events better, and your honest take helps more than anything. It only takes about two minutes:`;
  const textParts: string[] = [
    `Hi ${name},`,
    ``,
    `Thanks for being a part of our ${title}. Bringing our community together in this way, means a lot to us. Hopefully our experimentation of formats, yields better and better events for Newy in the future.`,
    ``,
    `JUST 2 MINUTES OF YOUR TIME`,
    feedbackLeadText,
    d.url,
  ];
  if (extras?.partners?.length) {
    textParts.push(
      ``,
      (extras.partnersHeading ?? "With thanks to our partners").toUpperCase(),
    );
    for (const pnr of extras.partners) {
      textParts.push(
        ``,
        `${pnr.name} (${pnr.role}): ${pnr.blurb}${pnr.url ? ` ${pnr.url}` : ""}`,
      );
    }
  }
  if (extras?.recap || extras?.partners?.length) {
    textParts.push(
      ``,
      `STILL TO COME`,
      `This is just the start. We'll keep sharing more from the night, photos and the individual talks, as they become available, so keep an eye on the event page.`,
    );
  }
  textParts.push(``, ...SIGN_OFF_TEXT);
  textParts.push(
    ``,
    `Any questions? Just reply to this email or write to ${REPLY_EMAIL}.`,
  );

  return {
    subject: `Thanks for coming to ${title} · TEDxNewy`,
    text: textParts.join("\n"),
    html: emailShell({
      eyebrow: `${title} · After the talks`,
      heading: `Thanks for coming, ${escapeHtml(name)}.`,
      bodyHtml: `${p(
        `Thanks for being a part of our ${escapeHtml(
          title,
        )}. Bringing our community together in this way, means a lot to us. Hopefully our experimentation of formats, yields better and better events for Newy in the future.`,
      )}${feedbackHtml}${partnersHtml}${closingHtml}${emailSignOff()}`,
    }),
  };
}

/**
 * One gentle nudge to attendees who have not left feedback yet. Only ever sent
 * to non-responders (the token tracks completion), so it never needs to hedge
 * with an "ignore this if you've already replied" line.
 */
export function feedbackReminderEmail(d: {
  fullName: string;
  eventTitle: string;
  url: string;
}): EmailContent {
  const name = firstName(d.fullName);
  const title = d.eventTitle;
  return {
    subject: `Still keen to hear how ${title} went · TEDxNewy`,
    text: [
      `Hi ${name},`,
      ``,
      `We know inboxes get busy, so just a gentle nudge. We'd still love to hear how you found our ${title}. Your honest take genuinely shapes what we build next for Newy, and it only takes a couple of minutes:`,
      ``,
      d.url,
      ``,
      ...SIGN_OFF_TEXT,
    ].join("\n"),
    html: emailShell({
      eyebrow: `${title} · Still keen to hear from you`,
      heading: `How did we do, ${escapeHtml(name)}?`,
      bodyHtml: `${p(
        `We know inboxes get busy, so just a gentle nudge. We&rsquo;d still love to hear how you found our ${escapeHtml(
          title,
        )}. Your honest take genuinely shapes what we build next for Newy, and it only takes a couple of minutes.`,
      )}${emailButton(d.url, "Share your feedback", "primary")}${emailSignOff()}`,
    }),
  };
}

/**
 * Free-form email composed in the admin (Settings -> Emails). Wraps the
 * admin's subject + body in the same branded shell every transactional
 * email uses.
 *
 * Two body inputs, in priority order:
 *  - `bodyHtml` — rich HTML from the admin editor (trusted, admin-authored).
 *    Lightly sanitised and given inline styles so it renders in email clients.
 *  - `body` — plain text (legacy / fallback). Blank lines start new
 *    paragraphs, single newlines become line breaks, and it's escaped.
 */
export function composeEmail(d: {
  subject: string;
  heading?: string;
  eyebrow?: string;
  body?: string;
  bodyHtml?: string;
  cta?: { href: string; label: string };
}): EmailContent {
  const rich = d.bodyHtml?.trim();
  const bodyHtml = rich
    ? styleRichBodyForEmail(rich)
    : plainBodyToHtml(d.body ?? "");
  const text = rich ? htmlToPlainText(rich) : (d.body ?? "");
  return {
    subject: d.subject,
    text,
    html: emailShell({
      eyebrow: d.eyebrow?.trim() || "A note from TEDxNewy",
      heading: escapeHtml(d.heading?.trim() || d.subject),
      bodyHtml,
      cta: d.cta,
    }),
  };
}

/** Plain text -> paragraph HTML (blank line = new paragraph). */
function plainBodyToHtml(body: string): string {
  return body
    .trim()
    .split(/\n{2,}/)
    .map((para) => p(escapeHtml(para).replace(/\n/g, "<br />")))
    .join("");
}

/**
 * Prepare the editor's HTML for email: strip anything that shouldn't be in a
 * message body (defence in depth — the editor already pastes as plain text),
 * and add inline styles, since email clients ignore <style> and most default
 * element styling. The admin is trusted, so this is about clean rendering
 * more than untrusted-input safety.
 */
export function styleRichBodyForEmail(html: string): string {
  let out = html;
  out = out.replace(/<\s*(script|style|iframe|object|embed)\b[^>]*>/gi, "");
  out = out.replace(/<\s*\/\s*(script|style|iframe|object|embed)\s*>/gi, "");
  out = out.replace(/\son\w+\s*=\s*"[^"]*"/gi, "");
  out = out.replace(/\son\w+\s*=\s*'[^']*'/gi, "");
  out = out.replace(/href\s*=\s*("|')\s*javascript:[^"']*\1/gi, 'href="#"');
  // Inline styles for the tags the toolbar can produce. These MERGE into any
  // style the tag already carries rather than adding a second attribute: the
  // toolbar's alignment buttons write `style="text-align:center"` onto the
  // paragraph, and with two style attributes a browser keeps only the first,
  // so blindly prepending silently threw the alignment away.
  out = addStyle(out, "a", "color:#e02214;text-decoration:underline");
  out = addStyle(out, "p", "margin:0 0 14px");
  // A line typed with no paragraph around it is wrapped in a bare <div> when
  // it gets aligned, so it takes the paragraph's spacing too.
  out = addStyle(out, "div", "margin:0 0 14px");
  out = addStyle(out, "ul", "margin:0 0 14px;padding-left:22px");
  out = addStyle(out, "ol", "margin:0 0 14px;padding-left:22px");
  out = addStyle(out, "li", "margin:0 0 4px");
  return out;
}

/**
 * Add inline declarations to every instance of one tag, folding them into an
 * existing style attribute when there is one. Ours go FIRST so anything the
 * editor set (alignment) wins on a conflict.
 */
function addStyle(html: string, tag: string, declarations: string): string {
  return html.replace(
    new RegExp(`<${tag}\\b([^>]*)>`, "gi"),
    (_match, attrs: string) => {
      const styled = /\sstyle\s*=\s*["']/i.test(attrs);
      if (!styled) return `<${tag} style="${declarations}"${attrs}>`;
      return `<${tag}${attrs.replace(
        /\sstyle\s*=\s*(["'])/i,
        (_m, quote: string) => ` style=${quote}${declarations};`,
      )}>`;
    },
  );
}

/** Strip HTML to a readable plain-text fallback (email text/plain part). */
export function htmlToPlainText(html: string): string {
  return html
    .replace(/<\s*br\s*\/?>/gi, "\n")
    .replace(/<\s*li\b[^>]*>/gi, "- ")
    .replace(/<\s*\/\s*(p|div|li|h[1-6]|ul|ol)\s*>/gi, "\n")
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

/** Plain text (e.g. a template body) -> HTML to seed the rich editor. */
export function plainToEditorHtml(body: string): string {
  return body
    .trim()
    .split(/\n{2,}/)
    .map((para) => `<p>${escapeHtml(para).replace(/\n/g, "<br>")}</p>`)
    .join("");
}

/**
 * Pre-written starting points for the admin Compose box. Selecting one fills
 * the subject / eyebrow / heading / body fields, which stay fully editable
 * before sending. Each recipient still gets their own individual email, so
 * the same templates work for one person or the whole accepted pool.
 */
export type ComposeTemplate = {
  id: string;
  label: string;
  subject: string;
  eyebrow?: string;
  heading?: string;
  body: string;
};

export const COMPOSE_TEMPLATES: ComposeTemplate[] = [
  {
    id: "talk-night-confirmation",
    label: "Talk Night, you're confirmed",
    subject: "You're in: TEDxNewy 60-Second Talk Night",
    eyebrow: "60-Second Talk Night · Confirmed",
    heading: "You're confirmed for the night",
    body: [
      "Hi there,",
      "",
      "Great news, we'd love to have you at the TEDxNewy 60-Second Talk Night. Your spot is confirmed.",
      "",
      "Here are the details:",
      "",
      "Date: Thursday 16 July 2026",
      "Time: 6:00pm to 8:00pm (doors from 5:45pm)",
      "Where: Newcastle West (full address to follow closer to the night)",
      "Cost: Free",
      "",
      "It's an intimate evening with limited spots, so your spot is held just for you. If anything changes and you can't make it, please reply to this email so we can offer the place to someone else.",
      "",
      "We'll send a final note with the exact venue and run sheet a few days out. If you registered to speak, we'll include everything you need to know about the 60-second format then.",
      "",
      "Any questions in the meantime? Just reply to this email.",
      "",
      "See you there,",
      "The TEDxNewy team",
    ].join("\n"),
  },
];

// =====================================================================
// Preview registry — sample data for the /dev/emails gallery
// =====================================================================

export type EmailPreview = {
  id: string;
  label: string;
  kind: "notification" | "confirmation";
  to: string;
  content: EmailContent;
  html: string;
};

function preview(
  id: string,
  label: string,
  kind: "notification" | "confirmation",
  to: string,
  content: EmailContent,
): EmailPreview {
  return { id, label, kind, to, content, html: content.html ?? "" };
}

const SAMPLE_CONTACT = {
  fullName: "James Park",
  email: "james@example.com",
  phone: "0400 111 222",
  message: "Hi team, I'd love to know how to get involved as a volunteer.",
};
const SAMPLE_NOMINATE = {
  nominatorName: "Tom Lee",
  nominatorEmail: "tom@example.com",
  nomineeName: "Dr Aisha Khan",
  nomineeTitle: "Marine biologist, University of Newcastle",
  relationship: "Colleague",
  link: "https://example.com/aisha-research",
  idea: "How kelp forests could be Newcastle's next climate frontier.",
};
const SAMPLE_PARTNER = {
  organisation: "Hunter Innovation Co.",
  contactName: "Priya Sharma",
  role: "Marketing Director",
  email: "priya@hunterinnovation.com",
  phone: "0455 333 444",
  tier: "Gold",
  message: "We'd love to explore a partnership for the 2026 event.",
};
const SAMPLE_APPLY = {
  firstName: "Liam",
  lastName: "O'Brien",
  email: "liam@example.com",
  phone: "0466 555 777",
  location: "Newcastle",
  availability: "A few hours a month",
  note: "Available weekends, have AV experience from local theatre.",
};
const SAMPLE_YFL = {
  schoolName: "Newcastle High School",
  suburb: "Waratah",
  contactName: "Sarah Nguyen",
  contactRole: "Head of Senior School",
  email: "snguyen@nhs.nsw.edu.au",
  phone: "0412 345 678",
  studentCount: 6,
  yearLevels: "Year 9-10",
  marketingConsent: true,
  comments: "Our students are really keen on the climate stream.",
};
const SAMPLE_TALK_NIGHT = {
  fullName: "Daniel Cole",
  email: "daniel.cole@example.com",
  phone: "0431 222 333",
  attendanceType: "speak",
  idea: "Why every street should have a bench: small design, big belonging.",
  reason: null,
  guestName: "Priya Shah",
  guestEmail: "priya.shah@example.com",
  guestAttendanceType: "listen",
  guestIdea: null,
  guestReason: "I love a good idea and want to support a friend on stage.",
};
const SAMPLE_SSC = {
  fullName: "Mia Roberts",
  email: "mia.roberts@example.com",
  phone: "0423 456 789",
  school: "Merewether High School",
  postCode: "2291",
  city: "Merewether",
  talkTitle: "Why boredom is good for you",
  videoUrl: "https://youtu.be/dQw4w9WgXcQ",
};

export const EMAIL_PREVIEWS: EmailPreview[] = [
  // --- Confirmations (to submitter) ---
  preview(
    "confirm-contact",
    "Contact — confirmation",
    "confirmation",
    "the sender",
    confirmContact(SAMPLE_CONTACT),
  ),
  preview(
    "confirm-nominate",
    "Speaker nomination — confirmation",
    "confirmation",
    "the nominator",
    confirmNominate(SAMPLE_NOMINATE),
  ),
  preview(
    "confirm-partner",
    "Partner enquiry — confirmation",
    "confirmation",
    "the partner contact",
    confirmPartner(SAMPLE_PARTNER),
  ),
  preview(
    "confirm-subscribe",
    "Newsletter — confirmation",
    "confirmation",
    "the subscriber",
    confirmSubscribe(),
  ),
  preview(
    "confirm-apply",
    "Volunteer — confirmation",
    "confirmation",
    "the applicant",
    confirmApply(SAMPLE_APPLY),
  ),
  preview(
    "confirm-youth-futures",
    "Youth Futures Lab — confirmation",
    "confirmation",
    "the school contact",
    confirmYouthFutures(SAMPLE_YFL),
  ),
  preview(
    "confirm-student-speaker",
    "Student Speaker — confirmation",
    "confirmation",
    "the student",
    confirmStudentSpeaker(SAMPLE_SSC),
  ),
  preview(
    "confirm-talk-night",
    "60-Second Talk Night — confirmation",
    "confirmation",
    "the registrant",
    confirmTalkNight(SAMPLE_TALK_NIGHT),
  ),
  preview(
    "feedback-request",
    "Event feedback — request",
    "confirmation",
    "each attendee",
    feedbackRequestEmail({
      fullName: "Daniel Cole",
      eventTitle: "60-Second Talk Night",
      url: `${SITE}/feedback/talk-night?t=preview`,
      extras: TALK_NIGHT_FEEDBACK_EXTRAS,
    }),
  ),
  preview(
    "feedback-reminder",
    "Event feedback — reminder (after 3 days)",
    "confirmation",
    "non-responders",
    feedbackReminderEmail({
      fullName: "Daniel Cole",
      eventTitle: "60-Second Talk Night",
      url: `${SITE}/feedback/talk-night?t=preview`,
    }),
  ),
  // --- Notifications (to admin team) ---
  preview(
    "notify-contact",
    "Contact — admin notification",
    "notification",
    "admin recipients",
    notifyContact(SAMPLE_CONTACT),
  ),
  preview(
    "notify-nominate",
    "Speaker nomination — admin notification",
    "notification",
    "admin recipients",
    notifyNominate(SAMPLE_NOMINATE),
  ),
  preview(
    "notify-partner",
    "Partner enquiry — admin notification",
    "notification",
    "admin recipients",
    notifyPartner(SAMPLE_PARTNER),
  ),
  preview(
    "notify-apply",
    "Volunteer application — admin notification",
    "notification",
    "admin recipients",
    notifyApply(SAMPLE_APPLY),
  ),
  preview(
    "notify-subscribe",
    "Newsletter subscriber — admin notification",
    "notification",
    "admin recipients",
    notifySubscribe({ email: "newfan@example.com", source: "home" }),
  ),
  preview(
    "notify-youth-futures",
    "Youth Futures Lab — admin notification",
    "notification",
    "admin recipients",
    notifyYouthFutures(SAMPLE_YFL),
  ),
  preview(
    "notify-student-speaker",
    "Student Speaker — admin notification",
    "notification",
    "admin recipients",
    notifyStudentSpeaker(SAMPLE_SSC),
  ),
  preview(
    "notify-talk-night",
    "60-Second Talk Night — admin notification",
    "notification",
    "admin recipients",
    notifyTalkNight(SAMPLE_TALK_NIGHT),
  ),
];
