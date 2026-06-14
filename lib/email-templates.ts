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
const SITE = "https://tedxnewy.com.au";
const ADMIN = `${SITE}/admin`;
const LOGO_DARK_TEXT = `${SITE}/brand/tedxnewy-black.png`; // for light backgrounds
const LOGO_LIGHT_TEXT = `${SITE}/brand/tedxnewy-white.png`; // for dark backgrounds
const CONTACT_EMAIL = "hello@tedxnewy.com.au";
// Public-facing reply address. Youth Futures uses its own (see YFL_EMAIL).
const REPLY_EMAIL = "hello@tedxnewy.com.au";
const YFL_EMAIL = "activations@tedxnewy.com.au";
const SOCIALS: { label: string; href: string; icon: string }[] = [
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
  <meta name="color-scheme" content="light only" />
  <title>${escapeHtml(o.eyebrow)}</title>
</head>
<body style="margin:0;padding:0;background:#f4efe6;-webkit-font-smoothing:antialiased;-webkit-text-size-adjust:100%">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f4efe6">
    <tr>
      <td align="center" style="padding:28px 14px">
        <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="width:600px;max-width:100%;background:#ffffff;border-radius:18px;overflow:hidden;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif">
          <tr>
            <td style="padding:34px 36px 0;text-align:center">
              <a href="${SITE}" style="text-decoration:none"><img src="${LOGO_DARK_TEXT}" alt="TEDxNewy" width="170" style="width:170px;max-width:62%;height:auto;display:inline-block;border:0" /></a>
            </td>
          </tr>
          <tr>
            <td style="padding:22px 36px 0">
              <div style="height:3px;width:46px;background:#e02214;border-radius:2px"></div>
            </td>
          </tr>
          <tr>
            <td style="padding:18px 36px 34px">
              <div style="font-size:11px;font-weight:700;letter-spacing:0.22em;text-transform:uppercase;color:#e02214;font-family:ui-monospace,Menlo,monospace">${escapeHtml(
                o.eyebrow,
              )}</div>
              <h1 style="margin:12px 0 0;font-size:23px;line-height:1.22;font-weight:600;color:#141210;letter-spacing:-0.01em">${o.heading}</h1>
              <div style="margin-top:16px;font-size:15px;line-height:1.62;color:#2a2521">${o.bodyHtml}</div>
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
          <td style="padding:9px 18px 9px 0;border-bottom:1px solid #efe9dd;font-size:14px;line-height:1.5;font-weight:700;color:#141210;vertical-align:${va};white-space:nowrap">${escapeHtml(
            r.label,
          )}</td>
          <td style="padding:9px 0;border-bottom:1px solid #efe9dd;font-size:14px;line-height:1.5;font-weight:400;color:#2a2521;vertical-align:${va}${
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
    <div style="font-size:10.5px;font-weight:700;letter-spacing:0.12em;text-transform:uppercase;color:#8a8278;font-family:ui-monospace,Menlo,monospace">${escapeHtml(
      label,
    )}</div>
    <div style="margin-top:7px;font-size:14px;line-height:1.6;color:#141210;white-space:pre-wrap">${escapeHtml(
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
    adminPath: "/contact-messages",
    textIntro: [`${d.fullName} sent a message through the contact form.`],
  });
}

