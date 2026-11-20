import type { SocialLink } from "./social-catalogue";

// Builds the TEDxNewy email-signature HTML (2027 design: solid red X, name block, contact rows, social icons,
// then the campaign banner). Table based with inline styles only, so it holds up in Gmail and Outlook.
// Only the X mark and the banner are designed images; name, role, email and phone are live text.
// Every image loads from the live domain, so it appears in sent mail.
//
// Banner: public/brand/sig/banner.png (1200x240, shown at 600x120 and 480x96). It links to /sig/banner, which
// redirects (next.config.js) to the current campaign page, so the target can change without touching signatures.

export type SigInput = {
  name: string;
  role: string;
  email: string;
  phone?: string;
  web?: string;
  /** The person's own socials, from the catalogue. Only their LinkedIn is used in the signature. */
  socials?: SocialLink[];
  /** Adds a small Acknowledgement of Country line under the contact rows (full signature only). */
  aoc?: boolean;
};

const FB_URL = "https://www.facebook.com/TEDxNewy/";
const IG_URL = "https://instagram.com/tedxnewy";
const BANNER_URL = "https://tedxnewy.com.au/sig/banner";
const BANNER_ALT = "Don't miss out in 2027. Join our community to stay updated!";
const F = "font-family:Inter,'Helvetica Neue',Helvetica,Arial,sans-serif";
const RED = "#E62B1E";
const INK = "#000000";

function esc(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

function normalizeUrl(u: string): string {
  const t = u.trim();
  return /^https?:\/\//i.test(t) ? t : `https://${t}`;
}

/** The person's LinkedIn link, if they have one. */
function linkedinOf(i: SigInput): string | null {
  const l = (i.socials ?? []).find((x) => x.key === "linkedin" && x.url?.trim());
  return l ? normalizeUrl(l.url) : null;
}

/** Brand Facebook and Instagram always; the member's own LinkedIn when they have one. */
function iconRow(i: SigInput, base: string, size: number): string {
  const gap = size >= 20 ? 9 : 8;
  const cell = (href: string, file: string, alt: string, last: boolean) =>
    `<td style="padding:0 ${last ? 0 : gap}px 0 0"><a href="${esc(href)}" style="text-decoration:none"><img src="${base}/brand/social/${file}" width="${size}" height="${size}" alt="${alt}" style="display:block;border:0;width:${size}px;height:${size}px"></a></td>`;
  const li = linkedinOf(i);
  const cells = [cell(FB_URL, "facebook-red.png", "TEDxNewy on Facebook", false), cell(IG_URL, "instagram-red.png", "TEDxNewy on Instagram", !li)];
  if (li) cells.push(cell(li, "linkedin-red.png", "LinkedIn", true));
  return `<table role="presentation" cellpadding="0" cellspacing="0" border="0" style="border-collapse:collapse"><tr>${cells.join("")}</tr></table>`;
}

function banner(base: string, w: number, h: number): string {
  return `<a href="${BANNER_URL}" style="text-decoration:none"><img src="${base}/brand/sig/banner.png" width="${w}" height="${h}" alt="${esc(BANNER_ALT)}" style="display:block;border:0;width:${w}px;height:${h}px"></a>`;
}

/**
 * The full signature for new emails: X mark, then name, role, email and phone, social icons, and the banner.
 * `base` is where the images load from: the live site when copied, this origin when previewing.
 */
export function signatureHtml(i: SigInput, base = "https://tedxnewy.com.au"): string {
  const name = esc(i.name || "First Last");
  const role = esc(i.role || "Role");
  const email = esc(i.email || "name@tedxnewy.com.au");
  const web = esc((i.web || "tedxnewy.com.au").replace(/^https?:\/\//i, ""));
  const row = (icon: string, alt: string, href: string, text: string) =>
    `<tr><td style="width:20px;padding:0;vertical-align:middle"><img src="${base}/brand/sig/icon-${icon}.png" width="13" height="13" alt="${alt}" style="display:block;border:0;width:13px;height:13px"></td><td style="${F};font-size:13px;line-height:21px;padding:0;vertical-align:middle"><a href="${href}" style="${F};color:${INK};text-decoration:none">${text}</a></td></tr>`;
  const phone = (i.phone || "").trim();
  const contact = [
    row("mail", "Email", `mailto:${email}`, email),
    phone ? row("phone", "Phone", `tel:${esc(phone.replace(/\s+/g, ""))}`, esc(phone)) : "",
  ].join("");
  const aoc = i.aoc
    ? `<div style="${F};font-size:11px;line-height:16px;color:#6b6459;padding:4px 0 0 0">An independently licensed TED event on Awabakal and Worimi Country.</div>`
    : "";
  return `<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="600" style="width:600px;max-width:600px;border-collapse:collapse;${F};color:${INK}">
<tr><td valign="top" width="110" style="width:110px;padding:0 18px 0 0;vertical-align:top"><a href="https://${web}" style="text-decoration:none"><img src="${base}/brand/sig/x-mark.png" width="91" height="88" alt="TEDxNewy" style="display:block;border:0;width:91px;height:88px"></a></td>
<td valign="top" style="vertical-align:top"><div style="${F};font-size:19px;line-height:23px;font-weight:700;letter-spacing:-0.3px;color:${INK}">${name}</div>
<div style="${F};font-size:13px;line-height:19px;font-weight:700;color:${RED};padding:0 0 7px 0">${role}</div>
<table role="presentation" cellpadding="0" cellspacing="0" border="0" style="border-collapse:collapse">${contact}</table>
${aoc}<div style="padding:8px 0 0 0">${iconRow(i, base, 20)}</div></td></tr>
<tr><td colspan="2" style="padding:14px 0 0 0">${banner(base, 600, 120)}</td></tr>
</table>`;
}

// Shorter signature for replies and forwards: small X, name and role, social icons, then a smaller banner.
// No contact rows, since those already went out on the first email in the thread.
export function signatureReplyHtml(i: SigInput, base = "https://tedxnewy.com.au"): string {
  const name = esc(i.name || "Your name");
  const role = esc(i.role || "Role");
  const web = esc((i.web || "tedxnewy.com.au").replace(/^https?:\/\//i, ""));
  return `<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="480" style="width:480px;max-width:480px;border-collapse:collapse;${F};color:${INK}">
<tr><td valign="top" width="58" style="width:58px;padding:0 12px 0 0;vertical-align:top"><a href="https://${web}" style="text-decoration:none"><img src="${base}/brand/sig/x-mark-sm.png" width="46" height="44" alt="TEDxNewy" style="display:block;border:0;width:46px;height:44px"></a></td>
<td valign="top" style="vertical-align:top"><div style="${F};font-size:14px;line-height:18px;font-weight:700;color:${INK}">${name} <span style="color:${RED}">&nbsp;${role}</span></div>
<div style="padding:6px 0 0 0">${iconRow(i, base, 17)}</div></td></tr>
<tr><td colspan="2" style="padding:10px 0 0 0">${banner(base, 480, 96)}</td></tr>
</table>`;
}
