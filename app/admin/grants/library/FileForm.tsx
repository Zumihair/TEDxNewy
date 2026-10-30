"use client";

import { useState } from "react";
import { PrimaryButton, inputCls } from "../../ui";
import DateTimePicker from "../../DateTimePicker";
import FileUpload from "./FileUpload";
import GrantPicker from "./GrantPicker";
import { FILE_KINDS, FILE_KIND_LABEL, type GrantFile, type GrantOption } from "./shared";

/** One evidence file (a certificate, a bank statement, an impact report), for adding or editing. */
export default function FileForm({
  action,
  initial,
  grants,
  linked = [],
}: {
  action: (formData: FormData) => Promise<void>;
  initial?: GrantFile;
  grants: GrantOption[];
  /** Ids of the grants this file is already attached to. */
  linked?: string[];
}) {
  const [dated, setDated] = useState(initial?.dated_on ?? "");
  const [expires, setExpires] = useState(initial?.expires_on ?? "");

  return (
    <form action={action} className="adm-form-stack">
      {initial && <input type="hidden" name="id" value={initial.id} />}
      <div className="adm-fields">
        <label className="tx-field adm-span2">
          <span className="tx-field__label">What it is</span>
          <input name="title" required defaultValue={initial?.title} placeholder="Public liability certificate of currency" className={inputCls} />
        </label>
        <label className="tx-field">
          <span className="tx-field__label">Kind</span>
          <select name="kind" defaultValue={initial?.kind ?? "other"} className={inputCls}>
            {FILE_KINDS.map((k) => (
              <option key={k} value={k}>
                {FILE_KIND_LABEL[k]}
              </option>
            ))}
          </select>
        </label>
        <div className="tx-field">
          <span className="tx-field__label">Dated</span>
          <DateTimePicker mode="date" name="dated_on" value={dated} onChange={setDated} placeholder="Not set" />
        </div>
        <div className="tx-field adm-span2">
          <span className="tx-field__label">Runs out on</span>
          <DateTimePicker mode="date" name="expires_on" value={expires} onChange={setExpires} placeholder="Never expires" />
          <span className="adm-card__text">We warn you 60 days before, and again on every grant it is attached to once it has run out.</span>
        </div>
      </div>
      <FileUpload
        folder="files"
        label="The file"
        initial={
          initial?.file_url && initial.storage_path
            ? { url: initial.file_url, name: initial.file_name ?? "File", path: initial.storage_path }
            : null
        }
      />
      <GrantPicker grants={grants} linked={linked} label="Attached to these grants" />
      <label className="tx-field">
        <span className="tx-field__label">Notes</span>
        <textarea
          name="notes"
          rows={3}
          defaultValue={initial?.notes ?? ""}
          placeholder="Where it comes from, who renews it, what funders accept."
          className={inputCls}
        />
      </label>
      <PrimaryButton type="submit">{initial ? "Save changes" : "Add file"}</PrimaryButton>
    </form>
  );
}
