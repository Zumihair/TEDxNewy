"use client";

import { useState } from "react";
import { Reorder, useDragControls } from "motion/react";
import {
  AlignCenter,
  AlignLeft,
  AlignRight,
  ArrowLeft,
  ArrowRight,
  ChevronDown,
  ChevronUp,
  Copy,
  GripVertical,
  Plus,
  Trash2,
  X,
} from "lucide-react";
import {
  BLOCK_ALIGNMENTS,
  BLOCK_BACKGROUNDS,
  BLOCK_TYPES,
  BUTTON_THEMES,
  COLUMN_RATIOS,
  DIVIDER_COLOURS,
  DIVIDER_STYLES,
  MOBILE_ORDERS,
  blockSummary,
  createBlock,
  createColumnChild,
  stackOrder,
  type BlockAlign,
  type BlockBg,
  type BlockType,
  type ButtonTheme,
  type ButtonVariant,
  type ColumnChild,
  type ColumnChildKind,
  type ColumnValign,
  type DividerColour,
  type DividerStyle,
  type ImageWidth,
  type MobileOrder,
  type NewsletterBlock,
} from "@/lib/newsletter-blocks";
import RichTextEditor from "../emails/RichTextEditor";
import ImageUploadField from "../ImageUploadField";
import { Field, inputCls } from "../ui";

