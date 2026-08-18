import { type NextRequest, NextResponse } from "next/server";
import { requireFullAdmin } from "@/lib/cms-auth";
import { getServerSupabase } from "@/lib/supabase-server";
import { getPartner, logPartnerEvent } from "@/lib/partners";
import { apolloConfigured, findPeopleAtDomain, revealPerson } from "@/lib/apollo";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function domainOf(website: string | null): string | null {
  if (!website) return null;
  try {
    const url = new URL(website.startsWith("http") ? website : `https://${website}`);
    return url.hostname.replace(/^www\./, "");
  } catch {
    return null;
  }
}

/** GET: candidate contacts at the partner's domain (no credits spent). */
export async function GET(
  _req: NextRequest,
  ctx: { params: Promise<{ id: string }> },
) {
  await requireFullAdmin();
  if (!apolloConfigured()) {
    return NextResponse.json(
      { error: "Apollo isn't configured (APOLLO_API_KEY)." },
      { status: 400 },
    );
  }
  const { id } = await ctx.params;
  const partner = await getPartner(id);
  if (!partner) return NextResponse.json({ error: "Partner not found." }, { status: 404 });
  const domain = domainOf(partner.website);
  if (!domain) {
    return NextResponse.json(
      { error: "Add the organisation's website first, so Apollo knows the domain." },
      { status: 400 },
    );
  }
  const res = await findPeopleAtDomain(domain);
  if (!res.ok) return NextResponse.json({ error: res.error }, { status: 502 });
  return NextResponse.json({ domain, people: res.data });
}

/**
 * POST { personId, name?, title? }: reveal that person's email (spends one
 * Apollo credit), write them onto the partner row, log a timeline event.
 */
export async function POST(
  req: NextRequest,
  ctx: { params: Promise<{ id: string }> },
) {
  const { email: admin } = await requireFullAdmin();
  if (!apolloConfigured()) {
    return NextResponse.json(
      { error: "Apollo isn't configured (APOLLO_API_KEY)." },
      { status: 400 },
    );
  }
  const { id } = await ctx.params;
  const partner = await getPartner(id);
  if (!partner) return NextResponse.json({ error: "Partner not found." }, { status: 404 });

  const body = (await req.json().catch(() => null)) as {
    personId?: string;
  } | null;
  if (!body?.personId) {
    return NextResponse.json({ error: "personId is required." }, { status: 400 });
  }

  const res = await revealPerson(body.personId);
  if (!res.ok) return NextResponse.json({ error: res.error }, { status: 502 });
  const person = res.data;
  if (!person.email) {
    return NextResponse.json(
      {
        error:
          "Apollo has no verified email for this person (or the account is out of email credits). Their name and title were not saved.",
      },
      { status: 422 },
    );
  }

  const supabase = await getServerSupabase();
  await supabase
    .from("cms_partners")
    .update({
      contact_name: person.name,
      email: person.email.toLowerCase(),
      updated_at: new Date().toISOString(),
    })
    .eq("id", id);
  await logPartnerEvent(
    id,
    "note",
    `Contact found via Apollo: ${person.name}${person.title ? `, ${person.title}` : ""} (${person.email})`,
    person.linkedinUrl,
    admin,
  );

  return NextResponse.json({ person });
}
