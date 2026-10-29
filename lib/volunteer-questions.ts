/**
 * A volunteer role's own application questions (`volunteer_roles.questions`,
 * jsonb) and the answers they collect (`applications.answers`, jsonb).
 *
 * Pure data with no server imports, so the admin's question builder (a client
 * component) and the server (page, route, actions) share one shape and one
 * parser. Anything read from the database or a form goes through
 * `parseQuestions` first: a hand-edited row can never crash the page.
 */

export const QUESTION_TYPES = [
  { value: "short", label: "Short answer" },
  { value: "long", label: "Paragraph" },
  { value: "link", label: "Link" },
  { value: "choice", label: "Pick one" },
] as const;

export type QuestionType = (typeof QUESTION_TYPES)[number]["value"];

export type RoleQuestion = {
  /** Stable key, used as the form field name (`q_<id>`). Kept across edits. */
  id: string;
  label: string;
  type: QuestionType;
  required: boolean;
  /** Small grey line under the label. */
  hint?: string;
  /** The options, for a "choice" question. */
  options?: string[];
};

/** One answer as stored: the question's wording at the time, so it still reads after an edit. */
export type RoleAnswer = { question: string; answer: string };

/** Asked when a posted role has no questions of its own. */
export const DEFAULT_ROLE_QUESTIONS: RoleQuestion[] = [
  { id: "fit", label: "Why are you a good fit for this role?", type: "long", required: true },
];

const isType = (v: unknown): v is QuestionType => QUESTION_TYPES.some((t) => t.value === v);

export const newQuestionId = () => Math.random().toString(36).slice(2, 8);

/** Clean anything question-shaped into valid questions; drops what can't be used. */
export function parseQuestions(raw: unknown): RoleQuestion[] {
  let list = raw;
  if (typeof list === "string") {
    try {
      list = JSON.parse(list);
    } catch {
      return [];
    }
  }
  if (!Array.isArray(list)) return [];
  const seen = new Set<string>();
  const out: RoleQuestion[] = [];
  for (const item of list) {
    if (!item || typeof item !== "object") continue;
    const q = item as Record<string, unknown>;
    const label = String(q.label ?? "").trim();
    if (!label) continue;
    const type = isType(q.type) ? q.type : "short";
    let id = String(q.id ?? "").replace(/[^a-z0-9_-]/gi, "").slice(0, 24) || newQuestionId();
    while (seen.has(id)) id = newQuestionId();
    seen.add(id);
    const options =
      type === "choice"
        ? (Array.isArray(q.options) ? q.options : []).map((o) => String(o).trim()).filter(Boolean)
        : undefined;
    // A choice with nothing to choose from can't be answered.
    if (type === "choice" && !options?.length) continue;
    const hint = String(q.hint ?? "").trim();
    out.push({ id, label, type, required: Boolean(q.required), ...(hint ? { hint } : {}), ...(options ? { options } : {}) });
  }
  return out;
}
