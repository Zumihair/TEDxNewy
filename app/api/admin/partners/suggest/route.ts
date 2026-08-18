import { type NextRequest, NextResponse } from "next/server";
import { requireFullAdmin } from "@/lib/cms-auth";
import { getServerSupabase } from "@/lib/supabase-server";
import { logPartnerEvent } from "@/lib/partners";
import {
  apolloConfigured,
  bestContactAtDomain,
  suggestOrganisations,
} from "@/lib/apollo";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
// Each batch makes up to ~20 Apollo calls (org page + search+reveal per org).
export const maxDuration = 60;

/**
 * Organisations that must never appear as prospects: current partners and
 * sponsors, orgs Jake has explicitly excluded, and ourselves. Matched on
 * exact name (lowercased) or domain.
 */
const EXCLUDED_NAMES = new Set(
  [
    "nib",
    "nib group",
    "nib health funds",
    "university of newcastle",
    "the university of newcastle",
    "hunter business chamber",
    "business hunter",
    "henderson",
    "henderson advocacy",
    "newy digital",
    "frekl",
    "the base",
    "the base health",
    "super radio network",
    "elqo",
    "tedxnewy",
    "newcastle ideas network",
  ].map((s) => s.toLowerCase()),
);
const EXCLUDED_DOMAINS = new Set([
  "nib.com.au",
  "newcastle.edu.au",
  "hunterbusinesschamber.com.au",
  "businesshunter.com",
  "henderson.com.au",
  "newydigital.com",
  "frekl.com.au",
  "thebasehealth.com.au",
  "srn.com.au",
  "elqo.app",
  "tedxnewy.com.au",
]);

const norm = (s: string) => s.trim().toLowerCase();
const domainOf = (website: string | null): string | null => {
  if (!website) return null;
  try {
    const u = new URL(website.startsWith("http") ? website : `https://${website}`);
    return u.hostname.replace(/^www\./, "").toLowerCase();
  } catch {
    return null;
  }
};

function isExcluded(name: string, domain: string | null): boolean {
  if (EXCLUDED_NAMES.has(norm(name))) return true;
  if (domain && EXCLUDED_DOMAINS.has(domain)) return true;
  return false;
}

/**
 * POST { page?, fillOnly? }: one batch of pipeline building.
 *
 * Two phases per call, both bounded so the whole thing fits a 60s window:
 *  1. Backfill: up to 4 existing partners that have a website but no email
 *     get a contact found and revealed via Apollo.
 *  2. Discover (unless fillOnly): from Apollo's Newcastle org search at
 *     `page`, insert up to 6 organisations we don't already track, each with
 *     a contact pulled the same way.
 *
 * The client loops, advancing `page`, until it reaches its target or Apollo
 * runs out of organisations. Each revealed email costs one Apollo credit;
 * name/title still land when a reveal fails, so a credit ceiling degrades
 * the run rather than killing it.
 */
export async function POST(req: NextRequest) {
  const { email: admin } = await requireFullAdmin();
  if (!apolloConfigured()) {
    return NextResponse.json(
      { error: "Apollo isn't configured (APOLLO_API_KEY)." },
      { status: 400 },
    );
  }
  const body = (await req.json().catch(() => ({}))) as {
    page?: number;
    fillOnly?: boolean;
  };
  const page = Math.max(1, Math.min(25, Math.trunc(body.page ?? 1)));

  const supabase = await getServerSupabase();
  const { data: existingRows } = await supabase
    .from("cms_partners")
    .select("id, org_name, website, email, contact_name");
  const rows = (existingRows ?? []) as {
    id: string;
    org_name: string;
    website: string | null;
    email: string | null;
    contact_name: string | null;
  }[];

  const known = new Set<string>();
  for (const r of rows) {
    known.add(norm(r.org_name));
    const d = domainOf(r.website);
    if (d) known.add(d);
  }

  const contactsFilled: string[] = [];
  const added: { org: string; contact: string | null }[] = [];
  let creditsSpent = 0;
  // The first reason a contact pull failed, surfaced to the UI. During the
  // first big run these failures were swallowed and 60+ orgs landed with no
  // contacts and no explanation; never let that happen silently again.
  let contactError: string | null = null;

  // Phase 1: backfill contacts on rows that need one.
  const needingContact = rows
    .filter((r) => !r.email && domainOf(r.website))
    .slice(0, 4);
  for (const r of needingContact) {
    const d = domainOf(r.website);
    if (!d) continue;
    const res = await bestContactAtDomain(d);
    if (!res.ok) {
      contactError ??= res.error;
      continue;
    }
    if (!res.data) continue;
    const person = res.data;
    if (person.email) creditsSpent++;
    await supabase
      .from("cms_partners")
      .update({
        contact_name: person.name,
        email: person.email?.toLowerCase() ?? null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", r.id);
    await logPartnerEvent(
      r.id,
      "note",
      `Contact found via Apollo: ${person.name}${person.title ? `, ${person.title}` : ""}${person.email ? ` (${person.email})` : " (no email available)"}`,
      person.linkedinUrl,
      admin,
    );
    contactsFilled.push(`${r.org_name}: ${person.name}`);
  }

  // Phase 2: discover new organisations at this page.
  let exhausted = false;
  if (!body.fillOnly) {
    const orgsRes = await suggestOrganisations(page);
    if (!orgsRes.ok) {
      return NextResponse.json(
        { error: orgsRes.error, contactsFilled, added, page, creditsSpent },
        { status: contactsFilled.length || added.length ? 200 : 502 },
      );
    }
    exhausted = orgsRes.data.length === 0;
    for (const org of orgsRes.data) {
      if (added.length >= 6) break;
      const d = org.domain?.toLowerCase() ?? domainOf(org.website);
      if (known.has(norm(org.name)) || (d && known.has(d))) continue;
      if (isExcluded(org.name, d)) continue;

      const { data: inserted, error } = await supabase
        .from("cms_partners")
        .insert({
          org_name: org.name,
          website: org.website ?? (d ? `https://${d}` : null),
          category: org.industry,
          notes: [
            "Suggested via Apollo.",
            org.employees ? `~${org.employees} employees.` : null,
            org.linkedinUrl,
          ]
            .filter(Boolean)
            .join(" "),
          created_by: admin,
        })
        .select("id")
        .single();
      if (error || !inserted) continue;
      known.add(norm(org.name));
      if (d) known.add(d);

      // Pull their contact straight away, as requested: every prospect
      // arrives with a person attached where Apollo has one.
      let contactLabel: string | null = null;
      if (d) {
        const res = await bestContactAtDomain(d);
        if (!res.ok) contactError ??= res.error;
        if (res.ok && res.data) {
          const person = res.data;
          if (person.email) creditsSpent++;
          await supabase
            .from("cms_partners")
            .update({
              contact_name: person.name,
              email: person.email?.toLowerCase() ?? null,
            })
            .eq("id", inserted.id);
          await logPartnerEvent(
            inserted.id,
            "note",
            `Contact found via Apollo: ${person.name}${person.title ? `, ${person.title}` : ""}${person.email ? ` (${person.email})` : " (no email available)"}`,
            person.linkedinUrl,
            admin,
          );
          contactLabel = person.name;
        }
      }
      added.push({ org: org.name, contact: contactLabel });
    }
  }

  const total = rows.length + added.length;
  return NextResponse.json({
    added,
    contactsFilled,
    creditsSpent,
    contactError,
    page,
    exhausted,
    total,
  });
}
