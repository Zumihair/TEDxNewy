"use client";

import { Fragment, useMemo, useState } from "react";
import { Download, Search, X } from "lucide-react";
import { Card } from "../ui";

export type Registration = {
  id: string;
  created_at: string;
  school_name: string;
  suburb: string;
  contact_name: string;
  contact_role: string;
  email: string;
  phone: string;
  student_count: number;
  year_levels: string;
  comments: string | null;
  marketing_consent: boolean;
  school_authorised: boolean;
};

export default function RegistrationsTable({
  rows,
}: {
  rows: Registration[];
}) {
  const [q, setQ] = useState("");
  const [expanded, setExpanded] = useState<string | null>(null);

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    if (!needle) return rows;
    return rows.filter((r) =>
      [r.school_name, r.suburb, r.contact_name, r.email, r.year_levels]
        .filter(Boolean)
        .some((v) => v.toLowerCase().includes(needle)),
    );
  }, [rows, q]);

  const totalStudents = useMemo(
    () => filtered.reduce((sum, r) => sum + (r.student_count || 0), 0),
    [filtered],
  );

  return (
    <>
      {/* Toolbar */}
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div className="relative flex-1 md:max-w-[420px]">
          <Search
            className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[#6b6459]"
            strokeWidth={2.25}
          />
          <input
            type="search"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search school, suburb, contact, email…"
            className="block w-full rounded-full border border-[rgba(20,18,16,0.10)] bg-white py-2.5 pl-10 pr-9 text-[13.5px] text-[#141210] placeholder:text-[#6b6459] focus:border-[#e02214]/40 focus:outline-none focus:ring-2 focus:ring-[#e02214]/20"
          />
          {q && (
            <button
              type="button"
              onClick={() => setQ("")}
              aria-label="Clear search"
              className="absolute right-2 top-1/2 inline-flex h-6 w-6 -translate-y-1/2 items-center justify-center rounded-full text-[#6b6459] hover:bg-[rgba(20,18,16,0.06)] hover:text-[#141210]"
            >
              <X className="h-3.5 w-3.5" strokeWidth={2.25} />
            </button>
          )}
        </div>
        <div className="flex flex-wrap items-center gap-3 text-[12.5px] text-[#6b6459]">
          <span>
            <strong className="text-[#141210]">{filtered.length}</strong> school
            {filtered.length === 1 ? "" : "s"} ·{" "}
            <strong className="text-[#141210]">{totalStudents}</strong> students
          </span>
          <button
            type="button"
            onClick={() => exportCsv(filtered)}
            disabled={filtered.length === 0}
            className="inline-flex items-center gap-1.5 rounded-full bg-[rgba(20,18,16,0.06)] px-4 py-2 text-[12.5px] font-medium text-[#141210] transition-colors hover:bg-[rgba(20,18,16,0.10)] disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Download className="h-3.5 w-3.5" strokeWidth={2.25} />
            Export CSV
          </button>
        </div>
      </div>

      {/* Table */}
      <Card className="overflow-hidden">
        {filtered.length === 0 ? (
          <div className="px-6 py-14 text-center text-[14px] text-[#6b6459]">
            {rows.length === 0
              ? "No registrations yet."
              : "No registrations match that search."}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[820px] border-collapse text-[13.5px]">
              <thead>
                <tr className="border-b border-[rgba(20,18,16,0.10)] bg-[rgba(20,18,16,0.03)] text-left font-mono text-[10.5px] font-semibold uppercase text-[#6b6459]">
                  <th
                    className="px-4 py-3"
                    style={{ letterSpacing: "0.20em" }}
                  >
                    Received
                  </th>
                  <th
                    className="px-4 py-3"
                    style={{ letterSpacing: "0.20em" }}
                  >
                    School
                  </th>
                  <th
                    className="px-4 py-3"
                    style={{ letterSpacing: "0.20em" }}
                  >
                    Contact
                  </th>
                  <th
                    className="px-4 py-3"
                    style={{ letterSpacing: "0.20em" }}
                  >
                    Students
                  </th>
                  <th
                    className="px-4 py-3"
                    style={{ letterSpacing: "0.20em" }}
                  >
                    Year levels
                  </th>
                  <th
                    className="px-4 py-3"
                    style={{ letterSpacing: "0.20em" }}
                  ></th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((r) => {
                  const isOpen = expanded === r.id;
                  return (
                    <Fragment key={r.id}>
                      <tr
                        className="border-b border-[rgba(20,18,16,0.06)] align-top hover:bg-[rgba(20,18,16,0.02)]"
                      >
                        <td className="px-4 py-3 font-mono text-[12px] text-[#6b6459]">
                          {formatDate(r.created_at)}
                        </td>
                        <td className="px-4 py-3">
                          <div className="font-semibold text-[#141210]">
                            {r.school_name}
                          </div>
                          <div className="mt-0.5 text-[12.5px] text-[#6b6459]">
                            {r.suburb}
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <div className="text-[#141210]">{r.contact_name}</div>
                          <div className="mt-0.5 text-[12.5px] text-[#6b6459]">
                            {r.contact_role}
                          </div>
                          <a
                            href={`mailto:${r.email}`}
                            className="mt-1 block text-[12.5px] text-[#e02214] hover:underline"
                          >
                            {r.email}
                          </a>
                        </td>
                        <td className="px-4 py-3 text-[#141210]">
                          <span className="font-semibold">
                            {r.student_count}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-[#141210]">
                          {r.year_levels}
                        </td>
                        <td className="px-4 py-3 text-right">
                          <button
                            type="button"
                            onClick={() => setExpanded(isOpen ? null : r.id)}
                            className="inline-flex items-center rounded-full bg-[rgba(20,18,16,0.06)] px-3 py-1 text-[11.5px] font-medium text-[#141210] hover:bg-[rgba(20,18,16,0.10)]"
                          >
                            {isOpen ? "Hide" : "Details"}
                          </button>
                        </td>
                      </tr>
                      {isOpen && (
                        <tr
                          className="border-b border-[rgba(20,18,16,0.06)] bg-[rgba(20,18,16,0.02)]"
                        >
                          <td colSpan={6} className="px-6 py-5">
                            <dl className="grid gap-x-8 gap-y-3 text-[13px] md:grid-cols-2">
                              <DetailRow label="Phone" value={r.phone} />
                              <DetailRow
                                label="Marketing consent"
                                value={r.marketing_consent ? "Yes" : "No"}
                              />
                              <DetailRow
                                label="School authorisation"
                                value={r.school_authorised ? "Confirmed" : "—"}
                              />
                              <DetailRow
                                label="Submission ID"
                                value={r.id}
                                mono
                              />
                              {r.comments && (
                                <div className="md:col-span-2">
                                  <dt
                                    className="font-mono text-[10.5px] font-semibold uppercase text-[#6b6459]"
                                    style={{ letterSpacing: "0.20em" }}
                                  >
                                    Comments
                                  </dt>
                                  <dd className="mt-1.5 whitespace-pre-wrap text-[13.5px] leading-[1.55] text-[#141210]">
                                    {r.comments}
                                  </dd>
                                </div>
                              )}
                            </dl>
                          </td>
                        </tr>
                      )}
                    </Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </>
  );
}

function DetailRow({
  label,
  value,
  mono,
}: {
  label: string;
  value: string;
  mono?: boolean;
}) {
  return (
    <div>
      <dt
        className="font-mono text-[10.5px] font-semibold uppercase text-[#6b6459]"
        style={{ letterSpacing: "0.20em" }}
      >
        {label}
      </dt>
      <dd
        className={`mt-1 text-[13.5px] text-[#141210] ${
          mono ? "font-mono text-[12px]" : ""
        }`}
      >
        {value}
      </dd>
    </div>
  );
}

function formatDate(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleString("en-AU", {
    day: "2-digit",
    month: "short",
    year: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function exportCsv(rows: Registration[]) {
  const headers = [
    "Received",
    "School",
    "Suburb",
    "Contact",
    "Role",
    "Email",
    "Phone",
    "Students",
    "Year levels",
    "Marketing consent",
    "School authorised",
    "Comments",
  ];
  const csvRows = rows.map((r) => [
    formatDate(r.created_at),
    r.school_name,
    r.suburb,
    r.contact_name,
    r.contact_role,
    r.email,
    r.phone,
    String(r.student_count),
    r.year_levels,
    r.marketing_consent ? "yes" : "no",
    r.school_authorised ? "yes" : "no",
    r.comments ?? "",
  ]);
  const csv = [headers, ...csvRows]
    .map((row) => row.map(escapeCsvCell).join(","))
    .join("\r\n");
  const blob = new Blob([`﻿${csv}`], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `youth-futures-registrations-${new Date()
    .toISOString()
    .slice(0, 10)}.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

function escapeCsvCell(v: string): string {
  if (/[",\r\n]/.test(v)) {
    return `"${v.replace(/"/g, '""')}"`;
  }
  return v;
}
