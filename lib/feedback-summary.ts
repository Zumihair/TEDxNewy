/**
 * Pure feedback aggregation. Turns a set of questions + responses into
 * per-question summaries for the "at a glance" overview. Deliberately free of
 * server-only or React deps so it runs on the server (native feedback page)
 * and in the client (imported-archive component) alike. Both the native
 * feedback schema and the imported archives are mapped onto the same
 * ImportedQuestion / ImportedResponse shape and fed through here, so there is
 * one aggregation path.
 */

import type {
  ImportedAnswer,
  ImportedQuestion,
  ImportedResponse,
} from "./imported-feedback";

export type RatingSummary = {
  kind: "rating";
  key: string;
  label: string;
  max: number;
  count: number;
  avg: number | null;
  /** Count at each integer value 1..max (ratings rounded to nearest whole). */
  dist: { value: number; count: number }[];
};

export type BooleanSummary = {
  kind: "boolean";
  key: string;
  label: string;
  count: number;
  yes: number;
  no: number;
};

export type ChoiceSummary = {
  kind: "choice";
  key: string;
  label: string;
  /** true for "select all that apply" questions. */
  multi: boolean;
  /** How many responses answered this at all. */
  count: number;
  options: { label: string; count: number }[];
};

export type TextSummary = {
  kind: "text";
  key: string;
  label: string;
  entries: { name: string | null; text: string }[];
};

export type QuestionSummary =
  | RatingSummary
  | BooleanSummary
  | ChoiceSummary
  | TextSummary;

/** The stat-like summaries that belong in the glance grid (not free text). */
export type StatSummary = RatingSummary | BooleanSummary | ChoiceSummary;

export function isStatSummary(s: QuestionSummary): s is StatSummary {
  return s.kind !== "text";
}

function asNumber(v: ImportedAnswer): number | null {
  return typeof v === "number" && !Number.isNaN(v) ? v : null;
}

export function summarizeQuestion(
  q: ImportedQuestion,
  responses: ImportedResponse[],
): QuestionSummary {
  const values = responses.map((r) => r.answers[q.key]);

  switch (q.type) {
    case "rating": {
      const max = q.max ?? 5;
      const nums = values
        .map(asNumber)
        .filter((n): n is number => n != null);
      const avg =
        nums.length > 0 ? nums.reduce((a, b) => a + b, 0) / nums.length : null;
      const dist = Array.from({ length: max }, (_, i) => {
        const value = i + 1;
        return {
          value,
          count: nums.filter((n) => Math.round(n) === value).length,
        };
      });
      return {
        kind: "rating",
        key: q.key,
        label: q.label,
        max,
        count: nums.length,
        avg,
        dist,
      };
    }

    case "boolean": {
      let yes = 0;
      let no = 0;
      for (const v of values) {
        if (v === true) yes++;
        else if (v === false) no++;
      }
      return {
        kind: "boolean",
        key: q.key,
        label: q.label,
        count: yes + no,
        yes,
        no,
      };
    }

    case "choice":
    case "multiselect": {
      const multi = q.type === "multiselect";
      const counts = new Map<string, number>();
      let answered = 0;
      for (const v of values) {
        if (v == null) continue;
        const opts = Array.isArray(v) ? v : [String(v)];
        const cleaned = opts.map((o) => o.trim()).filter(Boolean);
        if (cleaned.length === 0) continue;
        answered++;
        for (const o of cleaned) counts.set(o, (counts.get(o) ?? 0) + 1);
      }
      const options = [...counts.entries()]
        .map(([label, count]) => ({ label, count }))
        .sort((a, b) => b.count - a.count || a.label.localeCompare(b.label));
      return {
        kind: "choice",
        key: q.key,
        label: q.label,
        multi,
        count: answered,
        options,
      };
    }

    case "text":
    default: {
      const entries: { name: string | null; text: string }[] = [];
      for (const r of responses) {
        const v = r.answers[q.key];
        if (typeof v === "string" && v.trim()) {
          entries.push({ name: r.name, text: v.trim() });
        }
      }
      return { kind: "text", key: q.key, label: q.label, entries };
    }
  }
}

export function summarizeFeedback(
  questions: ImportedQuestion[],
  responses: ImportedResponse[],
): QuestionSummary[] {
  return questions.map((q) => summarizeQuestion(q, responses));
}
