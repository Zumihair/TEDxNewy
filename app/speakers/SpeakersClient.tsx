"use client";

import { useCallback, useMemo, useState } from "react";
import PhotoFill from "@/components/PhotoFill";
import SpeakerModal from "@/components/SpeakerModal";
import type { Speaker } from "@/lib/data";

type YearMeta = {
  year: number;
  label: string;
  event: string;
  venue: string;
};

const YEARS: YearMeta[] = [
  {
    year: 2025,
    label: "2025",
    event: "Reframe",
    venue: "Conservatorium of Music",
  },
  {
    year: 2024,
    label: "2024",
    event: "Beyond Boundaries",
    venue: "The Playhouse",
  },
];

export default function SpeakersClient({ speakers }: { speakers: Speaker[] }) {
  const [year, setYear] = useState<number>(YEARS[0].year);
  const [index, setIndex] = useState<number | null>(null);

  const filtered = useMemo(
    () => speakers.filter((s) => s.year === year),
    [speakers, year],
  );

  const activeMeta =
    YEARS.find((y) => y.year === year) ?? YEARS[0];

  const close = useCallback(() => setIndex(null), []);
  const prev = useCallback(
    () =>
      setIndex((i) =>
        i === null ? null : (i - 1 + filtered.length) % filtered.length,
      ),
    [filtered.length],
  );
  const next = useCallback(
    () =>
      setIndex((i) => (i === null ? null : (i + 1) % filtered.length)),
    [filtered.length],
  );

  const switchYear = (next: number) => {
    setIndex(null);
    setYear(next);
  };

  return (
    <>
      {/* Year switcher */}
      <div className="mb-12 flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
        <div
          className="font-mono text-[10.5px] font-semibold uppercase text-[#e02214]"
          style={{ letterSpacing: "0.24em" }}
        >
          {activeMeta.event} · {activeMeta.venue}
        </div>
        <div
          role="tablist"
          aria-label="Filter speakers by year"
          className="inline-flex items-center self-start rounded-full border border-[rgba(20,18,16,0.10)] bg-white p-1 md:self-auto"
        >
          {YEARS.map((y) => {
            const isActive = y.year === year;
            return (
              <button
                key={y.year}
                role="tab"
                type="button"
                aria-selected={isActive}
                onClick={() => switchYear(y.year)}
                className={
                  "rounded-full px-5 py-2 text-[13.5px] font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#e02214]/40 " +
                  (isActive
                    ? "bg-[#141210] text-white"
                    : "text-[#6b6459] hover:text-[#141210]")
                }
              >
                {y.label}
              </button>
            );
          })}
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="rounded-[var(--radius-md)] border border-dashed border-[rgba(20,18,16,0.15)] bg-[#f9f5ec] px-6 py-16 text-center md:py-20">
          <div
            className="font-mono text-[10.5px] font-semibold uppercase text-[#e02214]"
            style={{ letterSpacing: "0.24em" }}
          >
            Coming soon
          </div>
          <p className="mx-auto mt-4 max-w-[40ch] text-[16px] leading-[1.6] text-[#2a2521]">
            We&rsquo;re rebuilding the {activeMeta.event} {activeMeta.year}{" "}
            archive — speakers and talks land alongside their YouTube release
            through 2026.
          </p>
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
                </div>
                <div className="mt-4">
                  <div className="font-sans text-[18px] font-medium leading-tight tracking-[-0.01em] text-[#141210] group-hover:text-[#e02214]">
                    {s.name}
                  </div>
                  {!s.title.includes("to be added") && (
                    <div className="mt-1.5 text-[13.5px] leading-[1.5] text-[#6b6459]">
                      {s.title}
                    </div>
                  )}
                </div>
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
