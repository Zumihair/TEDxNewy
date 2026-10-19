import Link from "next/link";
import { Banner, Icon, LineChart } from "@/components/ds";
import { requireAdmin } from "@/lib/cms-auth";
import { getServerSupabase } from "@/lib/supabase-server";
import { getWebReport, type SourceRow } from "@/lib/web-analytics";
import { PageHeader } from "../ui";

export const dynamic = "force-dynamic";

const RANGES = [7, 30, 90] as const;

/** subscribers.source values, in words. Anything unknown shows as stored. */
const SOURCE_LABEL: Record<string, string> = {
  home: "Homepage form",
  subscribe: "Subscribe page",
  contact: "Contact page",
  signal: "Signal page",
  "signal-waitlist": "Signal waitlist",
  "signal-ticket": "Ticket buyers (synced from Humanitix)",
  mailchimp: "Mailchimp (imported or signed up there)",
  "popup-oct24-announce": "Pop-up",
  "popup-community-announce": "Pop-up",
  "talk-night": "60-Second Talk Night",
  test: "Test entries",
};

const n = (v: number) => v.toLocaleString("en-AU");
const rate = (a: number, b: number) => (b > 0 ? `${((a / b) * 100).toFixed(a / b < 0.1 ? 1 : 0)}%` : "");
const dayLabel = (d: string) =>
  new Intl.DateTimeFormat("en-AU", { day: "numeric", month: "short", timeZone: "UTC" }).format(new Date(`${d}T00:00:00Z`));

