"use client";

import { PrimaryButton, inputCls } from "../ui";

export type Pledge = {
  id: string;
  year: number;
  org_name: string;
  contact_name: string | null;
  email: string | null;
  status: "talking" | "committed" | "paid" | "declined";
  kind: "cash" | "in_kind";
  amount: number;
  notes: string | null;
};

export const STATUS_LABEL: Record<Pledge["status"], string> = {
  talking: "Talking",
  committed: "Committed",
  paid: "Paid",
  declined: "Declined",
};

/** One pledge, for adding or editing. */
export default function PledgeForm({
  action,
  year,
  initial,
}: {
  action: (formData: FormData) => Promise<void>;
  year: number;
  initial?: Pledge;
}) {
  return (
    <form action={action} className="adm-form-stack">
      {initial && <input type="hidden" name="id" value={initial.id} />}
      <input type="hidden" name="year" value={initial?.year ?? year} />
      <label className="tx-field">
        <span className="tx-field__label">Organisation</span>
        <input name="org_name" required defaultValue={initial?.org_name} className={inputCls} />
      </label>
      <div className="adm-fields">
        <label className="tx-field">
          <span className="tx-field__label">Contact</span>
          <input name="contact_name" defaultValue={initial?.contact_name ?? ""} className={inputCls} />
        </label>
        <label className="tx-field">
          <span className="tx-field__label">Email</span>
          <input name="email" type="email" defaultValue={initial?.email ?? ""} className={inputCls} />
        </label>
        <label className="tx-field">
          <span className="tx-field__label">Status</span>
          <select name="status" defaultValue={initial?.status ?? "talking"} className={inputCls}>
            {Object.entries(STATUS_LABEL).map(([v, l]) => (
              <option key={v} value={v}>
                {l}
              </option>
            ))}
          </select>
        </label>
        <label className="tx-field">
          <span className="tx-field__label">Type</span>
          <select name="kind" defaultValue={initial?.kind ?? "cash"} className={inputCls}>
            <option value="cash">Cash</option>
            <option value="in_kind">In kind</option>
          </select>
        </label>
        <label className="tx-field adm-span2">
          <span className="tx-field__label">Amount (AUD)</span>
          <input name="amount" inputMode="decimal" defaultValue={initial ? String(initial.amount) : ""} placeholder="5000" className={inputCls} />
          <span className="tx-field__hint">The agreed value, or your best estimate while still talking.</span>
        </label>
      </div>
      <label className="tx-field">
        <span className="tx-field__label">Notes</span>
        <textarea name="notes" rows={3} defaultValue={initial?.notes ?? ""} className={inputCls} />
      </label>
      <PrimaryButton type="submit">{initial ? "Save changes" : "Add pledge"}</PrimaryButton>
    </form>
  );
}
