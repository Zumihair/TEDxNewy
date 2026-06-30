// Builds the TEDxNewy email-signature HTML (mirrors the asset-library template).
// Logo and icons load from the live domain so they appear in sent mail.

export type SigInput = {
  name: string;
  role: string;
  email: string;
  phone?: string;
  web?: string;
  aoc?: boolean;
};

const FAM = "font-family:Arial,Helvetica,sans-serif";
const RED = "#e02214";
const INK = "#141210";
const GREY = "#8a8279";
const LOGO = "https://tedxnewy.com.au/brand/tedxnewy-black.png";
const IG = "https://tedxnewy.com.au/brand/social/instagram-red.png";
const LI = "https://tedxnewy.com.au/brand/social/linkedin-red.png";

export function signatureHtml(i: SigInput): string {
  const name = i.name || "Your name";
  const role = i.role || "Role";
  const email = i.email || "hello@tedxnewy.com.au";
  const web = i.web || "tedxnewy.com.au";
  const LH = "line-height:23px";
  const phPart = i.phone
    ? `<span style="color:#c9c3ba"> &nbsp;|&nbsp; </span><a href="tel:${i.phone.replace(/\s+/g, "")}" style="color:${INK};text-decoration:none">${i.phone}</a>`
    : "";
  const aocLine = i.aoc
    ? `<div style="${FAM};font-size:10px;line-height:1.5;color:${GREY};padding-top:6px;max-width:430px">An independently licensed TED event on Awabakal and Worimi Country.</div>`
    : "";
  return `<table cellpadding="0" cellspacing="0" border="0" style="${FAM};border-collapse:collapse">
<tr>
  <td style="vertical-align:middle;padding:0 20px 0 0;border-right:3px solid ${RED}">
    <img src="${LOGO}" alt="TEDxNewy" width="146" style="display:block;border:0">
  </td>
  <td style="vertical-align:middle;padding:0 0 0 20px">
    <div style="${FAM};font-size:17px;font-weight:bold;color:${INK};letter-spacing:-.2px;${LH}">${name}</div>
    <div style="${FAM};font-size:12px;color:${INK};${LH}">${role} &middot; TEDxNewy</div>
    <div style="${FAM};font-size:12px;color:${INK};${LH}"><a href="mailto:${email}" style="color:${INK};text-decoration:none">${email}</a>${phPart}</div>
    <div style="${FAM};font-size:12px;${LH}"><a href="https://${web}" style="color:${RED};text-decoration:none;font-weight:bold">${web}</a></div>
    <div style="${LH};font-size:0">
      <a href="https://instagram.com/tedxnewy" style="text-decoration:none"><img src="${IG}" width="17" height="17" alt="Instagram" style="display:inline-block;border:0;vertical-align:middle"></a>
      <a href="https://www.linkedin.com/company/tedxnewy" style="text-decoration:none"><img src="${LI}" width="17" height="17" alt="LinkedIn" style="display:inline-block;border:0;vertical-align:middle;margin-left:11px"></a>
    </div>
    ${aocLine}
  </td>
</tr>
<tr><td colspan="2" style="${FAM};font-size:9.5px;color:#b3aca2;padding-top:13px;letter-spacing:.2px">This independent TEDx event is operated under licence from TED.</td></tr>
</table>`;
}
