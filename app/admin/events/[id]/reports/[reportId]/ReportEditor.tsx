"use client";

import { useCallback, useEffect, useMemo, useRef, useState, useTransition } from "react";
import type { ReactNode } from "react";
import {
  ArrowDown,
  ArrowUp,
  Check,
  ExternalLink,
  FileDown,
  ImageIcon,
  Loader2,
  Plus,
  Printer,
  Save,
  Trash2,
  X,
} from "lucide-react";
import {
  ACCENTS,
  TONES,
  emptyStatement,
  pageCount,
  type ReportConfig,
  type ReportKind,
  type ReportPartner,
  type ReportStat,
  type ReportStatement,
  type ReportStatus,
  type ReportTestimonial,
} from "@/lib/report-schema";
import { Card, Field, SectionLabel, inputCls } from "../../../../ui";
import { useConfirm } from "../../../../ConfirmDialog";
import { useUnsavedGuard } from "../../../../useUnsavedGuard";
import { saveReportAction } from "../actions";
import { useToast } from "../../../../Toaster";

type Photo = { url: string; thumbUrl: string };

type Props = {
  eventId: string;
  eventTitle: string;
  report: {
    id: string;
    title: string;
    kind: ReportKind;
    status: ReportStatus;
    config: ReportConfig;
    pdfUrl: string | null;
    pdfGeneratedAt: string | null;
    updatedAt: string;
  };
  photos: Photo[];
  suggestions: {
    stats: ReportStat[];
    testimonials: ReportTestimonial[];
    partners: ReportPartner[];
  };
};

const textareaCls = `${inputCls} min-h-[84px] resize-y leading-[1.5]`;
const smallBtn =
  "inline-flex items-center gap-1.5 rounded-full bg-[rgba(20,18,16,0.06)] px-3 py-1.5 text-[12px] font-medium text-[#141210] transition-colors hover:bg-[rgba(20,18,16,0.10)] disabled:opacity-50";
const chipBtn =
  "inline-flex items-center gap-1 rounded-full border border-dashed border-[rgba(20,18,16,0.2)] px-2.5 py-1 text-[11.5px] text-[#4a453d] transition-colors hover:border-[#e02214]/50 hover:text-[#b91404]";
const iconBtn =
  "inline-flex h-8 w-8 items-center justify-center rounded-full text-[#6b6459] transition-colors hover:bg-[rgba(20,18,16,0.08)] hover:text-[#141210] disabled:opacity-30";

function when(iso: string) {
  return new Date(iso).toLocaleString("en-AU", {
    timeZone: "Australia/Sydney",
    day: "numeric",
    month: "short",
    hour: "numeric",
    minute: "2-digit",
  });
}