export default async function WebsiteAnalyticsPage({ searchParams }: { searchParams: Promise<{ days?: string }> }) {
  const [, { days: raw }] = await Promise.all([requireAdmin(), searchParams]);
  const days = RANGES.find((r) => String(r) === raw) ?? 30;
  const since = new Date(Date.now() - days * 86_400_000).toISOString();

  const supabase = await getServerSupabase();
  const [report, { data: subs }] = await Promise.all([
    getWebReport(days),
    supabase.from("subscribers").select("source, created_at").gte("created_at", since),
  ]);

  // Sign-ups from our own database: always available, and the true count.
  const bySource = new Map<string, number>();
  for (const r of (subs ?? []) as { source: string | null }[]) {
    const label = SOURCE_LABEL[r.source ?? ""] ?? r.source ?? "Unknown";
    bySource.set(label, (bySource.get(label) ?? 0) + 1);
  }
  const signupsDb = (subs ?? []).length;
  const sources = [...bySource].sort((a, b) => b[1] - a[1]);

  const range = (
    <div className="adm-pills" role="tablist" aria-label="Range">
      {RANGES.map((r) => (
        <Link
          key={r}
          href={`/admin/analytics?days=${r}`}
          role="tab"
          aria-selected={r === days}
          className={"adm-pill" + (r === days ? " is-active" : "")}
        >
          {r} days
        </Link>
      ))}
    </div>
  );

  const signupPanel = (
    <section className="adm-panel">
      <div>
        <h2 className="adm-section__title">Sign-ups by form</h2>
        <p className="adm-card__text">
          {n(signupsDb)} new on the list in the last {days} days, from our own records.
        </p>
      </div>
      {sources.length === 0 ? (
        <p className="adm-card__text">Nobody new in this period.</p>
      ) : (
        <table className="adm-an__table">
          <thead>
            <tr>
              <th>Where they signed up</th>
              <th>Sign-ups</th>
            </tr>
          </thead>
          <tbody>
            {sources.map(([label, count]) => (
              <tr key={label}>
                <td>{label}</td>
                <td>{n(count)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </section>
  );

  if (!report.ok) {
    return (
      <div className="adm-stack">
        <PageHeader title="Website" description="Traffic, ticket clicks and sign-ups beside the pages that drove them." actions={range} />
        <Banner tone="warning" title={report.reason === "no-token" ? "Website analytics needs a token" : report.reason === "not-enabled" ? "Web Analytics is not switched on yet" : "Vercel analytics could not be loaded"}>
          {report.reason === "no-token" ? (
            <>
              Add a Vercel access token as <code>VERCEL_ANALYTICS_TOKEN</code> in the project&apos;s environment variables, then
              redeploy. Sign-ups below come from our own records and already work.
            </>
          ) : report.reason === "not-enabled" ? (
            <>
              Turn on Web Analytics in the Vercel dashboard (project tedxnewy, Analytics tab). Numbers start from the day it is
              switched on. Ticket clicks and sign-ups are custom events, which need the Pro plan.
            </>
          ) : (
            <>{report.message ?? "Try again in a few minutes."}</>
          )}
        </Banner>
        {signupPanel}
      </div>
    );
  }

  const r = report.data;
  const labels = r.days.map((d) => dayLabel(d.day));
  const pages = r.pages.filter((p) => p.views > 0 || p.ticketClicks > 0 || p.signups > 0).slice(0, 30);
  const maxClicks = Math.max(0, ...pages.map((p) => p.ticketClicks));
  const maxSignups = Math.max(0, ...pages.map((p) => p.signups));

  return (
    <div className="adm-stack">
      <PageHeader title="Website" description="Traffic, ticket clicks and sign-ups beside the pages that drove them." actions={range} />

      <section className="adm-statrow" style={{ ["--n" as string]: 4 }}>
        <Stat label="Visitors" value={n(r.totals.visitors)} foot={`${n(r.totals.views)} page views`} />
        <Stat label="Ticket clicks" value={n(r.totals.ticketClicks)} foot={r.totals.visitors ? `${rate(r.totals.ticketClicks, r.totals.visitors)} of visitors` : "Get tickets presses"} />
        <Stat label="Sign-ups" value={n(signupsDb)} foot={`${n(r.totals.signups)} tracked to a page`} />
        <Stat label="Pages per visitor" value={r.totals.visitors ? (r.totals.views / r.totals.visitors).toFixed(1) : "0"} foot={`over ${days} days`} />
      </section>

      <div className="adm-twocol">
        <section className="adm-panel adm-panel--tight">
          <h2 className="adm-section__title">Visitors each day</h2>
          <LineChart
            labels={labels}
            series={[
              { name: "Visitors", values: r.days.map((d) => d.visitors) },
              { name: "Page views", values: r.days.map((d) => d.views) },
            ]}
            height={200}
          />
        </section>
        <section className="adm-panel adm-panel--tight">
          <h2 className="adm-section__title">Ticket clicks and sign-ups each day</h2>
          <LineChart
            labels={labels}
            series={[
              { name: "Ticket clicks", values: r.days.map((d) => d.ticketClicks) },
              { name: "Sign-ups", values: r.days.map((d) => d.signups) },
            ]}
            height={200}
            area={false}
          />
        </section>
      </div>

      <section className="adm-panel">
        <div>
          <h2 className="adm-section__title">Pages</h2>
          <p className="adm-card__text">
            Ticket clicks are counted on the page the button was pressed on. Sign-ups are credited to the page the form was on.
          </p>
        </div>
        {pages.length === 0 ? (
          <p className="adm-card__text">No visits recorded in this period yet.</p>
        ) : (
          <div className="adm-an__scroll">
            <table className="adm-an__table">
              <thead>
                <tr>
                  <th>Page</th>
                  <th>Views</th>
                  <th>Visitors</th>
                  <th>Ticket clicks</th>
                  <th>Sign-ups</th>
                  <th>Click rate</th>
                </tr>
              </thead>
              <tbody>
                {pages.map((p) => (
                  <tr key={p.path}>
                    <td>
                      {p.path.startsWith("/") ? (
                        <a href={`https://tedxnewy.com.au${p.path}`} target="_blank" rel="noreferrer" className="adm-link">
                          {p.path}
                        </a>
                      ) : (
                        p.path
                      )}
                    </td>
                    <td>{n(p.views)}</td>
                    <td>{n(p.visitors)}</td>
                    <td className={p.ticketClicks === 0 ? "is-zero" : p.ticketClicks === maxClicks ? "is-hi" : ""}>{n(p.ticketClicks)}</td>
                    <td className={p.signups === 0 ? "is-zero" : p.signups === maxSignups ? "is-hi" : ""}>{n(p.signups)}</td>
                    <td className="is-zero">{rate(p.ticketClicks, p.visitors)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <div className="adm-twocol">
        <SourceTable title="Where visitors came from" first="Site" rows={r.sources} empty="No referrers recorded yet." />
        <SourceTable
          title="Campaigns"
          first="utm_campaign"
          rows={r.campaigns}
          empty="No tagged links yet. Add ?utm_campaign=name to a link in a post or email to see it here."
        />
      </div>

      <div className="adm-twocol">
        <section className="adm-panel">
          <h2 className="adm-section__title">Which ticket buttons get pressed</h2>
          {r.placements.length === 0 ? (
            <p className="adm-card__text">No ticket clicks recorded yet.</p>
          ) : (
            <table className="adm-an__table">
              <thead>
                <tr>
                  <th>Button</th>
                  <th>Clicks</th>
                </tr>
              </thead>
              <tbody>
                {r.placements.map((p) => (
                  <tr key={p.name}>
                    <td>{p.name}</td>
                    <td>{n(p.count)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
          <p className="adm-card__text">
            <Icon name="info" size={14} /> A click opens the Humanitix checkout. Sales themselves are on the Tickets page.
          </p>
        </section>
        {signupPanel}
      </div>
    </div>
  );
}

function Stat({ label, value, foot }: { label: string; value: string; foot: string }) {
  return (
    <div className="adm-stat2">
      <span className="adm-stat2__label">{label}</span>
      <span className="adm-stat2__value">{value}</span>
      <span className="adm-stat2__foot">
        <span>{foot}</span>
      </span>
    </div>
  );
}

function SourceTable({ title, first, rows, empty }: { title: string; first: string; rows: SourceRow[]; empty: string }) {
  const list = rows.slice(0, 15);
  return (
    <section className="adm-panel">
      <h2 className="adm-section__title">{title}</h2>
      {list.length === 0 ? (
        <p className="adm-card__text">{empty}</p>
      ) : (
        <table className="adm-an__table">
          <thead>
            <tr>
              <th>{first}</th>
              <th>Visitors</th>
              <th>Ticket clicks</th>
            </tr>
          </thead>
          <tbody>
            {list.map((s) => (
              <tr key={s.name}>
                <td>{s.name === "(none)" ? "Direct or unknown" : s.name}</td>
                <td>{n(s.visitors)}</td>
                <td className={s.ticketClicks === 0 ? "is-zero" : ""}>{n(s.ticketClicks)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </section>
  );
}
