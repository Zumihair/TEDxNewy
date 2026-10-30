"use client";

import { useMemo, useState, useTransition, type ReactNode } from "react";
import { Copy, ExternalLink, Pencil, Trash2 } from "lucide-react";
import { IconButton, PrimaryButton, SecondaryButton, inputCls } from "../../ui";
import AutoGrowTextarea from "../../AutoGrowTextarea";
import DateTimePicker from "../../DateTimePicker";
import { useConfirm } from "../../ConfirmDialog";
import { useUnsavedGuard } from "../../useUnsavedGuard";
import { useToast } from "../../Toaster";
import {
  STAGES,
  STAGE_LABEL,
  daysBetween,
  money,
  shortDate,
  wordCount,
  type Grant,
  type GrantItem,
} from "../shared";
import {
  addItem,
  addStandardChecklist,
  deleteItem,
  saveGrantNotes,
  setGrantStage,
  updateItem,
  type BenchResult,
} from "./actions";

type Run = (task: () => Promise<BenchResult>, success?: string) => Promise<boolean>;

/** Runs a bench action and reports the outcome as a toast. */
function useRun(): [Run, boolean] {
  const toast = useToast();
  const [pending, start] = useTransition();
  const run: Run = (task, success) =>
    new Promise((resolve) =>
      start(async () => {
        const res = await task();
        if (res.ok) {
          if (success) toast.success(success);
        } else toast.error(res.error);
        resolve(res.ok);
      }),
    );
  return [run, pending];
}

const toNumber = (v: string) => {
  const n = Number(v.replace(/[^0-9.]/g, ""));
  return v.trim() && !Number.isNaN(n) ? n : null;
};

export default function Bench({
  grant,
  items,
  today,
  sideTop,
}: {
  grant: Grant;
  items: GrantItem[];
  today: string;
  /** Rendered above the checklist: the letters and evidence card, loaded by the page. */
  sideTop?: ReactNode;
}) {
  const { confirm, dialogs } = useConfirm();
  const [run, pending] = useRun();
  const id = grant.id;

  const byKind = (k: GrantItem["kind"]) => items.filter((i) => i.kind === k).sort((a, b) => a.position - b.position);
  const questions = byKind("question");
  const tasks = byKind("task");
  const budget = byKind("budget");
  const links = byKind("link");

  // Answer drafts and notes live here so one guard covers everything unsaved.
  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const [notes, setNotes] = useState(grant.notes ?? "");
  const draftOf = (q: GrantItem) => drafts[q.id] ?? q.body ?? "";
  const dirtyIds = questions.filter((q) => drafts[q.id] !== undefined && drafts[q.id] !== (q.body ?? "")).map((q) => q.id);
  const notesDirty = notes !== (grant.notes ?? "");
  useUnsavedGuard({ dirty: dirtyIds.length > 0 || notesDirty, confirm });

  const ask = (title: string, body: string) => confirm({ title, body, confirmLabel: "Delete", tone: "danger" });

  return (
    <>
      <StageBar grant={grant} today={today} run={run} pending={pending} />

      <div className="adm-bench">
        <div className="adm-bench__main">
          <Questions
            grantId={id}
            questions={questions}
            draftOf={draftOf}
            dirtyIds={dirtyIds}
            setDraft={(qid, v) => setDrafts((d) => ({ ...d, [qid]: v }))}
            run={run}
            ask={ask}
          />
          <Budget grantId={id} rows={budget} requested={grant.amount_requested} run={run} ask={ask} />
        </div>
        <div className="adm-bench__side">
          {sideTop}
          <Checklist grantId={id} tasks={tasks} today={today} run={run} ask={ask} />
          <Links grantId={id} links={links} run={run} ask={ask} />
          <Card title="Notes">
            <AutoGrowTextarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              minRows={4}
              placeholder="Who we spoke to, what they said, what to remember next round."
              className={inputCls}
            />
            <div className="adm-bench__row-end">
              <PrimaryButton
                type="button"
                disabled={!notesDirty || pending}
                onClick={() => run(() => saveGrantNotes(id, notes), "Notes saved.")}
              >
                Save notes
              </PrimaryButton>
            </div>
          </Card>
        </div>
      </div>
      {dialogs}
    </>
  );
}

function Card({ title, aside, children }: { title: string; aside?: ReactNode; children: ReactNode }) {
  return (
    <section className="adm-benchcard">
      <div className="adm-benchcard__head">
        <h2 className="adm-section__title">{title}</h2>
        {aside && <span className="adm-benchcard__aside">{aside}</span>}
      </div>
      {children}
    </section>
  );
}

