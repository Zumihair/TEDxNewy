"use client";

import { useState } from "react";
import { Segmented, Switch } from "@/components/ds";
import { passwordPhrase } from "@/lib/password-phrase";
import { PrimaryButton } from "../ui";
import { MODULES, type ModuleAccess } from "../access";

/**
 * What an access can do: one Admin switch (Settings, and writes everywhere) and, for everyone else,
 * Read or Write for each module. Posts `is_admin` and `mod_<key>` fields a plain form can read.
 */
export function ModulePermissions({
  admin: initialAdmin,
  modules: initialModules,
}: {
  admin: boolean;
  modules: ModuleAccess;
}) {
  const [admin, setAdmin] = useState(initialAdmin);
  const [modules, setModules] = useState<ModuleAccess>(initialModules);
  return (
    <div className="adm-form-stack">
      <input type="hidden" name="is_admin" value={admin ? "1" : ""} />
      {MODULES.map((m) => (
        <input key={m.key} type="hidden" name={`mod_${m.key}`} value={admin || modules[m.key] ? "1" : ""} />
      ))}
      <Switch
        label="Admin"
        hint="Also opens Settings (access, team, notifications) and can change everything."
        checked={admin}
        onChange={setAdmin}
      />
      {!admin && (
        <div className="adm-modperm">
          <span className="tx-field__label">What they can do in each module</span>
          {MODULES.map((m) => (
            <div key={m.key} className="adm-modperm__row">
              <span className="adm-modperm__name">{m.label}</span>
              <Segmented
                size="sm"
                value={modules[m.key] ? "write" : "read"}
                onChange={(v) => setModules({ ...modules, [m.key]: v === "write" })}
                options={[
                  { value: "read", label: "Read" },
                  { value: "write", label: "Write" },
                ]}
              />
            </div>
          ))}
          <span className="tx-field__hint">Read can look and preview. Write can add, edit, delete, send and move.</span>
        </div>
      )}
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
  initial?: { email: string; label: string; admin: boolean; modules: ModuleAccess };
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
        <span className="tx-field__hint">Shown in the corner once someone is signed in. The first word is used in the Home greeting.</span>
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

      <ModulePermissions admin={initial?.admin ?? false} modules={initial?.modules ?? {}} />

      <PrimaryButton type="submit">{editing ? "Save changes" : "Create access"}</PrimaryButton>
    </form>
  );
}
