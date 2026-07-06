import Link from "next/link";
import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/cms-auth";
import { getServerSupabase } from "@/lib/supabase-server";
import { Flash, PageHeader } from "../../ui";
import SubmissionsTable, { type Row } from "../../SubmissionsTable";
import { FORM_REGISTRY, formBySlug } from "../registry";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ form: string }>;
}) {
  const { form } = await params;
  const entry = formBySlug(form);
  return {
    title: entry
      ? `${entry.label} · Forms · Admin · TEDxNewy`
      : "Forms · Admin · TEDxNewy",
  };
}

export default async function AdminFormPage({
  params,
  searchParams,
}: {
  params: Promise<{ form: string }>;
  searchParams: Promise<{ deleted?: string; error?: string }>;
}) {
  const { form } = await params;
  const { deleted } = await searchParams;
  const entry = formBySlug(form);
  if (!entry) notFound();

  const supabase = await getServerSupabase();

  // The form's own rows plus a head-count for every form (for the tab bar),
  // all in parallel.
  const [, { data, error }, tabCounts] = await Promise.all([
    requireAdmin(),
    supabase
      .from(entry.table)
      .select(entry.select)
      .order(entry.orderBy, { ascending: false }),
    Promise.all(
      FORM_REGISTRY.map((f) =>
        supabase.from(f.table).select("*", { count: "exact", head: true }),
      ),
    ),
  ]);

  const rows = ((data ?? []) as unknown as Row[]) ?? [];
  const description =
    rows.length === 0 && !error && entry.emptyText
      ? entry.emptyText
      : entry.describe(rows);

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow={entry.eyebrow}
        title={entry.title}
        description={description}
        backHref="/admin/forms"
      />

      {/* Tab bar: hop between forms without leaving the hub. */}
      <div className="-mx-1 overflow-x-auto">
        <div className="flex min-w-max items-center gap-1 border-b border-[rgba(20,18,16,0.10)] px-1">
          {FORM_REGISTRY.map((f, i) => {
            const active = f.slug === entry.slug;
            const count = tabCounts[i]?.count ?? 0;
            return (
              <Link
                key={f.slug}
                href={`/admin/forms/${f.slug}`}
                className={
                  "-mb-px flex shrink-0 items-center gap-2 whitespace-nowrap border-b-2 px-4 py-2.5 text-[13.5px] font-medium transition-colors " +
                  (active
                    ? "border-[#e02214] text-[#141210]"
                    : "border-transparent text-[#6b6459] hover:text-[#141210]")
                }
              >
                {f.label}
                <span
                  className={
                    "tabular-nums text-[12px] " +
                    (active ? "text-[#6b6459]" : "text-[#a59f93]")
                  }
                >
                  {count}
                </span>
              </Link>
            );
          })}
        </div>
      </div>

      {deleted && <Flash tone="ok">Deleted.</Flash>}

      {error && (
        <div className="rounded-[var(--radius-md)] border border-[#e02214]/30 bg-[#e02214]/10 px-4 py-3 text-[13.5px] text-[#b91404]">
          Couldn&rsquo;t load {entry.noun}. This may not be fully set up yet, or
          the connection is down. Ask Will to take a look.
        </div>
      )}

      <SubmissionsTable
        rows={rows}
        columns={entry.columns}
        searchKeys={entry.searchKeys}
        deleteAction={entry.deleteAction}
        contactedAction={entry.contactedAction}
        bulkDeleteAction={entry.bulkDeleteAction}
        bulkContactedAction={entry.bulkContactedAction}
        exportName={entry.exportName}
        spamPreset={entry.spamPreset}
        statuses={entry.statuses}
        statusAction={entry.statusAction}
        acceptedStatus={entry.acceptedStatus}
        emailField={entry.emailField}
        breakdown={entry.breakdown}
      />
    </div>
  );
}
