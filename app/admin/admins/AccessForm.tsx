"use client";

import { useState } from "react";
import { Switch } from "@/components/ds";
import { passwordPhrase } from "@/lib/password-phrase";
import { PrimaryButton } from "../ui";

/** The two switches an access has, as hidden inputs a plain form post can read. */
export function PermissionSwitches({
  canEdit: initialEdit,
  admin: initialAdmin,
}: {
  canEdit: boolean;
  admin: boolean;
}) {
  const [admin, setAdmin] = useState(initialAdmin);
  const [edit, setEdit] = useState(initialEdit || initialAdmin);
  return (
    <div className="adm-form-stack">
      <input type="hidden" name="can_edit" value={edit || admin ? "1" : ""} />
      <input type="hidden" name="is_admin" value={admin ? "1" : ""} />
      <Switch
        label="Can edit"
        hint="Add, edit, delete, send and move things. Off means view only."
        checked={edit || admin}
        disabled={admin}
        onChange={setEdit}
      />
      <Switch
        label="Admin"
        hint="Also opens Settings: access, team and notifications. Admins can always edit."
        checked={admin}
        onChange={setAdmin}
      />
    </div>
  );
}

/** Name, password and permissions for one access. Used for both create and edit. */
export default function AccessForm({
  action,
  initial,
  team,
}: {
  action: (formData: FormData) => Promise<void>;
  initial?: { email: string; label: string; canEdit: boolean; admin: boolean };
  /** Team members without a sign-in yet, to link a new access to one. */
  team?: { slug: string; name: string }[];
}) {
  const editing = !!initial;
  const [password, setPassword] = useState("");
  return (
    <form action={action} className="adm-form-stack">
      {initial && <input type="hidden" name="email" value={initial.email} />}
      <label className="tx-field">
        <span className="tx-field__label">Name</span>
        <input name="label" required defaultValue={initial?.label} placeholder="Comms team" className="tx-input" />
        <span className="tx-field__hint">Shown in the corner once someone is signed in.</span>
      </label>

      {!editing && team && team.length > 0 && (
        <label className="tx-field">
          <span className="tx-field__label">Team member</span>
          <select name="team_slug" className="tx-input" defaultValue="">
            <option value="">Not linked to a team member</option>
            {team.map((t) => (
              <option key={t.slug} value={t.slug}>{t.name}</option>
            ))}
          </select>
          <span className="tx-field__hint">Linked people can edit their own photo, bio and socials from My account.</span>
        </label>
      )}

      <label className="tx-field">
        <span className="tx-field__label">{editing ? "New password" : "Password"}</span>
        <input
          name="password"
          type="text"
          autoComplete="off"
          required={!editing}
          minLength={8}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder={editing ? "Leave blank to keep the current one" : "At least 8 characters"}
          className="tx-input"
        />
        <span className="tx-field__hint">
          The password alone signs someone in, so each one has to be different.{" "}
          <button type="button" className="adm-link" onClick={() => setPassword(passwordPhrase())}>
            Make one for me
          </button>
        </span>
      </label>

      <PermissionSwitches canEdit={initial?.canEdit ?? false} admin={initial?.admin ?? false} />

      <PrimaryButton type="submit">{editing ? "Save changes" : "Create access"}</PrimaryButton>
    </form>
  );
}
