"use client";

import { useActionState } from "react";
import { Loader2 } from "lucide-react";
import ImageUploadField from "../ImageUploadField";
import { Card, Field, SectionLabel, inputCls } from "../ui";
import { useFormErrorToast } from "../Toaster";

type ActionResult =
  | { ok: true }
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
  display_order?: number;
  is_active?: boolean;
};

export default function TeamMemberForm({
  mode,
  initial,
  action,
}: {
  mode: "new" | "edit";
  initial: Member;
  action: (prev: unknown, form: FormData) => Promise<ActionResult>;
}) {
  const [state, formAction, pending] = useActionState<ActionResult, FormData>(
    action,
    { ok: true } as ActionResult,
  );

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
                    className="h-4 w-4 rounded border-[rgba(20,18,16,0.20)] text-[#e02214] focus:ring-[#e02214]/40"
                  />
                  <span className="text-[14px] text-[#141210]">
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
              <Field label="Contact email" hint="Optional — shown as a mail link.">
                <input
                  type="email"
                  name="email"
                  defaultValue={initial.email ?? ""}
                  placeholder="jake@tedxnewy.com.au"
                  className={inputCls}
                />
              </Field>
              <Field label="LinkedIn URL">
                <input
                  type="url"
                  name="linkedin_url"
                  defaultValue={initial.linkedin_url ?? ""}
                  placeholder="https://www.linkedin.com/in/…"
                  className={inputCls}
                />
              </Field>
            </div>
            <Field label="Instagram URL">
              <input
                type="url"
                name="instagram_url"
                defaultValue={initial.instagram_url ?? ""}
                placeholder="https://instagram.com/…"
                className={inputCls}
              />
            </Field>
          </Card>

      {/* Save bar — sticky within the modal's own scroll container. -mx-5/-mb-5
          bleed past Modal.tsx's p-5 body padding so it reaches the modal's
          true edges; pb-5 restores that inset ON the bar itself. */}
      <div className="sticky bottom-0 -mx-5 -mb-5 flex items-center justify-end gap-2 border-t border-[rgba(20,18,16,0.08)] bg-white/95 px-5 pb-5 pt-4 backdrop-blur-sm">
        <button
          type="submit"
          disabled={pending}
          className="inline-flex items-center gap-2 rounded-full bg-[#e02214] px-6 py-2.5 text-[13.5px] font-medium text-white transition-all hover:-translate-y-0.5 hover:bg-[#b91404] disabled:cursor-not-allowed disabled:opacity-70 disabled:hover:translate-y-0"
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