// ---- Stage and deadline ----

function StageBar({ grant, today, run, pending }: { grant: Grant; today: string; run: Run; pending: boolean }) {
  const [stage, setStage] = useState(grant.stage);
  const days = grant.closes_on ? daysBetween(today, grant.closes_on) : null;
  const open = stage === "researching" || stage === "drafting";
  const due =
    grant.closes_on == null
      ? grant.closes_note ?? "No closing date yet"
      : `${days! < 0 ? "Closed" : "Closes"} ${shortDate(grant.closes_on)}${grant.closes_note ? `, ${grant.closes_note}` : ""}`;
  const left =
    days == null || !open ? null : days < 0 ? "deadline passed" : days === 0 ? "today" : days === 1 ? "tomorrow" : `${days} days left`;

  return (
    <div className="adm-benchbar">
      <label className="adm-benchbar__stage">
        <span className="adm-benchbar__label">Stage</span>
        <select
          value={stage}
          disabled={pending}
          className={inputCls}
          onChange={async (e) => {
            const next = e.target.value as Grant["stage"];
            const prev = stage;
            setStage(next);
            const ok = await run(() => setGrantStage(grant.id, next), `Moved to ${STAGE_LABEL[next]}.`);
            if (!ok) setStage(prev);
          }}
        >
          {STAGES.map((s) => (
            <option key={s} value={s}>
              {STAGE_LABEL[s]}
            </option>
          ))}
        </select>
      </label>
      <div className="adm-benchbar__fact">
        <span className="adm-benchbar__label">Deadline</span>
        <span className={"adm-benchbar__value" + (open && days != null && days <= 7 ? " is-urgent" : "")}>
          {due}
          {left && <span className="adm-benchbar__sub"> · {left}</span>}
        </span>
      </div>
      <div className="adm-benchbar__fact">
        <span className="adm-benchbar__label">{grant.amount_awarded ? "Awarded" : "Asking"}</span>
        <span className="adm-benchbar__value">
          {grant.amount_awarded
            ? money(grant.amount_awarded)
            : grant.amount_requested
              ? money(grant.amount_requested)
              : "Not set"}
        </span>
      </div>
      <div className="adm-benchbar__fact">
        <span className="adm-benchbar__label">Decision</span>
        <span className="adm-benchbar__value">{grant.decision_note ?? "Not known"}</span>
      </div>
    </div>
  );
}

// ---- Application questions ----

