"use client";

import { Icon } from "@/components/ds";

export type ArchiveView = "list" | "grid";

/** Search, year filter and list/grid switch: the same bar on Talks and Speakers. */
export default function ArchiveToolbar({
  q,
  onQ,
  placeholder,
  years,
  year,
  onYear,
  view,
  onView,
}: {
  q: string;
  onQ: (v: string) => void;
  placeholder: string;
  years: string[];
  year: string;
  onYear: (v: string) => void;
  view: ArchiveView;
  onView: (v: ArchiveView) => void;
}) {
  return (
    <div className="adm-archbar">
      <div className="adm-archbar__search">
        <Icon name="search" size={16} />
        <input type="search" value={q} onChange={(e) => onQ(e.target.value)} placeholder={placeholder} aria-label={placeholder} />
        {q && (
          <button type="button" onClick={() => onQ("")} aria-label="Clear search" className="adm-archbar__clear">
            <Icon name="x" size={14} />
          </button>
        )}
      </div>
      <div className="adm-archbar__right">
        <div className="adm-pills" role="tablist" aria-label="Filter by year">
          {["all", ...years].map((y) => (
            <button
              key={y}
              type="button"
              role="tab"
              aria-selected={y === year}
              onClick={() => onYear(y)}
              className={"adm-pill" + (y === year ? " is-active" : "")}
            >
              {y === "all" ? "All" : y}
            </button>
          ))}
        </div>
        <div className="adm-pills" role="tablist" aria-label="View">
          {(["list", "grid"] as const).map((v) => (
            <button
              key={v}
              type="button"
              role="tab"
              aria-selected={v === view}
              onClick={() => onView(v)}
              className={"adm-pill" + (v === view ? " is-active" : "")}
            >
              {v === "list" ? "List" : "Grid"}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
