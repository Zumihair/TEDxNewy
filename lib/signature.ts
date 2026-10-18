// Builds the TEDxNewy email-signature HTML (mirrors the asset-library template).
// Logo and icons load from the live domain so they appear in sent mail.

export type SigInput = {
  name: string;
  role: string;
  email: string;
  phone?: string;
  web?: string;
  linkedin?: string;
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
 * The full signature for new emails: the TEDxNewy logo, the name, the role, contact lines, two social icons
 * and a quiet footer under a red rule. Table based with inline styles only, so it holds up in Gmail and
 * Outlook. `base` is where the images load from: the live site when copied, this origin when previewing.
 */
export function signatureHtml(i: SigInput, base = "https://tedxnewy.com.au"): string {
  const name = i.name || "First Last";
  const role = i.role || "Role";
  const email = i.email || "name@tedxnewy.com.au";
  const web = i.web || "tedxnewy.com.au";
  const F = "font-family:Inter,'Helvetica Neue',Helvetica,Arial,sans-serif";
  const link = (href: string, text: string) =>
    `<a href="${href}" style="${F};font-size:13px;line-height:20px;color:#000000;text-decoration:none">${text}</a>`;
  const sep = `<span style="color:#d8d2c8">&nbsp;&nbsp;|&nbsp;&nbsp;</span>`;
  const contacts = [
    link(`mailto:${email}`, email),
    i.phone ? link(`tel:${i.phone.replace(/\s+/g, "")}`, i.phone) : "",
    link(`https://${web}`, web),
  ].filter(Boolean).join(sep);
  const icon = (href: string, file: string, alt: string) =>
    `<td style="padding:0 10px 0 0"><a href="${href}" style="text-decoration:none"><img src="${base}/brand/social/${file}" width="20" height="20" alt="${alt}" style="display:block;border:0;width:20px;height:20px"></a></td>`;
  const social = `<table role="presentation" cellpadding="0" cellspacing="0" border="0" style="border-collapse:collapse"><tr>${
    i.linkedin ? icon(normalizeUrl(i.linkedin), "linkedin-red.png", "LinkedIn") : ""
  }${icon("https://instagram.com/tedxnewy", "instagram-red.png", "Instagram")}</tr></table>`;
  const aoc = i.aoc
    ? `<tr><td style="${F};font-size:11px;line-height:17px;color:#6b6459;padding:2px 0 0 0">An independently licensed TED event on Awabakal and Worimi Country.</td></tr>`
    : "";
  return `<table role="presentation" cellpadding="0" cellspacing="0" border="0" style="max-width:520px;border-collapse:collapse;${F};color:#000000">
<tr><td style="padding:0 0 14px 0"><a href="https://${web}" style="text-decoration:none"><img src="${base}/brand/sig/logo.png" width="170" height="31" alt="TEDxNewy" style="display:block;border:0;width:170px;height:31px"></a></td></tr>
<tr><td style="${F};font-size:20px;line-height:24px;font-weight:700;letter-spacing:-0.4px;color:#000000">${name}</td></tr>
<tr><td style="${F};font-size:13.5px;line-height:20px;font-weight:600;color:#E62B1E;padding:1px 0 10px 0">${role}, TEDxNewy</td></tr>
<tr><td style="padding:0 0 10px 0">${contacts}</td></tr>
<tr><td style="padding:0 0 14px 0">${social}</td></tr>
<tr><td style="border-top:2px solid #E62B1E;padding:10px 0 0 0;font-size:0;line-height:0">&nbsp;</td></tr>
<tr><td style="${F};font-size:12.5px;line-height:18px;font-weight:700;color:#E62B1E">Ideas change everything.</td></tr>
${aoc}
<tr><td style="${F};font-size:10.5px;line-height:16px;color:#8a8279;padding:2px 0 0 0">This independent TEDx event is operated under licence from TED.</td></tr>
</table>`;
}

// Short signature for replies: the small logo, name and role, and a link. No contact lines or icons, since
// those already went out on the first email in the thread.
export function signatureReplyHtml(i: SigInput, base = "https://tedxnewy.com.au"): string {
  const name = i.name || "Your name";
  const role = i.role || "Role";
  const web = i.web || "tedxnewy.com.au";
  return `<table role="presentation" cellpadding="0" cellspacing="0" border="0" style="${FAM};border-collapse:collapse">
<tr><td style="padding:0 0 8px 0"><a href="https://${web}" style="text-decoration:none"><img src="${base}/brand/sig/logo.png" width="112" height="20" alt="TEDxNewy" style="display:block;border:0;width:112px;height:20px"></a></td></tr>
<tr><td style="${FAM};font-size:15px;line-height:20px;font-weight:bold;color:${INK};letter-spacing:-.2px">${name}</td></tr>
<tr><td style="${FAM};font-size:12.5px;line-height:18px;color:${RED};font-weight:bold">${role}, TEDxNewy</td></tr>
<tr><td style="${FAM};font-size:12px;line-height:18px;color:${GREY}"><a href="https://${web}" style="color:${GREY};text-decoration:none">${web}</a></td></tr>
</table>`;
}