function Questions({
  grantId,
  questions,
  draftOf,
  dirtyIds,
  setDraft,
  run,
  ask,
}: {
  grantId: string;
  questions: GrantItem[];
  draftOf: (q: GrantItem) => string;
  dirtyIds: string[];
  setDraft: (id: string, v: string) => void;
  run: Run;
  ask: (title: string, body: string) => Promise<boolean>;
}) {
  const toast = useToast();
  const [newQ, setNewQ] = useState("");
  const [newLimit, setNewLimit] = useState("");
  const [editing, setEditing] = useState<string | null>(null);
  const [editText, setEditText] = useState("");
  const [editLimit, setEditLimit] = useState("");
  const ready = questions.filter((q) => q.done).length;

  return (
    <Card title="Application" aside={questions.length ? `${ready} of ${questions.length} ready` : undefined}>
      {questions.length === 0 && (
        <p className="adm-card__text">
          Add each question from the application form, with its word limit, then write the answers here.
        </p>
      )}
      {questions.map((q, i) => {
        const text = draftOf(q);
        const words = wordCount(text);
        const over = q.word_limit != null && words > q.word_limit;
        const dirty = dirtyIds.includes(q.id);
        return (
          <article key={q.id} className={"adm-q" + (q.done ? " is-ready" : "")}>
            {editing === q.id ? (
              <div className="adm-q__edit">
                <input value={editText} onChange={(e) => setEditText(e.target.value)} className={inputCls} aria-label="Question" />
                <input
                  value={editLimit}
                  onChange={(e) => setEditLimit(e.target.value)}
                  inputMode="numeric"
                  placeholder="Word limit"
                  className={inputCls}
                  aria-label="Word limit"
                />
                <div className="adm-bench__row-end">
                  <SecondaryButton type="button" onClick={() => setEditing(null)}>
                    Cancel
                  </SecondaryButton>
                  <PrimaryButton
                    type="button"
                    onClick={async () => {
                      const ok = await run(
                        () => updateItem(grantId, q.id, { title: editText, word_limit: toNumber(editLimit) }),
                        "Question updated.",
                      );
                      if (ok) setEditing(null);
                    }}
                  >
                    Save question
                  </PrimaryButton>
                </div>
              </div>
            ) : (
              <div className="adm-q__top">
                <span className="adm-q__num">Q{i + 1}</span>
                <h3 className="adm-q__title">{q.title}</h3>
                <IconButton
                  ariaLabel="Edit question"
                  title="Edit question"
                  onClick={() => {
                    setEditing(q.id);
                    setEditText(q.title);
                    setEditLimit(q.word_limit ? String(q.word_limit) : "");
                  }}
                >
                  <Pencil className="h-4 w-4" strokeWidth={2.25} />
                </IconButton>
              </div>
            )}
            <AutoGrowTextarea
              value={text}
              onChange={(e) => setDraft(q.id, e.target.value)}
              minRows={5}
              maxHeightPx={640}
              placeholder="Write the answer here."
              className={inputCls}
              aria-label={`Answer to question ${i + 1}`}
            />
            <div className="adm-q__foot">
              <span className={"adm-q__count" + (over ? " is-over" : "")}>
                {words}
                {q.word_limit ? ` / ${q.word_limit}` : ""} words{over ? `, ${words - q.word_limit!} over` : ""}
              </span>
              <label className="adm-q__ready">
                <input
                  type="checkbox"
                  checked={q.done}
                  onChange={(e) => run(() => updateItem(grantId, q.id, { done: e.target.checked }))}
                />
                Ready
              </label>
              <IconButton
                ariaLabel="Copy answer"
                title="Copy answer"
                onClick={async () => {
                  try {
                    await navigator.clipboard.writeText(text);
                    toast.success("Answer copied.");
                  } catch {
                    toast.error("Could not copy. Select the text instead.");
                  }
                }}
              >
                <Copy className="h-4 w-4" strokeWidth={2.25} />
              </IconButton>
              <IconButton
                tone="danger"
                ariaLabel="Delete question"
                title="Delete question"
                onClick={async () => {
                  if (await ask("Delete this question?", "Its answer is deleted with it.")) {
                    await run(() => deleteItem(grantId, q.id), "Question deleted.");
                  }
                }}
              >
                <Trash2 className="h-4 w-4" strokeWidth={2.25} />
              </IconButton>
              <PrimaryButton
                type="button"
                disabled={!dirty}
                onClick={() => run(() => updateItem(grantId, q.id, { body: text }), "Answer saved.")}
              >
                {dirty ? "Save answer" : "Saved"}
              </PrimaryButton>
            </div>
          </article>
        );
      })}
      <form
        className="adm-bench__add"
        onSubmit={async (e) => {
          e.preventDefault();
          const ok = await run(
            () => addItem(grantId, "question", { title: newQ, word_limit: toNumber(newLimit) }),
            "Question added.",
          );
          if (ok) {
            setNewQ("");
            setNewLimit("");
          }
        }}
      >
        <input
          value={newQ}
          onChange={(e) => setNewQ(e.target.value)}
          placeholder="Paste a question from the form"
          className={inputCls}
          aria-label="New question"
        />
        <input
          value={newLimit}
          onChange={(e) => setNewLimit(e.target.value)}
          inputMode="numeric"
          placeholder="Word limit"
          className={inputCls + " adm-bench__narrow"}
          aria-label="Word limit"
        />
        <SecondaryButton type="submit" write>
          Add question
        </SecondaryButton>
      </form>
    </Card>
  );
}

// ---- Checklist ----

