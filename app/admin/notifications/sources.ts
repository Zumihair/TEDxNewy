/**
 * The LIVE forms that can email notifications. `value` matches the
 * `form_source` string each API route passes to sendFormNotification() in
 * lib/email-notify. Every form here is wired to send, so adding a recipient
 * takes effect immediately.
 *
 * KEEP THIS LIST TO LIVE FORMS ONLY. When a form is taken offline (page
 * removed, closed notice, or route disabled), remove its entry here in the
 * same change, and delete its rows from `notification_recipients`
 * (`delete from notification_recipients where form_source = '<value>'`).
 * Re-add the entry when the form returns. See CLAUDE.md, "Retiring a form".
 *
 * Plain data (no "use client"/"use server") so it can be imported by the
 * server page, the server actions, and the client matrix alike.
 */
export type FormSource = {
  /** form_source value stored in notification_recipients */
  value: string;
  /** Full human label (used in the Add recipient dialog) */
  label: string;
  /** Short label for the matrix column header */
  short: string;
  /** One plain-English line: which form this is and where it lives */
  about: string;
};

export const FORM_SOURCES: FormSource[] = [
  {
    value: "apply",
    label: "Volunteer applications",
    short: "Volunteers",
    about: "Someone applies for a role or offers to help on /volunteer.",
  },
  {
    value: "nominate",
    label: "Speaker nominations",
    short: "Speakers",
    about: "Someone nominates or applies to speak on /speak.",
  },
  {
    value: "partner",
    label: "Partner enquiries",
    short: "Partners",
    about: "A business or organisation enquires on /partner.",
  },
  {
    value: "contact",
    label: "Contact messages",
    short: "Contact",
    about: "A message sent through the /contact form.",
  },
  {
    value: "subscribe",
    label: "Newsletter signups",
    short: "Newsletter",
    about: "Someone joins the newsletter from the website.",
  },
];

export const SOURCE_VALUES = FORM_SOURCES.map((s) => s.value);

export function sourceLabel(value: string): string {
  return FORM_SOURCES.find((s) => s.value === value)?.label ?? value;
}
