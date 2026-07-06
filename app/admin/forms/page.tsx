import Link from "next/link";
import { Inbox } from "lucide-react";
import { requireAdmin } from "@/lib/cms-auth";
import { getServerSupabase } from "@/lib/supabase-server";
import { PageHeader, SectionLabel } from "../ui";
import { FORM_REGISTRY } from "./registry";

export const metadata = {
  title: "Form inbox · Admin · TEDxNewy",
};

export default async function AdminFormsPage() {
  const supabase = await getServerSupabase();

  const [, counts] = await Promise.all([
    requireAdmin(),
    Promise.all(
      FORM_REGISTRY.map((f) =>
        supabase.from(f.table).select("*", { count: "exact", head: true }),
      ),
    ),
  ]);

  const tiles = FORM_REGISTRY.map((f, i) => ({
    slug: f.slug,
    label: f.label,
    count: counts[i]?.count ?? 0,
  }));
  const total = tiles.reduce((acc, t) => acc + t.count, 0);

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Forms"
        title="Form inbox"
        description="Every submission from the site's forms, in one place. Pick a form to read, tag and reply to what has come in."
      />

      <section className="space-y-5">
        <SectionLabel>{total} total across all forms</SectionLabel>
        <ul className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {tiles.map((t) => (
            <li key={t.slug}>
              <Link
                href={`/admin/forms/${t.slug}`}
                className="group flex h-full flex-col rounded-[var(--radius-md)] border border-[rgba(20,18,16,0.10)] bg-white p-4 transition-all hover:-translate-y-0.5 hover:border-[rgba(20,18,16,0.18)] hover:shadow-[var(--shadow-sm)]"
              >
                <div className="flex items-start justify-between gap-2">
                  <span
                    className="font-mono text-[10px] font-semibold uppercase leading-[1.35] text-[#6b6459]"
                    style={{ letterSpacing: "0.18em" }}
                  >
                    {t.label}
                  </span>
                  <Inbox
                    className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[#6b6459] group-hover:text-[#141210]"
                    strokeWidth={2.25}
                  />
                </div>
                <div
                  className="mt-auto pt-4 font-sans font-medium leading-none tracking-[-0.02em] text-[#141210]"
                  style={{
                    fontSize: "clamp(1.5rem, 2.6vw, 1.85rem)",
                    fontVariationSettings: '"opsz" 144',
                  }}
                >
                  {t.count}
                </div>
              </Link>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
