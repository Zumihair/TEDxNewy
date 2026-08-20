import { NextResponse } from "next/server";
import { requireFullAdmin } from "@/lib/cms-auth";
import { getServerSupabase } from "@/lib/supabase-server";
import { apolloConfigured, bestJournalistAtDomain } from "@/lib/apollo";
import { OUTLETS } from "@/lib/media";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
// Up to 4 outlets per batch, each a search plus (at most) one reveal.
export const maxDuration = 60;

const BATCH = 4;

/**
 * Fill the media list from the curated outlet roster: for each outlet not
 * yet on the board, find its best journalist via Apollo and reveal their
 * email (at most one credit per outlet). Outlets where Apollo finds nobody
 * get a "News desk" placeholder row so they stay visible for manual filling
 * and are not retried every run.
 */
export async function POST() {
  await requireFullAdmin();
  if (!apolloConfigured()) {
    return NextResponse.json(
      { error: "APOLLO_API_KEY is not set on this environment." },
      { status: 400 },
    );
  }

  const supabase = await getServerSupabase();
  const { data: existing, error: readErr } = await supabase
    .from("cms_media_contacts")
    .select("outlet");
  if (readErr) {
    return NextResponse.json({ error: readErr.message }, { status: 500 });
  }
  const have = new Set(
    (existing as { outlet: string }[]).map((r) => r.outlet.toLowerCase()),
  );

  const missing = OUTLETS.filter((o) => !have.has(o.name.toLowerCase()));
  const batch = missing.slice(0, BATCH);

  const added: { outlet: string; contact: string | null }[] = [];
  let creditsSpent = 0;
  let contactError: string | null = null;

  for (const outlet of batch) {
    const res = await bestJournalistAtDomain(
      outlet.domain,
      outlet.requireNewcastle,
    );
    if (!res.ok) {
      contactError = contactError ?? res.error;
      continue;
    }
    const person = res.data;
    if (person?.email) creditsSpent++;
    const row = {
      full_name: person?.name ?? "News desk",
      outlet: outlet.name,
      title: person?.title ?? null,
      email: person?.email ?? null,
      linkedin_url: person?.linkedinUrl ?? null,
      source: "apollo",
      notes: person
        ? null
        : `Apollo found no journalist at ${outlet.domain}; add a contact manually.`,
    };
    const { error: insErr } = await supabase
      .from("cms_media_contacts")
      .insert(row);
    if (insErr) {
      contactError = contactError ?? insErr.message;
      continue;
    }
    added.push({ outlet: outlet.name, contact: person?.name ?? null });
  }

  return NextResponse.json({
    added,
    creditsSpent,
    contactError,
    remaining: Math.max(0, missing.length - batch.length),
  });
}
