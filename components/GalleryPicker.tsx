"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import {
  ChevronRight,
  ImageOff,
  Loader2,
  Mail,
  Megaphone,
  X,
} from "lucide-react";
import { getBrowserSupabase } from "@/lib/supabase-browser";

type EventGroup = {
  eventId: string;
  title: string;
  photos: { url: string; thumbUrl: string }[];
};

type PhotoUse = {
  kind: "social" | "newsletter" | "flow";
  title?: string;
  status?: string;
};

/** Keyed by photo url. See /api/photo-usage and lib/photo-usage.ts. */
type PhotoUsage = Record<string, PhotoUse[]>;

const USE_LABEL: Record<PhotoUse["kind"], string> = {
  social: "Social post",
  newsletter: "Newsletter",
  flow: "Welcome email",
};

/** Tooltip text for a used photo: one line per place it appears. */
function usageTitle(uses: PhotoUse[]) {
  const lines = uses.map((u) => {
    const where = USE_LABEL[u.kind];
    if (!u.title) return `Used in a ${where.toLowerCase()}`;
    return `${where}: ${u.title}${u.status ? ` (${u.status})` : ""}`;
  });
  return ["Already used", ...lines].join("\n");
}

/**
 * Modal for picking an already-hosted event photo instead of uploading a
 * new one. Self-contained: fetches cms_events + event_photos directly via
 * the browser client (both public-read RLS), so it drops into any admin
 * form with no server plumbing and no props beyond the callbacks.
 *
 * Events are collapsible rows, closed by default: some galleries run to
 * several hundred photos, so this is both easier to scan and a lot lighter
 * (a closed row renders no thumbnails at all).
 *
 * Photos that already appear in a social post, newsletter or welcome-flow
 * step are tinted and badged. That mark is derived on every open from the
 * drafts themselves, never stored, so deleting a draft clears it by itself.
 * Marked photos stay fully selectable: it is a reminder, not a block.
 */
