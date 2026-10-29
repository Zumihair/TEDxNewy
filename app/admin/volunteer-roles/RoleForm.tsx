"use client";

import { useActionState } from "react";
import { Loader2 } from "lucide-react";
import { Card, Field, SectionLabel, inputCls } from "../ui";
import { useFormErrorToast } from "../Toaster";
import type { VolunteerRoleRow } from "@/lib/volunteer-roles";

type ActionResult =
  | { ok: true }
  | { ok: false; errors: { field?: string; message: string }[] };

const STATUS_OPTIONS = [
  { value: "open", label: "Open: shown on /volunteer" },
  { value: "draft", label: "Draft: hidden while you write it" },
  { value: "closed", label: "Closed: filled or paused, kept for next time" },
];

export default function RoleForm({
  mode,
  initial,
  action,
}: {
  mode: "new" | "edit";
  initial: Partial<VolunteerRoleRow>;
  action: (prev: unknown, form: FormData) => Promise<ActionResult>;
}) {
  const [state, formAction, pending] = useActionState<ActionResult, FormData>(
    action,
    { ok: true } as ActionResult,
  );
  const errors = state.ok ? [] : state.errors;
  const errorFor = (field: string) => errors.find((e) => e.field === field)?.message;
  useFormErrorToast(state, errors);

  return (
    <form action={formAction} className="space-y-6">
      {initial.id && <input type="hidden" name="id" value={initial.id} />}

      <Card className="space-y-6 p-6">
        <SectionLabel>Role</SectionLabel>
        <Field label="Title" error={errorFor("title")}>
          <input
            name="title"
            required
            defaultValue={initial.title ?? ""}
            placeholder="e.g. Partnerships manager"
            className={inputCls}
          />
        </Field>
        <div className="grid gap-6 md:grid-cols-[minmax(0,1fr)_140px]">
          <Field label="Status">
            <select name="status" defaultValue={initial.status ?? "draft"} className={inputCls}>
              {STATUS_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Order" hint="Lower shows first">
            <input
              type="number"
              name="display_order"
              min={0}
              defaultValue={initial.display_order ?? 100}
              className={inputCls}
            />
          </Field>
        </div>
        <div className="grid gap-6 md:grid-cols-3">
          <Field label="Crew" hint="e.g. Partnerships, Production">
            <input name="crew" defaultValue={initial.crew ?? ""} placeholder="Partnerships" className={inputCls} />
          </Field>
          <Field label="Time" hint="How much time it takes">
            <input
              name="time_commitment"
              defaultValue={initial.time_commitment ?? ""}
              placeholder="A few hours a week"
              className={inputCls}
            />
          </Field>
          <Field label="Where">
            <input
              name="location"
              defaultValue={initial.location ?? ""}
              placeholder="Newcastle and online"
              className={inputCls}
            />
          </Field>
        </div>
        <Field label="Summary" hint="Two or three sentences: why the role matters." error={errorFor("summary")}>
          <textarea
            name="summary"
            rows={3}
            defaultValue={initial.summary ?? ""}
            className={inputCls}
          />
        </Field>
      </Card>

      <Card className="space-y-6 p-6">
        <SectionLabel>The detail</SectionLabel>
        <Field label="What you could do" hint="One item per line." error={errorFor("does")}>
          <textarea
            name="does"
            rows={6}
            defaultValue={(initial.does ?? []).join("\n")}
            placeholder={"Find and reach out to businesses that share our values\nLook after current partners through the season"}
            className={inputCls}
          />
        </Field>
        <Field label="What helps" hint="Optional. One item per line. Skills or experience that suit the role.">
          <textarea
            name="helps"
            rows={4}
            defaultValue={(initial.helps ?? []).join("\n")}
            placeholder={"Experience in sales or events\nBeing organised"}
            className={inputCls}
          />
        </Field>
      </Card>

      <Card className="space-y-6 p-6">
        <SectionLabel>Applying</SectionLabel>
        <Field
          label="Application question"
          hint="Optional. Asked on the role's own form in place of a general note. Leave blank to ask why they're a good fit."
        >
          <textarea
            name="apply_question"
            rows={2}
            defaultValue={initial.apply_question ?? ""}
            placeholder="e.g. Tell us about a partnership you have built or looked after."
            className={inputCls}
          />
        </Field>
      </Card>

      <div className="sticky bottom-0 -mx-5 -mb-5 flex items-center justify-end gap-2 border-t border-[rgba(0,0,0,0.08)] bg-white/95 px-5 pb-5 pt-4 backdrop-blur-sm">
        <button type="submit" disabled={pending} className="tx-btn tx-btn--accent tx-btn--sm tx-btn--auto">
          {pending && <Loader2 className="h-4 w-4 animate-spin" strokeWidth={2.5} />}
          {pending ? "Saving…" : mode === "new" ? "Add role" : "Save changes"}
        </button>
      </div>
    </form>
  );
}