function Checklist({
  grantId,
  tasks,
  today,
  run,
  ask,
}: {
  grantId: string;
  tasks: GrantItem[];
  today: string;
  run: Run;
  ask: (title: string, body: string) => Promise<boolean>;
}) {
  const [label, setLabel] = useState("");
  const [owner, setOwner] = useState("");
  const [due, setDue] = useState("");
  // Ticks show straight away; the server confirms behind them.
  const [ticked, setTicked] = useState<Record<string, boolean>>({});
  const isDone = (t: GrantItem) => ticked[t.id] ?? t.done;
  const done = tasks.filter(isDone).length;
  const pct = tasks.length ? Math.round((done / tasks.length) * 100) : 0;

  return (
    <Card title="Checklist" aside={tasks.length ? `${done} of ${tasks.length} done` : undefined}>
      {tasks.length > 0 && (
        <span className="adm-bar" aria-hidden>
          <i style={{ width: `${Math.max(2, pct)}%` }} />
        </span>
      )}
      {tasks.length === 0 && (
        <div className="adm-bench__empty">
          <p className="adm-card__text">Nothing on the list yet.</p>
          <SecondaryButton type="button" write onClick={() => run(() => addStandardChecklist(grantId), "Checklist added.")}>
            Add the standard checklist
          </SecondaryButton>
        </div>
      )}
      <ul className="adm-tasks">
        {tasks.map((t) => {
          const checked = isDone(t);
          const late = !checked && t.due_on != null && t.due_on < today;
          return (
            <li key={t.id} className={"adm-task" + (checked ? " is-done" : "")}>
              <input
                type="checkbox"
                checked={checked}
                aria-label={t.title}
                onChange={async (e) => {
                  const v = e.target.checked;
                  setTicked((m) => ({ ...m, [t.id]: v }));
                  const ok = await run(() => updateItem(grantId, t.id, { done: v }));
                  if (!ok) setTicked((m) => ({ ...m, [t.id]: !v }));
                }}
              />
              <span className="adm-task__text">
                <span className="adm-task__title">{t.title}</span>
                {(t.owner || t.due_on) && (
                  <span className={"adm-task__meta" + (late ? " is-late" : "")}>
                    {[t.owner, t.due_on ? `${late ? "Overdue" : "Due"} ${shortDate(t.due_on)}` : null]
                      .filter(Boolean)
                      .join(" · ")}
                  </span>
                )}
              </span>
              <IconButton
                tone="danger"
                ariaLabel={`Remove ${t.title}`}
                title="Remove"
                onClick={async () => {
                  if (await ask("Remove this item?", t.title)) await run(() => deleteItem(grantId, t.id));
                }}
              >
                <Trash2 className="h-4 w-4" strokeWidth={2.25} />
              </IconButton>
            </li>
          );
        })}
      </ul>
      <form
        className="adm-bench__addstack"
        onSubmit={async (e) => {
          e.preventDefault();
          const ok = await run(() => addItem(grantId, "task", { title: label, owner, due_on: due }), "Added.");
          if (ok) {
            setLabel("");
            setOwner("");
            setDue("");
          }
        }}
      >
        <input value={label} onChange={(e) => setLabel(e.target.value)} placeholder="Something to do" className={inputCls} aria-label="New item" />
        <div className="adm-bench__pair">
          <input value={owner} onChange={(e) => setOwner(e.target.value)} placeholder="Who" className={inputCls} aria-label="Who" />
          <DateTimePicker mode="date" value={due} onChange={setDue} placeholder="Due" />
        </div>
        <SecondaryButton type="submit" write>
          Add to checklist
        </SecondaryButton>
      </form>
    </Card>
  );
}

// ---- Budget ----

