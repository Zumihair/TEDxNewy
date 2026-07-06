"use client";

import { useState } from "react";
import {
  ChevronDown,
  ChevronUp,
  Copy,
  GripVertical,
  Plus,
  Trash2,
  X,
} from "lucide-react";
import {
  BLOCK_TYPES,
  blockSummary,
  createBlock,
  type BlockType,
  type NewsletterBlock,
  type NewsletterColumn,
} from "@/lib/newsletter-blocks";
import RichTextEditor from "../emails/RichTextEditor";
import ImageUploadField from "../ImageUploadField";
import { Field, inputCls } from "../ui";

/**
 * Controlled block editor shared by the newsletter builder and the subscriber
 * flow steps. Owns nothing but presentation: the parent holds the block array
 * and passes value + onChange.
 */
export default function BlockCanvas({
  blocks,
  onChange,
}: {
  blocks: NewsletterBlock[];
  onChange: (blocks: NewsletterBlock[]) => void;
}) {
  const [openId, setOpenId] = useState<string | null>(null);
  const [palette, setPalette] = useState(false);

  const newId = () =>
    typeof crypto !== "undefined" && crypto.randomUUID
      ? crypto.randomUUID()
      : `b_${Math.floor(Math.random() * 1e9).toString(36)}`;

  const patch = (id: string, next: Partial<NewsletterBlock>) =>
    onChange(
      blocks.map((b) => (b.id === id ? ({ ...b, ...next } as NewsletterBlock) : b)),
    );

  const remove = (id: string) => onChange(blocks.filter((b) => b.id !== id));

  const move = (id: string, dir: -1 | 1) => {
    const i = blocks.findIndex((b) => b.id === id);
    const j = i + dir;
    if (i < 0 || j < 0 || j >= blocks.length) return;
    const next = [...blocks];
    [next[i], next[j]] = [next[j], next[i]];
    onChange(next);
  };

  const duplicate = (id: string) => {
    const i = blocks.findIndex((b) => b.id === id);
    if (i < 0) return;
    const copy = { ...blocks[i], id: newId() } as NewsletterBlock;
    const next = [...blocks];
    next.splice(i + 1, 0, copy);
    onChange(next);
  };

  const add = (type: BlockType) => {
    const block = createBlock(type);
    onChange([...blocks, block]);
    setOpenId(block.id);
    setPalette(false);
  };

  return (
    <div className="space-y-3">
      {blocks.length === 0 && (
        <p className="rounded-[var(--radius-md)] border border-dashed border-[rgba(20,18,16,0.18)] px-4 py-8 text-center text-[13.5px] text-[#6b6459]">
          No blocks yet. Add your first block below.
        </p>
      )}

      {blocks.map((block, i) => {
        const open = openId === block.id;
        return (
          <div
            key={block.id}
            className="rounded-[var(--radius-md)] border border-[rgba(20,18,16,0.12)] bg-white"
          >
            <div className="flex items-center gap-2 px-3 py-2.5">
              <GripVertical
                className="h-4 w-4 shrink-0 text-[#a59f93]"
                strokeWidth={2}
              />
              <button
                type="button"
                onClick={() => setOpenId(open ? null : block.id)}
                className="flex min-w-0 flex-1 items-center gap-2 text-left"
              >
                <span
                  className="shrink-0 font-mono text-[9.5px] font-semibold uppercase text-[#e02214]"
                  style={{ letterSpacing: "0.18em" }}
                >
                  {block.type}
                </span>
                <span className="truncate text-[13px] text-[#6b6459]">
                  {blockSummary(block)}
                </span>
              </button>
              <div className="flex shrink-0 items-center gap-0.5">
                <IconBtn
                  label="Move up"
                  disabled={i === 0}
                  onClick={() => move(block.id, -1)}
                >
                  <ChevronUp className="h-4 w-4" strokeWidth={2.25} />
                </IconBtn>
                <IconBtn
                  label="Move down"
                  disabled={i === blocks.length - 1}
                  onClick={() => move(block.id, 1)}
                >
                  <ChevronDown className="h-4 w-4" strokeWidth={2.25} />
                </IconBtn>
                <IconBtn label="Duplicate" onClick={() => duplicate(block.id)}>
                  <Copy className="h-3.5 w-3.5" strokeWidth={2.25} />
                </IconBtn>
                <IconBtn label="Delete" onClick={() => remove(block.id)}>
                  <Trash2 className="h-3.5 w-3.5" strokeWidth={2.25} />
                </IconBtn>
              </div>
            </div>

            {open && (
              <div className="space-y-4 border-t border-[rgba(20,18,16,0.08)] px-4 py-4">
                <BlockEditor block={block} patch={patch} />
              </div>
            )}
          </div>
        );
      })}

      {/* Add block */}
      {palette ? (
        <div className="rounded-[var(--radius-md)] border border-[rgba(20,18,16,0.12)] bg-white p-3">
          <div className="mb-2 flex items-center justify-between">
            <span
              className="font-mono text-[9.5px] font-semibold uppercase text-[#6b6459]"
              style={{ letterSpacing: "0.22em" }}
            >
              Add a block
            </span>
            <IconBtn label="Close" onClick={() => setPalette(false)}>
              <X className="h-4 w-4" strokeWidth={2.25} />
            </IconBtn>
          </div>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
            {BLOCK_TYPES.map((t) => (
              <button
                key={t.type}
                type="button"
                onClick={() => add(t.type)}
                className="rounded-[var(--radius-sm)] border border-[rgba(20,18,16,0.12)] px-3 py-2.5 text-left transition-colors hover:border-[rgba(20,18,16,0.25)] hover:bg-[rgba(20,18,16,0.03)]"
              >
                <div className="text-[13px] font-medium text-[#141210]">
                  {t.label}
                </div>
                <div className="text-[11.5px] text-[#6b6459]">{t.hint}</div>
              </button>
            ))}
          </div>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setPalette(true)}
          className="inline-flex items-center gap-2 rounded-full bg-[rgba(20,18,16,0.06)] px-4 py-2 text-[13px] font-medium text-[#141210] transition-colors hover:bg-[rgba(20,18,16,0.10)]"
        >
          <Plus className="h-4 w-4" strokeWidth={2.5} />
          Add block
        </button>
      )}
    </div>
  );
}

