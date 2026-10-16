import Link from "next/link";
import type { ReactNode } from "react";
import { Banner, Icon, Meter, type IconName } from "@/components/ds";
import type { NavGroup } from "./nav-config";

export type PulseStat = { href: string; label: string; value: string; sub: string; pct?: number };
export type FormTile = { label: string; count: number; href: string };

/** Home: today's numbers, the forms inbox, then a card per workspace. */
export function HomeView({
  greeting,
  today,
  denied,
  pulse,
  forms,
  workspaces,
}: {
  greeting: string;
  today: string;
  denied?: ReactNode;
  pulse: PulseStat[] | null;
  forms: FormTile[] | null;
  workspaces: NavGroup[];
}) {
  return (
    <div className="adm-stack">
      <header className="adm-head">
        <div>
          <h1 className="adm-head__title">{greeting}</h1>
          <p className="adm-head__desc">{today}</p>
        </div>
      </header>

      {denied && <Banner tone="warning">{denied}</Banner>}

      {pulse && (
        <section className="adm-section">
          <div className="adm-grid adm-grid--stats">
            {pulse.map((p) => (
              <Link key={p.label} href={p.href} className="adm-stat">
                <span className="tx-stat__label">{p.label}</span>
                <span className="tx-stat__value">{p.value}</span>
                {typeof p.pct === "number" && <Meter label="Sold" value={p.pct} display={`${p.pct}%`} />}
                <span className="adm-card__text">{p.sub}</span>
              </Link>
            ))}
          </div>
        </section>
      )}

      {forms && (
        <section className="adm-section">
          <div className="adm-card__top">
            <h2 className="adm-section__title">Inbox</h2>
            <Link href="/admin/forms" className="tx-btn tx-btn--secondary tx-btn--sm tx-btn--auto">
              Open inbox
            </Link>
          </div>
          <div className="adm-formgrid">
            {forms.map((f) => (
              <Link key={f.href} href={f.href} className="adm-form">
                <span className="adm-form__n">{f.count}</span>
                <span className="adm-form__l">{f.label}</span>
              </Link>
            ))}
          </div>
        </section>
      )}

      <section className="adm-section">
        <h2 className="adm-section__title">Workspaces</h2>
        <div className="adm-grid adm-grid--cards">
          {workspaces.map((g) => (
            <Link key={g.key} href={g.href} className="adm-card">
              <div className="adm-card__top">
                <span className="adm-chip">
                  <Icon name={g.icon as IconName} size={18} />
                </span>
                <Icon name="arrow-up-right" size={16} />
              </div>
              <span className="adm-card__title">{g.heading}</span>
              <span className="adm-card__text">{g.blurb}</span>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}

/** A workspace hub: its pages as cards. */
export function HubView({ group }: { group: NavGroup }) {
  return (
    <div className="adm-stack">
      <header className="adm-head">
        <div>
          <h1 className="adm-head__title">{group.heading}</h1>
          <p className="adm-head__desc">{group.blurb}</p>
        </div>
      </header>
      <div className="adm-grid adm-grid--cards">
        {group.items.map((item) => (
          <Link key={item.href} href={item.href} className="adm-card">
            <div className="adm-card__top">
              <span className="adm-card__title">{item.label}</span>
              <Icon name="arrow-up-right" size={16} />
            </div>
            <span className="adm-card__text">{item.blurb ?? item.description}</span>
          </Link>
        ))}
      </div>
    </div>
  );
}
