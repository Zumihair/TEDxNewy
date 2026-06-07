"use client";

import { useState, useTransition } from "react";
import { Check, Plus, Trash2 } from "lucide-react";
import { Card, DangerButton, Field, PrimaryButton, inputCls } from "../ui";
import type { FormSource } from "./sources";

export type RecipientRow = {
  email: string;
  label: string | null;
  /** form_source values this recipient is currently subscribed to */
  forms: string[];
};

type Props = {
  forms: FormSource[];
  recipients: RecipientRow[];
  setAction: (formData: FormData) => Promise<void>;
  addAction: (formData: FormData) => Promise<void>;
  removeAction: (formData: FormData) => Promise<void>;
};

export default function NotificationMatrix({
  forms,
  recipients,
  setAction,
  addAction,
  removeAction,
}: Props) {
  // Optimistic checked-state per cell, seeded from the server data.
  const seed: Record<string, boolean> = {};
  for (const r of recipients) {
    for (const f of forms) {
      seed[cellKey(r.email, f.value)] = r.forms.includes(f.value);
    }
  }
  const [checked, setChecked] = useState(seed);
  const [pending, startTransition] = useTransition();

  const toggle = (recipient: RecipientRow, formSource: string, next: boolean) => {
    setChecked((prev) => ({ ...prev, [cellKey(recipient.email, formSource)]: next }));
    const fd = new FormData();
    fd.set("email", recipient.email);
    fd.set("label", recipient.label ?? "");
    fd.set("formSource", formSource);
    fd.set("enabled", next ? "1" : "0");
    startTransition(() => setAction(fd));
  };

  return (
    <div className="space-y-8">
      {recipients.length > 0 ? (
        <Card className="overflow-x-auto">
          <table className="w-full border-collapse text-left">
            <thead>
              <tr className="border-b border-[rgba(20,18,16,0.10)]">
                <th className="sticky left-0 z-10 bg-white px-4 py-3 md:px-5">
                  <ColHead>Recipient</ColHead>
                </th>
                {forms.map((f) => (
                  <th key={f.value} className="px-3 py-3 text-center">
                    <ColHead>{f.short}</ColHead>
                  </th>
                ))}
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-[rgba(20,18,16,0.08)]">
              {recipients.map((r) => (
                <tr key={r.email} className="group">
                  <td className="sticky left-0 z-10 bg-white px-4 py-3.5 md:px-5">
                    <div className="min-w-0">
                      <div className="text-[14px] font-medium text-[#141210]">
                        {r.email}
                      </div>
                      {r.label && (
                        <div className="mt-0.5 text-[12px] text-[#6b6459]">
                          {r.label}
                        </div>
                      )}
                    </div>
                  </td>
                  {forms.map((f) => {
                    const key = cellKey(r.email, f.value);
                    const on = checked[key] ?? false;
                    return (
                      <td key={f.value} className="px-3 py-3.5 text-center">
                        <CheckCell
                          on={on}
                          disabled={pending}
                          label={`${r.email} — ${f.short}`}
                          onChange={(next) => toggle(r, f.value, next)}
                        />
                      </td>
                    );
                  })}
                  <td className="px-4 py-3.5 text-right">
                    <form action={removeAction}>
                      <input type="hidden" name="email" value={r.email} />
                      <DangerButton type="submit">
                        <Trash2 className="h-3.5 w-3.5" strokeWidth={2.25} />
                        Remove
                      </DangerButton>
                    </form>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      ) : (
        <Card className="px-6 py-12 text-center">
          <p className="text-[14px] text-[#6b6459]">
            No recipients yet. Add one below and tick the forms they should be
            emailed about.
          </p>
        </Card>
      )}

      {/* Add recipient */}
      <Card className="p-5 md:p-6">
        <form action={addAction} className="space-y-5">
          <div className="grid gap-4 md:grid-cols-2">
            <Field label="Email">
              <input
                name="email"
                type="email"
                required
                placeholder="teammate@tedxnewy.com.au"
                className={inputCls}
              />
            </Field>
            <Field label="Label" hint="Optional — e.g. 'Will (co-director)'.">
              <input
                name="label"
                placeholder="Activations team"
                className={inputCls}
              />
            </Field>
          </div>
          <fieldset>
            <legend
              className="font-mono text-[10.5px] font-semibold uppercase text-[#6b6459]"
              style={{ letterSpacing: "0.24em" }}
            >
              Email them about
            </legend>
            <div className="mt-3 grid grid-cols-2 gap-2 md:grid-cols-3">
              {forms.map((f) => (
                <label
                  key={f.value}
                  className="flex cursor-pointer items-center gap-2.5 rounded-[var(--radius-sm)] border border-[rgba(20,18,16,0.10)] bg-[#f9f5ec] px-3 py-2.5 text-[13px] text-[#141210] has-[:checked]:border-[#e02214]/30 has-[:checked]:bg-[#e02214]/[0.06]"
                >
                  <input
                    type="checkbox"
                    name="forms"
                    value={f.value}
                    defaultChecked
                    className="h-4 w-4 shrink-0 accent-[#e02214]"
                  />
                  {f.label}
                </label>
              ))}
            </div>
          </fieldset>
          <div className="flex">
            <PrimaryButton type="submit">
              <Plus className="h-4 w-4" strokeWidth={2.25} />
              Add recipient
            </PrimaryButton>
          </div>
        </form>
      </Card>
    </div>
  );
}

function cellKey(email: string, formSource: string): string {
  return `${email}|${formSource}`;
}

function ColHead({ children }: { children: React.ReactNode }) {
  return (
    <span
      className="font-mono text-[9.5px] font-semibold uppercase text-[#6b6459]"
      style={{ letterSpacing: "0.18em" }}
    >
      {children}
    </span>
  );
}

function CheckCell({
  on,
  disabled,
  label,
  onChange,
}: {
  on: boolean;
  disabled: boolean;
  label: string;
  onChange: (next: boolean) => void;
}) {
  return (
    <button
      type="button"
      role="checkbox"
      aria-checked={on}
      aria-label={label}
      disabled={disabled}
      onClick={() => onChange(!on)}
      className={
        "inline-flex h-6 w-6 items-center justify-center rounded-md border transition-colors disabled:opacity-50 " +
        (on
          ? "border-[#e02214] bg-[#e02214] text-white hover:bg-[#b91404]"
          : "border-[rgba(20,18,16,0.20)] bg-white text-transparent hover:border-[#e02214]/50")
      }
    >
      <Check className="h-3.5 w-3.5" strokeWidth={3} />
    </button>
  );
}