function BlockEditor({
  block,
  patch,
}: {
  block: NewsletterBlock;
  patch: (id: string, next: Partial<NewsletterBlock>) => void;
}) {
  switch (block.type) {
    case "header":
      return (
        <>
          <Field label="Heading text">
            <input
              className={inputCls}
              value={block.text}
              onChange={(e) => patch(block.id, { text: e.target.value })}
            />
          </Field>
          <Field label="Size">
            <select
              className={inputCls}
              value={block.size}
              onChange={(e) =>
                patch(block.id, { size: e.target.value as "lg" | "md" })
              }
            >
              <option value="lg">Large</option>
              <option value="md">Medium</option>
            </select>
          </Field>
        </>
      );

    case "text":
      return (
        <Field label="Text" hint="Select text to format it.">
          <RichTextEditor
            key={block.id}
            name={`text-${block.id}`}
            initialHtml={block.html}
            onChange={(html) => patch(block.id, { html })}
            placeholder="Write something here."
          />
        </Field>
      );

    case "image":
      return (
        <>
          <ImageUploadField
            key={block.id}
            name={`image-${block.id}`}
            label="Image"
            folder="newsletter"
            aspect="16/9"
            defaultValue={block.src}
            onChange={(src) => patch(block.id, { src })}
          />
          <Field label="Alt text" hint="Describe the image for screen readers.">
            <input
              className={inputCls}
              value={block.alt}
              onChange={(e) => patch(block.id, { alt: e.target.value })}
            />
          </Field>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Width">
              <select
                className={inputCls}
                value={block.widthPct}
                onChange={(e) =>
                  patch(block.id, {
                    widthPct: Number(e.target.value) as 40 | 60 | 80 | 100,
                  })
                }
              >
                <option value={40}>40%</option>
                <option value={60}>60%</option>
                <option value={80}>80%</option>
                <option value={100}>100%</option>
              </select>
            </Field>
            <Field label="Link (optional)" hint="Make the image clickable.">
              <input
                className={inputCls}
                value={block.href ?? ""}
                placeholder="https://"
                onChange={(e) => patch(block.id, { href: e.target.value })}
              />
            </Field>
          </div>
        </>
      );

    case "twoColumn":
      return (
        <div className="grid gap-5 md:grid-cols-2">
          <ColumnEditor
            title="Left column"
            id={`${block.id}-l`}
            col={block.left}
            onChange={(left) => patch(block.id, { left })}
          />
          <ColumnEditor
            title="Right column"
            id={`${block.id}-r`}
            col={block.right}
            onChange={(right) => patch(block.id, { right })}
          />
        </div>
      );

    case "button":
      return (
        <>
          <Field label="Button label">
            <input
              className={inputCls}
              value={block.label}
              onChange={(e) => patch(block.id, { label: e.target.value })}
            />
          </Field>
          <Field label="Link">
            <input
              className={inputCls}
              value={block.href}
              placeholder="https://"
              onChange={(e) => patch(block.id, { href: e.target.value })}
            />
          </Field>
          <Field label="Alignment">
            <select
              className={inputCls}
              value={block.align}
              onChange={(e) =>
                patch(block.id, { align: e.target.value as "left" | "center" })
              }
            >
              <option value="center">Center</option>
              <option value="left">Left</option>
            </select>
          </Field>
        </>
      );

    case "video":
      return (
        <>
          <p className="rounded-[var(--radius-sm)] bg-[rgba(20,18,16,0.04)] px-3 py-2 text-[12px] leading-[1.5] text-[#6b6459]">
            Email can&rsquo;t play video. This renders the thumbnail with a play
            button that links out to the video.
          </p>
          <Field label="Video link" hint="Where the thumbnail links to.">
            <input
              className={inputCls}
              value={block.href}
              placeholder="https://youtube.com/…"
              onChange={(e) => patch(block.id, { href: e.target.value })}
            />
          </Field>
          <ImageUploadField
            key={block.id}
            name={`video-thumb-${block.id}`}
            label="Thumbnail"
            folder="newsletter"
            aspect="16/9"
            defaultValue={block.thumbnailSrc}
            onChange={(thumbnailSrc) => patch(block.id, { thumbnailSrc })}
          />
          <Field label="Caption (optional)">
            <input
              className={inputCls}
              value={block.caption ?? ""}
              onChange={(e) => patch(block.id, { caption: e.target.value })}
            />
          </Field>
        </>
      );

    case "countdown": {
      const isUnits = block.style === "units";
      return (
        <>
          <p className="rounded-[var(--radius-sm)] bg-[rgba(20,18,16,0.04)] px-3 py-2 text-[12px] leading-[1.5] text-[#6b6459]">
            {isUnits
              ? "Email can't tick live, so this shows the days, hours, minutes and seconds remaining at the exact moment the email is sent."
              : "Rendered as static text at send time, for example “12 days to go”."}
          </p>
          <Field label="Label">
            <input
              className={inputCls}
              value={block.label}
              onChange={(e) => patch(block.id, { label: e.target.value })}
            />
          </Field>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field
              label="Target date and time"
              hint="Australia/Sydney. The time matters for the hours/minutes/seconds style."
            >
              <input
                type="datetime-local"
                className={inputCls}
                value={toDateTimeInput(block.targetDate)}
                onChange={(e) =>
                  patch(block.id, { targetDate: localToIso(e.target.value) })
                }
              />
            </Field>
            <Field label="Style">
              <select
                className={inputCls}
                value={block.style}
                onChange={(e) =>
                  patch(block.id, {
                    style: e.target.value as "days" | "date" | "units",
                  })
                }
              >
                <option value="units">Days, hours, minutes, seconds</option>
                <option value="days">Days to go</option>
                <option value="date">Show the date</option>
              </select>
            </Field>
          </div>
        </>
      );
    }
  }
}

