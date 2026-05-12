"use client";

import { useActionState, useState } from "react";
import Link from "next/link";
import { Eye, FileText, Loader2 } from "lucide-react";
import Markdown from "@/components/Markdown";
import { Card, Field, Flash, PageHeader, SectionLabel, inputCls } from "../ui";

type ActionResult =
  | { ok: true }
  | { ok: false; errors: { field?: string; message: string }[] };

type Post = {
  slug?: string;
  title?: string;
  summary?: string | null;
  body_markdown?: string;
  hero_image_url?: string | null;
  author?: string | null;
  published_at?: string | null;
};

export default function PostForm({
  mode,
  initial,
  action,
}: {
  mode: "new" | "edit";
  initial: Post;
  action: (prev: unknown, form: FormData) => Promise<ActionResult>;
}) {
  const [state, formAction, pending] = useActionState<ActionResult, FormData>(
    action,
    { ok: true } as ActionResult,
  );

  const [body, setBody] = useState<string>(initial.body_markdown ?? "");
  const [showPreview, setShowPreview] = useState(false);
  const [heroImage, setHeroImage] = useState<string>(initial.hero_image_url ?? "");

  const errors = state.ok ? [] : state.errors;
  const errorFor = (field: string) =>
    errors.find((e) => e.field === field)?.message;
  const generalErrors = errors.filter((e) => !e.field);

  const isPublished = Boolean(initial.published_at);

  return (
    <div className="space-y-8 pb-24">
      <PageHeader
        eyebrow={mode === "new" ? "New post" : "Edit post"}
        title={mode === "new" ? "Draft a new idea" : (initial.title ?? "Edit post")}
        backHref="/admin/posts"
      />

      {generalErrors.length > 0 && (
        <Flash tone="error">
          {generalErrors.map((e, i) => (
            <div key={i}>{e.message}</div>
          ))}
        </Flash>
      )}

      <form action={formAction} className="grid gap-8 md:grid-cols-[1fr_300px]">
        <div className="space-y-6">
          {initial.slug && (
            <input type="hidden" name="original_slug" value={initial.slug} />
          )}

          <Card className="space-y-6 p-6">
            <SectionLabel>The post</SectionLabel>
            <Field label="Title" error={errorFor("title")}>
              <input
                name="title"
                required
                defaultValue={initial.title ?? ""}
                placeholder="e.g. The talks that changed how we choose speakers"
                className={`${inputCls} text-[16px] font-medium`}
              />
            </Field>
            <Field
              label="Slug"
              hint="URL-safe id. Auto-generates from title if blank. Becomes /ideas/<slug>."
            >
              <input
                name="slug"
                defaultValue={initial.slug ?? ""}
                placeholder="the-talks-that-changed-how-we-choose-speakers"
                className={inputCls}
              />
            </Field>
            <Field
              label="Summary"
              hint="Optional. 1–2 sentences. Shown on the /ideas index card + at the top of the post."
            >
              <textarea
                name="summary"
                rows={3}
                defaultValue={initial.summary ?? ""}
                placeholder="A short hook for the index card…"
                className={`${inputCls} leading-[1.55]`}
              />
            </Field>
          </Card>

          <Card className="space-y-6 p-6">
            <div className="flex items-center justify-between">
              <SectionLabel>Body (markdown)</SectionLabel>
              <button
                type="button"
                onClick={() => setShowPreview((p) => !p)}
                className="inline-flex items-center gap-1.5 rounded-full bg-[rgba(20,18,16,0.06)] px-3 py-1.5 text-[12px] font-medium text-[#141210] transition-colors hover:bg-[rgba(20,18,16,0.10)]"
              >
                {showPreview ? (
                  <>
                    <FileText className="h-3.5 w-3.5" strokeWidth={2.25} />
                    Edit
                  </>
                ) : (
                  <>
                    <Eye className="h-3.5 w-3.5" strokeWidth={2.25} />
                    Preview
                  </>
                )}
              </button>
            </div>
            <Field label="Content" error={errorFor("body_markdown")}>
              {showPreview ? (
                <div className="min-h-[400px] rounded-[var(--radius-md)] border border-[rgba(20,18,16,0.10)] bg-[#f9f5ec] px-6 py-5">
                  {body.trim() ? (
                    <Markdown>{body}</Markdown>
                  ) : (
                    <p className="py-12 text-center text-[14px] text-[#6b6459]">
                      Nothing to preview yet.
                    </p>
                  )}
                </div>
              ) : (
                <textarea
                  name="body_markdown"
                  rows={20}
                  required
                  value={body}
                  onChange={(e) => setBody(e.currentTarget.value)}
                  placeholder={MARKDOWN_PLACEHOLDER}
                  className={`${inputCls} block font-mono text-[13.5px] leading-[1.65]`}
                />
              )}
              {showPreview && (
                <input type="hidden" name="body_markdown" value={body} />
              )}
            </Field>
            <details className="rounded-[var(--radius-sm)] bg-[#f9f5ec] p-3 text-[12px] leading-[1.55] text-[#6b6459]">
              <summary className="cursor-pointer text-[#141210]">
                Markdown cheat-sheet
              </summary>
              <pre className="mt-3 overflow-x-auto whitespace-pre-wrap font-mono text-[11.5px]">
                {`## Heading 2          ### Heading 3
**bold**   *italic*   [link text](https://…)
- bullet list
1. numbered list
> blockquote
\`inline code\`
![alt text](image-url)`}
              </pre>
            </details>
          </Card>

          <Card className="space-y-6 p-6">
            <SectionLabel>Meta</SectionLabel>
            <Field label="Hero image URL" hint="Optional. Shown on the index card + as a banner.">
              <input
                name="hero_image_url"
                defaultValue={initial.hero_image_url ?? ""}
                onChange={(e) => setHeroImage(e.currentTarget.value)}
                placeholder="/images/ideas/hero.jpg"
                className={inputCls}
              />
            </Field>
            <div className="grid gap-6 md:grid-cols-2">
              <Field label="Author" hint="Optional byline.">
                <input
                  name="author"
                  defaultValue={initial.author ?? ""}
                  placeholder="e.g. Jake Hoppe"
                  className={inputCls}
                />
              </Field>
              <Field
                label="Publish date"
                hint="Optional. Used as the post date when published."
              >
                <input
                  type="datetime-local"
                  name="published_at"
                  defaultValue={
                    initial.published_at
                      ? toLocalInput(initial.published_at)
                      : ""
                  }
                  className={inputCls}
                />
              </Field>
            </div>
          </Card>
        </div>

        {/* Side preview */}
        <aside className="space-y-4 md:sticky md:top-8 md:self-start">
          <SectionLabel>Hero preview</SectionLabel>
          <div className="relative aspect-[16/9] overflow-hidden rounded-[var(--radius-md)] border border-[rgba(20,18,16,0.10)] bg-[#1a1714] shadow-[var(--shadow-sm)]">
            {heroImage ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={heroImage}
                alt=""
                className="absolute inset-0 h-full w-full object-cover"
                onError={(e) => {
                  e.currentTarget.style.display = "none";
                }}
              />
            ) : (
              <div className="absolute inset-0 flex items-center justify-center px-4 text-center text-[12.5px] text-white/45">
                No hero image
              </div>
            )}
          </div>
          <div className="rounded-[var(--radius-sm)] bg-[#f9f5ec] p-3 text-[12px] leading-[1.55] text-[#6b6459]">
            <strong className="text-[#141210]">Status:</strong>{" "}
            {isPublished ? (
              <span className="text-[#15803d]">
                Published {initial.published_at && new Date(initial.published_at).toLocaleDateString("en-AU")}
              </span>
            ) : (
              <span className="text-[#b91404]">Draft (not on /ideas)</span>
            )}
          </div>
        </aside>

        {/* Sticky save bar */}
        <div className="fixed inset-x-0 bottom-0 z-20 border-t border-[rgba(20,18,16,0.08)] bg-white/95 backdrop-blur-sm md:left-[260px]">
          <div className="mx-auto flex max-w-[1100px] flex-wrap items-center justify-between gap-3 px-5 py-3.5 md:px-12">
            <Link
              href="/admin/posts"
              className="text-[13px] font-medium text-[#6b6459] hover:text-[#141210]"
            >
              Cancel
            </Link>
            <div className="flex items-center gap-2">
              <button
                type="submit"
                name="action"
                value="save-draft"
                disabled={pending}
                className="inline-flex items-center gap-2 rounded-full bg-[rgba(20,18,16,0.06)] px-5 py-2.5 text-[13px] font-medium text-[#141210] transition-colors hover:bg-[rgba(20,18,16,0.10)] disabled:cursor-not-allowed disabled:opacity-70"
              >
                Save as draft
              </button>
              <button
                type="submit"
                name="action"
                value={isPublished ? "save" : "publish-now"}
                disabled={pending}
                className="inline-flex items-center gap-2 rounded-full bg-[#e02214] px-6 py-2.5 text-[13.5px] font-medium text-white transition-all hover:-translate-y-0.5 hover:bg-[#b91404] disabled:cursor-not-allowed disabled:opacity-70 disabled:hover:translate-y-0"
              >
                {pending && (
                  <Loader2 className="h-4 w-4 animate-spin" strokeWidth={2.5} />
                )}
                {pending
                  ? "Saving…"
                  : isPublished
                    ? "Save changes"
                    : "Publish now"}
              </button>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}

function toLocalInput(iso: string): string {
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

const MARKDOWN_PLACEHOLDER = `Start writing in markdown…

## A heading

A paragraph. **Bold** and *italic* work as you'd expect. Links go [in square brackets](https://example.com).

- A bulleted thought
- Another one

> A pull-quote that earns its place.

![Optional inline image](https://…)`;
