"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Search, X } from "lucide-react";
import PhotoFill from "@/components/PhotoFill";
import SpeakerModal from "@/components/SpeakerModal";
import type { SpeakerWithTalk } from "@/lib/cms-content";

const YEAR_OPTIONS = [2025, 2024] as const;

const EVENT_BY_YEAR: Record<number, string> = {
  2025: "Reframe",
  2024: "Beyond Boundaries",
};

export default function SpeakersClient({
  speakers,
}: {
  speakers: SpeakerWithTalk[];
}) {
  const [yearFilter, setYearFilter] = useState<number | null>(null);
  const [query, setQuery] = useState("");
  const [index, setIndex] = useState<number | null>(null);

  // Newest first (2025 above 2024), preserving curated order within a year.
  const ordered = useMemo(
    () => [...speakers].sort((a, b) => b.year - a.year),
    [speakers],
  );

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return ordered.filter((s) => {
      if (yearFilter && s.year !== yearFilter) return false;
      if (!q) return true;
      return (
        s.name.toLowerCase().includes(q) ||
        s.title.toLowerCase().includes(q)
      );
    });
  }, [ordered, yearFilter, query]);

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

  // Open the matching speaker if the page is loaded with ?speaker=<slug>.
  useEffect(() => {
    const slug = new URLSearchParams(window.location.search).get("speaker");
    if (!slug) return;
    const i = filtered.findIndex((s) => s.slug === slug);
    if (i >= 0) setIndex(i);
    // run once on mount
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Reflect the open speaker in the URL so the popup view is linkable/shareable.
  useEffect(() => {
    const base = window.location.pathname;
    const url =
      index !== null && filtered[index]
        ? `${base}?speaker=${filtered[index].slug}`
        : base;
    window.history.replaceState(null, "", url);
  }, [index, filtered]);

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
            placeholder="Search by name or role"
            aria-label="Search speakers by name or role"
            className="w-full rounded-full border border-[rgba(20,18,16,0.14)] bg-white py-2.5 pl-11 pr-4 text-[14px] text-[#141210] transition-colors placeholder:text-[#9a9286] focus:border-[#e02214] focus:outline-none focus:ring-2 focus:ring-[#e02214]/20"
          />
        </div>

        <div
          role="group"
          aria-label="Filter speakers by year"
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
            className="font-mono text-[10.5px] font-semibold uppercase text-[#e02214]"
            style={{ letterSpacing: "0.24em" }}
          >
            {query.trim() ? "No matches" : "Coming soon"}
          </div>
          <p className="mx-auto mt-4 max-w-[44ch] text-[16px] leading-[1.6] text-[#2a2521]">
            {query.trim() ? (
              <>No speakers match &ldquo;{query.trim()}&rdquo;. Try a different search.</>
            ) : (
              <>Speakers and talks land alongside their YouTube release through 2026.</>
            )}
          </p>
          {hasFilters && (
            <button
              type="button"
              onClick={clearAll}
              className="mt-5 inline-flex items-center gap-1.5 text-[14px] font-medium text-[#e02214]"
            >
              <X className="h-3.5 w-3.5" strokeWidth={2.5} />
              Clear filters
            </button>
          )}
        </div>
      ) : (
        <ul className="grid grid-cols-1 gap-x-6 gap-y-12 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((s, i) => (
            <li key={s.slug}>
              <button
                type="button"
                onClick={() => setIndex(i)}
                className="group block w-full text-left focus-visible:outline-none"
              >
                <div className="relative aspect-[4/5] overflow-hidden rounded-[var(--radius-md)] bg-[#1a1714]">
                  {s.image && (
                    <PhotoFill
                      src={s.image}
                      alt={s.name}
                      sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                      hoverZoom
                    />
                  )}
                  {/* Brand overlay — logo, gradient, name + year/event */}
                  <div
                    aria-hidden
                    className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/75 via-black/15 to-transparent"
                  />
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src="/brand/tedxnewy-white.png"
                    alt=""
                    aria-hidden
                    className="pointer-events-none absolute left-3.5 top-3.5 w-[74px]"
                  />
                  <div className="pointer-events-none absolute inset-x-0 bottom-0 p-4">
                    <div className="font-sans text-[18px] font-semibold leading-[1.15] tracking-[-0.01em] text-white">
                      {s.name}
                    </div>
                    <div
                      className="mt-1.5 font-mono text-[9.5px] font-semibold uppercase text-white/75"
                      style={{ letterSpacing: "0.18em" }}
                    >
                      {EVENT_BY_YEAR[s.year]
                        ? `${s.year} · ${EVENT_BY_YEAR[s.year]}`
                        : s.year}
                    </div>
                  </div>
                </div>
                {!s.title.includes("to be added") && (
                  <div className="mt-3 text-[13.5px] leading-[1.5] text-[#6b6459] group-hover:text-[#141210]">
                    {s.title}
                  </div>
                )}
              </button>
            </li>
          ))}
        </ul>
      )}

      <SpeakerModal
        speakers={filtered}
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
