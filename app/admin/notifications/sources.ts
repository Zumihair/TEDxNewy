/**
 * The forms that can email notifications. `value` matches the `form_source`
 * string each API route passes to sendFormNotification() in lib/email-notify.
 * Keep this list in sync with those routes — every form here is already wired
 * to send, so adding a recipient takes effect immediately.
 *
 * Plain data (no "use client"/"use server") so it can be imported by the
 * server page, the server actions, and the client matrix alike.
 */
export type FormSource = {
  /** form_source value stored in notification_recipients */
  value: string;
  /** Full human label */
  label: string;
  /** Short label for the matrix column header */
  short: string;
};

export const FORM_SOURCES: FormSource[] = [
  { value: "youth-futures", label: "Youth Futures Lab", short: "Youth Futures" },
  {
    value: "student-speaker",
    label: "Student Speaker Competition",
    short: "Student speaker",
  },
  { value: "nominate", label: "Speaker nominations", short: "Nominations" },
  { value: "apply", label: "Volunteer applications", short: "Applications" },
  { value: "partner", label: "Partner enquiries", short: "Partners" },
  { value: "contact", label: "Contact messages", short: "Contact" },
  { value: "subscribe", label: "Newsletter subscribers", short: "Subscribers" },
];

export const SOURCE_VALUES = FORM_SOURCES.map((s) => s.value);

export function sourceLabel(value: string): string {
  return FORM_SOURCES.find((s) => s.value === value)?.label ?? value;
}