const pad2 = (n: number) => String(n).padStart(2, "0");

/** A stored target (date or ISO) as the value a datetime-local input expects. */
function toDateTimeInput(v: string): string {
  if (!v) return "";
  if (/^\d{4}-\d{2}-\d{2}$/.test(v)) return `${v}T00:00`;
  const d = new Date(v);
  if (Number.isNaN(d.getTime())) return "";
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}T${pad2(d.getHours())}:${pad2(d.getMinutes())}`;
}

/** A datetime-local value (read as the admin's local Sydney time) to UTC ISO. */
function localToIso(v: string): string {
  if (!v) return "";
  const d = new Date(v);
  return Number.isNaN(d.getTime()) ? "" : d.toISOString();
}

function ColumnEditor({
  title,
  id,
  col,
  onChange,
}: {
  title: string;
  id: string;
  col: NewsletterColumn;
  onChange: (col: NewsletterColumn) => void;
}) {
  return (
    <div className="space-y-3 rounded-[var(--radius-sm)] border border-[rgba(20,18,16,0.10)] p-3">
      <Field label={`${title} type`}>
        <select
          className={inputCls}
          value={col.kind}
          onChange={(e) =>
            onChange(
              e.target.value === "image"
                ? { kind: "image", src: "", alt: "" }
                : { kind: "text", html: "<p></p>" },
            )
          }
        >
          <option value="text">Text</option>
          <option value="image">Image</option>
        </select>
      </Field>
      {col.kind === "text" ? (
        <RichTextEditor
          key={id}
          name={`col-${id}`}
          initialHtml={col.html}
          onChange={(html) => onChange({ kind: "text", html })}
          placeholder="Column text."
        />
      ) : (
        <>
          <ImageUploadField
            key={id}
            name={`col-img-${id}`}
            label="Image"
            folder="newsletter"
            aspect="1/1"
            defaultValue={col.src}
            onChange={(src) => onChange({ kind: "image", src, alt: col.alt })}
          />
          <Field label="Alt text">
            <input
              className={inputCls}
              value={col.alt}
              onChange={(e) =>
                onChange({ kind: "image", src: col.src, alt: e.target.value })
              }
            />
          </Field>
        </>
      )}
    </div>
  );
}

function IconBtn({
  label,
  onClick,
  disabled,
  children,
}: {
  label: string;
  onClick: () => void;
  disabled?: boolean;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      title={label}
      aria-label={label}
      disabled={disabled}
      onClick={onClick}
      className="inline-flex h-7 w-7 items-center justify-center rounded-[8px] text-[#6b6459] transition-colors hover:bg-[rgba(20,18,16,0.08)] hover:text-[#141210] disabled:cursor-not-allowed disabled:opacity-30"
    >
      {children}
    </button>
  );
}
