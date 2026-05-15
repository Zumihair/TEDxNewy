"use client";

import { useActionState, useState } from "react";
import Link from "next/link";
import { Loader2, User } from "lucide-react";
import { Card, Field, Flash, PageHeader, SectionLabel, inputCls } from "../ui";

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
  const [imageUrl, setImageUrl] = useState<string>(initial.image_url ?? "");

  const errors = state.ok ? [] : state.errors;
  const errorFor = (field: string) =>
    errors.find((e) => e.field === field)?.message;
  const generalErrors = errors.filter((e) => !e.field);

  return (
    <div className="space-y-8 pb-24">
      <PageHeader
        eyebrow={mode === "new" ? "Add team member" : "Edit team member"}
        title={mode === "new" ? "Add to the crew" : (initial.name ?? "Edit team member")}
        backHref="/admin/team"
      />

      {generalErrors.length > 0 && (
        <Flash tone="error">
          {generalErrors.map((e, i) => (
            <div key={i}>{e.message}</div>
          ))}
        </Flash>
      )}

      <form action={formAction} className="grid gap-8 md:grid-cols-[1fr_280px]">
        <div className="space-y-6">
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
            <Field
              label="Photo URL"
              hint="An absolute URL or a path under /images/team/…"
            >
              <input
                name="image_url"
                defaultValue={initial.image_url ?? ""}
                onChange={(e) => setImageUrl(e.currentTarget.value)}
                placeholder="/images/team/jake.jpg"
                className={inputCls}
              />
            </Field>
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
        </div>

        {/* Preview */}
        <aside className="space-y-4 md:sticky md:top-8 md:self-start">
          <SectionLabel>Preview</SectionLabel>
          <div className="relative aspect-square overflow-hidden rounded-[var(--radius-md)] border border-[rgba(20,18,16,0.10)] bg-[#1a1714] shadow-[var(--shadow-sm)]">
            {imageUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={imageUrl}
                alt=""
                className="absolute inset-0 h-full w-full object-cover"
                onError={(e) => {
                  e.currentTarget.style.display = "none";
                }}
              />
            ) : (
              <div className="absolute inset-0 flex items-center justify-center text-white/40">
                <User className="h-10 w-10" strokeWidth={1.5} />
              </div>
            )}
          </div>
        </aside>

        {/* Sticky save bar */}
        <div className="fixed inset-x-0 bottom-0 z-20 border-t border-[rgba(20,18,16,0.08)] bg-white/95 backdrop-blur-sm md:left-[260px]">
          <div className="mx-auto flex max-w-[1100px] flex-wrap items-center justify-between gap-3 px-5 py-3.5 md:px-12">
            <Link
              href="/admin/team"
              className="text-[13px] font-medium text-[#6b6459] hover:text-[#141210]"
            >
              Cancel
            </Link>
            <div className="flex items-center gap-2">
              {mode === "new" && (
                <button
                  type="submit"
                  name="next"
                  value="add-another"
                  disabled={pending}
                  className="inline-flex items-center gap-2 rounded-full bg-[rgba(20,18,16,0.06)] px-5 py-2.5 text-[13px] font-medium text-[#141210] transition-colors hover:bg-[rgba(20,18,16,0.10)] disabled:cursor-not-allowed disabled:opacity-70"
                >
                  Save & add another
                </button>
              )}
              <button
                type="submit"
                disabled={pending}
                className="inline-flex items-center gap-2 rounded-full bg-[#e02214] px-6 py-2.5 text-[13.5px] font-medium text-white transition-all hover:-translate-y-0.5 hover:bg-[#b91404] disabled:cursor-not-allowed disabled:opacity-70 disabled:hover:translate-y-0"
              >
                {pending && (
                  <Loader2 className="h-4 w-4 animate-spin" strokeWidth={2.5} />
                )}
                {pending
                  ? "Saving…"
                  : mode === "new"
                    ? "Add team member"
                    : "Save changes"}
              </button>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}
