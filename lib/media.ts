import "server-only";
import { getServerSupabase } from "./supabase-server";

/**
 * The media list: Newcastle journalists to pitch. One table, managed by hand
 * at /admin/media. (The Apollo list builder and the release composer were
 * removed 2026-10-17: contacts are kept by hand and emailed from Quick email.)
 */
export type MediaContact = {
  id: string;
  fullName: string;
  outlet: string;
  title: string | null;
  email: string | null;
  phone: string | null;
  linkedinUrl: string | null;
  notes: string | null;
  createdAt: string;
};

type MediaRow = {
  id: string;
  full_name: string;
  outlet: string;
  title: string | null;
  email: string | null;
  phone: string | null;
  linkedin_url: string | null;
  notes: string | null;
  created_at: string;
};

function rowToContact(r: MediaRow): MediaContact {
  return {
    id: r.id,
    fullName: r.full_name,
    outlet: r.outlet,
    title: r.title,
    email: r.email,
    phone: r.phone,
    linkedinUrl: r.linkedin_url,
    notes: r.notes,
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
