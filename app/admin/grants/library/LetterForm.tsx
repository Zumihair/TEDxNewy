"use client";

import { useState } from "react";
import { PrimaryButton, inputCls } from "../../ui";
import DateTimePicker from "../../DateTimePicker";
import FileUpload from "./FileUpload";
import GrantPicker from "./GrantPicker";
import {
  LETTER_STATUSES,
  LETTER_STATUS_LABEL,
  LETTER_TYPES,
  LETTER_TYPE_LABEL,
  type GrantLetter,
  type GrantOption,
} from "./shared";

/** One reference letter, for adding or editing. */
export default function LetterForm({
  action,
  initial,
  grants,
  linked = [],
}: {
  action: (formData: FormData) => Promise<void>;
  initial?: GrantLetter;
  grants: GrantOption[];
  /** Ids of the grants this letter is already used for. */
  linked?: string[];
}) {
  const [asked, setAsked] = useState(initial?.asked_on ?? "");
  const [due, setDue] = useState(initial?.due_on ?? "");
  const [received, setReceived] = useState(initial?.received_on ?? "");

  return (
    <form action={action} className="adm-form-stack">
      {initial && <input type="hidden" name="id" value={initial.id} />}
      <div className="adm-fields">
        <label className="tx-field">
          <span className="tx-field__label">Who is writing it</span>
          <input name="referee" required defaultValue={initial?.referee} placeholder="University of Newcastle" className={inputCls} />
        </label>
        <label className="tx-field">
          <span className="tx-field__label">Their role</span>
          <input name="role" defaultValue={initial?.role ?? ""} placeholder="Partnerships team" className={inputCls} />
        </label>
        <label className="tx-field">
          <span className="tx-field__label">What kind of letter</span>
          <select name="letter_type" defaultValue={initial?.letter_type ?? "partner"} className={inputCls}>
            {LETTER_TYPES.map((t) => (
              <option key={t} value={t}>
                {LETTER_TYPE_LABEL[t]}
              </option>
            ))}
          </select>
        </label>
        <label className="tx-field">
          <span className="tx-field__label">Where it is up to</span>
          <select name="status" defaultValue={initial?.status ?? "to_ask"} className={inputCls}>
            {LETTER_STATUSES.map((s) => (
              <option key={s} value={s}>
                {LETTER_STATUS_LABEL[s]}
              </option>
            ))}
          </select>
        </label>
        <div className="tx-field">
          <span className="tx-field__label">Asked on</span>
          <DateTimePicker mode="date" name="asked_on" value={asked} onChange={setAsked} placeholder="Not asked yet" />
        </div>
        <div className="tx-field">
          <span className="tx-field__label">Needed by</span>
          <DateTimePicker mode="date" name="due_on" value={due} onChange={setDue} placeholder="No date" />
        </div>
        <div className="tx-field adm-span2">
          <span className="tx-field__label">Received on</span>
          <DateTimePicker mode="date" name="received_on" value={received} onChange={setReceived} placeholder="Set when it is marked received" />
        </div>
      </div>
      <FileUpload
        folder="letters"
        label="The signed letter"
        hint="A PDF or a photo of the signed page. You can add it later."
        initial={
          initial?.file_url && initial.storage_path
            ? { url: initial.file_url, name: initial.file_name ?? "Letter", path: initial.storage_path }
            : null
        }
      />
      <GrantPicker grants={grants} linked={linked} />
      <label className="tx-field">
        <span className="tx-field__label">Notes</span>
        <textarea
          name="notes"
          rows={3}
          defaultValue={initial?.notes ?? ""}
          placeholder="What to ask them to cover, who is chasing, anything they said."
          className={inputCls}
        />
      </label>
      <PrimaryButton type="submit">{initial ? "Save changes" : "Add letter"}</PrimaryButton>
    </form>
  );
}
