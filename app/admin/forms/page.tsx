import Link from "next/link";
import type { CSSProperties } from "react";
import { Inbox } from "lucide-react";
import { requireAdmin } from "@/lib/cms-auth";
import { getServerSupabase } from "@/lib/supabase-server";
import { PageHeader, SectionLabel } from "../ui";
import { THEMES } from "../section-theme";
import { VISIBLE_FORMS } from "./registry";

export const metadata = {
  title: "Form inbox · Admin · TEDxNewy",
};

export default async function AdminFormsPage() {
  const supabase = await getServerSupabase();

  const [, counts] = await Promise.all([
    requireAdmin(),
    Promise.all(
      VISIBLE_FORMS.map((f) =>
        supabase.from(f.table).select("*", { count: "exact", head: true }),
      ),
    ),
  ]);

  const tiles = VISIBLE_FORMS.map((f, i) => ({
    slug: f.slug,
    label: f.label,
    count: counts[i]?.count ?? 0,
  }));
  const total = tiles.reduce((acc, t) => acc + t.count, 0);
  const amber = THEMES.amber; // Forms is the amber section.

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Forms"
        title="Form inbox"
        description="Every submission from the site's forms, in one place. Pick a form to read, tag and reply to what has come in."
      />

      <section className="space-y-5">
        <SectionLabel>{total} total across all forms</SectionLabel>
        <ul className="grid auto-rows-[120px] grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {tiles.map((t) => (
            <li key={t.slug}>
              <Link
                href={`/admin/forms/${t.slug}`}
                style={
                  {
                    "--bc": amber.border,
                    "--bch": amber.borderHover,
                  } as CSSProperties
                }
                className="group flex h-full flex-col justify-between rounded-[var(--radius-md)] border-2 border-[color:var(--bc)] bg-white p-4 shadow-[var(--shadow-sm)] transition-all hover:-translate-y-0.5 hover:border-[color:var(--bch)] hover:shadow-[var(--shadow-md)]"
              >
                <div className="flex items-start justify-between">
                  <span
                    className="inline-flex h-9 w-9 items-center justify-center rounded-full"
                    style={{ backgroundColor: amber.chipBg, color: amber.chipFg }}
                    aria-hidden
                  >
                    <Inbox className="h-[18px] w-[18px]" strokeWidth={2.25} />
                  </span>
                  <span
                    className="font-sans font-medium leading-none tracking-[-0.02em] text-[#141210]"
                    style={{
                      fontSize: "clamp(1.5rem, 2.4vw, 1.9rem)",
                      fontVariationSettings: '"opsz" 144',
                    }}
                  >
                    {t.count}
                  </span>
                </div>
                <div className="font-sans text-[14.5px] font-medium leading-tight tracking-[-0.01em] text-[#141210]">
                  {t.label}
                </div>
              </Link>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
