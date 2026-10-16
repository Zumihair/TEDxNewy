import Link from "next/link";
import type { ReactNode } from "react";
import { Banner, Icon, LineChart, Network, type IconName } from "@/components/ds";
import type { NavGroup } from "./nav-config";

export type Stat = { href: string; label: string; value: string; foot: string; pct?: number };
export type FormTile = { label: string; count: number; href: string };
export type Growth = { total: number; last7: number; labels: string[]; values: number[] };

/** One number, clearly labelled, with a foot line (or a progress bar) on the same baseline across the row. */
function StatCard({ s }: { s: Stat }) {
  return (
    <Link href={s.href} className="adm-stat2">
      <span className="adm-stat2__label">{s.label}</span>
      <span className="adm-stat2__value">{s.value}</span>
      <span className="adm-stat2__foot">
        {typeof s.pct === "number" && (
          <span className="adm-bar" aria-hidden>
            <i style={{ width: `${Math.max(2, Math.min(100, s.pct))}%` }} />
          </span>
        )}
        <span>{s.foot}</span>
      </span>
    </Link>
  );
}

export function GrowthCard({ growth, title = "Subscribers over time" }: { growth: Growth; title?: string }) {
  const start = growth.values[0] ?? 0;
  const change = growth.total - start;
  return (
    <section className="adm-panel">
      <div className="adm-card__top">
        <div>
          <h2 className="adm-section__title">{title}</h2>
          <p className="adm-card__text">
            {growth.total.toLocaleString("en-AU")} now, {change >= 0 ? "+" : ""}
            {change} over the last {growth.labels.length} weeks
          </p>
        </div>
        <Link href="/admin/subscribers" className="adm-link">
          Open list <Icon name="arrow-up-right" size={14} />
        </Link>
      </div>
      <LineChart labels={growth.labels} series={[{ name: "Subscribers", values: growth.values }]} height={190} />
    </section>
  );
}

/** Home: a hero with some character, today's numbers, the inbox and the workspaces. */
export function HomeView({
  greeting,
  headline,
  today,
  denied,
  stats,
  growth,
  forms,
  workspaces,
}: {
  greeting: string;
  headline: string;
  today: string;
  denied?: ReactNode;
  stats: Stat[];
  growth: Growth | null;
  forms: FormTile[] | null;
  workspaces: NavGroup[];
}) {
  return (
    <div className="adm-stack">
      <header className="adm-hero">
        <Network tone="dark" nodes={20} seed={11} accents={2} animate={false} opacity={0.22} />
        <div className="adm-hero__body">
          <span className="adm-hero__date">{today}</span>
          <h1 className="adm-hero__title">{greeting}</h1>
          <p className="adm-hero__line">{headline}</p>
        </div>
      </header>

      {denied && <Banner tone="warning">{denied}</Banner>}

      {stats.length > 0 && (
        <section className="adm-statrow" style={{ ["--n" as string]: stats.length }}>
          {stats.map((s) => (
            <StatCard key={s.label} s={s} />
          ))}
        </section>
      )}

      {growth && <GrowthCard growth={growth} />}

      {forms && (
        <section className="adm-section">
          <div className="adm-card__top">
            <h2 className="adm-section__title">Inbox</h2>
            <Link href="/admin/forms" className="adm-link">
              Open inbox <Icon name="arrow-up-right" size={14} />
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

export type UpcomingItem = { id: string; title: string; kind: "Newsletter" | "Social post"; when: string; href: string };

/** The Comms landing page: how the list is growing, what is going out, and the tools. */
export function CommsView({
  group,
  stats,
  growth,
  upcoming,
  drafts,
}: {
  group: NavGroup;
  stats: Stat[];
  growth: Growth;
  upcoming: UpcomingItem[];
  drafts: { newsletters: number; posts: number };
}) {
  return (
    <div className="adm-stack">
      <header className="adm-head">
        <div>
          <h1 className="adm-head__title">Comms</h1>
          <p className="adm-head__desc">{group.blurb}</p>
        </div>
        <div className="adm-head__actions">
          <Link href="/admin/emails" className="tx-btn tx-btn--accent tx-btn--sm tx-btn--auto">
            <Icon name="send" size={14} /> Quick email
          </Link>
        </div>
      </header>

      <section className="adm-statrow" style={{ ["--n" as string]: stats.length }}>
        {stats.map((s) => (
          <StatCard key={s.label} s={s} />
        ))}
      </section>

      <GrowthCard growth={growth} />

      <div className="adm-twocol">
        <section className="adm-panel">
          <h2 className="adm-section__title">Going out soon</h2>
          {upcoming.length === 0 ? (
            <p className="adm-card__text">Nothing is scheduled. Draft a post or a newsletter to get started.</p>
          ) : (
            <ul className="adm-rows">
              {upcoming.map((u) => (
                <li key={u.id}>
                  <Link href={u.href} className="adm-row">
                    <span className="adm-row__main">
                      <span className="adm-row__title">{u.title}</span>
                      <span className="adm-card__text">
                        {u.kind} · {u.when}
                      </span>
                    </span>
                    <Icon name="chevron-right" size={16} />
                  </Link>
                </li>
              ))}
            </ul>
          )}
          <p className="adm-card__text">
            {drafts.newsletters} newsletter draft{drafts.newsletters === 1 ? "" : "s"} and {drafts.posts} post draft
            {drafts.posts === 1 ? "" : "s"} in progress.
          </p>
        </section>

        <section className="adm-panel">
          <h2 className="adm-section__title">Tools</h2>
          <ul className="adm-rows">
            {group.items.map((item) => (
              <li key={item.href}>
                <Link href={item.href} className="adm-row">
                  <span className="adm-row__main">
                    <span className="adm-row__title">{item.label}</span>
                    <span className="adm-card__text">{item.blurb}</span>
                  </span>
                  <Icon name="chevron-right" size={16} />
                </Link>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </div>
  );
}

/** A plain workspace landing page: its pages as cards. */
export function HubView({ group, extra }: { group: NavGroup; extra?: ReactNode }) {
  return (
    <div className="adm-stack">
      <header className="adm-head">
        <div>
          <h1 className="adm-head__title">{group.heading}</h1>
          <p className="adm-head__desc">{group.blurb}</p>
        </div>
      </header>
      {extra}
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
