import { getServerSupabase } from "@/lib/supabase-server";

export type EventOption = { id: string; label: string };

function yearOf(starts_at: string | null, date_label: string | null): string {
  if (starts_at) {
    const y = new Date(starts_at).getFullYear();
    if (!Number.isNaN(y)) return String(y);
  }
  if (date_label) {
    const m = date_label.match(/(20\d{2})/);
    if (m) return m[1];
  }
  return "";
}

/**
 * Event dropdown options for the talk + speaker forms: "Title (year)".
 * Reads the real cms_events rows (so the ids are valid uuids). Returns an empty
 * list if the table isn't there yet, which is the right state pre-migration.
 */
export async function getEventOptions(): Promise<EventOption[]> {
  const supabase = await getServerSupabase();
  const { data, error } = await supabase
    .from("cms_events")
    .select("id, title, starts_at, date_label")
    .order("starts_at", { ascending: false, nullsFirst: false })
    .order("display_order", { ascending: true });
  if (error || !data) return [];
  return data.map((e) => {
    const year = yearOf(e.starts_at ?? null, e.date_label ?? null);
    return {
      id: e.id as string,
      label: year ? `${e.title} (${year})` : (e.title as string),
    };
  });
}
