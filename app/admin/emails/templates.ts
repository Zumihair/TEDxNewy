import { getServerSupabase } from "@/lib/supabase-server";
import { validateBlocks, type NewsletterBlock } from "@/lib/newsletter-blocks";

/**
 * Admin-authored Quick Compose templates, stored in `compose_templates` so the
 * team can save a message they built (subject + blocks) and reuse it later.
 *
 * These sit alongside the built-in code templates in `lib/email-templates.ts`.
 * The built-ins are fixed starting points shipped with the site; these are
 * whatever the admins create and can delete.
 *
 * Everything here degrades quietly: if the table isn't there yet (migration not
 * applied), reads return an empty list rather than throwing, so Compose still
 * loads with just the built-in templates.
 */
export type SavedTemplate = {
  id: string;
  label: string;
  subject: string;
  blocks: NewsletterBlock[];
};

type Row = {
  id: string;
  label: string;
  subject: string;
  blocks: unknown;
};

/** All saved templates, newest first. Empty list on any error. */
export async function listSavedTemplates(): Promise<SavedTemplate[]> {
  try {
    const supabase = await getServerSupabase();
    const { data, error } = await supabase
      .from("compose_templates")
      .select("id, label, subject, blocks")
      .order("created_at", { ascending: false })
      .limit(100);
    if (error || !data) return [];
    return (data as Row[]).map((r) => ({
      id: r.id,
      label: r.label,
      subject: r.subject,
      // Re-validate on the way out: a template is just stored blocks, so the
      // same trust boundary the composer uses applies when we load it back.
      blocks: validateBlocks(r.blocks),
    }));
  } catch {
    return [];
  }
}
