import type { NextRequest } from "next/server";

/** Absolute origin of the current deployment, from the proxy headers Vercel sets. */
export function siteOrigin(req: NextRequest): string {
  const host =
    req.headers.get("x-forwarded-host") ??
    req.headers.get("host") ??
    "tedxnewy.com.au";
  const proto =
    req.headers.get("x-forwarded-proto") ??
    (host.startsWith("localhost") ? "http" : "https");
  return `${proto}://${host}`;
}
