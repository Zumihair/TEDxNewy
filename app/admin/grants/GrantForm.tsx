"use client";

import { useState } from "react";
import { PrimaryButton, inputCls } from "../ui";
import DateTimePicker from "../DateTimePicker";
import { STAGES, STAGE_LABEL, type Grant } from "./shared";

const num = (n: number | null | undefined) => (n == null ? "" : String(n));

/** One grant, for adding or editing. */
export default function GrantForm({
  action,
  initial,
}: {
  action: (formData: FormData) => Promise<void>;
  initial?: Grant;
}) {
  const [closes, setCloses] = useState(initial?.closes_on ?? "");

  return (
    <form action={action} className="adm-form-stack">
      {initial && <input type="hidden" name="id" value={initial.id} />}
      <div className="adm-fields">
        <label className="tx-field">
          <span className="tx-field__label">Grant</span>
          <input name="name" required defaultValue={initial?.name} placeholder="Connect IRL Phase 2" className={inputCls} />
        </label>
        <label className="tx-field">
          <span className="tx-field__label">Funder</span>
          <input name="funder" defaultValue={initial?.funder ?? ""} placeholder="NSW Office for Youth" className={inputCls} />
        </label>
        <label className="tx-field">
          <span className="tx-field__label">Stage</span>
          <select name="stage" defaultValue={initial?.stage ?? "researching"} className={inputCls}>
            {STAGES.map((s) => (
              <option key={s} value={s}>
                {STAGE_LABEL[s]}
              </option>
            ))}
          </select>
        </label>
        <label className="tx-field">
          <span className="tx-field__label">Who&apos;s leading it</span>
          <input name="owner" defaultValue={initial?.owner ?? ""} placeholder="Jake" className={inputCls} />
        </label>
        <label className="tx-field adm-span2">
          <span className="tx-field__label">What it would fund</span>
          <input name="project" defaultValue={initial?.project ?? ""} placeholder="Youth Futures Lab" className={inputCls} />
        </label>
        <div className="tx-field">
          <span className="tx-field__label">Closes</span>
          <DateTimePicker mode="date" name="closes_on" value={closes} onChange={setCloses} placeholder="No date yet" />
        </div>
        <label className="tx-field">
          <span className="tx-field__label">Time or timing note</span>
          <input name="closes_note" defaultValue={initial?.closes_note ?? ""} placeholder="4pm, or Usually opens in May" className={inputCls} />
        </label>
        <label className="tx-field">
          <span className="tx-field__label">Smallest grant (AUD)</span>
          <input name="amount_min" inputMode="decimal" defaultValue={num(initial?.amount_min)} placeholder="25000" className={inputCls} />
        </label>
        <label className="tx-field">
          <span className="tx-field__label">Largest grant (AUD)</span>
          <input name="amount_max" inputMode="decimal" defaultValue={num(initial?.amount_max)} placeholder="50000" className={inputCls} />
        </label>
        <label className="tx-field">
          <span className="tx-field__label">We asked for (AUD)</span>
          <input name="amount_requested" inputMode="decimal" defaultValue={num(initial?.amount_requested)} className={inputCls} />
        </label>
        <label className="tx-field">
          <span className="tx-field__label">We were awarded (AUD)</span>
          <input name="amount_awarded" inputMode="decimal" defaultValue={num(initial?.amount_awarded)} className={inputCls} />
        </label>
        <label className="tx-field">
          <span className="tx-field__label">Decision expected</span>
          <input name="decision_note" defaultValue={initial?.decision_note ?? ""} placeholder="January 2027" className={inputCls} />
        </label>
        <label className="tx-field">
          <span className="tx-field__label">Link</span>
          <input name="url" type="url" defaultValue={initial?.url ?? ""} placeholder="https://" className={inputCls} />
        </label>
      </div>
      <label className="tx-field">
        <span className="tx-field__label">Notes</span>
        <textarea name="notes" rows={3} defaultValue={initial?.notes ?? ""} placeholder="Eligibility, what to attach, who to ask." className={inputCls} />
      </label>
      <PrimaryButton type="submit">{initial ? "Save changes" : "Add grant"}</PrimaryButton>
    </form>
  );
}
