// Grant pipeline types, labels and date helpers. No "use client" on purpose:
// the server page and the client form both import these, and a plain value
// exported from a client file is only a stub on the server.

export type GrantStage =
  | "watching"
  | "researching"
  | "drafting"
  | "submitted"
  | "successful"
  | "unsuccessful"
  | "not_applying";

export type Grant = {
  id: string;
  name: string;
  funder: string | null;
  url: string | null;
  stage: GrantStage;
  project: string | null;
  owner: string | null;
  amount_min: number | null;
  amount_max: number | null;
  amount_requested: number | null;
  amount_awarded: number | null;
  /** Plain YYYY-MM-DD: a deadline is a day, so it never goes through a time zone. */
  closes_on: string | null;
  closes_note: string | null;
  decision_note: string | null;
  notes: string | null;
  updated_at: string;
};

export const STAGES: GrantStage[] = [
  "watching",
  "researching",
  "drafting",
  "submitted",
  "successful",
  "unsuccessful",
  "not_applying",
];

export const STAGE_LABEL: Record<GrantStage, string> = {
  watching: "Next round",
  researching: "Checking fit",
  drafting: "Writing",
  submitted: "Submitted",
  successful: "Successful",
  unsuccessful: "Unsuccessful",
  not_applying: "Not applying",
};

/** The four board columns, left to right, and which stages land in each. */
export const COLUMNS: { key: string; title: string; stages: GrantStage[]; empty: string }[] = [
  { key: "upcoming", title: "Upcoming rounds", stages: ["watching"], empty: "Nothing on the radar." },
  { key: "open", title: "Open now", stages: ["researching", "drafting"], empty: "No open rounds." },
  { key: "submitted", title: "Submitted", stages: ["submitted"], empty: "Nothing waiting on a decision." },
  { key: "decided", title: "Decided", stages: ["successful", "unsuccessful", "not_applying"], empty: "No outcomes yet." },
];

export const asStage = (v: unknown): GrantStage =>
  STAGES.includes(v as GrantStage) ? (v as GrantStage) : "researching";

/** Today's date in Sydney as YYYY-MM-DD. */
export function sydneyToday(): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Australia/Sydney" }).format(new Date());
}

/** Whole days from `from` to `to`, both YYYY-MM-DD. Date.UTC so DST can't move a day. */
export function daysBetween(from: string, to: string): number {
  const [a, b] = [from, to].map((d) => {
    const [y, m, day] = d.split("-").map(Number);
    return Date.UTC(y, m - 1, day);
  });
  return Math.round((b - a) / 86_400_000);
}

/** "6 Nov 2026" from YYYY-MM-DD. */
export function shortDate(d: string): string {
  const [y, m, day] = d.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, day)).toLocaleDateString("en-AU", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  });
}

export const money = (n: number) =>
  n.toLocaleString("en-AU", { style: "currency", currency: "AUD", maximumFractionDigits: 0 });

/** "$25,000 to $50,000", "Up to $25,000", or null when nothing is known. */
export function rangeText(min: number | null, max: number | null): string | null {
  if (min && max) return `${money(min)} to ${money(max)}`;
  if (max) return `Up to ${money(max)}`;
  if (min) return `From ${money(min)}`;
  return null;
}

// ---- The bench: the working page behind each grant ----

export type ItemKind = "question" | "task" | "budget" | "link";

export type GrantItem = {
  id: string;
  grant_id: string;
  kind: ItemKind;
  position: number;
  /** Question text, task, budget line or link label. */
  title: string;
  /** Our answer to a question, or a note on a budget line. */
  body: string | null;
  word_limit: number | null;
  amount: number | null;
  url: string | null;
  /** A question marked ready, or a task ticked off. */
  done: boolean;
  due_on: string | null;
  owner: string | null;
};

/** Close to how SmartyGrants counts: runs of non-space characters. */
export function wordCount(text: string | null | undefined): number {
  const t = (text ?? "").trim();
  return t ? t.split(/\s+/).length : 0;
}

/** What most applications need before they can be submitted. */
export const STANDARD_CHECKLIST: string[] = [
  "Confirm we are eligible (entity type, location, who it funds)",
  "Read the guidelines and FAQs end to end",
  "ABN and incorporation details ready",
  "Public liability certificate of currency",
  "Bank statement on letterhead showing BSB and account",
  "Two authorised signatories confirmed",
  "Budget built from real quotes",
  "Supporting evidence attached (past results, photos, reports)",
  "Second person reviews the whole application",
  "Submit, and save the confirmation email",
];