/**
 * Controlled block editor shared by the newsletter builder and the subscriber
 * flow steps. Owns nothing but presentation: the parent holds the block array
 * and passes value + onChange. Reordering is drag-and-drop (a grip handle) with
 * up/down arrows kept as a keyboard/a11y fallback.
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
    // Deep clone so nested block data (e.g. column contents) isn't shared with
    // the original, then re-id the clone and its children.
    const copy = reId(structuredClone(blocks[i]));
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

      <Reorder.Group
        as="div"
        axis="y"
        values={blocks}
        onReorder={onChange}
        className="space-y-3"
      >
        {blocks.map((block, i) => (
          <BlockCard
            key={block.id}
            block={block}
            index={i}
            count={blocks.length}
            open={openId === block.id}
            onToggle={() =>
              setOpenId(openId === block.id ? null : block.id)
            }
            onMove={(dir) => move(block.id, dir)}
            onDuplicate={() => duplicate(block.id)}
            onRemove={() => remove(block.id)}
            patch={patch}
          />
        ))}
      </Reorder.Group>

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

function BlockCard({
  block,
  index,
  count,
  open,
  onToggle,
  onMove,
  onDuplicate,
  onRemove,
  patch,
}: {
  block: NewsletterBlock;
  index: number;
  count: number;
  open: boolean;
  onToggle: () => void;
  onMove: (dir: -1 | 1) => void;
  onDuplicate: () => void;
  onRemove: () => void;
  patch: (id: string, next: Partial<NewsletterBlock>) => void;
}) {
  const controls = useDragControls();
  return (
    <Reorder.Item
      as="div"
      value={block}
      dragListener={false}
      dragControls={controls}
      className="rounded-[var(--radius-md)] border border-[rgba(20,18,16,0.12)] bg-white"
    >
      <div className="flex items-center gap-2 px-3 py-2.5">
        <button
          type="button"
          aria-label="Drag to reorder"
          title="Drag to reorder"
          onPointerDown={(e) => controls.start(e)}
          className="shrink-0 cursor-grab touch-none text-[#b4ada1] transition-colors hover:text-[#6b6459] active:cursor-grabbing"
        >
          <GripVertical className="h-4 w-4" strokeWidth={2} />
        </button>
        <button
          type="button"
          onClick={onToggle}
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
          <IconBtn label="Move up" disabled={index === 0} onClick={() => onMove(-1)}>
            <ChevronUp className="h-4 w-4" strokeWidth={2.25} />
          </IconBtn>
          <IconBtn
            label="Move down"
            disabled={index === count - 1}
            onClick={() => onMove(1)}
          >
            <ChevronDown className="h-4 w-4" strokeWidth={2.25} />
          </IconBtn>
          <IconBtn label="Duplicate" onClick={onDuplicate}>
            <Copy className="h-3.5 w-3.5" strokeWidth={2.25} />
          </IconBtn>
          <IconBtn label="Delete" onClick={onRemove}>
            <Trash2 className="h-3.5 w-3.5" strokeWidth={2.25} />
          </IconBtn>
        </div>
      </div>

      {open && (
        <div className="space-y-4 border-t border-[rgba(20,18,16,0.08)] px-4 py-4">
          <BlockEditor block={block} patch={patch} />
        </div>
      )}
    </Reorder.Item>
  );
}

const BG_SUPPORTED: BlockType[] = ["header", "text", "image", "columns", "button"];

function BlockEditor({
  block,
  patch,
}: {
  block: NewsletterBlock;
  patch: (id: string, next: Partial<NewsletterBlock>) => void;
}) {
  const bgPicker = BG_SUPPORTED.includes(block.type) ? (
    <BackgroundPicker
      value={"bg" in block ? block.bg : undefined}
      onChange={(bg) => patch(block.id, { bg } as Partial<NewsletterBlock>)}
    />
  ) : null;

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
          <div className="grid gap-4 sm:grid-cols-2">
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
            <AlignPicker
              value={block.align}
              onChange={(align) => patch(block.id, { align })}
            />
          </div>
          {bgPicker}
        </>
      );

    case "text":
      return (
        <>
          <Field
            label="Text"
            hint="Select text to format it. Alignment is per paragraph: put the cursor in a line and use the toolbar."
          >
            <RichTextEditor
              key={block.id}
              name={`text-${block.id}`}
              initialHtml={block.html}
              onChange={(html) => patch(block.id, { html })}
              placeholder="Write something here."
            />
          </Field>
          {bgPicker}
        </>
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
                value={String(block.widthPct)}
                onChange={(e) =>
                  patch(block.id, { widthPct: parseWidth(e.target.value) })
                }
              >
                <option value="40">40%</option>
                <option value="60">60%</option>
                <option value="80">80%</option>
                <option value="100">100%</option>
                <option value="full">Full width (edge to edge)</option>
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
          {bgPicker}
        </>
      );

    case "columns":
      return (
        <>
          <ColumnsEditor block={block} patch={patch} />
          {bgPicker}
        </>
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
          <div className="grid gap-4 sm:grid-cols-2">
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
            <Field label="Style">
              <select
                className={inputCls}
                value={block.variant}
                onChange={(e) =>
                  patch(block.id, { variant: e.target.value as ButtonVariant })
                }
              >
                <option value="solid">Solid</option>
                <option value="outline">Outline</option>
              </select>
            </Field>
          </div>
          <ButtonThemePicker
            value={block.theme}
            onChange={(theme) => patch(block.id, { theme })}
          />
          {bgPicker}
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

    case "divider":
      return (
        <>
          <Field label="Style">
            <div className="flex flex-wrap gap-1.5">
              {DIVIDER_STYLES.map((s) => {
                const active = block.style === s.id;
                return (
                  <button
                    key={s.id}
                    type="button"
                    title={s.hint}
                    aria-pressed={active}
                    onClick={() => patch(block.id, { style: s.id })}
                    className={
                      "flex items-center gap-2 rounded-full border px-2.5 py-1 text-[11.5px] transition-colors " +
                      (active
                        ? "border-[#141210] text-[#141210]"
                        : "border-[rgba(20,18,16,0.15)] text-[#6b6459] hover:border-[rgba(20,18,16,0.3)]")
                    }
                  >
                    <DividerSwatch style={s.id} colour={block.colour} />
                    {s.label}
                  </button>
                );
              })}
            </div>
          </Field>
          <Field label="Colour">
            <div className="flex flex-wrap gap-1.5">
              {DIVIDER_COLOURS.map((c) => {
                const active = block.colour === c.id;
                return (
                  <button
                    key={c.id}
                    type="button"
                    title={c.label}
                    aria-pressed={active}
                    onClick={() => patch(block.id, { colour: c.id })}
                    className={
                      "flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11.5px] transition-colors " +
                      (active
                        ? "border-[#141210] text-[#141210]"
                        : "border-[rgba(20,18,16,0.15)] text-[#6b6459] hover:border-[rgba(20,18,16,0.3)]")
                    }
                  >
                    <span
                      className="inline-block h-3.5 w-3.5 rounded-full border border-[rgba(20,18,16,0.15)]"
                      style={{ background: c.hex }}
                    />
                    {c.label}
                  </button>
                );
              })}
            </div>
          </Field>
        </>
      );
  }
}

/** Miniature of a divider style, so the option reads at a glance. */
function DividerSwatch({
  style,
  colour,
}: {
  style: DividerStyle;
  colour: DividerColour;
}) {
  const hex = DIVIDER_COLOURS.find((c) => c.id === colour)?.hex ?? "#efe9dd";
  if (style === "x") {
    return (
      <span
        aria-hidden
        className="inline-flex w-7 items-center gap-0.5"
        style={{ color: hex }}
      >
        <span className="h-px flex-1" style={{ background: hex }} />
        <span className="text-[9px] leading-none">&#10005;</span>
        <span className="h-px flex-1" style={{ background: hex }} />
      </span>
    );
  }
  return (
    <span aria-hidden className="inline-flex w-7 justify-center">
      <span
        className="block"
        style={{
          background: hex,
          height: style === "accent" ? "3px" : "1px",
          width: style === "thin" ? "100%" : style === "short" ? "70%" : "45%",
          borderRadius: style === "accent" ? "2px" : 0,
          marginRight: style === "accent" ? "auto" : undefined,
        }}
      />
    </span>
  );
}

