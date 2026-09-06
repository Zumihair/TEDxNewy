"use client";

import { useActionState } from "react";
import { Loader2 } from "lucide-react";
import ImageUploadField from "../ImageUploadField";
import { Card, Field, SectionLabel, inputCls } from "../ui";
import { useFormErrorToast } from "../Toaster";

type ActionResult =
  | { ok: true }
  | { ok: false; errors: { field?: string; message: string }[] };

type Sponsor = {
  id?: string;
  name?: string;
  tier?: string;
  partner_type?: string | null;
  logo_url?: string | null;
  website_url?: string | null;
  display_order?: number;
};

const TIERS = ["Presenting", "Platinum", "Gold", "Community"];

export default function SponsorForm({
  mode,
  initial,
  action,
}: {
  mode: "new" | "edit";
  initial: Sponsor;
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
      {initial.id && <input type="hidden" name="id" value={initial.id} />}

      <Card className="space-y-6 p-6">
        <SectionLabel>Sponsor</SectionLabel>
        <Field label="Name" error={errorFor("name")}>
          <input
            name="name"
            required
            defaultValue={initial.name ?? ""}
            placeholder="e.g. University of Newcastle"
            className={inputCls}
          />
        </Field>
        <div className="grid gap-6 md:grid-cols-[1fr_140px]">
          <Field label="Tier" hint="Drives ordering and prominence.">
            <select
              name="tier"
              defaultValue={initial.tier ?? "Community"}
              className={inputCls}
            >
              {TIERS.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
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
        <Field
          label="Partner type label"
          hint={'Shown under the name, e.g. "Media Partner". Leave blank for "{Tier} Partner".'}
        >
          <input
            name="partner_type"
            defaultValue={initial.partner_type ?? ""}
            placeholder="e.g. Media Partner"
            className={inputCls}
          />
        </Field>
        <Field label="Website URL" hint="Optional, for a click-through.">
          <input
            name="website_url"
            defaultValue={initial.website_url ?? ""}
            placeholder="https://…"
            className={inputCls}
          />
        </Field>
      </Card>

      <Card className="space-y-6 p-6">
        <SectionLabel>Logo</SectionLabel>
        <ImageUploadField
          name="logo_url"
          label="Logo"
          defaultValue={initial.logo_url ?? ""}
          folder="sponsors"
          baseName={initial.name}
          aspect="1/1"
          error={errorFor("logo_url") ?? undefined}
          hint="Drag & drop, click to pick, or paste an external URL. Transparent PNG works best. Leave blank to show the sponsor name as a text wordmark instead."
        />
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
          {pending ? "Saving…" : mode === "new" ? "Add sponsor" : "Save changes"}
        </button>
      </div>
    </form>
  );
}
