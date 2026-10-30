// Letters and evidence files for grant applications: types, labels and the
// date rules. No "use client" on purpose: the server page, the client forms
// and the dev preview all import these, and a plain value exported from a
// client file is only a stub on the server.
import { daysBetween, shortDate } from "../shared";

// ---- Reference letters ----

export type LetterStatus = "to_ask" | "asked" | "drafting" | "received";
export const LETTER_STATUSES: LetterStatus[] = ["to_ask", "asked", "drafting", "received"];
export const LETTER_STATUS_LABEL: Record<LetterStatus, string> = {
  to_ask: "To ask",
  asked: "Asked",
  drafting: "Drafting",
  received: "Received",
};

export type LetterType = "partner" | "participant" | "community" | "youth" | "other";
export const LETTER_TYPES: LetterType[] = ["partner", "participant", "community", "youth", "other"];
export const LETTER_TYPE_LABEL: Record<LetterType, string> = {
  partner: "Partner support",
  participant: "Participant reference",
  community: "Community support",
  youth: "Youth voice",
  other: "Other",
};

export type GrantLetter = {
  id: string;
  referee: string;
  role: string | null;
  letter_type: LetterType;
  status: LetterStatus;
  asked_on: string | null;
  due_on: string | null;
  received_on: string | null;
  file_url: string | null;
  file_name: string | null;
  storage_path: string | null;
  notes: string | null;
  updated_at: string;
};

export const asLetterStatus = (v: unknown): LetterStatus =>
  LETTER_STATUSES.includes(v as LetterStatus) ? (v as LetterStatus) : "to_ask";
export const asLetterType = (v: unknown): LetterType =>
  LETTER_TYPES.includes(v as LetterType) ? (v as LetterType) : "other";

/** Due-date wording for a letter that is still outstanding, and whether it needs attention now. */
export function letterDue(l: GrantLetter, today: string): { text: string; urgent: boolean } | null {
  if (l.status === "received" || !l.due_on) return null;
  const days = daysBetween(today, l.due_on);
  if (days < 0) return { text: `Overdue by ${days === -1 ? "1 day" : `${-days} days`}`, urgent: true };
  if (days === 0) return { text: "Due today", urgent: true };
  if (days === 1) return { text: "Due tomorrow", urgent: true };
  return { text: `Due ${shortDate(l.due_on)}`, urgent: days <= 3 };
}

// ---- Evidence files ----

export type FileKind =
  | "certificate"
  | "incorporation"
  | "constitution"
  | "registration"
  | "bank"
  | "financials"
  | "signatories"
  | "licence"
  | "report"
  | "other";
export const FILE_KINDS: FileKind[] = [
  "certificate",
  "incorporation",
  "constitution",
  "registration",
  "bank",
  "financials",
  "signatories",
  "licence",
  "report",
  "other",
];
export const FILE_KIND_LABEL: Record<FileKind, string> = {
  certificate: "Certificate of currency",
  incorporation: "Incorporation",
  constitution: "Constitution",
  registration: "ABN, ACN and GST",
  bank: "Bank statement",
  financials: "Financial statements",
  signatories: "Authorised signatories",
  licence: "Licence",
  report: "Impact report",
  other: "Other",
};

export type GrantFile = {
  id: string;
  title: string;
  kind: FileKind;
  file_url: string | null;
  file_name: string | null;
  storage_path: string | null;
  /** The date on the document, plain YYYY-MM-DD. */
  dated_on: string | null;
  /** Plain YYYY-MM-DD. Blank means it never expires. */
  expires_on: string | null;
  notes: string | null;
  updated_at: string;
};

export const asFileKind = (v: unknown): FileKind =>
  FILE_KINDS.includes(v as FileKind) ? (v as FileKind) : "other";

/** How far ahead an upcoming expiry starts to show as a warning. */
export const EXPIRY_WARN_DAYS = 60;

export type Expiry = { state: "none" | "ok" | "soon" | "expired"; days: number | null };

export function expiryOf(expiresOn: string | null, today: string): Expiry {
  if (!expiresOn) return { state: "none", days: null };
  const days = daysBetween(today, expiresOn);
  if (days < 0) return { state: "expired", days };
  return { state: days <= EXPIRY_WARN_DAYS ? "soon" : "ok", days };
}

/** One line for a file card: "Expired 30 Sep 2026", "Expires in 34 days", "No expiry". */
export function expiryText(expiresOn: string | null, today: string): string {
  const e = expiryOf(expiresOn, today);
  if (!expiresOn || e.days == null) return "No expiry";
  if (e.state === "expired") return `Expired ${shortDate(expiresOn)}`;
  if (e.state === "soon") return e.days === 0 ? "Expires today" : `Expires in ${e.days === 1 ? "1 day" : `${e.days} days`}`;
  return `Expires ${shortDate(expiresOn)}`;
}

/** Lowercase only the first letter, so "Expired 30 Sep 2026" reads mid-sentence without mangling the month. */
export const lowerFirst = (s: string) => s.charAt(0).toLowerCase() + s.slice(1);

/** An open grant is one we are still working on. Files and letters only matter for these. */
export const isOpenStage = (stage: string) => stage === "researching" || stage === "drafting";

/** A file the board warns about: out of date, or about to be, and attached to a grant we are still working on. */
export type FileAlert = { id: string; title: string; expires_on: string; state: "expired" | "soon"; openGrants: number };

export function fileAlerts(
  files: { id: string; title: string; expires_on: string | null }[],
  grantIdsByFile: Map<string, string[]>,
  openGrantIds: Set<string>,
  today: string,
): FileAlert[] {
  const out: FileAlert[] = [];
  for (const f of files) {
    const e = expiryOf(f.expires_on, today);
    if ((e.state !== "expired" && e.state !== "soon") || !f.expires_on) continue;
    const openGrants = (grantIdsByFile.get(f.id) ?? []).filter((g) => openGrantIds.has(g)).length;
    if (openGrants > 0) out.push({ id: f.id, title: f.title, expires_on: f.expires_on, state: e.state, openGrants });
  }
  // Expired before upcoming, then soonest first.
  return out.sort((a, b) => Number(b.state === "expired") - Number(a.state === "expired") || a.expires_on.localeCompare(b.expires_on));
}

/** A grant, as the pickers on the forms and the library list it. */
export type GrantOption = { id: string; name: string; stage: string };

/** Storage bucket for letters and files (the existing public `documents` bucket). */
export const LIBRARY_BUCKET = "documents";
