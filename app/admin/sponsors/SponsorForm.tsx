"use client";

import { useActionState, useState } from "react";
import Link from "next/link";
import { Loader2, Building2 } from "lucide-react";
import ImageUploadField from "../ImageUploadField";
import { Card, Field, PageHeader, SectionLabel, inputCls } from "../ui";
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

  const [logoUrl, setLogoUrl] = useState<string>(initial.logo_url ?? "");

  const errors = state.ok ? [] : state.errors;
  const errorFor = (field: string) =>
    errors.find((e) => e.field === field)?.message;

  useFormErrorToast(state, errors);

  return (
    <div className="space-y-8 pb-24">
      <PageHeader
        eyebrow={mode === "new" ? "Add sponsor" : "Edit sponsor"}
        title={mode === "new" ? "Add a sponsor" : (initial.name ?? "Edit sponsor")}
        backHref="/admin/sponsors"
        description={
          mode === "new"
            ? "Add a partner and their logo. Drives /sponsors and the Signal sponsor teaser."
            : undefined
        }
      />

      <form action={formAction} className="grid gap-8 md:grid-cols-[1fr_280px]">
        <div className="space-y-6">
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
              onChange={setLogoUrl}
            />
          </Card>
        </div>

        {/* Live preview */}
        <aside className="space-y-4 md:sticky md:top-8 md:self-start">
          <SectionLabel>Preview</SectionLabel>
          <div className="flex aspect-square items-center justify-center overflow-hidden rounded-[var(--radius-md)] border border-[rgba(20,18,16,0.10)] bg-white p-6 shadow-[var(--shadow-sm)]">
            {logoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={logoUrl}
                alt=""
                className="max-h-full max-w-full object-contain"
                onError={(e) => {
                  e.currentTarget.style.display = "none";
                }}
              />
            ) : (
              <div className="flex flex-col items-center gap-2 text-[#6b6459]/50">
                <Building2 className="h-8 w-8" strokeWidth={1.5} />
                <span className="text-[11px]">No logo, text wordmark</span>
              </div>
            )}
          </div>
        </aside>

        {/* Sticky save bar */}
        <div className="fixed inset-x-0 bottom-0 z-20 border-t border-[rgba(20,18,16,0.08)] bg-white/95 backdrop-blur-sm md:left-[260px]">
          <div className="mx-auto flex max-w-[1100px] flex-wrap items-center justify-between gap-3 px-5 py-3.5 md:px-12">
            <Link
              href="/admin/sponsors"
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
                    ? "Add sponsor"
                    : "Save changes"}
              </button>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}