export function notifyNominate(d: {
  nomineeName: string;
  nomineeTitle: string;
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
      ["Nominator", d.nominatorName],
      ["Email", d.nominatorEmail],
      ["Relationship", d.relationship ?? null],
      ["Link", d.link ?? null],
    ],
    long: [{ label: "The idea", text: d.idea }],
    adminPath: "/nominations",
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
    adminPath: "/partner-enquiries",
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
  crew: string;
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
      ["Crew", d.crew],
    ],
    long: d.note ? [{ label: "Note", text: d.note }] : [],
    adminPath: "/applications",
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
    adminPath: "/youth-futures",
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
    adminPath: "/student-speaker-competition",
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
    adminPath: "/talk-night",
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
  crew: string;
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
        ["Crew", d.crew],
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
        { label: "Crew you chose", value: d.crew },
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
      <div style="margin-top:18px;font-size:10.5px;font-weight:700;letter-spacing:0.12em;text-transform:uppercase;color:#8a8278;font-family:ui-monospace,Menlo,monospace">Event details</div>
      <ul style="margin:8px 0 0;padding-left:20px;font-size:14px;line-height:1.6;color:#141210">
        <li><strong>Friday, 7 August 2026</strong>, 9:30 am to 2:30 pm</li>
        <li>University of Newcastle, NUspace City Campus, Room X-101</li>
        <li>Free for selected schools</li>
        <li style="margin-top:6px;color:#6b6459">Morning tea and lunch are not provided. Students bring their own food or use the university cafe on campus.</li>
      </ul>
      <p style="margin:18px 0 0;color:#6b6459">Any questions or concerns can be directed to <a href="mailto:${YFL_EMAIL}" style="color:#e02214;text-decoration:none">${YFL_EMAIL}</a>.</p>`,
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
      `  Entries close 15 August 2026.`,
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
      <div style="margin-top:18px;font-size:10.5px;font-weight:700;letter-spacing:0.12em;text-transform:uppercase;color:#8a8278;font-family:ui-monospace,Menlo,monospace">What happens next</div>
      <ul style="margin:8px 0 0;padding-left:20px;font-size:14px;line-height:1.6;color:#141210">
        <li>Entries close <strong>15 August 2026</strong>.</li>
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
    ? "Because you'd like to speak, we'll be in touch with a few details on how the 60-second talks run if you're selected."
    : "If you're selected, we'll send everything you need to know closer to the night.";
  const intimateNote =
    "This is an intimate, invite-only evening, and we sadly can't take everyone who registers. We read every expression of interest and will be in touch to confirm your spot.";
  const guestLine = d.guestName
    ? `We've also noted your guest, ${d.guestName}. Their spot is part of the same review.`
    : null;
  return {
    subject: "Your 60-Second Talk Night EOI · TEDxNewy",
    text: [
      `Hi ${name},`,
      ``,
      `Thanks for registering your interest in the TEDxNewy 60-Second Talk Night. We've got your expression of interest.`,
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
      `  Wednesday 16 July 2026, 6:00pm to 8:00pm`,
      `  The Base, Newcastle West`,
      `  Free, by invitation through EOI`,
      ``,
      `Any questions? Just reply to this email or write to ${REPLY_EMAIL}.`,
    ].join("\n"),
    html: emailShell({
      eyebrow: "60-Second Talk Night · EOI received",
      heading: `EOI received. Thanks ${escapeHtml(name)}.`,
      bodyHtml: `${p(
        "Thanks for registering your interest in the TEDxNewy 60-Second Talk Night. We&rsquo;ve got your expression of interest.",
      )}${p(intimateNote)}${fieldTable([
        { label: "Interest", value: interest },
        { label: "Guest", value: d.guestName ?? null },
      ])}${p(speakerNote)}${guestLine ? p(escapeHtml(guestLine)) : ""}
      <div style="margin-top:18px;font-size:10.5px;font-weight:700;letter-spacing:0.12em;text-transform:uppercase;color:#8a8278;font-family:ui-monospace,Menlo,monospace">Event details</div>
      <ul style="margin:8px 0 0;padding-left:20px;font-size:14px;line-height:1.6;color:#141210">
        <li><strong>Wednesday 16 July 2026</strong>, 6:00pm to 8:00pm</li>
        <li>The Base, Newcastle West</li>
        <li>Free, by invitation through EOI</li>
      </ul>
      <p style="margin:18px 0 0;color:#6b6459">Any questions? Just reply to this email or write to <a href="mailto:${REPLY_EMAIL}" style="color:#e02214;text-decoration:none">${REPLY_EMAIL}</a>.</p>`,
    }),
  };
}

/**
 * Free-form email composed in the admin (Settings -> Emails). Wraps the
 * admin's subject + body in the same branded shell every transactional
 * email uses. Blank lines start new paragraphs; single newlines become
 * line breaks. `body` is plain text and is escaped.
 */
export function composeEmail(d: {
  subject: string;
  heading?: string;
  eyebrow?: string;
  body: string;
  cta?: { href: string; label: string };
}): EmailContent {
  const bodyHtml = d.body
    .trim()
    .split(/\n{2,}/)
    .map((para) => p(escapeHtml(para).replace(/\n/g, "<br />")))
    .join("");
  return {
    subject: d.subject,
    text: d.body,
    html: emailShell({
      eyebrow: d.eyebrow?.trim() || "A note from TEDxNewy",
      heading: escapeHtml(d.heading?.trim() || d.subject),
      bodyHtml,
      cta: d.cta,
    }),
  };
}

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
  crew: "Production",
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
