"use client";

import { WORKSPACE_OPTIONS } from "../access";
import { PrimaryButton } from "../ui";

/** Name, workspaces and password for one access. Used for both create and edit. */
export default function AccessForm({
  action,
  initial,
}: {
  action: (formData: FormData) => Promise<void>;
  initial?: { email: string; label: string; workspaces: string[] };
}) {
  const editing = !!initial;
  return (
    <form action={action} className="adm-form-stack">
      {initial && <input type="hidden" name="email" value={initial.email} />}
      <label className="tx-field">
        <span className="tx-field__label">Name</span>
        <input
          name="label"
          required
          defaultValue={initial?.label}
          placeholder="Comms team"
          className="tx-input"
        />
        <span className="tx-field__hint">Shown in the corner once someone is signed in.</span>
      </label>

      <label className="tx-field">
        <span className="tx-field__label">{editing ? "New password" : "Password"}</span>
        <input
          name="password"
          type="text"
          autoComplete="off"
          required={!editing}
          minLength={8}
          placeholder={editing ? "Leave blank to keep the current one" : "At least 8 characters"}
          className="tx-input"
        />
        <span className="tx-field__hint">
          Whoever enters this password signs in with exactly the workspaces ticked below.
        </span>
      </label>

      <fieldset className="adm-checks">
        <legend className="tx-field__label">Can see</legend>
        <p className="tx-field__hint" style={{ margin: 0 }}>Home is always included.</p>
        {WORKSPACE_OPTIONS.map((w) => (
          <label key={w.key} className="adm-check">
            <input
              type="checkbox"
              name="workspaces"
              value={w.key}
              defaultChecked={initial ? initial.workspaces.includes(w.key) : w.key === "comms"}
            />
            <span>{w.label}</span>
          </label>
        ))}
      </fieldset>

      <PrimaryButton type="submit">{editing ? "Save changes" : "Create access"}</PrimaryButton>
    </form>
  );
}
