import { type NextRequest, NextResponse } from "next/server";
import { requireFullAdmin } from "@/lib/cms-auth";
import { getPartner } from "@/lib/partners";
import { renderProspectusHtml } from "@/lib/prospectus-render";
import { siteOrigin } from "@/lib/request-origin";

export const dynamic = "force-dynamic";

/**
 * The partner-personalised prospectus as plain HTML, opened in a new tab
 * from the partner page ("Open prospectus"). A partner-specific PDF used to
 * be generated server-side via headless Chromium; that route was dropped
 * (2026-08) after it proved unreliable in production, and this page does
 * everything it needs to on its own (a browser's Save as PDF covers the
 * rest, same as the impact reports' print view).
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
    { origin: siteOrigin(req) },
  );
  return new NextResponse(html, {
    headers: { "content-type": "text/html; charset=utf-8" },
  });
}
