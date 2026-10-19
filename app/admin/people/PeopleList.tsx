"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { Icon } from "@/components/ds";
import type { PersonRow } from "@/lib/people";

type Filter = "all" | "list" | "event" | "regular" | "not-list";
type Sort = "recent" | "events" | "emails" | "name";

const FILTERS: { key: Filter; label: string; test: (r: PersonRow) => boolean }[] = [
  { key: "all", label: "Everyone", test: () => true },
  { key: "list", label: "On the list", test: (r) => r.subscribed === true },
  { key: "event", label: "Came to an event", test: (r) => r.eventCount > 0 },
  { key: "regular", label: "Came to two or more", test: (r) => r.eventCount > 1 },
  { key: "not-list", label: "Came but not on the list", test: (r) => r.eventCount > 0 && r.subscribed !== true },
];

const SORTS: { key: Sort; label: string }[] = [
  { key: "recent", label: "Most recent" },
  { key: "events", label: "Most events" },
  { key: "emails", label: "Most emails" },
  { key: "name", label: "Name" },
];

const PAGE = 50;

const date = (iso: string | null) =>
  iso
    ? new Intl.DateTimeFormat("en-AU", { day: "numeric", month: "short", year: "numeric", timeZone: "Australia/Sydney" }).format(
        new Date(iso),
      )
    : "";

export const personHref = (email: string) => `/admin/people/${encodeURIComponent(email)}`;

export default function PeopleList({ rows }: { rows: PersonRow[] }) {
  const [q, setQ] = useState("");
  const [filter, setFilter] = useState<Filter>("all");
  const [sort, setSort] = useState<Sort>("recent");
  const [shown, setShown] = useState(PAGE);

  const counts = useMemo(
    () => Object.fromEntries(FILTERS.map((f) => [f.key, rows.filter(f.test).length])) as Record<Filter, number>,
    [rows],
  );

  const list = useMemo(() => {
    const needle = q.trim().toLowerCase();
    const test = FILTERS.find((f) => f.key === filter)!.test;
    const out = rows.filter(
      (r) =>
        test(r) &&
        (!needle ||
          r.email.includes(needle) ||
          (r.name ?? "").toLowerCase().includes(needle) ||
          r.roles.some((x) => x.toLowerCase().includes(needle)) ||
          r.eventTitles.some((x) => x.toLowerCase().includes(needle))),
    );
    const by: Record<Sort, (a: PersonRow, b: PersonRow) => number> = {
      recent: (a, b) => (b.lastSeen ?? "").localeCompare(a.lastSeen ?? ""),
      events: (a, b) => b.eventCount - a.eventCount || (b.lastSeen ?? "").localeCompare(a.lastSeen ?? ""),
      emails: (a, b) =>
        b.emailsReceived + b.newslettersWhileSubscribed - (a.emailsReceived + a.newslettersWhileSubscribed),
      name: (a, b) => (a.name ?? a.email).localeCompare(b.name ?? b.email),
    };
    return out.sort(by[sort]);
  }, [rows, q, filter, sort]);

  const exportCsv = () => {
    const head = ["Email", "Name", "Mailing list", "Events", "Event names", "Emails", "Newsletters", "Roles", "First seen", "Last seen"];
    const cell = (v: unknown) => `"${String(v ?? "").replace(/"/g, '""')}"`;
    const lines = list.map((r) =>
      [
        r.email,
        r.name,
        r.subscribed === true ? "Subscribed" : r.subscribed === false ? "Unsubscribed" : "",
        r.eventCount,
        r.eventTitles.join("; "),
        r.emailsReceived,
        r.newslettersWhileSubscribed,
        r.roles.join("; "),
        r.firstSeen?.slice(0, 10),
        r.lastSeen?.slice(0, 10),
      ]
        .map(cell)
        .join(","),
    );
    const blob = new Blob([[head.map(cell).join(","), ...lines].join("\n")], { type: "text/csv" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "people.csv";
    a.click();
    URL.revokeObjectURL(a.href);
  };

  return (
    <section className="adm-stack adm-stack--tight">
      <div className="adm-pills adm-pills--scroll" role="tablist" aria-label="Show">
        {FILTERS.map((f) => (
          <button
            key={f.key}
            type="button"
            role="tab"
            aria-selected={f.key === filter}
            className={"adm-pill" + (f.key === filter ? " is-active" : "")}
            onClick={() => {
              setFilter(f.key);
              setShown(PAGE);
            }}
          >
            {f.label} <span className="adm-pill__n">{counts[f.key].toLocaleString("en-AU")}</span>
          </button>
        ))}
      </div>

      <div className="adm-ppl__bar">
        <label className="adm-searchform">
          <Icon name="search" size={16} className="adm-searchform__icon" />
          <input
            type="search"
            value={q}
            onChange={(e) => {
              setQ(e.target.value);
              setShown(PAGE);
            }}
            placeholder="Search name, email, event or role"
            aria-label="Search people"
          />
        </label>
        <select value={sort} onChange={(e) => setSort(e.target.value as Sort)} aria-label="Sort">
          {SORTS.map((s) => (
            <option key={s.key} value={s.key}>
              {s.label}
            </option>
          ))}
        </select>
        <button type="button" className="tx-btn tx-btn--secondary tx-btn--auto" onClick={exportCsv}>
          <Icon name="download" size={16} /> Export {list.length.toLocaleString("en-AU")}
        </button>
      </div>

      {list.length === 0 ? (
        <p className="adm-empty">Nobody matches that.</p>
      ) : (
        <ul className="adm-ppl">
          <li className="adm-ppl__row adm-ppl__row--head" aria-hidden>
            <span>Person</span>
            <span>Events</span>
            <span>Emails</span>
            <span>Last active</span>
          </li>
          {list.slice(0, shown).map((r) => (
            <li key={r.email}>
              <Link href={personHref(r.email)} className="adm-ppl__row">
                <span className="adm-ppl__who">
                  <span className="adm-ppl__name">{r.name ?? r.email}</span>
                  {r.name && <span className="adm-ppl__email">{r.email}</span>}
                  <span className="adm-ppl__tags">
                    {r.roles.map((role) => (
                      <span key={role} className={"adm-ppl__tag" + (role === "Subscriber" ? " is-list" : role === "Unsubscribed" ? " is-off" : "")}>
                        {role}
                      </span>
                    ))}
                  </span>
                </span>
                <span className="adm-ppl__num" title={r.eventTitles.join(", ")}>
                  <b>{r.eventCount}</b>
                  <small>{r.eventCount === 1 ? "event" : "events"}</small>
                </span>
                <span className="adm-ppl__num" title={`${r.emailsReceived} direct, ${r.newslettersWhileSubscribed} newsletters`}>
                  <b>{r.emailsReceived + r.newslettersWhileSubscribed}</b>
                  <small>emails</small>
                </span>
                <span className="adm-ppl__when">{date(r.lastSeen)}</span>
              </Link>
            </li>
          ))}
        </ul>
      )}

      {list.length > shown && (
        <button type="button" className="tx-btn tx-btn--secondary" onClick={() => setShown((n) => n + PAGE * 2)}>
          Show more ({(list.length - shown).toLocaleString("en-AU")} to go)
        </button>
      )}
    </section>
  );
}
