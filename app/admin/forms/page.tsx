import Link from "next/link";
import { requireFullAdmin } from "@/lib/cms-auth";
import { getServerSupabase } from "@/lib/supabase-server";
import { Icon } from "@/components/ds";
import { PageHeader } from "../ui";
import { VISIBLE_FORMS } from "./registry";

export const metadata = {
  title: "Inbox · Admin · TEDxNewy",
};

export default async function AdminFormsPage() {
  const supabase = await getServerSupabase();

  const [, counts] = await Promise.all([
    requireFullAdmin(),
    Promise.all(
      VISIBLE_FORMS.map((f) => {
        // See registry.ts: `filter` scopes a form that's really a filtered
        // slice of a table shared with something else (waitlist ->
        // subscribers where source = "signal-waitlist"), so its tile count
        // has to match what its own list actually shows.
        let q = supabase.from(f.table).select("*", { count: "exact", head: true });
        if (f.filter) q = q.eq(f.filter.column, f.filter.value);
        return q;
      }),
    ),
  ]);

  const tiles = VISIBLE_FORMS.map((f, i) => ({
    slug: f.slug,
    label: f.label,
    count: counts[i]?.count ?? 0,
  }));
  const total = tiles.reduce((acc, t) => acc + t.count, 0);

  return (
    <div className="adm-stack">
      <PageHeader
        title="Inbox"
        description={`${total.toLocaleString("en-AU")} submissions across ${tiles.length} forms. Pick one to read, tag and reply.`}
      />

      <div className="adm-grid adm-grid--cards">
        {tiles.map((t) => (
          <Link key={t.slug} href={`/admin/forms/${t.slug}`} className="adm-card adm-card--count">
            <div className="adm-card__top">
              <span className="adm-card__title">{t.label}</span>
              <Icon name="arrow-up-right" size={16} />
            </div>
            <span className="adm-count">{t.count.toLocaleString("en-AU")}</span>
          </Link>
        ))}
      </div>
    </div>
  );
}
