import Link from "next/link";
import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/cms-auth";
import { getServerSupabase } from "@/lib/supabase-server";
import { Icon } from "@/components/ds";
import TemplateEditor from "@/components/team-brand/TemplateEditor";
import Studio from "@/components/team-brand/Studio";
import DeckTemplate from "@/components/team-brand/DeckTemplate";
import { findTemplate } from "@/components/team-brand/templates-data";

export const metadata = { title: "Template · Resources · TEDxNewy", robots: { index: false, follow: false } };

export default async function TemplatePage({ params }: { params: Promise<{ slug: string }> }) {
  await requireAdmin();
  const { slug } = await params;
  const meta = findTemplate(slug);
  if (!meta) notFound();

  if (meta.kind === "page") return <TemplateEditor slug={slug} title={meta.title} />;

  // The signature picks its details from the team page, so it needs the list.
  let team: { name: string; role: string | null; email: string | null; linkedin_url: string | null }[] = [];
  if (meta.studio === "signature") {
    const supabase = await getServerSupabase();
    const { data } = await supabase
      .from("cms_team_members")
      .select("name, role, email, linkedin_url, is_active, display_order")
      .order("is_active", { ascending: false })
      .order("display_order", { ascending: true });
    team = ((data ?? []) as { name: string; role: string | null; email: string | null; linkedin_url: string | null }[]).filter((m) => m.name);
  }

  return (
    <div className="adm-stack">
      <div className="adm-head">
        <div>
          <Link href="/admin/brand/templates" className="adm-head__back">
            <Icon name="arrow-left" size={14} /> Templates
          </Link>
          <h1 className="adm-head__title" style={{ marginTop: 12 }}>{meta.title}</h1>
          <p className="adm-head__desc">{meta.blurb}</p>
        </div>
      </div>
      {meta.kind === "deck" ? <DeckTemplate /> : <Studio fixedKind={meta.studio} team={team} />}
    </div>
  );
}
