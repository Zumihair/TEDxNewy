import { type NextRequest, NextResponse } from "next/server";
import { put } from "@vercel/blob";
import { requireFullAdmin } from "@/lib/cms-auth";
import {
  getReport,
  getReportEvent,
  updateReport,
  ACKNOWLEDGEMENT_TEXT,
} from "@/lib/event-reports";
import { renderReportHtml } from "@/lib/report-render";
import { siteOrigin } from "@/lib/request-origin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
// Chromium cold start + a 10-page render with remote photos can take a while.
export const maxDuration = 60;

/**
 * POST: render the saved report to PDF with headless Chromium, store it on
 * Vercel Blob (same store as the event photos) and stamp the URL on the row.
 *
 * On Vercel this uses @sparticuz/chromium (a Lambda-sized Chromium build).
 * Locally set CHROME_EXECUTABLE_PATH to a Chrome/Edge binary. If Chromium
 * cannot launch, the editor's "Open print view" path (browser Save as PDF)
 * still works, so this route failing is never blocking.
 */
export async function POST(
  req: NextRequest,
  ctx: { params: Promise<{ id: string }> },
) {
  await requireFullAdmin();
  const { id } = await ctx.params;
  const report = await getReport(id);
  if (!report) return NextResponse.json({ error: "Report not found." }, { status: 404 });
  const event = await getReportEvent(report.eventId);
  if (!event) return NextResponse.json({ error: "Event not found." }, { status: 404 });

  const token = process.env.BLOB_READ_WRITE_TOKEN;
  if (!token) {
    return NextResponse.json(
      { error: "BLOB_READ_WRITE_TOKEN is not set, so the PDF cannot be stored." },
      { status: 500 },
    );
  }

  const html = renderReportHtml(report.config, {
    origin: siteOrigin(req),
    acknowledgement: ACKNOWLEDGEMENT_TEXT,
  });

  let pdf: Uint8Array;
  try {
    pdf = await renderPdf(html);
  } catch (err) {
    console.error("[reports/pdf] chromium failed", err);
    return NextResponse.json(
      {
        error:
          "The PDF renderer could not start. Use \"Open print view\" and Save as PDF instead.",
        detail: err instanceof Error ? err.message : String(err),
      },
      { status: 500 },
    );
  }

  const stamp = new Date().toISOString().replace(/[:.]/g, "-");
  const pathname = `event-reports/${event.slug}/${slugify(report.title) || "report"}-${stamp}.pdf`;
  const blob = await put(pathname, Buffer.from(pdf), {
    access: "public",
    addRandomSuffix: false,
    contentType: "application/pdf",
    cacheControlMaxAge: 60 * 60 * 24 * 365,
    token,
  });

  const generatedAt = new Date().toISOString();
  const error = await updateReport(id, { pdfUrl: blob.url, pdfGeneratedAt: generatedAt });
  if (error) return NextResponse.json({ error }, { status: 500 });

  return NextResponse.json({ pdfUrl: blob.url, pdfGeneratedAt: generatedAt });
}

function slugify(s: string): string {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
}

async function renderPdf(html: string): Promise<Uint8Array> {
  // Dynamic imports keep these heavy packages out of every other route's
  // bundle and let the build succeed even where they are absent.
  const puppeteer = await import("puppeteer-core");
  let executablePath = process.env.CHROME_EXECUTABLE_PATH;
  let args: string[] = ["--no-sandbox", "--disable-setuid-sandbox"];
  if (!executablePath) {
    const chromium = (await import("@sparticuz/chromium")).default;
    executablePath = await chromium.executablePath();
    args = chromium.args;
  }
  const browser = await puppeteer.launch({
    args,
    executablePath,
    headless: true,
    defaultViewport: { width: 816, height: 1020, deviceScaleFactor: 2 },
  });
  try {
    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: "networkidle0", timeout: 45_000 });
    await page.evaluate(() => (document as unknown as { fonts: { ready: Promise<unknown> } }).fonts.ready);
    const pdf = await page.pdf({
      printBackground: true,
      preferCSSPageSize: true,
      margin: { top: 0, right: 0, bottom: 0, left: 0 },
    });
    return pdf;
  } finally {
    await browser.close();
  }
}
