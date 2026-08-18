import { NextResponse } from "next/server";
import { requireFullAdmin } from "@/lib/cms-auth";
import { getServerSupabase } from "@/lib/supabase-server";
import { apolloConfigured, suggestOrganisations } from "@/lib/apollo";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * POST: pull Newcastle-area organisations from Apollo and add the ones we
 * don't already track as prospects. Names and websites only — contacts are
 * found (and credits spent) per-partner, deliberately.
 */
export async function POST() {
  const { email: admin } = await requireFullAdmin();
  if (!apolloConfigured()) {
    return NextResponse.json(
      { error: "Apollo isn't configured (APOLLO_API_KEY)." },
      { status: 400 },
    );
  }

  const supabase = await getServerSupabase();
  const { data: existingRows } = await supabase
    .from("cms_partners")
    .select("org_name, website");
  const existing = new Set<string>();
  for (const r of (existingRows ?? []) as { org_name: string; website: string | null }[]) {
    existing.add(r.org_name.trim().toLowerCase());
    if (r.website) {
      existing.add(
        r.website.replace(/^https?:\/\//, "").replace(/^www\./, "").replace(/\/.*$/, "").toLowerCase(),
      );
    }
  }

  // Walk a couple of pages so repeat clicks keep finding fresh names.
  const added: string[] = [];
  for (let page = 1; page <= 3 && added.length < 8; page++) {
    const res = await suggestOrganisations(page);
    if (!res.ok) {
      if (added.length === 0) {
        return NextResponse.json({ error: res.error }, { status: 502 });
      }
      break;
    }
    for (const org of res.data) {
      if (added.length >= 8) break;
      const nameKey = org.name.trim().toLowerCase();
      const domainKey = org.domain?.toLowerCase() ?? "";
      if (existing.has(nameKey) || (domainKey && existing.has(domainKey))) continue;
      const { error } = await supabase.from("cms_partners").insert({
        org_name: org.name,
        website: org.website ?? (org.domain ? `https://${org.domain}` : null),
        category: org.industry,
        notes: [
          "Suggested via Apollo.",
          org.employees ? `~${org.employees} employees.` : null,
          org.linkedinUrl,
        ]
          .filter(Boolean)
          .join(" "),
        created_by: admin,
      });
      if (!error) {
        existing.add(nameKey);
        if (domainKey) existing.add(domainKey);
        added.push(org.name);
      }
    }
  }

  return NextResponse.json({ added });
}