export default function ReportEditor({ eventId, eventTitle, report, photos, suggestions }: Props) {
  const [config, setConfig] = useState<ReportConfig>(report.config);
  const [title, setTitle] = useState(report.title);
  const [status, setStatus] = useState<ReportStatus>(report.status);
  const [savedSnapshot, setSavedSnapshot] = useState(() =>
    JSON.stringify({ title: report.title, status: report.status, config: report.config }),
  );
  const [savedAt, setSavedAt] = useState<string | null>(report.updatedAt);
  const [pending, startTransition] = useTransition();
  const toast = useToast();

  // A PDF failure always names the way out, which is what the inline banner
  // used to add underneath it.
  const pdfFailed = (message: string) =>
    toast.error(
      `${message} If this keeps happening, use Open print view and choose Save as PDF in the print dialog.`,
    );

  const [pdfUrl, setPdfUrl] = useState(report.pdfUrl);
  const [pdfAt, setPdfAt] = useState(report.pdfGeneratedAt);
  const [pdfBusy, setPdfBusy] = useState(false);

  const [previewHtml, setPreviewHtml] = useState<string>("");
  const [previewBusy, setPreviewBusy] = useState(false);
  const previewTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const { confirm, dialogs } = useConfirm();

  const current = JSON.stringify({ title, status, config });
  const dirty = current !== savedSnapshot;
  useUnsavedGuard({ dirty, confirm });

  const pages = useMemo(() => pageCount(config), [config]);

  // ---- live preview: debounce, POST the working config, render into srcdoc
  const refreshPreview = useCallback(async (c: ReportConfig) => {
    setPreviewBusy(true);
    try {
      const res = await fetch(`/api/admin/reports/${encodeURIComponent(report.id)}/preview`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ config: c }),
      });
      if (res.ok) setPreviewHtml(await res.text());
    } finally {
      setPreviewBusy(false);
    }
  }, [report.id]);

  useEffect(() => {
    if (previewTimer.current) clearTimeout(previewTimer.current);
    previewTimer.current = setTimeout(() => void refreshPreview(config), 600);
    return () => {
      if (previewTimer.current) clearTimeout(previewTimer.current);
    };
  }, [config, refreshPreview]);

  // ---- save
  function save() {
    startTransition(async () => {
      const result = await saveReportAction({
        eventId,
        reportId: report.id,
        title,
        status,
        config,
      });
      if (result.ok) {
        setSavedSnapshot(JSON.stringify({ title, status, config }));
        setSavedAt(result.savedAt);
        toast.success("Report saved.");
      } else {
        toast.error(result.error);
      }
    });
  }

  // ---- PDF (server-side render, stored on Blob)
  async function generatePdf() {
    if (dirty) {
      const ok = await confirm({
        title: "Save first?",
        body: "The PDF is rendered from the saved version. Save your changes before generating.",
        confirmLabel: "Save and generate",
      });
      if (!ok) return;
      const result = await saveReportAction({ eventId, reportId: report.id, title, status, config });
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      setSavedSnapshot(JSON.stringify({ title, status, config }));
      setSavedAt(result.savedAt);
    }
    setPdfBusy(true);
    try {
      const res = await fetch(`/api/admin/reports/${encodeURIComponent(report.id)}/pdf`, { method: "POST" });
      const json = (await res.json().catch(() => ({}))) as { pdfUrl?: string; pdfGeneratedAt?: string; error?: string };
      if (!res.ok || !json.pdfUrl) {
        pdfFailed(json.error ?? "Could not generate the PDF.");
      } else {
        setPdfUrl(json.pdfUrl);
        setPdfAt(json.pdfGeneratedAt ?? new Date().toISOString());
        toast.success("PDF generated.");
      }
    } catch (err) {
      pdfFailed(err instanceof Error ? err.message : "Could not generate the PDF.");
    } finally {
      setPdfBusy(false);
    }
  }

  // ---- helpers to patch config immutably
  const patch = (fn: (c: ReportConfig) => void) =>
    setConfig((prev) => {
      const next = structuredClone(prev);
      fn(next);
      return next;
    });

  const printHref = `/api/admin/reports/${encodeURIComponent(report.id)}/preview?print=1`;

  return (
    <div className="space-y-6">
      {dialogs}

      {/* Header bar */}
      <Card>
        <div className="flex flex-wrap items-center gap-3 px-5 py-4">
          <div className="min-w-[240px] flex-1">
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className={`${inputCls} font-medium`}
              aria-label="Report title"
            />
          </div>
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value as ReportStatus)}
            className={`${inputCls} w-auto`}
            aria-label="Status"
          >
            <option value="draft">Draft</option>
            <option value="final">Final</option>
          </select>
          <button type="button" onClick={save} disabled={pending || !dirty} className="inline-flex items-center gap-2 rounded-full bg-[#e02214] px-5 py-2.5 text-[13.5px] font-medium text-white transition-all hover:-translate-y-0.5 hover:bg-[#b91404] disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:translate-y-0">
            {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : dirty ? <Save className="h-4 w-4" strokeWidth={2.25} /> : <Check className="h-4 w-4" strokeWidth={2.25} />}
            {pending ? "Saving" : dirty ? "Save" : "Saved"}
          </button>
          <a href={printHref} target="_blank" rel="noopener noreferrer" className={smallBtn}>
            <Printer className="h-3.5 w-3.5" strokeWidth={2.25} />
            Open print view
          </a>
          <button type="button" onClick={generatePdf} disabled={pdfBusy} className={smallBtn}>
            {pdfBusy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <FileDown className="h-3.5 w-3.5" strokeWidth={2.25} />}
            {pdfBusy ? "Rendering PDF" : "Generate PDF"}
          </button>
          {pdfUrl && (
            <a href={pdfUrl} target="_blank" rel="noopener noreferrer" className={smallBtn}>
              <ExternalLink className="h-3.5 w-3.5" strokeWidth={2.25} />
              Open PDF{pdfAt ? ` (${when(pdfAt)})` : ""}
            </a>
          )}
        </div>
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 border-t border-[rgba(20,18,16,0.06)] px-5 py-2.5 text-[12px] text-[#6b6459]">
          <span>{eventTitle}</span>
          <span>{pages} pages</span>
          {savedAt && <span>Saved {when(savedAt)}</span>}
          {dirty && <span className="text-[#b91404]">Unsaved changes</span>}
        </div>
      </Card>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
        {/* ------------------------------------------------------------ editor */}
        <div className="space-y-5">
          <Section title="Look">
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Accent colour" hint="Overview reports use TEDx red. Highlight reports pick a room colour.">
                <div className="flex flex-wrap gap-2">
                  {ACCENTS.map((a) => (
                    <button
                      key={a.value}
                      type="button"
                      onClick={() => patch((c) => { c.accent = a.value; })}
                      className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-[12px] ${config.accent === a.value ? "border-[#141210] bg-white" : "border-[rgba(20,18,16,0.12)] bg-white/60"}`}
                    >
                      <span className="inline-block h-3.5 w-3.5 rounded-full" style={{ background: a.value }} />
                      {a.label}
                    </button>
                  ))}
                </div>
              </Field>
              <Field label="Page footer label" hint="Small line in the corner of every page.">
                <input className={inputCls} value={config.footerLabel} onChange={(e) => patch((c) => { c.footerLabel = e.target.value; })} />
              </Field>
            </div>
          </Section>

          <Section title="Cover">
            <PhotoField label="Cover photo" value={config.cover.photoUrl} photos={photos} onChange={(url) => patch((c) => { c.cover.photoUrl = url; })} />
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Kicker" hint="Date and venue, usually.">
                <input className={inputCls} value={config.cover.kicker} onChange={(e) => patch((c) => { c.cover.kicker = e.target.value; })} />
              </Field>
              <Field label="Corner stamp" hint="Two short lines, one per line.">
                <textarea className={`${textareaCls} min-h-[56px]`} value={config.cover.stamp} onChange={(e) => patch((c) => { c.cover.stamp = e.target.value; })} />
              </Field>
            </div>
            <Field label="Title">
              <textarea className={`${textareaCls} min-h-[64px] text-[18px] font-medium`} value={config.cover.title} onChange={(e) => patch((c) => { c.cover.title = e.target.value; })} />
            </Field>
            <Field label="Lead" hint="One or two sentences. Say what the reader is about to see.">
              <textarea className={textareaCls} value={config.cover.lead} onChange={(e) => patch((c) => { c.cover.lead = e.target.value; })} />
            </Field>
          </Section>

          <Section
            title="The numbers"
            toggle={{ on: config.numbers.enabled, set: (v) => patch((c) => { c.numbers.enabled = v; }) }}
          >
            <Field label="Kicker">
              <input className={inputCls} value={config.numbers.kicker} onChange={(e) => patch((c) => { c.numbers.kicker = e.target.value; })} />
            </Field>
            <StatsEditor
              label="Stats"
              hint="Up to six. Big number, short label."
              stats={config.numbers.stats}
              suggestions={suggestions.stats}
              max={6}
              onChange={(stats) => patch((c) => { c.numbers.stats = stats; })}
            />
            <Field label="Note" hint="A paragraph at the foot of the page. Optional.">
              <textarea className={textareaCls} value={config.numbers.note} onChange={(e) => patch((c) => { c.numbers.note = e.target.value; })} />
            </Field>
          </Section>

          <Section
            title="Photo page"
            toggle={{ on: config.photos.enabled, set: (v) => patch((c) => { c.photos.enabled = v; }) }}
          >
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Kicker">
                <input className={inputCls} value={config.photos.kicker} onChange={(e) => patch((c) => { c.photos.kicker = e.target.value; })} />
              </Field>
              <Field label="Title">
                <input className={inputCls} value={config.photos.title} onChange={(e) => patch((c) => { c.photos.title = e.target.value; })} />
              </Field>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              {[0, 1, 2, 3].map((i) => {
                const item = config.photos.items[i];
                return (
                  <div key={i} className="space-y-2">
                    <PhotoField
                      label={`Photo ${i + 1}`}
                      value={item?.url ?? ""}
                      photos={photos}
                      onChange={(url) =>
                        patch((c) => {
                          while (c.photos.items.length <= i) c.photos.items.push({ url: "", caption: "" });
                          c.photos.items[i].url = url;
                          c.photos.items = c.photos.items.filter((p) => p.url);
                        })
                      }
                    />
                    {item?.url && (
                      <input
                        className={inputCls}
                        placeholder="Caption (optional)"
                        value={item.caption}
                        onChange={(e) => patch((c) => { if (c.photos.items[i]) c.photos.items[i].caption = e.target.value; })}
                      />
                    )}
                  </div>
                );
              })}
            </div>
          </Section>

          <Section title={`Statements (${config.statements.length})`}>
            <p className="text-[12.5px] leading-[1.6] text-[#6b6459]">
              One idea per page. A short headline, a sentence or two, and, if you have one, a real quote from the room. Alternate cream and dark pages so it reads well as a carousel.
            </p>
            {config.statements.map((s, i) => (
              <StatementEditor
                key={s.id}
                s={s}
                index={i}
                total={config.statements.length}
                photos={photos}
                onChange={(next) => patch((c) => { c.statements[i] = next; })}
                onMove={(dir) =>
                  patch((c) => {
                    const j = i + dir;
                    if (j < 0 || j >= c.statements.length) return;
                    [c.statements[i], c.statements[j]] = [c.statements[j], c.statements[i]];
                  })
                }
                onRemove={async () => {
                  const ok = await confirm({ title: "Remove this statement page?", tone: "danger", confirmLabel: "Remove" });
                  if (ok) patch((c) => { c.statements.splice(i, 1); });
                }}
              />
            ))}
            <button type="button" className={smallBtn} onClick={() => patch((c) => { c.statements.push(emptyStatement(c.statements.length)); })}>
              <Plus className="h-3.5 w-3.5" strokeWidth={2.25} />
              Add a statement page
            </button>
          </Section>

          <Section
            title="Feedback"
            toggle={{ on: config.feedback.enabled, set: (v) => patch((c) => { c.feedback.enabled = v; }) }}
          >
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Kicker">
                <input className={inputCls} value={config.feedback.kicker} onChange={(e) => patch((c) => { c.feedback.kicker = e.target.value; })} />
              </Field>
              <Field label="Title">
                <input className={inputCls} value={config.feedback.title} onChange={(e) => patch((c) => { c.feedback.title = e.target.value; })} />
              </Field>
            </div>
            <StatsEditor
              label="Feedback stats"
              hint="Up to four. Ratings and yes/no splits from the responses."
              stats={config.feedback.stats}
              suggestions={suggestions.stats}
              max={4}
              onChange={(stats) => patch((c) => { c.feedback.stats = stats; })}
            />
            <TestimonialsEditor
              items={config.feedback.testimonials}
              suggestions={suggestions.testimonials}
              onChange={(items) => patch((c) => { c.feedback.testimonials = items; })}
            />
          </Section>

          <Section title="Close">
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Kicker">
                <input className={inputCls} value={config.close.kicker} onChange={(e) => patch((c) => { c.close.kicker = e.target.value; })} />
              </Field>
              <Field label="Title">
                <input className={inputCls} value={config.close.title} onChange={(e) => patch((c) => { c.close.title = e.target.value; })} />
              </Field>
            </div>
            <Field label="Body" hint="Optional.">
              <textarea className={textareaCls} value={config.close.body} onChange={(e) => patch((c) => { c.close.body = e.target.value; })} />
            </Field>
            <PartnersEditor
              items={config.close.partners}
              suggestions={suggestions.partners}
              onChange={(items) => patch((c) => { c.close.partners = items; })}
            />
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Next label">
                <input className={inputCls} value={config.close.nextLabel} onChange={(e) => patch((c) => { c.close.nextLabel = e.target.value; })} />
              </Field>
              <Field label="Link label">
                <input className={inputCls} value={config.close.linkLabel} onChange={(e) => patch((c) => { c.close.linkLabel = e.target.value; })} />
              </Field>
            </div>
            <Field label="Next text">
              <textarea className={textareaCls} value={config.close.nextText} onChange={(e) => patch((c) => { c.close.nextText = e.target.value; })} />
            </Field>
            <Field label="Link URL">
              <input className={inputCls} value={config.close.linkUrl} onChange={(e) => patch((c) => { c.close.linkUrl = e.target.value; })} />
            </Field>
            <label className="flex items-center gap-2 text-[13px] text-[#2a2521]">
              <input type="checkbox" checked={config.close.showAcknowledgement} onChange={(e) => patch((c) => { c.close.showAcknowledgement = e.target.checked; })} />
              Show the Acknowledgment of Country and TED licence line
            </label>
          </Section>
        </div>

        {/* ------------------------------------------------------------ preview */}
        <div className="xl:sticky xl:top-6 xl:self-start">
          <Card>
            <div className="flex items-center justify-between px-4 py-2.5">
              <SectionLabel>Preview</SectionLabel>
              <span className="text-[12px] text-[#6b6459]">
                {previewBusy ? "Updating" : `${pages} pages · 4:5, LinkedIn document size`}
              </span>
            </div>
            <div className="border-t border-[rgba(20,18,16,0.06)] bg-[#e9e2d5]">
              <iframe
                title="Report preview"
                srcDoc={previewHtml}
                className="block h-[80vh] w-full"
                sandbox="allow-same-origin"
              />
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------- pieces

function Section({
  title,
  toggle,
  children,
}: {
  title: string;
  toggle?: { on: boolean; set: (v: boolean) => void };
  children: ReactNode;
}) {
  return (
    <Card>
      <div className="flex items-center justify-between px-5 py-3.5">
        <SectionLabel>{title}</SectionLabel>
        {toggle && (
          <label className="flex items-center gap-2 text-[12.5px] text-[#4a453d]">
            <input type="checkbox" checked={toggle.on} onChange={(e) => toggle.set(e.target.checked)} />
            {toggle.on ? "Included" : "Left out"}
          </label>
        )}
      </div>
      <div className={`space-y-4 border-t border-[rgba(20,18,16,0.06)] px-5 py-5 ${toggle && !toggle.on ? "opacity-50" : ""}`}>
        {children}
      </div>
    </Card>
  );
}

function PhotoField({
  label,
  value,
  photos,
  onChange,
}: {
  label: string;
  value: string;
  photos: Photo[];
  onChange: (url: string) => void;
}) {
  const [open, setOpen] = useState(false);
  return (
    <Field label={label}>
      <div className="flex items-start gap-3">
        <div className="h-16 w-24 shrink-0 overflow-hidden rounded-[8px] bg-[#e9e2d5]">
          {value ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={value} alt="" className="h-full w-full object-cover" />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-[#b8b1a5]">
              <ImageIcon className="h-5 w-5" strokeWidth={1.75} />
            </div>
          )}
        </div>
        <div className="min-w-0 flex-1 space-y-2">
          <div className="flex flex-wrap gap-2">
            <button type="button" className={smallBtn} onClick={() => setOpen((v) => !v)} disabled={photos.length === 0}>
              <ImageIcon className="h-3.5 w-3.5" strokeWidth={2.25} />
              {photos.length ? (open ? "Close gallery" : "Pick from gallery") : "No gallery photos yet"}
            </button>
            {value && (
              <button type="button" className={smallBtn} onClick={() => onChange("")}>
                <X className="h-3.5 w-3.5" strokeWidth={2.25} />
                Clear
              </button>
            )}
          </div>
          <input className={inputCls} placeholder="or paste an image URL" value={value} onChange={(e) => onChange(e.target.value)} />
        </div>
      </div>
      {open && (
        <div className="mt-3 grid max-h-64 grid-cols-4 gap-2 overflow-y-auto rounded-[var(--radius-md)] border border-[rgba(20,18,16,0.10)] bg-[#f9f5ec] p-2 sm:grid-cols-6">
          {photos.map((p) => (
            <button
              key={p.url}
              type="button"
              onClick={() => { onChange(p.url); setOpen(false); }}
              className={`aspect-square overflow-hidden rounded-[6px] ring-2 ${value === p.url ? "ring-[#e02214]" : "ring-transparent hover:ring-[rgba(20,18,16,0.3)]"}`}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={p.thumbUrl} alt="" className="h-full w-full object-cover" loading="lazy" />
            </button>
          ))}
        </div>
      )}
    </Field>
  );
}

function StatsEditor({
  label,
  hint,
  stats,
  suggestions,
  max,
  onChange,
}: {
  label: string;
  hint?: string;
  stats: ReportStat[];
  suggestions: ReportStat[];
  max: number;
  onChange: (s: ReportStat[]) => void;
}) {
  const unused = suggestions.filter((s) => !stats.some((x) => x.value === s.value && x.label === s.label));
  return (
    <Field label={label} hint={hint}>
      <div className="space-y-2">
        {stats.map((s, i) => (
          <div key={i} className="grid grid-cols-[110px_1fr_auto] gap-2">
            <input className={inputCls} value={s.value} placeholder="122" onChange={(e) => onChange(stats.map((x, j) => (j === i ? { ...x, value: e.target.value } : x)))} />
            <input className={inputCls} value={s.label} placeholder="people in the room" onChange={(e) => onChange(stats.map((x, j) => (j === i ? { ...x, label: e.target.value } : x)))} />
            <button type="button" className={iconBtn} aria-label="Remove" onClick={() => onChange(stats.filter((_, j) => j !== i))}>
              <Trash2 className="h-4 w-4" strokeWidth={2} />
            </button>
          </div>
        ))}
        {stats.length < max && (
          <button type="button" className={smallBtn} onClick={() => onChange([...stats, { value: "", label: "" }])}>
            <Plus className="h-3.5 w-3.5" strokeWidth={2.25} />
            Add a stat
          </button>
        )}
        {unused.length > 0 && stats.length < max && (
          <div className="flex flex-wrap gap-1.5 pt-1">
            <span className="text-[11px] uppercase tracking-[0.14em] text-[#8a8278]">From the data:</span>
            {unused.map((s) => (
              <button key={`${s.value}-${s.label}`} type="button" className={chipBtn} onClick={() => onChange([...stats, s])}>
                <Plus className="h-3 w-3" strokeWidth={2.5} />
                {s.value} {s.label}
              </button>
            ))}
          </div>
        )}
      </div>
    </Field>
  );
}

function StatementEditor({
  s,
  index,
  total,
  photos,
  onChange,
  onMove,
  onRemove,
}: {
  s: ReportStatement;
  index: number;
  total: number;
  photos: Photo[];
  onChange: (s: ReportStatement) => void;
  onMove: (dir: -1 | 1) => void;
  onRemove: () => void;
}) {
  const set = (p: Partial<ReportStatement>) => onChange({ ...s, ...p });
  return (
    <div className="rounded-[var(--radius-md)] border border-[rgba(20,18,16,0.10)] bg-[#f9f5ec] p-4">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <input className={`${inputCls} w-16 py-1.5 text-center`} value={s.number} onChange={(e) => set({ number: e.target.value })} aria-label="Number" />
          <select className={`${inputCls} w-auto py-1.5`} value={s.tone} onChange={(e) => set({ tone: e.target.value as ReportStatement["tone"] })} aria-label="Page tone">
            {TONES.map((t) => (
              <option key={t.value} value={t.value}>{t.label} page</option>
            ))}
          </select>
        </div>
        <div className="flex items-center gap-1">
          <button type="button" className={iconBtn} disabled={index === 0} onClick={() => onMove(-1)} aria-label="Move up"><ArrowUp className="h-4 w-4" strokeWidth={2} /></button>
          <button type="button" className={iconBtn} disabled={index === total - 1} onClick={() => onMove(1)} aria-label="Move down"><ArrowDown className="h-4 w-4" strokeWidth={2} /></button>
          <button type="button" className={`${iconBtn} hover:bg-[rgba(224,34,20,0.10)] hover:text-[#b91404]`} onClick={onRemove} aria-label="Remove"><Trash2 className="h-4 w-4" strokeWidth={2} /></button>
        </div>
      </div>
      <div className="mt-3 space-y-3">
        <Field label="Headline">
          <textarea className={`${textareaCls} min-h-[56px] text-[16px] font-medium`} value={s.headline} onChange={(e) => set({ headline: e.target.value })} />
        </Field>
        <Field label="Body">
          <textarea className={textareaCls} value={s.body} onChange={(e) => set({ body: e.target.value })} />
        </Field>
        <div className="grid gap-3 sm:grid-cols-[1fr_1fr]">
          <Field label="Quote" hint="Something someone actually wrote or said.">
            <textarea className={`${textareaCls} min-h-[64px]`} value={s.quote} onChange={(e) => set({ quote: e.target.value })} />
          </Field>
          <Field label="Quote source" hint="e.g. Post-it note · Health wall">
            <input className={inputCls} value={s.quoteSource} onChange={(e) => set({ quoteSource: e.target.value })} />
          </Field>
        </div>
        <PhotoField label="Photo (optional, top half of the page)" value={s.photoUrl} photos={photos} onChange={(url) => set({ photoUrl: url })} />
      </div>
    </div>
  );
}

function TestimonialsEditor({
  items,
  suggestions,
  onChange,
}: {
  items: ReportTestimonial[];
  suggestions: ReportTestimonial[];
  onChange: (t: ReportTestimonial[]) => void;
}) {
  const unused = suggestions.filter((s) => !items.some((x) => x.text === s.text));
  return (
    <Field label="Testimonials" hint="Up to three. Only quotes the attendee agreed we can use appear in the suggestions.">
      <div className="space-y-2">
        {items.map((t, i) => (
          <div key={i} className="grid grid-cols-[1fr_160px_auto] gap-2">
            <textarea className={`${textareaCls} min-h-[56px]`} value={t.text} onChange={(e) => onChange(items.map((x, j) => (j === i ? { ...x, text: e.target.value } : x)))} />
            <input className={inputCls} placeholder="Name (optional)" value={t.name} onChange={(e) => onChange(items.map((x, j) => (j === i ? { ...x, name: e.target.value } : x)))} />
            <button type="button" className={iconBtn} aria-label="Remove" onClick={() => onChange(items.filter((_, j) => j !== i))}>
              <Trash2 className="h-4 w-4" strokeWidth={2} />
            </button>
          </div>
        ))}
        {items.length < 3 && (
          <button type="button" className={smallBtn} onClick={() => onChange([...items, { text: "", name: "" }])}>
            <Plus className="h-3.5 w-3.5" strokeWidth={2.25} />
            Add a testimonial
          </button>
        )}
        {unused.length > 0 && items.length < 3 && (
          <div className="space-y-1.5 pt-1">
            <span className="text-[11px] uppercase tracking-[0.14em] text-[#8a8278]">From the responses:</span>
            {unused.slice(0, 8).map((s, i) => (
              <button key={i} type="button" className={`${chipBtn} block w-full text-left`} onClick={() => onChange([...items, s])}>
                <span className="line-clamp-2">&ldquo;{s.text}&rdquo;{s.name ? ` · ${s.name}` : ""}</span>
              </button>
            ))}
          </div>
        )}
      </div>
    </Field>
  );
}

function PartnersEditor({
  items,
  suggestions,
  onChange,
}: {
  items: ReportPartner[];
  suggestions: ReportPartner[];
  onChange: (p: ReportPartner[]) => void;
}) {
  const unused = suggestions.filter((s) => !items.some((x) => x.name === s.name));
  return (
    <Field label="Partners" hint="Up to four. Name plus the label shown under it.">
      <div className="space-y-2">
        {items.map((p, i) => (
          <div key={i} className="grid grid-cols-[1fr_1fr_auto] gap-2">
            <input className={inputCls} placeholder="University of Newcastle" value={p.name} onChange={(e) => onChange(items.map((x, j) => (j === i ? { ...x, name: e.target.value } : x)))} />
            <input className={inputCls} placeholder="Presenting Partner" value={p.label} onChange={(e) => onChange(items.map((x, j) => (j === i ? { ...x, label: e.target.value } : x)))} />
            <button type="button" className={iconBtn} aria-label="Remove" onClick={() => onChange(items.filter((_, j) => j !== i))}>
              <Trash2 className="h-4 w-4" strokeWidth={2} />
            </button>
          </div>
        ))}
        {items.length < 4 && (
          <button type="button" className={smallBtn} onClick={() => onChange([...items, { name: "", label: "" }])}>
            <Plus className="h-3.5 w-3.5" strokeWidth={2.25} />
            Add a partner
          </button>
        )}
        {unused.length > 0 && items.length < 4 && (
          <div className="flex flex-wrap gap-1.5 pt-1">
            <span className="text-[11px] uppercase tracking-[0.14em] text-[#8a8278]">Active sponsors:</span>
            {unused.map((s) => (
              <button key={s.name} type="button" className={chipBtn} onClick={() => onChange([...items, s])}>
                <Plus className="h-3 w-3" strokeWidth={2.5} />
                {s.name}
              </button>
            ))}
          </div>
        )}
      </div>
    </Field>
  );
}
