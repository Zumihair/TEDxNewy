"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { getSessionUser, requireFullAdmin } from "@/lib/cms-auth";
import {
  createReport,
  deleteReport,
  getEventImpactData,
  getReportEvent,
  seedConfig,
  updateReport,
} from "@/lib/event-reports";
import { parseConfig, type ReportKind, type ReportStatus } from "@/lib/report-schema";
import { flashUrl } from "../../../flash";

function listPath(eventId: string) {
  return `/admin/events/${encodeURIComponent(eventId)}/reports`;
}
function editorPath(eventId: string, reportId: string) {
  return `${listPath(eventId)}/${encodeURIComponent(reportId)}`;
}

/**
 * Where to land on an error (or after a delete). `ReportsListContent.tsx`
 * is rendered both on its own standalone page AND inside the Events list's
 * Impact-report chip modal (app/admin/events/page.tsx). Its forms carry a
 * hidden `returnTo` field so a submit lands back wherever it was opened
 * from. Falls back to the standalone list page's own path if omitted.
 * Doesn't apply to a successful create, which always opens the (never
 * modal-ized) editor regardless of context.
 */
function returnPath(formData: FormData, eventId: string): string {
  return String(formData.get("returnTo") ?? "").trim() || listPath(eventId);
}

/** New report, seeded from the event's live data, then straight into the editor. */
export async function createReportAction(formData: FormData) {
  await requireFullAdmin();
  const eventId = String(formData.get("eventId") ?? "");
  const kindRaw = String(formData.get("kind") ?? "overview");
  const kind: ReportKind = kindRaw === "highlight" ? "highlight" : "overview";
  const titleIn = String(formData.get("title") ?? "").trim();
  if (!eventId) return;
  const back = returnPath(formData, eventId);

  const event = await getReportEvent(eventId);
  if (!event) redirect(flashUrl(back, "Event not found.", "error"));

  const data = await getEventImpactData(event);
  const config = seedConfig(data, kind);
  const user = await getSessionUser();
  const title = titleIn || (kind === "highlight" ? `${event.title} highlights` : `${event.title} impact report`);

  const result = await createReport({
    eventId,
    title,
    kind,
    config,
    createdBy: user?.email ?? null,
  });
  if ("error" in result) {
    redirect(flashUrl(back, result.error, "error"));
  }
  revalidatePath(listPath(eventId));
  redirect(editorPath(eventId, result.id));
}

export type SaveResult = { ok: true; savedAt: string } | { ok: false; error: string };

/** Save from the editor. Called with useTransition, no redirect. */
export async function saveReportAction(input: {
  eventId: string;
  reportId: string;
  title: string;
  status: ReportStatus;
  config: unknown;
}): Promise<SaveResult> {
  await requireFullAdmin();
  const title = input.title.trim() || "Impact report";
  const status: ReportStatus = input.status === "final" ? "final" : "draft";
  const config = parseConfig(input.config);
  const error = await updateReport(input.reportId, { title, status, config });
  if (error) return { ok: false, error };
  revalidatePath(listPath(input.eventId));
  revalidatePath(editorPath(input.eventId, input.reportId));
  return { ok: true, savedAt: new Date().toISOString() };
}

export async function deleteReportAction(formData: FormData) {
  await requireFullAdmin();
  const eventId = String(formData.get("eventId") ?? "");
  const reportId = String(formData.get("reportId") ?? "");
  if (!eventId || !reportId) return;
  const back = returnPath(formData, eventId);
  const error = await deleteReport(reportId);
  revalidatePath(listPath(eventId));
  redirect(
    error ? flashUrl(back, error, "error") : flashUrl(back, "Report deleted."),
  );
}
