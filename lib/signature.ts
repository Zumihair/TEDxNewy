import { SOCIAL_BY_KEY, type SocialLink } from "./social-catalogue";

// Builds the TEDxNewy email-signature HTML (mirrors the asset-library template).
// Logo and icons load from the live domain so they appear in sent mail.

export type SigInput = {
  name: string;
  role: string;
  email: string;
  phone?: string;
  web?: string;
  /** The person's own socials, from the catalogue. Each shows as a red icon. */
  socials?: SocialLink[];
  aoc?: boolean;
};

const FAM = "font-family:'Helvetica Neue',Helvetica,Arial,sans-serif";
const RED = "#e62b1e";
const INK = "#000000";
const GREY = "#8a8279";

function normalizeUrl(u: string): string {
  const t = u.trim();
  return /^https?:\/\//i.test(t) ? t : `https://${t}`;
}

/**
 * The full signature for new emails: name first, then role, contact lines, social icons, and the logo and
 * tagline under a hairline. Table based with inline styles only, so it holds up in Gmail and Outlook.
 * `base` is where the images load from: the live site when copied, this origin when previewing.
 */
export function signatureHtml(i: SigInput, base = "https://tedxnewy.com.au"): string {
  const name = i.name || "First Last";
  const role = i.role || "Role";
  const email = i.email || "name@tedxnewy.com.au";
  const web = i.web || "tedxnewy.com.au";
  const F = "font-family:Inter,'Helvetica Neue',Helvetica,Arial,sans-serif";
  const row = (icon: string, alt: string, href: string, text: string) =>
    `<tr><td style="width:22px;padding:0;vertical-align:middle"><img src="${base}/brand/sig/icon-${icon}.png" width="14" height="14" alt="${alt}" style="display:block;border:0;width:14px;height:14px"></td><td style="${F};font-size:13px;line-height:22px;padding:0;vertical-align:middle"><a href="${href}" style="${F};color:#000000;text-decoration:none">${text}</a></td></tr>`;
  const rows = [
    row("mail", "Email", `mailto:${email}`, email),
    i.phone ? row("phone", "Phone", `tel:${i.phone.replace(/\s+/g, "")}`, i.phone) : "",
  ].join("");
  const icon = (href: string, file: string, alt: string) =>
    `<td style="padding:0 10px 0 0"><a href="${href}" style="text-decoration:none"><img src="${base}/brand/social/${file}" width="20" height="20" alt="${alt}" style="display:block;border:0;width:20px;height:20px"></a></td>`;
  // Their own socials first; TEDxNewy's Instagram stays unless they have added their own.
  const own = i.socials ?? [];
  const cells = own.map((x) => icon(normalizeUrl(x.url), `${x.key}-red.png`, SOCIAL_BY_KEY[x.key]?.label ?? x.key));
  if (!own.some((x) => x.key === "instagram")) cells.push(icon("https://instagram.com/tedxnewy", "instagram-red.png", "Instagram"));
  const social = `<table role="presentation" cellpadding="0" cellspacing="0" border="0" style="border-collapse:collapse"><tr>${cells.join("")}</tr></table>`;
  const aoc = i.aoc
    ? `<tr><td style="${F};font-size:11px;line-height:17px;color:#6b6459;padding:4px 0 0 0">An independently licensed TED event on Awabakal and Worimi Country.</td></tr>`
    : "";
  return `<table role="presentation" cellpadding="0" cellspacing="0" border="0" style="max-width:480px;border-collapse:collapse;${F};color:#000000">
<tr><td style="${F};font-size:22px;line-height:26px;font-weight:700;letter-spacing:-0.5px;color:#000000">${name}</td></tr>
<tr><td style="${F};font-size:14px;line-height:20px;font-weight:600;color:#E62B1E;padding:2px 0 12px 0">${role}</td></tr>
<tr><td style="padding:0 0 12px 0"><table role="presentation" cellpadding="0" cellspacing="0" border="0" style="border-collapse:collapse">${rows}</table></td></tr>
<tr><td style="padding:0 0 16px 0">${social}</td></tr>
<tr><td style="border-top:1px solid #d8d2c8;font-size:0;line-height:0;height:1px">&nbsp;</td></tr>
<tr><td style="padding:14px 0 0 0"><a href="https://${web}" style="text-decoration:none"><img src="${base}/brand/sig/logo.png" width="130" height="24" alt="TEDxNewy" style="display:block;border:0;width:130px;height:24px"></a></td></tr>
<tr><td style="${F};font-size:12.5px;line-height:18px;font-weight:600;color:#000000;padding:8px 0 0 0">Ideas change everything.</td></tr>
${aoc}
<tr><td style="${F};font-size:10.5px;line-height:16px;color:#8a8279;padding:4px 0 0 0">This independent TEDx event is operated under licence from TED.</td></tr>
</table>`;
}

// Short signature for replies: name and role, the person's social icons, then the small logo linking to the
// website. No contact lines, since those already went out on the first email in the thread.
export function signatureReplyHtml(i: SigInput, base = "https://tedxnewy.com.au"): string {
  const name = i.name || "Your name";
  const role = i.role || "Role";
  const web = i.web || "tedxnewy.com.au";
  const icon = (href: string, file: string, alt: string) =>
    `<td style="padding:0 10px 0 0"><a href="${href}" style="text-decoration:none"><img src="${base}/brand/social/${file}" width="20" height="20" alt="${alt}" style="display:block;border:0;width:20px;height:20px"></a></td>`;
  const own = i.socials ?? [];
  const cells = own.map((x) => icon(normalizeUrl(x.url), `${x.key}-red.png`, SOCIAL_BY_KEY[x.key]?.label ?? x.key));
  if (!own.some((x) => x.key === "instagram")) cells.push(icon("https://instagram.com/tedxnewy", "instagram-red.png", "Instagram"));
  const social = `<table role="presentation" cellpadding="0" cellspacing="0" border="0" style="border-collapse:collapse"><tr>${cells.join("")}</tr></table>`;
  return `<table role="presentation" cellpadding="0" cellspacing="0" border="0" style="${FAM};border-collapse:collapse">
<tr><td style="${FAM};font-size:15px;line-height:20px;font-weight:bold;color:${INK};letter-spacing:-.2px">${name}</td></tr>
<tr><td style="${FAM};font-size:12.5px;line-height:18px;color:${RED};font-weight:bold;padding:0 0 8px 0">${role}</td></tr>
<tr><td style="padding:0 0 8px 0">${social}</td></tr>
<tr><td style="padding:0"><a href="https://${web}" style="text-decoration:none"><img src="${base}/brand/sig/logo.png" width="112" height="20" alt="TEDxNewy" style="display:block;border:0;width:112px;height:20px"></a></td></tr>
</table>`;
}
