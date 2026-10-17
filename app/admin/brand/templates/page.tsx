import Link from "next/link";
import { requireAdmin } from "@/lib/cms-auth";
import { Icon, type IconName } from "@/components/ds";
import { TEMPLATES, TEMPLATE_GROUPS } from "@/components/team-brand/templates-data";
import { PageHeader } from "../../PageHeader";

export const metadata = { title: "Templates · Resources · Admin · TEDxNewy", robots: { index: false, follow: false } };

export default async function TemplatesPage() {
  await requireAdmin();
  return (
    <div className="adm-stack adm-stack--tight">
      <PageHeader title="Templates" description="On-brand starting points. Word documents, images and slides you download, fill in and send." />
      {TEMPLATE_GROUPS.map((g) => (
        <section key={g.key} className="adm-section">
          <h2 className="adm-section__title">{g.title}</h2>
          <div className="adm-tplgrid">
            {TEMPLATES.filter((t) => t.group === g.key).map((t) => (
              <Link key={t.slug} href={`/admin/brand/templates/${t.slug}`} className="adm-tpl">
                <span className="adm-chip">
                  <Icon name={t.icon as IconName} size={18} />
                </span>
                <span className="adm-tpl__text">
                  <span className="adm-card__title">{t.title}</span>
                  <span className="adm-card__text">{t.blurb}</span>
                </span>
              </Link>
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}
