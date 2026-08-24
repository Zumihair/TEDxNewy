import "server-only";
import { getServerSupabase } from "./supabase-server";
import { MEDIA_STATUSES, type MediaContact, type MediaStatus } from "./media-constants";

/**
 * The media room: journalist contacts and the Signal media release.
 * Same shape as lib/partners.ts, deliberately smaller: one table, a status
 * per contact, sends logged to email_sends by the action that sends them.
 *
 * The types, statuses, sender list and release copy live in
 * `lib/media-constants.ts` (no Supabase dependency) and are re-exported
 * below so every existing "@/lib/media" import keeps working; only
 * `listMediaContacts` itself needs the server-only Supabase client. Import
 * from media-constants directly in a client component instead of here, or
 * the client bundle drags in `next/headers`.
 */
export * from "./media-constants";

type MediaRow = {
  id: string;
  full_name: string;
  outlet: string;
  title: string | null;
  email: string | null;
  phone: string | null;
  linkedin_url: string | null;
  status: string;
  notes: string | null;
  source: string | null;
  last_contacted_at: string | null;
  created_at: string;
};

const STATUS_IDS = MEDIA_STATUSES.map((s) => s.id);

function rowToContact(r: MediaRow): MediaContact {
  return {
    id: r.id,
    fullName: r.full_name,
    outlet: r.outlet,
    title: r.title,
    email: r.email,
    phone: r.phone,
    linkedinUrl: r.linkedin_url,
    status: (STATUS_IDS as string[]).includes(r.status)
      ? (r.status as MediaStatus)
      : "prospect",
    notes: r.notes,
    source: r.source,
    lastContactedAt: r.last_contacted_at,
    createdAt: r.created_at,
  };
}

export async function listMediaContacts(): Promise<MediaContact[]> {
  const supabase = await getServerSupabase();
  const { data, error } = await supabase
    .from("cms_media_contacts")
    .select("*")
    .order("outlet", { ascending: true })
    .order("full_name", { ascending: true });
  if (error || !data) return [];
  return (data as MediaRow[]).map(rowToContact);
}
