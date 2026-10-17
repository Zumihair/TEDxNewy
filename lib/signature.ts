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
const LOGO = "https://tedxnewy.com.au/brand/tedxnewy-black-signature.png";
const IG = "https://tedxnewy.com.au/brand/social/instagram-red.png";
const LI = "https://tedxnewy.com.au/brand/social/linkedin-red.png";

function normalizeUrl(u: string): string {
  const t = u.trim();
  return /^https?:\/\//i.test(t) ? t : `https://${t}`;
}

/**
 * The full signature for new emails: a red X tile, the name big, round contact buttons, a ribbon, and a
 * card that points people at the site. Table based with inline styles only, so it holds up in Gmail and
 * Outlook. `base` is where the images load from: the live site when copied, this origin when previewing.
 */
export function signatureHtml(i: SigInput, base = "https://tedxnewy.com.au"): string {
  const name = i.name || "First Last";
  const role = i.role || "Role";
  const email = i.email || "name@tedxnewy.com.au";
  const web = i.web || "tedxnewy.com.au";
  const F = "font-family:Inter,'Helvetica Neue',Helvetica,Arial,sans-serif";
  const btn = (href: string, icon: string, alt: string) =>
    `<td style="padding:0 8px 0 0"><a href="${href}" style="text-decoration:none"><table role="presentation" cellpadding="0" cellspacing="0" border="0" style="border-collapse:separate"><tr><td width="36" height="36" align="center" valign="middle" bgcolor="#F4EFE6" style="width:36px;height:36px;border-radius:18px;background:#F4EFE6"><img src="${base}/brand/sig/icon-${icon}.png" width="18" height="18" alt="${alt}" style="display:block;border:0;width:18px;height:18px"></td></tr></table></a></td>`;
  const phone = i.phone ? btn(`tel:${i.phone.replace(/\s+/g, "")}`, "phone", "Call") : "";
  const linkedin = i.linkedin ? btn(normalizeUrl(i.linkedin), "linkedin", "LinkedIn") : "";
  const aoc = i.aoc
    ? `<tr><td style="${F};font-size:11px;line-height:17px;color:#6b6459;padding:14px 0 0 0">An independently licensed TED event on Awabakal and Worimi Country.</td></tr>`
    : "";
  return `<table role="presentation" cellpadding="0" cellspacing="0" border="0" style="width:100%;max-width:560px;border-collapse:collapse;${F};color:#000000">
<tr><td style="padding:0 0 16px 0">
  <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="border-collapse:collapse"><tr>
    <td width="88" valign="middle" style="width:88px;padding:0 18px 0 0"><img src="${base}/brand/sig/tile.png" width="88" height="88" alt="TEDxNewy" style="display:block;border:0;width:88px;height:88px"></td>
    <td valign="middle">
      <div style="${F};font-size:22px;line-height:26px;font-weight:700;letter-spacing:-0.6px;color:#000000">${name}</div>
      <div style="${F};font-size:13.5px;line-height:20px;font-weight:600;color:#E62B1E;padding:2px 0 0 0">${role}, TEDxNewy</div>
      <div style="${F};font-size:12.5px;line-height:19px;color:#6b6459">Ideas change everything.</div>
      <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="border-collapse:collapse;margin:10px 0 0 0"><tr>
        ${btn(`mailto:${email}`, "mail", "Email")}${phone}${linkedin}${btn("https://instagram.com/tedxnewy", "instagram", "Instagram")}
      </tr></table>
    </td>
  </tr></table>
</td></tr>
<tr><td style="padding:0"><img src="${base}/brand/sig/ribbon.png" width="560" height="6" alt="" style="display:block;width:100%;max-width:560px;height:6px;border:0"></td></tr>
<tr><td style="padding:14px 0 0 0">
  <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="width:100%;border-collapse:separate"><tr>
    <td bgcolor="#F4EFE6" style="background:#F4EFE6;border-radius:16px;padding:10px">
      <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="width:100%;border-collapse:collapse"><tr>
        <td width="44" valign="middle" style="width:44px;padding:0 12px 0 0"><a href="https://${web}" style="text-decoration:none"><img src="${base}/brand/sig/tile.png" width="44" height="44" alt="" style="display:block;border:0;width:44px;height:44px"></a></td>
        <td valign="middle" style="${F}">
          <a href="https://${web}" style="${F};font-size:14px;line-height:18px;font-weight:600;color:#000000;text-decoration:none">See what is coming up</a><br>
          <a href="https://${web}" style="${F};font-size:12.5px;line-height:17px;color:#6b6459;text-decoration:none">Talks, salons and events in Newcastle</a>
        </td>
        <td align="right" valign="middle" style="text-align:right;white-space:nowrap;padding:0 4px 0 12px">
          <table role="presentation" cellpadding="0" cellspacing="0" border="0" align="right" style="border-collapse:separate"><tr>
            <td bgcolor="#000000" style="background:#000000;border-radius:999px;padding:0 16px;height:34px;line-height:34px"><a href="https://${web}" style="${F};font-size:13px;line-height:34px;font-weight:600;color:#FFFFFF;text-decoration:none;display:inline-block"><span style="color:#FFFFFF">Visit&nbsp;&#8599;</span></a></td>
          </tr></table>
        </td>
      </tr></table>
    </td>
  </tr></table>
</td></tr>
${aoc}
<tr><td style="${F};font-size:10.5px;line-height:16px;color:#8a8279;padding:12px 0 0 0">This independent TEDx event is operated under licence from TED.</td></tr>
</table>`;
}

// Short signature for replies: name, role, and the tagline only. No contact
// details, logo, or icons, since those already went out on the first email
// in the thread.
export function signatureReplyHtml(i: SigInput): string {
  const name = i.name || "Your name";
  const role = i.role || "Role";
  const LH = "line-height:23px";
  return `<table cellpadding="0" cellspacing="0" border="0" style="${FAM};border-collapse:collapse">
<tr><td>
  <div style="${FAM};font-size:17px;font-weight:bold;color:${INK};letter-spacing:-.2px;${LH}">${name}</div>
  <div style="${FAM};font-size:12px;color:${INK};${LH}">${role} &middot; TEDxNewy</div>
  <div style="${FAM};font-size:12px;font-weight:bold;color:${RED};${LH};padding-top:6px">Ideas change everything.</div>
</td></tr>
</table>`;
}
