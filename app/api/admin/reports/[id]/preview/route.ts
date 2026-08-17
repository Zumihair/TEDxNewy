import { type NextRequest, NextResponse } from "next/server";
import { requireFullAdmin } from "@/lib/cms-auth";
import { getReport, ACKNOWLEDGEMENT_TEXT } from "@/lib/event-reports";
import { renderReportHtml } from "@/lib/report-render";
import { parseConfig } from "@/lib/report-schema";
import { siteOrigin } from "@/lib/request-origin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * The report as a bare HTML document (no admin chrome, no site nav).
 *
 * GET  renders the saved config. `?print=1` adds an auto-print script so the
 *      tab opens straight into the browser's Save as PDF dialog: the no-
 *      dependency fallback if server-side PDF generation is ever unavailable.
 * POST renders a config sent in the body without saving it, for the editor's
 *      live preview iframe (`srcdoc`).
 */

export async function GET(
  req: NextRequest,
  ctx: { params: Promise<{ id: string }> },
) {
  await requireFullAdmin();
  const { id } = await ctx.params;
  const report = await getReport(id);
  if (!report) return new NextResponse("Not found", { status: 404 });
  const html = renderReportHtml(report.config, {
    origin: siteOrigin(req),
    acknowledgement: ACKNOWLEDGEMENT_TEXT,
    autoPrint: req.nextUrl.searchParams.get("print") === "1",
  });
  return new NextResponse(html, {
    headers: {
      "content-type": "text/html; charset=utf-8",
      "cache-control": "no-store",
      "x-robots-tag": "noindex",
    },
  });
}

export async function POST(
  req: NextRequest,
  ctx: { params: Promise<{ id: string }> },
) {
  await requireFullAdmin();
  await ctx.params;
  let body: unknown = null;
  try {
    body = await req.json();
  } catch {
    return new NextResponse("Bad request", { status: 400 });
  }
  const config = parseConfig((body as { config?: unknown } | null)?.config);
  const html = renderReportHtml(config, {
    origin: siteOrigin(req),
    acknowledgement: ACKNOWLEDGEMENT_TEXT,
  });
  return new NextResponse(html, {
    headers: {
      "content-type": "text/html; charset=utf-8",
      "cache-control": "no-store",
    },
  });
}
