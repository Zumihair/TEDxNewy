import Link from "next/link";
import { requireAdmin } from "@/lib/cms-auth";
import { Icon, type IconName } from "@/components/ds";
import { TEMPLATES, TEMPLATE_GROUPS } from "@/components/team-brand/templates-data";
import { PageHeader } from "../../PageHeader";

export const metadata = { title: "Templates · Resources · Admin · TEDxNewy", robots: { index: false, follow: false } };

export default async function TemplatesPage() {
  await requireAdmin();
  return (
    <div className="adm-stack">
      <PageHeader title="Templates" description="Ready-made, on-brand starting points. Open one, fill it in and print, copy or download." />
      {TEMPLATE_GROUPS.map((g) => (
        <section key={g.key} className="adm-section">
          <div>
            <h2 className="adm-section__title">{g.title}</h2>
            <p className="adm-card__text">{g.blurb}</p>
          </div>
          <div className="adm-grid adm-grid--cards">
            {TEMPLATES.filter((t) => t.group === g.key).map((t) => (
              <Link key={t.slug} href={`/admin/brand/templates/${t.slug}`} className="adm-card">
                <div className="adm-card__top">
                  <span className="adm-chip">
                    <Icon name={t.icon as IconName} size={18} />
                  </span>
                  <Icon name="arrow-up-right" size={16} />
                </div>
                <span className="adm-card__title">{t.title}</span>
                <span className="adm-card__text">{t.blurb}</span>
              </Link>
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}
