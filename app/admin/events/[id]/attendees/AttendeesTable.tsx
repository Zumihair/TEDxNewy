"use client";

import { Download } from "lucide-react";
import { Badge, Card } from "../../../ui";
import type { EventAttendee } from "@/lib/event-feedback";

function feedbackState(a: EventAttendee): {
  label: string;
  tone: "neutral" | "red" | "live" | "soon" | "draft";
} {
  if (a.feedbackCompletedAt) return { label: "Completed", tone: "live" };
  if (a.feedbackRemindedAt) return { label: "Reminded", tone: "soon" };
  if (a.feedbackRequestedAt) return { label: "Asked", tone: "soon" };
  return { label: "Not asked", tone: "neutral" };
}

function detailSummary(a: EventAttendee): string {
  const d = a.details ?? {};
  const parts: string[] = [];
  // Youth Futures Lab (and anything else keyed this way): the school is the
  // headline detail, so it goes first rather than getting silently dropped
  // by fields this summary only used to know about from Talk Night.
  const school = d.school_name;
  if (typeof school === "string" && school) parts.push(school);
  const studentCount = d.student_count;
  if (studentCount != null && studentCount !== "") {
    parts.push(`${studentCount} student${studentCount === 1 || studentCount === "1" ? "" : "s"}`);
  }
  const at = d.attendance_type;
  if (typeof at === "string" && at) parts.push(at);
  const idea = d.idea ?? d.reason;
  if (typeof idea === "string" && idea) {
    parts.push(idea.length > 80 ? `${idea.slice(0, 80)}…` : idea);
  }
  return parts.join(" · ");
}

function csvCell(v: unknown): string {
  const s = v == null ? "" : String(v);
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

export default function AttendeesTable({
  attendees,
  eventTitle,
}: {
  attendees: EventAttendee[];
  eventTitle: string;
}) {
  const exportCsv = () => {
    const header = [
      "full_name",
      "email",
      "role",
      "school",
      "attendance_type",
      "idea_or_reason",
      "feedback_requested_at",
      "feedback_reminded_at",
      "feedback_completed_at",
    ];
    const lines = attendees.map((a) =>
      [
        a.fullName,
        a.email,
        a.role,
        (a.details?.school_name as string) ?? "",
        (a.details?.attendance_type as string) ?? "",
        (a.details?.idea as string) ?? (a.details?.reason as string) ?? "",
        a.feedbackRequestedAt ?? "",
        a.feedbackRemindedAt ?? "",
        a.feedbackCompletedAt ?? "",
      ]
        .map(csvCell)
        .join(","),
    );
    const csv = [header.join(","), ...lines].join("\r\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    const safe = eventTitle.toLowerCase().replace(/[^a-z0-9]+/g, "-");
    a.download = `${safe}-attendees.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (attendees.length === 0) {
    return (
      <div className="rounded-[var(--radius-md)] border border-dashed border-[rgba(20,18,16,0.15)] bg-[#f9f5ec] px-6 py-16 text-center">
        <p className="text-[15px] text-[#2a2521]">
          No attendees yet. Import from a registration table or CSV above.
        </p>
      </div>
    );
  }

  return (
    <Card>
      <div className="flex items-center justify-between px-4 py-3 md:px-5">
        <div className="text-[13px] font-medium text-[#141210]">
          {attendees.length} {attendees.length === 1 ? "person" : "people"}
        </div>
        <button
          type="button"
          onClick={exportCsv}
          className="inline-flex items-center gap-1.5 rounded-full bg-[rgba(20,18,16,0.06)] px-3 py-1.5 text-[12px] font-medium text-[#141210] transition-colors hover:bg-[rgba(20,18,16,0.10)]"
        >
          <Download className="h-3.5 w-3.5" strokeWidth={2.25} />
          Export CSV
        </button>
      </div>
      <div className="overflow-x-auto border-t border-[rgba(20,18,16,0.08)]">
        <table className="w-full min-w-[640px] text-left text-[13.5px]">
          <thead>
            <tr className="text-[11px] uppercase tracking-[0.08em] text-[#8a8278]">
              <th className="px-4 py-2.5 font-semibold md:px-5">Name</th>
              <th className="px-4 py-2.5 font-semibold">Email</th>
              <th className="px-4 py-2.5 font-semibold">Role</th>
              <th className="px-4 py-2.5 font-semibold">Feedback</th>
              <th className="px-4 py-2.5 font-semibold">Details</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[rgba(20,18,16,0.06)]">
            {attendees.map((a) => {
              const state = feedbackState(a);
              return (
                <tr key={a.id} className="align-top">
                  <td className="px-4 py-3 font-medium text-[#141210] md:px-5">
                    {a.fullName}
                  </td>
                  <td className="px-4 py-3 text-[#2a2521]">{a.email}</td>
                  <td className="px-4 py-3">
                    <Badge tone="neutral">{a.role}</Badge>
                  </td>
                  <td className="px-4 py-3">
                    <Badge tone={state.tone}>{state.label}</Badge>
                  </td>
                  <td className="px-4 py-3 text-[12.5px] text-[#6b6459]">
                    {detailSummary(a)}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </Card>
  );
}