function Budget({
  grantId,
  rows,
  requested,
  run,
  ask,
}: {
  grantId: string;
  rows: GrantItem[];
  requested: number | null;
  run: Run;
  ask: (title: string, body: string) => Promise<boolean>;
}) {
  const [item, setItem] = useState("");
  const [amt, setAmt] = useState("");
  const [note, setNote] = useState("");
  const total = useMemo(() => rows.reduce((a, r) => a + (r.amount ?? 0), 0), [rows]);
  const diff = requested != null ? requested - total : null;

  // Saves a cell when it loses focus, only if it changed.
  const saveCell = (r: GrantItem, field: "title" | "body" | "amount", raw: string) => {
    const value = field === "amount" ? toNumber(raw) : raw;
    const current = field === "amount" ? r.amount : field === "title" ? r.title : r.body ?? "";
    if (value === current || (field !== "amount" && raw.trim() === String(current ?? "").trim())) return;
    run(() => updateItem(grantId, r.id, { [field]: value } as never), "Saved.");
  };

  return (
    <Card
      title="Budget"
      aside={
        rows.length
          ? diff == null
            ? `Total ${money(total)}`
            : diff === 0
              ? `${money(total)}, matches the ask`
              : `${money(total)}, ${money(Math.abs(diff))} ${diff > 0 ? "under" : "over"} the ask`
          : undefined
      }
    >
      {rows.length === 0 && <p className="adm-card__text">Add each line of the budget. The total is checked against what we&apos;re asking for.</p>}
      {rows.length > 0 && (
        <div className="adm-budget" role="table" aria-label="Budget">
          <div className="adm-budget__row adm-budget__row--head" role="row">
            <span role="columnheader">Item</span>
            <span role="columnheader">Note</span>
            <span role="columnheader" className="adm-budget__num">Amount (ex GST)</span>
            <span />
          </div>
          {rows.map((r) => (
            <div key={r.id} className="adm-budget__row" role="row">
              <input defaultValue={r.title} onBlur={(e) => saveCell(r, "title", e.target.value)} className={inputCls} aria-label="Item" />
              <input defaultValue={r.body ?? ""} onBlur={(e) => saveCell(r, "body", e.target.value)} className={inputCls} aria-label="Note" />
              <input
                defaultValue={r.amount != null ? String(r.amount) : ""}
                onBlur={(e) => saveCell(r, "amount", e.target.value)}
                inputMode="decimal"
                className={inputCls + " adm-budget__num"}
                aria-label="Amount"
              />
              <IconButton
                tone="danger"
                ariaLabel={`Remove ${r.title}`}
                title="Remove"
                onClick={async () => {
                  if (await ask("Remove this line?", r.title)) await run(() => deleteItem(grantId, r.id));
                }}
              >
                <Trash2 className="h-4 w-4" strokeWidth={2.25} />
              </IconButton>
            </div>
          ))}
          <div className="adm-budget__row adm-budget__row--total" role="row">
            <span>Total</span>
            <span />
            <span className="adm-budget__num">{money(total)}</span>
            <span />
          </div>
        </div>
      )}
      <form
        className="adm-bench__add"
        onSubmit={async (e) => {
          e.preventDefault();
          const ok = await run(() => addItem(grantId, "budget", { title: item, amount: toNumber(amt), body: note }), "Line added.");
          if (ok) {
            setItem("");
            setAmt("");
            setNote("");
          }
        }}
      >
        <input value={item} onChange={(e) => setItem(e.target.value)} placeholder="Line item" className={inputCls} aria-label="Line item" />
        <input value={note} onChange={(e) => setNote(e.target.value)} placeholder="Note" className={inputCls} aria-label="Note" />
        <input
          value={amt}
          onChange={(e) => setAmt(e.target.value)}
          inputMode="decimal"
          placeholder="Amount"
          className={inputCls + " adm-bench__narrow"}
          aria-label="Amount"
        />
        <SecondaryButton type="submit" write>
          Add line
        </SecondaryButton>
      </form>
    </Card>
  );
}

// ---- Files and links ----

function Links({
  grantId,
  links,
  run,
  ask,
}: {
  grantId: string;
  links: GrantItem[];
  run: Run;
  ask: (title: string, body: string) => Promise<boolean>;
}) {
  const [label, setLabel] = useState("");
  const [url, setUrl] = useState("");
  return (
    <Card title="Files and links">
      {links.length === 0 && (
        <p className="adm-card__text">Guidelines, the form, quotes, the draft. Upload files in Resources, then paste the link here.</p>
      )}
      <ul className="adm-tasks">
        {links.map((l) => (
          <li key={l.id} className="adm-task">
            <a href={l.url ?? "#"} target="_blank" rel="noreferrer" className="adm-task__link">
              {l.title}
              <ExternalLink className="h-3 w-3" strokeWidth={2.25} />
            </a>
            <IconButton
              tone="danger"
              ariaLabel={`Remove ${l.title}`}
              title="Remove"
              onClick={async () => {
                if (await ask("Remove this link?", l.title)) await run(() => deleteItem(grantId, l.id));
              }}
            >
              <Trash2 className="h-4 w-4" strokeWidth={2.25} />
            </IconButton>
          </li>
        ))}
      </ul>
      <form
        className="adm-bench__addstack"
        onSubmit={async (e) => {
          e.preventDefault();
          const ok = await run(() => addItem(grantId, "link", { title: label, url }), "Link added.");
          if (ok) {
            setLabel("");
            setUrl("");
          }
        }}
      >
        <input value={label} onChange={(e) => setLabel(e.target.value)} placeholder="Label" className={inputCls} aria-label="Label" />
        <input value={url} onChange={(e) => setUrl(e.target.value)} type="url" placeholder="https://" className={inputCls} aria-label="Link" required />
        <SecondaryButton type="submit" write>
          Add link
        </SecondaryButton>
      </form>
    </Card>
  );
}
