"use client";

import { useActionState, useState } from "react";
import Link from "next/link";
import { Loader2, User } from "lucide-react";
import { Card, Field, Flash, PageHeader, SectionLabel, inputCls } from "../ui";

type ActionResult =
  | { ok: true }
  | { ok: false; errors: { field?: string; message: string }[] };

type Speaker = {
  slug?: string;
  name?: string;
  title?: string | null;
  talk?: string | null;
  blurb?: string | null;
  year?: number;
  accent?: string;
  image_url?: string | null;
  display_order?: number;
};

const ACCENTS = [
  { value: "red", swatch: "#e02214" },
  { value: "amber", swatch: "#d89645" },
  { value: "coast", swatch: "#1f4a5c" },
  { value: "harbor", swatch: "#2a3a88" },
];

export default function SpeakerForm({
  mode,
  initial,
  action,
}: {
  mode: "new" | "edit";
  initial: Speaker;
  action: (prev: unknown, form: FormData) => Promise<ActionResult>;
}) {
  const [state, formAction, pending] = useActionState<ActionResult, FormData>(
    action,
    { ok: true } as ActionResult,
  );

  const [imageUrl, setImageUrl] = useState<string>(initial.image_url ?? "");
  const [accent, setAccent] = useState<string>(initial.accent ?? "red");

  const errors = state.ok ? [] : state.errors;
  const errorFor = (field: string) =>
    errors.find((e) => e.field === field)?.message;
  const generalErrors = errors.filter((e) => !e.field);

  return (
    <div className="space-y-8 pb-24">
      <PageHeader
        eyebrow={mode === "new" ? "Add speaker" : "Edit speaker"}
        title={mode === "new" ? "Add a speaker" : (initial.name ?? "Edit speaker")}
        backHref="/admin/speakers"
        description={
          mode === "new"
            ? "Capture the basics — you can fill in talk + bio when content is finalised."
            : undefined
        }
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
            <SectionLabel>Speaker</SectionLabel>
            <Field label="Name" error={errorFor("name")}>
              <input
                name="name"
                required
                defaultValue={initial.name ?? ""}
                placeholder="e.g. Brittney Saunders"
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
                placeholder="brittney-saunders"
                className={inputCls}
              />
            </Field>
            <Field
              label="Title / role"
              hint="A short descriptor shown under the name."
            >
              <input
                name="title"
                defaultValue={initial.title ?? ""}
                placeholder="e.g. Founder · Fayt the Label · Creator"
                className={inputCls}
              />
            </Field>
            <div className="grid gap-6 md:grid-cols-[1fr_140px]">
              <Field label="Year" error={errorFor("year")}>
                <select
                  name="year"
                  defaultValue={initial.year ?? 2025}
                  className={inputCls}
                >
                  <option value={2025}>2025 · Reframe</option>
                  <option value={2024}>2024 · Beyond Boundaries</option>
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
          </Card>

          <Card className="space-y-6 p-6">
            <SectionLabel>Talk</SectionLabel>
            <Field label="Talk title" hint="Leave blank if not finalised.">
              <input
                name="talk"
                defaultValue={initial.talk ?? ""}
                placeholder="e.g. The power in quitting"
                className={inputCls}
              />
            </Field>
            <Field label="Bio / talk blurb">
              <textarea
                name="blurb"
                rows={5}
                defaultValue={initial.blurb ?? ""}
                placeholder="A short paragraph shown in the speaker modal…"
                className={`${inputCls} leading-[1.55]`}
              />
            </Field>
          </Card>

          <Card className="space-y-6 p-6">
            <SectionLabel>Portrait + accent</SectionLabel>
            <Field
              label="Portrait URL"
              hint="Use a path under /images/speakers/… or any absolute URL."
              error={errorFor("image_url")}
            >
              <input
                name="image_url"
                defaultValue={initial.image_url ?? ""}
                onChange={(e) => setImageUrl(e.currentTarget.value)}
                placeholder="/images/speakers/brittney-saunders.png"
                className={inputCls}
              />
            </Field>
            <Field label="Accent colour">
              <div role="radiogroup" className="flex flex-wrap items-center gap-2">
                {ACCENTS.map((a) => {
                  const active = a.value === accent;
                  return (
                    <label
                      key={a.value}
                      className={
                        "inline-flex cursor-pointer items-center gap-2 rounded-full border px-3 py-1.5 text-[12.5px] font-medium transition-colors " +
                        (active
                          ? "border-[#141210] bg-[#141210] text-white"
                          : "border-[rgba(20,18,16,0.15)] bg-white text-[#141210] hover:border-[#141210]/40")
                      }
                    >
                      <input
                        type="radio"
                        name="accent"
                        value={a.value}
                        checked={active}
                        onChange={(e) => setAccent(e.currentTarget.value)}
                        className="sr-only"
                      />
                      <span
                        className="inline-block h-3 w-3 rounded-full"
                        style={{ background: a.swatch }}
                        aria-hidden
                      />
                      {a.value}
                    </label>
                  );
                })}
              </div>
            </Field>
          </Card>
        </div>

        {/* Live preview */}
        <aside className="space-y-4 md:sticky md:top-8 md:self-start">
          <SectionLabel>Preview</SectionLabel>
          <div className="relative aspect-[4/5] overflow-hidden rounded-[var(--radius-md)] border border-[rgba(20,18,16,0.10)] bg-[#1a1714] shadow-[var(--shadow-sm)]">
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
              href="/admin/speakers"
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
                    ? "Add speaker"
                    : "Save changes"}
              </button>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}
