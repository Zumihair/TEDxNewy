/**
 * Partnerships portal data layer.
 *
 * A light CRM over two tables: `cms_partners` (one row per organisation)
 * and `cms_partner_events` (the activity timeline: emails, status changes,
 * notes, prospectus generations). Server-only; every reader returns null on
 * a missing table so the pages can show the NotSetUp state pre-migration.
 */

import { getServerSupabase } from "./supabase-server";
import type { ProspectusTier } from "./prospectus-render";

export type PartnerStatus =
  | "prospect"
  | "contacted"
  | "in_discussion"
  | "confirmed"
  | "declined"
  | "dormant";

export const STATUSES: { id: PartnerStatus; label: string; hint: string }[] = [
  { id: "prospect", label: "Prospect", hint: "Identified, not yet approached" },
  { id: "contacted", label: "Contacted", hint: "First email or call made" },
  { id: "in_discussion", label: "In discussion", hint: "Talking terms" },
  { id: "confirmed", label: "Confirmed", hint: "Signed on" },
  { id: "declined", label: "Declined", hint: "Said no this year" },
  { id: "dormant", label: "Dormant", hint: "Parked for later" },
];

export type Partner = {
  id: string;
  orgName: string;
  contactName: string | null;
  email: string | null;
  phone: string | null;
  website: string | null;
  category: string | null;
  targetTier: ProspectusTier | null;
  status: PartnerStatus;
  notes: string | null;
  prospectusUrl: string | null;
  prospectusGeneratedAt: string | null;
  lastContactedAt: string | null;
  /** Brand assets, collected once a partner is confirmed. */
  logoLightUrl: string | null;
  logoDarkUrl: string | null;
  createdAt: string;
};

export type PartnerEvent = {
  id: string;
  kind: "email" | "status" | "note" | "prospectus";
  summary: string;
  detail: string | null;
  createdBy: string | null;
  createdAt: string;
};

type Row = Record<string, unknown>;

const s = (r: Row, k: string): string | null =>
  typeof r[k] === "string" && (r[k] as string).length > 0 ? (r[k] as string) : null;

function toPartner(r: Row): Partner {
  const tier = s(r, "target_tier");
  const status = s(r, "status") ?? "prospect";
  return {
    id: String(r.id),
    orgName: s(r, "org_name") ?? "(unnamed)",
    contactName: s(r, "contact_name"),
    email: s(r, "email"),
    phone: s(r, "phone"),
    website: s(r, "website"),
    category: s(r, "category"),
    targetTier:
      tier === "presenting" ||
      tier === "platinum" ||
      tier === "gold" ||
      tier === "community" ||
      tier === "in_kind"
        ? tier
        : null,
    status: (STATUSES.some((x) => x.id === status) ? status : "prospect") as PartnerStatus,
    notes: s(r, "notes"),
    prospectusUrl: s(r, "prospectus_url"),
    prospectusGeneratedAt: s(r, "prospectus_generated_at"),
    lastContactedAt: s(r, "last_contacted_at"),
    logoLightUrl: s(r, "logo_light_url"),
    logoDarkUrl: s(r, "logo_dark_url"),
    createdAt: s(r, "created_at") ?? new Date(0).toISOString(),
  };
}

/** All partners, or null when the table is missing (migration not applied). */
export async function listPartners(): Promise<Partner[] | null> {
  const supabase = await getServerSupabase();
  const { data, error } = await supabase
    .from("cms_partners")
    .select("*")
    .order("updated_at", { ascending: false });
  if (error) {
    if (error.code === "42P01") return null;
    console.error("[partners] list", error);
    return [];
  }
  return (data as Row[]).map(toPartner);
}

export async function getPartner(id: string): Promise<Partner | null> {
  const supabase = await getServerSupabase();
  const { data } = await supabase
    .from("cms_partners")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  return data ? toPartner(data as Row) : null;
}

export async function listPartnerEvents(partnerId: string): Promise<PartnerEvent[]> {
  const supabase = await getServerSupabase();
  const { data } = await supabase
    .from("cms_partner_events")
    .select("id, kind, summary, detail, created_by, created_at")
    .eq("partner_id", partnerId)
    .order("created_at", { ascending: false })
    .limit(100);
  return ((data ?? []) as Row[]).map((r) => ({
    id: String(r.id),
    kind: (s(r, "kind") ?? "note") as PartnerEvent["kind"],
    summary: s(r, "summary") ?? "",
    detail: s(r, "detail"),
    createdBy: s(r, "created_by"),
    createdAt: s(r, "created_at") ?? "",
  }));
}

/** Append a timeline event. Best-effort: a logging failure never blocks. */
export async function logPartnerEvent(
  partnerId: string,
  kind: PartnerEvent["kind"],
  summary: string,
  detail?: string | null,
  createdBy?: string | null,
): Promise<void> {
  try {
    const supabase = await getServerSupabase();
    await supabase.from("cms_partner_events").insert({
      partner_id: partnerId,
      kind,
      summary,
      detail: detail ?? null,
      created_by: createdBy ?? null,
    });
  } catch (err) {
    console.error("[partners] log event", err);
  }
}
