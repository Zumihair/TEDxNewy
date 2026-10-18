"use client";

import { useActionState, useState } from "react";
import { Loader2 } from "lucide-react";
import ImageUploadField from "../ImageUploadField";
import { Card, Field, SectionLabel, inputCls } from "../ui";
import { ModulePermissions } from "../access/AccessForm";
import SocialsEditor from "../SocialsEditor";
import { socialsOf } from "@/lib/social-catalogue";
import type { ModuleAccess } from "../access";
import { useFormErrorToast } from "../Toaster";

type ActionResult =
  | { ok: true; login?: { username: string; password: string } }
  | { ok: false; errors: { field?: string; message: string }[] };

type Member = {
  slug?: string;
  name?: string;
  role?: string | null;
  bio?: string | null;
  image_url?: string | null;
  email?: string | null;
  linkedin_url?: string | null;
  instagram_url?: string | null;
  socials?: unknown;
  phone?: string | null;
  display_order?: number;
  is_active?: boolean;
};

/** The sign-in already linked to this member, if any. */
export type MemberLogin = { email: string; admin: boolean; modules: ModuleAccess } | null;

export default function TeamMemberForm({
  mode,
  initial,
  action,
  login = null,
}: {
  mode: "new" | "edit";
  initial: Member;
  login?: MemberLogin;
  action: (prev: unknown, form: FormData) => Promise<ActionResult>;
}) {
  const [state, formAction, pending] = useActionState<ActionResult, FormData>(
    action,
    { ok: true } as ActionResult,
  );

  // A new team member always gets a sign-in; an existing one without can be given one.
  const [loginMode, setLoginMode] = useState<"" | "create" | "update" | "reset">(mode === "new" ? "create" : "");
  const created = state.ok ? state.login : undefined;
  const errors = state.ok ? [] : state.errors;
  const errorFor = (field: string) =>
    errors.find((e) => e.field === field)?.message;

  useFormErrorToast(state, errors);

  return (
    <form action={formAction} className="space-y-6">
      {initial.slug && (
        <input type="hidden" name="original_slug" value={initial.slug} />
      )}

      <Card className="space-y-6 p-6">
            <SectionLabel>Person</SectionLabel>
            <Field label="Name" error={errorFor("name")}>
              <input
                name="name"
                required
                defaultValue={initial.name ?? ""}
                placeholder="e.g. Jake Hoppe"
                className={inputCls}
              />
            </Field>
            <Field
              label="Slug"
              hint="URL-safe id. Leave blank to auto-generate from the name."
            >
              <input
                name="slug"
                defaultValue={initial.slug ?? ""}
                placeholder="jake-hoppe"
                className={inputCls}
              />
            </Field>
            <Field label="Role" hint="A short title — Curator, Producer, Stage Crew Lead…">
              <input
                name="role"
                defaultValue={initial.role ?? ""}
                placeholder="e.g. Curator + Co-Lead"
                className={inputCls}
              />
            </Field>
            <Field label="Bio" hint="One or two sentences. Plain text.">
              <textarea
                name="bio"
                rows={4}
                defaultValue={initial.bio ?? ""}
                placeholder="A short paragraph about them…"
                className={`${inputCls} leading-[1.55]`}
              />
            </Field>
            <div className="grid gap-6 md:grid-cols-[1fr_140px]">
              <Field label="Active" hint="Uncheck to hide from the public /team page.">
                <label className="inline-flex cursor-pointer items-center gap-2">
                  <input
                    type="checkbox"
                    name="is_active"
                    defaultChecked={initial.is_active ?? true}
                    className="h-4 w-4 rounded border-[rgba(0,0,0,0.20)] text-[#e62b1e] focus:ring-[#e62b1e]/40"
                  />
                  <span className="text-[14px] text-[#000000]">
                    Show on /team
                  </span>
                </label>
              </Field>
              <Field label="Display order" hint="Lower = earlier">
                <input
                  type="number"
                  name="display_order"
                  min={0}
                  defaultValue={initial.display_order ?? 999}
                  className={inputCls}
                />
              </Field>
            </div>
          </Card>

          <Card className="space-y-6 p-6">
            <SectionLabel>Photo + socials</SectionLabel>
            <ImageUploadField
              name="image_url"
              label="Photo"
              defaultValue={initial.image_url ?? ""}
              folder="team"
              baseName={initial.slug ?? initial.name}
              aspect="4/5"
              hint="Drag & drop, click to pick, or paste an external URL. 4:5 portrait works best."
            />
            <div className="grid gap-6 md:grid-cols-2">
              <Field label="Contact email" hint="Optional, shown as a mail link.">
                <input
                  type="email"
                  name="email"
                  defaultValue={initial.email ?? ""}
                  placeholder="jake@tedxnewy.com.au"
                  className={inputCls}
                />
              </Field>
              <Field label="Phone" hint="Only used in their email signature. Not shown on /team.">
                <input name="phone" defaultValue={initial.phone ?? ""} placeholder="0400 000 000" className={inputCls} />
              </Field>
            </div>
            <Field label="Socials" hint="Any number, from the catalogue. They show on /team and in the email signature.">
              <SocialsEditor initial={socialsOf(initial)} />
            </Field>
          </Card>

      <Card className="space-y-4 p-6">
        <SectionLabel>Sign-in</SectionLabel>
        {created && (
          <div className="adm-newlogin">
            <span className="adm-card__title">Sign-in ready. Share this once.</span>
            <code>{created.password}</code>
            <span className="adm-card__text">They sign in at /admin/login with just the password. Close this window when you have copied it.</span>
          </div>
        )}
        {login ? (
          <>
            <input type="hidden" name="login_email" value={login.email} />
            <input type="hidden" name="login_mode" value={loginMode || "update"} />
            <ModulePermissions admin={login.admin} modules={login.modules} />
            <label className="adm-check">
              <input type="checkbox" checked={loginMode === "reset"} onChange={(e) => setLoginMode(e.target.checked ? "reset" : "")} />
              <span>Make a new password for them</span>
            </label>
          </>
        ) : (
          <>
            {mode === "edit" && (
              <label className="adm-check">
                <input type="checkbox" checked={loginMode === "create"} onChange={(e) => setLoginMode(e.target.checked ? "create" : "")} />
                <span>Give them a sign-in</span>
              </label>
            )}
            {loginMode === "create" && (
              <>
                <input type="hidden" name="login_mode" value="create" />
                <ModulePermissions admin={false} modules={{}} />
                <p className="adm-card__text">
                  A password is made when you save, like mango-TEAL-47, and shown once. They sign in with just the password,
                  then keep their own photo, bio and socials up to date from My account. Their role stays with you.
                </p>
              </>
            )}
          </>
        )}
      </Card>

      {/* Save bar — sticky within the modal's own scroll container. -mx-5/-mb-5
          bleed past Modal.tsx's p-5 body padding so it reaches the modal's
          true edges; pb-5 restores that inset ON the bar itself. */}
      <div className="sticky bottom-0 -mx-5 -mb-5 flex items-center justify-end gap-2 border-t border-[rgba(0,0,0,0.08)] bg-white/95 px-5 pb-5 pt-4 backdrop-blur-sm">
        <button
          type="submit"
          disabled={pending}
          className="tx-btn tx-btn--accent tx-btn--sm tx-btn--auto"
        >
          {pending && (
            <Loader2 className="h-4 w-4 animate-spin" strokeWidth={2.5} />
          )}
          {pending ? "Saving…" : mode === "new" ? "Add team member" : "Save changes"}
        </button>
      </div>
    </form>
  );
}
