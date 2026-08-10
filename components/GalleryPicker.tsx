"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { ImageOff, Loader2, X } from "lucide-react";
import { getBrowserSupabase } from "@/lib/supabase-browser";

type EventGroup = {
  eventId: string;
  title: string;
  photos: { url: string; thumbUrl: string }[];
};

/**
 * Modal for picking an already-hosted event photo instead of uploading a
 * new one. Self-contained: fetches cms_events + event_photos directly via
 * the browser client (both public-read RLS), so it drops into any admin
 * form with no server plumbing and no props beyond the callbacks.
 */
export default function GalleryPicker({
  onSelect,
  onClose,
}: {
  onSelect: (photo: { url: string; name: string }) => void;
  onClose: () => void;
}) {
  const [groups, setGroups] = useState<EventGroup[] | null>(null);
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
            <div className="space-y-6">
              {groups.map((g) => (
                <div key={g.eventId}>
                  <div className="mb-2.5 text-[13px] font-medium text-[#141210]">
                    {g.title}
                  </div>
                  <div className="grid grid-cols-4 gap-2 sm:grid-cols-5">
                    {g.photos.map((p, i) => (
                      <button
                        key={i}
                        type="button"
                        onClick={() => handlePick(g, p.url)}
                        className="aspect-square overflow-hidden rounded-[8px] border border-[rgba(20,18,16,0.10)] bg-[#1a1714] transition-all hover:-translate-y-0.5 hover:border-[#e02214]/50"
                      >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={p.thumbUrl}
                          alt=""
                          className="h-full w-full object-cover"
                        />
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>,
    document.body,
  );
}
