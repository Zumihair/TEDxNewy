import Link from "next/link";
import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/cms-auth";
import { socialsOf, type SocialLink } from "@/lib/social-catalogue";
import { getServerSupabase } from "@/lib/supabase-server";
import { Icon } from "@/components/ds";
import TemplateEditor from "@/components/team-brand/TemplateEditor";
import Studio from "@/components/team-brand/Studio";
import DeckTemplate from "@/components/team-brand/DeckTemplate";
import { findTemplate } from "@/components/team-brand/templates-data";

export const metadata = { title: "Template · Resources · TEDxNewy", robots: { index: false, follow: false } };

export default async function TemplatePage({ params }: { params: Promise<{ slug: string }> }) {
  const admin = await requireAdmin({ readOnly: true });
  const { slug } = await params;
  const meta = findTemplate(slug);
  if (!meta) notFound();

  if (meta.kind === "page") return <TemplateEditor slug={slug} title={meta.title} />;

  // The signature is the signed-in person's own: it fills from their team profile.
  let me: { name: string; role: string | null; email: string | null; phone: string | null; socials: SocialLink[] } | null = null;
  if (meta.studio === "signature" && admin.teamSlug) {
    const supabase = await getServerSupabase();
    const { data } = await supabase.from("cms_team_members").select("*").eq("slug", admin.teamSlug).maybeSingle();
    if (data) {
      me = {
        name: String(data.name ?? ""),
        role: (data.role as string | null) ?? null,
        email: (data.email as string | null) ?? null,
        phone: (data.phone as string | null) ?? null,
        socials: socialsOf(data),
      };
    }
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
      {meta.kind === "deck" ? <DeckTemplate /> : <Studio fixedKind={meta.studio} me={me} />}
    </div>
  );
}