function parseWidth(v: string): ImageWidth {
  if (v === "full") return "full";
  const n = Number(v);
  return (n === 40 || n === 60 || n === 80 ? n : 100) as ImageWidth;
}

// ---- background + button pickers ----

const ALIGN_ICON: Record<BlockAlign, React.ReactNode> = {
  left: <AlignLeft className="h-3.5 w-3.5" strokeWidth={2.25} />,
  center: <AlignCenter className="h-3.5 w-3.5" strokeWidth={2.25} />,
  right: <AlignRight className="h-3.5 w-3.5" strokeWidth={2.25} />,
};

/** Left / centre / right for a header, which has no rich text toolbar of its
 *  own. A text block aligns per paragraph from inside the editor instead.
 *  Undefined is left, which is what everything written before this control
 *  existed renders as, so picking Left clears the value rather than storing
 *  it. */
function AlignPicker({
  value,
  onChange,
}: {
  value: BlockAlign | undefined;
  onChange: (align: BlockAlign | undefined) => void;
}) {
  const current = value ?? "left";
  return (
    <Field label="Alignment">
      <div className="flex flex-wrap gap-1.5">
        {BLOCK_ALIGNMENTS.map((a) => {
          const active = current === a.id;
          return (
            <button
              key={a.id}
              type="button"
              title={a.label}
              aria-pressed={active}
              onClick={() => onChange(a.id === "left" ? undefined : a.id)}
              className={
                "flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11.5px] transition-colors " +
                (active
                  ? "border-[#141210] text-[#141210]"
                  : "border-[rgba(20,18,16,0.15)] text-[#6b6459] hover:border-[rgba(20,18,16,0.3)]")
              }
            >
              {ALIGN_ICON[a.id]}
              {a.label}
            </button>
          );
        })}
      </div>
    </Field>
  );
}

/** A swatch split down the middle: the light-mode colour on the left, what the
 *  same choice becomes on a dark device on the right. The pairing is the point
 *  of these two pickers, so it is worth showing rather than describing. */
function DualSwatch({ light, dark }: { light: string; dark: string }) {
  return (
    <span
      aria-hidden
      className="inline-flex h-3.5 w-3.5 overflow-hidden rounded-full border border-[rgba(20,18,16,0.15)]"
    >
      <span className="h-full w-1/2" style={{ background: light }} />
      <span className="h-full w-1/2" style={{ background: dark }} />
    </span>
  );
}

function BackgroundPicker({
  value,
  onChange,
}: {
  value: BlockBg | undefined;
  onChange: (bg: BlockBg | undefined) => void;
}) {
  const current = value ?? "none";
  return (
    <Field
      label="Background"
      hint="A soft tint to make this block stand out. Each one has a dark-mode partner (the right half of the swatch) that it switches to on a device in dark mode."
    >
      <div className="flex flex-wrap gap-1.5">
        {BLOCK_BACKGROUNDS.map((b) => {
          const active = current === b.id;
          return (
            <button
              key={b.id}
              type="button"
              title={b.label}
              aria-label={b.label}
              aria-pressed={active}
              onClick={() => onChange(b.id === "none" ? undefined : b.id)}
              className={
                "flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11.5px] transition-colors " +
                (active
                  ? "border-[#141210] text-[#141210]"
                  : "border-[rgba(20,18,16,0.15)] text-[#6b6459] hover:border-[rgba(20,18,16,0.3)]")
              }
            >
              {b.id === "none" ? (
                <span
                  aria-hidden
                  className="inline-block h-3.5 w-3.5 rounded-full border border-[rgba(20,18,16,0.15)]"
                  style={{
                    background:
                      "repeating-linear-gradient(45deg,#fff,#fff 3px,#e6e0d5 3px,#e6e0d5 6px)",
                  }}
                />
              ) : (
                <DualSwatch light={b.swatch} dark={b.darkSwatch} />
              )}
              {b.label}
            </button>
          );
        })}
      </div>
    </Field>
  );
}

