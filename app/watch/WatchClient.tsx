"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Play } from "lucide-react";
import TalkModal from "@/components/TalkModal";
import type { Talk } from "@/lib/data";

type YearMeta = {
  year: number;
  label: string;
  event: "Reframe" | "Beyond Boundaries";
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

// Use hqdefault — it's the most reliable thumbnail across all videos.
const thumbFor = (id: string) =>
  `https://i.ytimg.com/vi/${id}/hqdefault.jpg`;

export default function WatchClient({ talks }: { talks: Talk[] }) {
  const params = useSearchParams();
  const requested = Number(params.get("year"));
  const initialYear =
    YEARS.find((y) => y.year === requested)?.year ?? YEARS[0].year;
  const [year, setYear] = useState<number>(initialYear);
  const [index, setIndex] = useState<number | null>(null);

  // Sync state if the query string changes after mount (e.g. nav from header)
  useEffect(() => {
    const next = Number(params.get("year"));
    if (YEARS.some((y) => y.year === next) && next !== year) {
      setYear(next);
      setIndex(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params]);

  const filtered = useMemo(
    () => talks.filter((t) => t.year === year),
    [talks, year],
  );

  const activeMeta = YEARS.find((y) => y.year === year) ?? YEARS[0];

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

  const switchYear = (nextYear: number) => {
    setIndex(null);
    setYear(nextYear);
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
          aria-label="Filter talks by year"
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
          <p className="mx-auto mt-4 max-w-[42ch] text-[16px] leading-[1.6] text-[#2a2521]">
            We&rsquo;re rolling out the {activeMeta.event} {activeMeta.year}{" "}
            archive — videos publish on YouTube through 2026.
          </p>
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
                    className="font-sans text-[17.5px] font-medium leading-[1.25] tracking-[-0.01em] text-[#141210] balance group-hover:text-[#e02214]"
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
