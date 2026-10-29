"use client";

import { useState } from "react";
import { ArrowDown, ArrowUp, Plus, Trash2 } from "lucide-react";
import { IconButton, inputCls } from "../ui";
import {
  QUESTION_TYPES,
  newQuestionId,
  type QuestionType,
  type RoleQuestion,
} from "@/lib/volunteer-questions";

type Draft = Omit<RoleQuestion, "options"> & { optionsText: string };

const toDraft = (q: RoleQuestion): Draft => ({ ...q, hint: q.hint ?? "", optionsText: (q.options ?? []).join("\n") });

const toQuestion = (d: Draft): RoleQuestion => ({
  id: d.id,
  label: d.label.trim(),
  type: d.type,
  required: d.required,
  ...(d.hint?.trim() ? { hint: d.hint.trim() } : {}),
  ...(d.type === "choice"
    ? { options: d.optionsText.split(/\r?\n/).map((o) => o.trim()).filter(Boolean) }
    : {}),
});

/**
 * The role's own application form: an ordered list of questions, sent to the
 * server action as one hidden JSON field (`questions`) and cleaned there by
 * parseQuestions. Options are edited as text (one per line) so pressing Enter
 * to add the next option isn't swallowed; they're split on save.
 */
export default function QuestionsEditor({ initial }: { initial: RoleQuestion[] }) {
  const [items, setItems] = useState<Draft[]>(() => initial.map(toDraft));

  const update = (id: string, patch: Partial<Draft>) =>
    setItems((xs) => xs.map((x) => (x.id === id ? { ...x, ...patch } : x)));
  const move = (i: number, by: number) =>
    setItems((xs) => {
      const j = i + by;
      if (j < 0 || j >= xs.length) return xs;
      const next = [...xs];
      [next[i], next[j]] = [next[j], next[i]];
      return next;
    });
  const add = () =>
    setItems((xs) => [...xs, { id: newQuestionId(), label: "", type: "long", required: false, hint: "", optionsText: "" }]);

  return (
    <div className="space-y-4">
      <input type="hidden" name="questions" value={JSON.stringify(items.map(toQuestion).filter((q) => q.label))} />
      <p className="text-[13px] leading-[1.55] text-[#6b6459]">
        Everyone gives their name, email and phone first. These questions come after, in this order. With
        none, the form just asks why they&rsquo;re a good fit.
      </p>
      {items.map((q, i) => (
        <div key={q.id} className="space-y-3 rounded-[16px] border border-[rgba(0,0,0,0.1)] bg-white p-4">
          <div className="flex items-start gap-2">
            <span className="mt-[11px] w-5 shrink-0 text-[13px] font-semibold text-[#6b6459]">{i + 1}</span>
            <textarea
              aria-label={`Question ${i + 1}`}
              rows={2}
              value={q.label}
              onChange={(e) => update(q.id, { label: e.target.value })}
              placeholder="The question, e.g. What do you do now?"
              className={inputCls}
            />
            <div className="flex shrink-0 flex-col">
              <IconButton ariaLabel="Move up" title="Move up" onClick={() => move(i, -1)} disabled={i === 0}>
                <ArrowUp className="h-4 w-4" strokeWidth={2.25} />
              </IconButton>
              <IconButton ariaLabel="Move down" title="Move down" onClick={() => move(i, 1)} disabled={i === items.length - 1}>
                <ArrowDown className="h-4 w-4" strokeWidth={2.25} />
              </IconButton>
            </div>
            <IconButton
              tone="danger"
              ariaLabel={`Remove question ${i + 1}`}
              title="Remove"
              onClick={() => setItems((xs) => xs.filter((x) => x.id !== q.id))}
            >
              <Trash2 className="h-4 w-4" strokeWidth={2.25} />
            </IconButton>
          </div>
          <div className="grid gap-3 pl-7 md:grid-cols-[minmax(0,180px)_minmax(0,1fr)_auto] md:items-center">
            <select
              aria-label="Answer type"
              value={q.type}
              onChange={(e) => update(q.id, { type: e.target.value as QuestionType })}
              className={inputCls}
            >
              {QUESTION_TYPES.map((t) => (
                <option key={t.value} value={t.value}>
                  {t.label}
                </option>
              ))}
            </select>
            {q.type !== "choice" ? (
              <input
                aria-label="Hint shown inside the answer box"
                value={q.hint ?? ""}
                onChange={(e) => update(q.id, { hint: e.target.value })}
                placeholder="Hint inside the box (optional)"
                className={inputCls}
              />
            ) : (
              <span className="text-[12.5px] text-[#6b6459]">One option per line below.</span>
            )}
            <label className="flex items-center gap-2 text-[13.5px] font-medium text-black">
              <input type="checkbox" checked={q.required} onChange={(e) => update(q.id, { required: e.target.checked })} />
              Required
            </label>
          </div>
          {q.type === "choice" && (
            <div className="pl-7">
              <textarea
                aria-label="Options, one per line"
                rows={3}
                value={q.optionsText}
                onChange={(e) => update(q.id, { optionsText: e.target.value })}
                placeholder={"Yes\nMost weeks\nNot sure yet, happy to chat"}
                className={inputCls}
              />
            </div>
          )}
        </div>
      ))}
      <button type="button" onClick={add} className="tx-btn tx-btn--secondary tx-btn--sm tx-btn--auto adm-write">
        <Plus className="h-4 w-4" strokeWidth={2.25} />
        Add question
      </button>
    </div>
  );
}
