"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Play, Search, X } from "lucide-react";
import TalkModal from "@/components/TalkModal";
import type { Talk } from "@/lib/data";

const YEAR_OPTIONS = [2025, 2024] as const;
type YearOption = (typeof YEAR_OPTIONS)[number];

const isYearOption = (n: number): n is YearOption =>
  (YEAR_OPTIONS as readonly number[]).includes(n);

// Use hqdefault — it's the most reliable thumbnail across all videos.
const thumbFor = (id: string) => `https://i.ytimg.com/vi/${id}/hqdefault.jpg`;

export default function WatchClient({ talks }: { talks: Talk[] }) {
  const params = useSearchParams();
  const requested = Number(params.get("year"));

  const [yearFilter, setYearFilter] = useState<number | null>(
    isYearOption(requested) ? requested : null,
  );
  const [query, setQuery] = useState("");
  const [index, setIndex] = useState<number | null>(null);

  // React to header links that change ?year= after mount. Next's router
  // intercepts window.history.replaceState (which the ?talk= deep-link sync
  // below uses) and re-fires useSearchParams, so this must only react when
  // the "year" param itself actually changed — otherwise every talk open
  // re-triggers this and immediately closes the modal it just opened.
  const lastYearParam = useRef(params.get("year"));
  useEffect(() => {
    const raw = params.get("year");
    if (raw === lastYearParam.current) return;
    lastYearParam.current = raw;
    const next = Number(raw);
    setYearFilter(isYearOption(next) ? next : null);
    setIndex(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params]);

  // Newest first (2025 above 2024), preserving curated order within a year.
  const ordered = useMemo(
    () => [...talks].sort((a, b) => b.year - a.year),
    [talks],
  );

  // A talk's link slug is its speaker's slug (talks map 1:1 to speakers in
  // practice, same identifier SpeakerLineup already uses for ?speaker=), with
  // the talk's own id as a fallback for the rare one with no linked speaker.
  const talkSlug = (t: Talk) => t.speakerSlug ?? t.id;

  // Deep link: open the talk matching ?talk=<slug> on load. Clears any year/
  // search filter so the target is guaranteed to be in `filtered`, then opens
  // it by its position in `ordered` (== its position in `filtered` once those
  // filters are cleared, since both derive from the same source array in the
  // same order). Runs once on mount; an unknown slug just opens nothing.
  useEffect(() => {
    const slug = params.get("talk");
    if (!slug) return;
    const i = ordered.findIndex((t) => talkSlug(t) === slug);
    if (i < 0) return;
    setYearFilter(null);
    setQuery("");
    setIndex(i);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return ordered.filter((t) => {
      if (yearFilter && t.year !== yearFilter) return false;
      if (!q) return true;
      return (
        t.title.toLowerCase().includes(q) ||
        t.speaker.toLowerCase().includes(q)
      );
    });
  }, [ordered, yearFilter, query]);

  // Keep the URL in step with whichever talk is open, so the address bar is
  // always a shareable link. replaceState (not push) so closing doesn't leave
  // a back-button trap. Same pattern as SpeakerLineup's ?speaker= sync.
  useEffect(() => {
    const base = window.location.pathname;
    const open = index !== null ? filtered[index] : null;
    const url = open ? `${base}?talk=${talkSlug(open)}` : base;
    window.history.replaceState(null, "", url);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [index, filtered]);

  const close = useCallback(() => setIndex(null), []);
  const prev = useCallback(
    () =>
      setIndex((i) =>
        i === null ? null : (i - 1 + filtered.length) % filtered.length,
      ),
    [filtered.length],
  );
  const next = useCallback(
    () => setIndex((i) => (i === null ? null : (i + 1) % filtered.length)),
    [filtered.length],
  );

  const hasFilters = query.trim() !== "" || yearFilter !== null;
  const clearAll = () => {
    setQuery("");
    setYearFilter(null);
    setIndex(null);
  };

  return (
    <>
      {/* Search + year filter */}
      <div className="mb-12 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="relative w-full md:max-w-[380px]">
          <Search
            aria-hidden
            className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[#6b6459]"
            strokeWidth={2}
          />
          <input
            type="search"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setIndex(null);
            }}
            placeholder="Search talks or speakers"
            aria-label="Search talks by title or speaker"
            className="w-full rounded-full border border-[rgba(20,18,16,0.14)] bg-white py-2.5 pl-11 pr-4 text-[14px] text-[#141210] transition-colors placeholder:text-[#9a9286] focus:border-[#e02214] focus:outline-none focus:ring-2 focus:ring-[#e02214]/20"
          />
        </div>

        <div
          role="group"
          aria-label="Filter talks by year"
          className="inline-flex items-center self-start rounded-full border border-[rgba(20,18,16,0.10)] bg-white p-1 md:self-auto"
        >
          <FilterPill active={yearFilter === null} onClick={() => { setYearFilter(null); setIndex(null); }}>
            All
          </FilterPill>
          {YEAR_OPTIONS.map((y) => (
            <FilterPill
              key={y}
              active={yearFilter === y}
              onClick={() => { setYearFilter(y); setIndex(null); }}
            >
              {y}
            </FilterPill>
          ))}
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="rounded-[var(--radius-md)] border border-dashed border-[rgba(20,18,16,0.15)] bg-[#f9f5ec] px-6 py-16 text-center md:py-20">
          <div
            className="font-mono text-[10.5px] font-semibold uppercase text-[#b91404]"
            style={{ letterSpacing: "0.24em" }}
          >
            {query.trim() ? "No matches" : "Coming soon"}
          </div>
          <p className="mx-auto mt-4 max-w-[44ch] text-[16px] leading-[1.6] text-[#2a2521]">
            {query.trim() ? (
              <>
                No talks match &ldquo;{query.trim()}&rdquo;. Try a different
                search.
              </>
            ) : (
              <>More videos publish on YouTube through 2026.</>
            )}
          </p>
          {hasFilters && (
            <button
              type="button"
              onClick={clearAll}
              className="mt-5 inline-flex items-center gap-1.5 text-[14px] font-medium text-[#b91404]"
            >
              <X className="h-3.5 w-3.5" strokeWidth={2.5} />
              Clear filters
            </button>
          )}
        </div>
      ) : (
        <ul className="grid grid-cols-1 gap-x-6 gap-y-12 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((t, i) => (
            <li key={t.id}>
              <button
                type="button"
                onClick={() => setIndex(i)}
                className="group block w-full text-left focus-visible:outline-none"
              >
                {/* Thumbnail */}
                <div className="relative aspect-video overflow-hidden rounded-[var(--radius-md)] bg-[#1a1714] shadow-[0_8px_30px_rgba(20,18,16,0.10)] transition-shadow group-hover:shadow-[0_18px_50px_rgba(20,18,16,0.18)]">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={thumbFor(t.youtubeId)}
                    alt=""
                    loading="lazy"
                    className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
                  />
                  <div
                    aria-hidden
                    className="pointer-events-none absolute inset-0"
                    style={{
                      background:
                        "linear-gradient(180deg, rgba(0,0,0,0.0) 30%, rgba(0,0,0,0.55) 100%)",
                    }}
                  />
                  {/* Play badge */}
                  <div
                    aria-hidden
                    className="absolute bottom-4 left-4 inline-flex h-11 w-11 items-center justify-center rounded-full bg-[#e02214] text-white shadow-[0_8px_22px_rgba(224,34,20,0.35)] transition-transform duration-300 group-hover:scale-110 group-hover:bg-[#b91404]"
                  >
                    <Play className="ml-[2px] h-4 w-4 fill-current" strokeWidth={0} />
                  </div>
                  {/* Event chip top-right */}
                  <div
                    className="absolute right-3 top-3 rounded-full bg-black/45 px-2.5 py-1 font-mono text-[10px] font-semibold uppercase text-white backdrop-blur-sm"
                    style={{ letterSpacing: "0.18em" }}
                  >
                    {t.event} · {t.year}
                  </div>
                </div>

                {/* Title + speaker */}
                <div className="mt-4">
                  <div
                    className="font-sans text-[17.5px] font-medium leading-[1.25] tracking-[-0.01em] text-[#141210] balance group-hover:text-[#b91404]"
                    style={{ fontVariationSettings: '"opsz" 96' }}
                  >
                    {t.title}
                  </div>
                  <div className="mt-1.5 text-[13.5px] font-medium text-[#6b6459]">
                    {t.speaker}
                  </div>
                </div>
              </button>
            </li>
          ))}
        </ul>
      )}

      <TalkModal
        talks={filtered}
        index={index}
        onClose={close}
        onPrev={prev}
        onNext={next}
      />
    </>
  );
}

function FilterPill({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      aria-pressed={active}
      onClick={onClick}
      className={
        "rounded-full px-4 py-2 text-[13.5px] font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#e02214]/40 " +
        (active
          ? "bg-[#141210] text-white"
          : "text-[#6b6459] hover:text-[#141210]")
      }
    >
      {children}
    </button>
  );
}
