import { type NextRequest, NextResponse } from "next/server";
import { put } from "@vercel/blob";
import { requireFullAdmin } from "@/lib/cms-auth";
import { getServerSupabase } from "@/lib/supabase-server";
import { getPartner, logPartnerEvent } from "@/lib/partners";
import { renderProspectusHtml } from "@/lib/prospectus-render";
import { siteOrigin } from "@/lib/request-origin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

/**
 * GET: the partner-personalised prospectus as an HTML print view (browser
 * Save as PDF fallback, and a quick visual check before generating).
 */
export async function GET(
  req: NextRequest,
  ctx: { params: Promise<{ id: string }> },
) {
  await requireFullAdmin();
  const { id } = await ctx.params;
  const partner = await getPartner(id);
  if (!partner) {
    return NextResponse.json({ error: "Partner not found." }, { status: 404 });
  }
  const html = renderProspectusHtml(
    {
      orgName: partner.orgName,
      contactName: partner.contactName,
      targetTier: partner.targetTier,
    },
    { origin: siteOrigin(req), autoPrint: req.nextUrl.searchParams.has("print") },
  );
  return new NextResponse(html, {
    headers: { "content-type": "text/html; charset=utf-8" },
  });
}

/**
 * POST: render the personalised prospectus to PDF with headless Chromium,
 * store it on Vercel Blob and stamp the URL on the partner row. Mirrors
 * app/api/admin/reports/[id]/pdf. If Chromium can't launch, GET ?print=1
 * (browser Save as PDF) still works, so this failing is never blocking.
 */
export async function POST(
  req: NextRequest,
  ctx: { params: Promise<{ id: string }> },
) {
  const { email: admin } = await requireFullAdmin();
  const { id } = await ctx.params;
  const partner = await getPartner(id);
  if (!partner) {
    return NextResponse.json({ error: "Partner not found." }, { status: 404 });
  }

  const token = process.env.BLOB_READ_WRITE_TOKEN;
  if (!token) {
    return NextResponse.json(
      { error: "BLOB_READ_WRITE_TOKEN is not set, so the PDF cannot be stored." },
      { status: 500 },
    );
  }

  const html = renderProspectusHtml(
    {
      orgName: partner.orgName,
      contactName: partner.contactName,
      targetTier: partner.targetTier,
    },
    { origin: siteOrigin(req) },
  );

  let pdf: Uint8Array;
  try {
    pdf = await renderPdf(html);
  } catch (err) {
    console.error("[partners/prospectus] chromium failed", err);
    return NextResponse.json(
      {
        error:
          'The PDF renderer could not start. Use "Print view" and Save as PDF instead.',
        detail: err instanceof Error ? err.message : String(err),
      },
      { status: 500 },
    );
  }

  const stamp = new Date().toISOString().replace(/[:.]/g, "-");
  const pathname = `partner-prospectus/${slugify(partner.orgName) || "partner"}-${stamp}.pdf`;
  const blob = await put(pathname, Buffer.from(pdf), {
    access: "public",
    addRandomSuffix: false,
    contentType: "application/pdf",
    cacheControlMaxAge: 60 * 60 * 24 * 365,
    token,
  });

  const generatedAt = new Date().toISOString();
  const supabase = await getServerSupabase();
  await supabase
    .from("cms_partners")
    .update({
      prospectus_url: blob.url,
      prospectus_generated_at: generatedAt,
      updated_at: generatedAt,
    })
    .eq("id", id);
  await logPartnerEvent(id, "prospectus", "Generated a personalised prospectus PDF", blob.url, admin);

  return NextResponse.json({ prospectusUrl: blob.url, generatedAt });
}

function slugify(s: string): string {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
}

async function renderPdf(html: string): Promise<Uint8Array> {
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
    defaultViewport: { width: 794, height: 1123, deviceScaleFactor: 2 },
  });
  try {
    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: "load", timeout: 45_000 });
    await page.waitForNetworkIdle({ idleTime: 500, timeout: 30_000 }).catch(() => {});
    await page.evaluate(
      () => (document as unknown as { fonts: { ready: Promise<unknown> } }).fonts.ready,
    );
    return await page.pdf({
      printBackground: true,
      preferCSSPageSize: true,
      margin: { top: 0, right: 0, bottom: 0, left: 0 },
    });
  } finally {
    await browser.close();
  }
}