function ButtonThemePicker({
  value,
  onChange,
}: {
  value: ButtonTheme;
  onChange: (theme: ButtonTheme) => void;
}) {
  return (
    <Field
      label="Colour"
      hint="Dark colours flip to a light fill on a device in dark mode (the right half of the swatch), so the button stands out either way."
    >
      <div className="flex flex-wrap gap-1.5">
        {BUTTON_THEMES.map((t) => {
          const active = value === t.id;
          return (
            <button
              key={t.id}
              type="button"
              title={t.label}
              aria-label={t.label}
              aria-pressed={active}
              onClick={() => onChange(t.id)}
              className={
                "flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11.5px] transition-colors " +
                (active
                  ? "border-[#141210] text-[#141210]"
                  : "border-[rgba(20,18,16,0.15)] text-[#6b6459] hover:border-[rgba(20,18,16,0.3)]")
              }
            >
              <DualSwatch light={t.swatch} dark={t.darkSwatch} />
              {t.label}
            </button>
          );
        })}
      </div>
    </Field>
  );
}

// ---- columns editor ----

function ColumnsEditor({
  block,
  patch,
}: {
  block: Extract<NewsletterBlock, { type: "columns" }>;
  patch: (id: string, next: Partial<NewsletterBlock>) => void;
}) {
  const setCols = (cols: ColumnChild[][]) => patch(block.id, { cols });

  const setCount = (count: 2 | 3) => {
    let cols = [...block.cols];
    if (count === 3 && cols.length === 2) {
      cols = [...cols, [createColumnChild("text")]];
    } else if (count === 2 && cols.length === 3) {
      // Fold the third column's children into the second so nothing is lost.
      cols = [cols[0], [...cols[1], ...cols[2]]];
    }
    // Reset the ratio to the first valid preset for the new count.
    patch(block.id, { cols, ratio: COLUMN_RATIOS[count][0].id });
  };

  const setChild = (colIdx: number, child: ColumnChild) =>
    setCols(
      block.cols.map((stack, ci) =>
        ci === colIdx ? stack.map((c) => (c.id === child.id ? child : c)) : stack,
      ),
    );

  const addChild = (colIdx: number, kind: ColumnChildKind) =>
    setCols(
      block.cols.map((stack, ci) =>
        ci === colIdx ? [...stack, createColumnChild(kind)] : stack,
      ),
    );

  const removeChild = (colIdx: number, childId: string) =>
    setCols(
      block.cols.map((stack, ci) =>
        ci === colIdx ? stack.filter((c) => c.id !== childId) : stack,
      ),
    );

  const moveChild = (colIdx: number, childId: string, dir: -1 | 1) => {
    const stack = block.cols[colIdx];
    const i = stack.findIndex((c) => c.id === childId);
    const j = i + dir;
    if (i < 0 || j < 0 || j >= stack.length) return;
    const next = [...stack];
    [next[i], next[j]] = [next[j], next[i]];
    setCols(block.cols.map((s, ci) => (ci === colIdx ? next : s)));
  };

  // Move a child to the previous/next column (keeps the container feel without
  // full cross-column dragging).
  const shiftChild = (colIdx: number, childId: string, dir: -1 | 1) => {
    const target = colIdx + dir;
    if (target < 0 || target >= block.cols.length) return;
    const child = block.cols[colIdx].find((c) => c.id === childId);
    if (!child) return;
    setCols(
      block.cols.map((stack, ci) => {
        if (ci === colIdx) return stack.filter((c) => c.id !== childId);
        if (ci === target) return [...stack, child];
        return stack;
      }),
    );
  };

  const count = (block.cols.length === 3 ? 3 : 2) as 2 | 3;

  return (
    <div className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Field label="Columns">
          <select
            className={inputCls}
            value={count}
            onChange={(e) => setCount(Number(e.target.value) as 2 | 3)}
          >
            <option value={2}>2 columns</option>
            <option value={3}>3 columns</option>
          </select>
        </Field>
        <Field label="Widths">
          <select
            className={inputCls}
            value={block.ratio}
            onChange={(e) => patch(block.id, { ratio: e.target.value })}
          >
            {COLUMN_RATIOS[count].map((r) => (
              <option key={r.id} value={r.id}>
                {r.label}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Vertical align">
          <select
            className={inputCls}
            value={block.valign}
            onChange={(e) =>
              patch(block.id, { valign: e.target.value as ColumnValign })
            }
          >
            <option value="top">Top</option>
            <option value="middle">Middle</option>
            <option value="bottom">Bottom</option>
          </select>
        </Field>
        <Field label="On mobile" hint={stackHint(block)}>
          <select
            className={inputCls}
            value={block.mobileOrder ?? "asShown"}
            onChange={(e) =>
              patch(block.id, {
                mobileOrder:
                  e.target.value === "asShown"
                    ? undefined
                    : (e.target.value as MobileOrder),
              })
            }
          >
            {MOBILE_ORDERS.map((o) => (
              <option key={o.id} value={o.id}>
                {o.label}
              </option>
            ))}
          </select>
        </Field>
      </div>

      <div className="grid gap-3 md:grid-cols-2">
        {block.cols.map((stack, colIdx) => (
          <ColumnStackEditor
            key={colIdx}
            title={`Column ${colIdx + 1}`}
            colIdx={colIdx}
            colCount={block.cols.length}
            stack={stack}
            onAdd={(kind) => addChild(colIdx, kind)}
            onChangeChild={(child) => setChild(colIdx, child)}
            onRemoveChild={(id) => removeChild(colIdx, id)}
            onMoveChild={(id, dir) => moveChild(colIdx, id, dir)}
            onShiftChild={(id, dir) => shiftChild(colIdx, id, dir)}
          />
        ))}
      </div>
    </div>
  );
}

/**
 * Spells out the order the columns will stack in on a phone. Worth printing
 * rather than trusting the label: only a reversal is available, so "Image
 * first" cannot deliver on a three-column block whose image sits in the
 * middle, and this is where that shows up instead of being a silent no-op.
 */
function stackHint(block: Extract<NewsletterBlock, { type: "columns" }>): string {
  const order = stackOrder(block);
  const names = order.map((i) => {
    const kinds = new Set(block.cols[i].map((c) => c.kind));
    const what = kinds.has("image") ? "image" : kinds.has("button") ? "button" : "text";
    return `column ${i + 1} (${what})`;
  });
  return `Stacks ${names.join(", then ")}. Desktop is unchanged.`;
}

function ColumnStackEditor({
  title,
  colIdx,
  colCount,
  stack,
  onAdd,
  onChangeChild,
  onRemoveChild,
  onMoveChild,
  onShiftChild,
}: {
  title: string;
  colIdx: number;
  colCount: number;
  stack: ColumnChild[];
  onAdd: (kind: ColumnChildKind) => void;
  onChangeChild: (child: ColumnChild) => void;
  onRemoveChild: (id: string) => void;
  onMoveChild: (id: string, dir: -1 | 1) => void;
  onShiftChild: (id: string, dir: -1 | 1) => void;
}) {
  return (
    <div className="space-y-3 rounded-[var(--radius-sm)] border border-[rgba(20,18,16,0.10)] bg-[rgba(20,18,16,0.015)] p-3">
      <div
        className="font-mono text-[9.5px] font-semibold uppercase text-[#6b6459]"
        style={{ letterSpacing: "0.2em" }}
      >
        {title}
      </div>

      {stack.length === 0 && (
        <p className="rounded-[var(--radius-sm)] border border-dashed border-[rgba(20,18,16,0.18)] px-3 py-4 text-center text-[12px] text-[#6b6459]">
          Empty. Add text, an image or a button.
        </p>
      )}

      {stack.map((child, i) => (
        <div
          key={child.id}
          className="space-y-2 rounded-[var(--radius-sm)] border border-[rgba(20,18,16,0.10)] bg-white p-2.5"
        >
          <div className="flex items-center justify-between">
            <span
              className="font-mono text-[9px] font-semibold uppercase text-[#e02214]"
              style={{ letterSpacing: "0.16em" }}
            >
              {child.kind}
            </span>
            <div className="flex items-center gap-0.5">
              <IconBtn
                label="Move up"
                disabled={i === 0}
                onClick={() => onMoveChild(child.id, -1)}
              >
                <ChevronUp className="h-3.5 w-3.5" strokeWidth={2.25} />
              </IconBtn>
              <IconBtn
                label="Move down"
                disabled={i === stack.length - 1}
                onClick={() => onMoveChild(child.id, 1)}
              >
                <ChevronDown className="h-3.5 w-3.5" strokeWidth={2.25} />
              </IconBtn>
              <IconBtn
                label="Move to previous column"
                disabled={colIdx === 0}
                onClick={() => onShiftChild(child.id, -1)}
              >
                <ArrowLeft className="h-3.5 w-3.5" strokeWidth={2.25} />
              </IconBtn>
              <IconBtn
                label="Move to next column"
                disabled={colIdx === colCount - 1}
                onClick={() => onShiftChild(child.id, 1)}
              >
                <ArrowRight className="h-3.5 w-3.5" strokeWidth={2.25} />
              </IconBtn>
              <IconBtn label="Delete" onClick={() => onRemoveChild(child.id)}>
                <Trash2 className="h-3.5 w-3.5" strokeWidth={2.25} />
              </IconBtn>
            </div>
          </div>
          <ColumnChildEditor child={child} onChange={onChangeChild} />
        </div>
      ))}

      <div className="flex flex-wrap gap-1.5">
        {(["text", "image", "button"] as ColumnChildKind[]).map((kind) => (
          <button
            key={kind}
            type="button"
            onClick={() => onAdd(kind)}
            className="inline-flex items-center gap-1 rounded-full bg-[rgba(20,18,16,0.06)] px-2.5 py-1 text-[11.5px] font-medium capitalize text-[#141210] transition-colors hover:bg-[rgba(20,18,16,0.10)]"
          >
            <Plus className="h-3 w-3" strokeWidth={2.5} />
            {kind}
          </button>
        ))}
      </div>
    </div>
  );
}

function ColumnChildEditor({
  child,
  onChange,
}: {
  child: ColumnChild;
  onChange: (child: ColumnChild) => void;
}) {
  switch (child.kind) {
    case "text":
      return (
        <RichTextEditor
          key={child.id}
          name={`col-${child.id}`}
          initialHtml={child.html}
          onChange={(html) => onChange({ ...child, html })}
          placeholder="Column text."
        />
      );
    case "image":
      return (
        <>
          <ImageUploadField
            key={child.id}
            name={`col-img-${child.id}`}
            label="Image"
            folder="newsletter"
            aspect="1/1"
            defaultValue={child.src}
            onChange={(src) => onChange({ ...child, src })}
          />
          <Field label="Alt text">
            <input
              className={inputCls}
              value={child.alt}
              onChange={(e) => onChange({ ...child, alt: e.target.value })}
            />
          </Field>
        </>
      );
    case "button":
      return (
        <>
          <Field label="Label">
            <input
              className={inputCls}
              value={child.label}
              onChange={(e) => onChange({ ...child, label: e.target.value })}
            />
          </Field>
          <Field label="Link">
            <input
              className={inputCls}
              value={child.href}
              placeholder="https://"
              onChange={(e) => onChange({ ...child, href: e.target.value })}
            />
          </Field>
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Alignment">
              <select
                className={inputCls}
                value={child.align}
                onChange={(e) =>
                  onChange({ ...child, align: e.target.value as "left" | "center" })
                }
              >
                <option value="center">Center</option>
                <option value="left">Left</option>
              </select>
            </Field>
            <Field label="Style">
              <select
                className={inputCls}
                value={child.variant}
                onChange={(e) =>
                  onChange({ ...child, variant: e.target.value as ButtonVariant })
                }
              >
                <option value="solid">Solid</option>
                <option value="outline">Outline</option>
              </select>
            </Field>
          </div>
          <ButtonThemePicker
            value={child.theme}
            onChange={(theme) => onChange({ ...child, theme })}
          />
        </>
      );
  }
}

// ---- helpers ----

const newId = () =>
  typeof crypto !== "undefined" && crypto.randomUUID
    ? crypto.randomUUID()
    : `b_${Math.floor(Math.random() * 1e9).toString(36)}`;

/** Fresh ids for a duplicated block and any nested column children. */
function reId(block: NewsletterBlock): NewsletterBlock {
  if (block.type === "columns") {
    return {
      ...block,
      id: newId(),
      cols: block.cols.map((stack) =>
        stack.map((child) => ({ ...child, id: newId() })),
      ),
    };
  }
  return { ...block, id: newId() };
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