export default function GalleryPicker({
  onSelect,
  onClose,
}: {
  onSelect: (photo: { url: string; name: string }) => void;
  onClose: () => void;
}) {
  const [groups, setGroups] = useState<EventGroup[] | null>(null);
  const [usage, setUsage] = useState<PhotoUsage>({});
  const [open, setOpen] = useState<Record<string, boolean>>({});
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const supabase = getBrowserSupabase();
      const [eventsRes, photosRes] = await Promise.all([
        supabase.from("cms_events").select("id, title, starts_at"),
        supabase
          .from("event_photos")
          .select("event_id, url, thumb_url, display_order")
          .order("display_order", { ascending: true }),
      ]);
      if (cancelled) return;
      if (eventsRes.error || photosRes.error) {
        setError("Could not load the photo gallery.");
        return;
      }
      const events = (eventsRes.data ?? []) as {
        id: string;
        title: string;
        starts_at: string | null;
      }[];
      const photos = (photosRes.data ?? []) as {
        event_id: string;
        url: string;
        thumb_url: string;
      }[];

      const byEvent = new Map<string, EventGroup>();
      for (const e of events) {
        byEvent.set(e.id, { eventId: e.id, title: e.title, photos: [] });
      }
      for (const p of photos) {
        byEvent.get(p.event_id)?.photos.push({ url: p.url, thumbUrl: p.thumb_url });
      }
      const sorted = events
        .slice()
        .sort((a, b) => (b.starts_at ?? "").localeCompare(a.starts_at ?? ""))
        .map((e) => byEvent.get(e.id)!)
        .filter((g) => g.photos.length > 0);
      setGroups(sorted);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  // Usage marks load separately and never gate the picker: if the feed fails,
  // the gallery still works, just without the "already used" tint.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/photo-usage", { cache: "no-store" });
        if (!res.ok) return;
        const json = (await res.json()) as { usage?: PhotoUsage };
        if (!cancelled && json.usage) setUsage(json.usage);
      } catch {
        // no marks, no problem
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [onClose]);

  const handlePick = (group: EventGroup, url: string) => {
    onSelect({ url, name: group.title });
    onClose();
  };

  return createPortal(
    <div
      onClick={onClose}
      className="fixed inset-0 z-[80] flex items-center justify-center bg-black/60 p-4"
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Select a photo from the gallery"
        onClick={(e) => e.stopPropagation()}
        className="flex max-h-[85vh] w-full max-w-[720px] flex-col overflow-hidden rounded-[var(--radius-md)] bg-white shadow-2xl"
      >
        <div className="flex items-center justify-between border-b border-[rgba(20,18,16,0.08)] px-5 py-4">
          <span className="font-sans text-[15px] font-medium text-[#141210]">
            Select from gallery
          </span>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="inline-flex h-8 w-8 items-center justify-center rounded-full text-[#6b6459] transition-colors hover:bg-[rgba(20,18,16,0.08)] hover:text-[#141210]"
          >
            <X className="h-4 w-4" strokeWidth={2.25} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-4">
          {error ? (
            <p className="py-10 text-center text-[13.5px] text-[#b91404]">{error}</p>
          ) : groups === null ? (
            <div className="flex items-center justify-center gap-2 py-14 text-[#6b6459]">
              <Loader2 className="h-4 w-4 animate-spin" strokeWidth={2.25} />
              Loading photos…
            </div>
          ) : groups.length === 0 ? (
            <div className="flex flex-col items-center gap-2 py-14 text-[#6b6459]">
              <ImageOff className="h-6 w-6" strokeWidth={1.75} />
              <p className="text-[13.5px]">No event photos have been catalogued yet.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {groups.map((g) => {
                const isOpen = !!open[g.eventId];
                const usedCount = g.photos.filter((p) => usage[p.url]?.length).length;
                return (
                  <div
                    key={g.eventId}
                    className="overflow-hidden rounded-[10px] border border-[rgba(20,18,16,0.10)]"
                  >
                    <button
                      type="button"
                      aria-expanded={isOpen}
                      onClick={() =>
                        setOpen((o) => ({ ...o, [g.eventId]: !o[g.eventId] }))
                      }
                      className="flex w-full items-center gap-2.5 px-3.5 py-3 text-left transition-colors hover:bg-[rgba(20,18,16,0.03)]"
                    >
                      <ChevronRight
                        className={`h-4 w-4 shrink-0 text-[#6b6459] transition-transform ${
                          isOpen ? "rotate-90" : ""
                        }`}
                        strokeWidth={2.25}
                      />
                      <span className="flex-1 text-[13px] font-medium text-[#141210]">
                        {g.title}
                      </span>
                      {usedCount > 0 && (
                        <span className="rounded-full bg-[rgba(224,34,20,0.10)] px-2 py-0.5 text-[11px] font-medium text-[#b91404]">
                          {usedCount} used
                        </span>
                      )}
                      <span className="text-[11.5px] text-[#6b6459]">
                        {g.photos.length} photo{g.photos.length === 1 ? "" : "s"}
                      </span>
                    </button>

                    {isOpen && (
                      <div className="grid grid-cols-4 gap-2 border-t border-[rgba(20,18,16,0.08)] p-3 sm:grid-cols-5">
                        {g.photos.map((p, i) => {
                          const uses = usage[p.url] ?? [];
                          const used = uses.length > 0;
                          const inSocial = uses.some((u) => u.kind === "social");
                          const inEmail = uses.some((u) => u.kind !== "social");
                          return (
                            <button
                              key={i}
                              type="button"
                              onClick={() => handlePick(g, p.url)}
                              title={used ? usageTitle(uses) : undefined}
                              className="group relative aspect-square overflow-hidden rounded-[8px] border border-[rgba(20,18,16,0.10)] bg-[#1a1714] transition-all hover:-translate-y-0.5 hover:border-[#e02214]/50"
                            >
                              {/* eslint-disable-next-line @next/next/no-img-element */}
                              <img
                                src={p.thumbUrl}
                                alt=""
                                loading="lazy"
                                decoding="async"
                                className="h-full w-full object-cover"
                              />
                              {used && (
                                <>
                                  {/* Tint marks it as used but keeps it usable;
                                      it lifts on hover so the photo is still
                                      easy to judge before picking. */}
                                  <span
                                    aria-hidden
                                    className="pointer-events-none absolute inset-0 bg-[#141210]/45 transition-opacity group-hover:opacity-0"
                                  />
                                  <span className="pointer-events-none absolute right-1 top-1 flex items-center gap-0.5 rounded-full bg-[#141210]/80 px-1.5 py-1 text-white">
                                    {inSocial && (
                                      <Megaphone className="h-3 w-3" strokeWidth={2.25} />
                                    )}
                                    {inEmail && (
                                      <Mail className="h-3 w-3" strokeWidth={2.25} />
                                    )}
                                  </span>
                                  <span className="sr-only">{usageTitle(uses)}</span>
                                </>
                              )}
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {groups !== null && groups.length > 0 && (
          <div className="flex items-center gap-2 border-t border-[rgba(20,18,16,0.08)] px-5 py-3 text-[11.5px] text-[#6b6459]">
            <span className="flex items-center gap-1">
              <Megaphone className="h-3 w-3" strokeWidth={2.25} /> social
            </span>
            <span className="flex items-center gap-1">
              <Mail className="h-3 w-3" strokeWidth={2.25} /> email
            </span>
            <span>
              Tinted photos are already used somewhere. Still fine to reuse.
            </span>
          </div>
        )}
      </div>
    </div>,
    document.body,
  );
}
