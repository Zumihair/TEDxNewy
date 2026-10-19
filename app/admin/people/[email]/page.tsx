import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { Icon, type IconName } from "@/components/ds";
import { requireAdmin } from "@/lib/cms-auth";
import { getPerson, type Touch } from "@/lib/people";
import { getMemberActivity, mailchimpConfigured } from "@/lib/mailchimp";
import { PageHeader } from "../../ui";

export const dynamic = "force-dynamic";

const fmt = (iso: string | null, withYear = true) =>
  iso
    ? new Intl.DateTimeFormat("en-AU", {
        day: "numeric",
        month: "short",
        ...(withYear ? { year: "numeric" } : {}),
        timeZone: "Australia/Sydney",
      }).format(new Date(iso))
    : "Date unknown";

const KIND_ICON: Record<Touch["kind"], IconName> = {
  subscribe: "mail",
  unsubscribe: "x",
  event: "ticket",
  feedback: "message-square",
  email: "send",
  form: "inbox",
  partner: "handshake",
  media: "newspaper",
  team: "users",
};

export default async function PersonPage({ params }: { params: Promise<{ email: string }> }) {
  await requireAdmin();
  const { email: raw } = await params;
  const person = await getPerson(decodeURIComponent(raw));
  if (!person) notFound();

  const status =
    person.subscribed === true
      ? `On the mailing list since ${fmt(person.subscribedAt)}${person.subscribeSource ? ` (via ${person.subscribeSource})` : ""}`
      : person.subscribed === false
        ? `Unsubscribed ${fmt(person.unsubscribedAt)}`
        : "Not on the mailing list";

  return (
    <div className="adm-stack">
      <PageHeader
        backHref="/admin/people"
        title={person.name ?? person.email}
        description={
          <>
            {person.name && <>{person.email} · </>}
            {status}
          </>
        }
        actions={
          <Link href={`/admin/emails?to=${encodeURIComponent(person.email)}#compose`} className="tx-btn tx-btn--secondary adm-write">
            <Icon name="send" size={16} /> Email
          </Link>
        }
      />

      {person.roles.length > 0 && (
        <div className="adm-ppl__tags">
          {person.roles.map((r) => (
            <span key={r} className={"adm-ppl__tag" + (r === "Subscriber" ? " is-list" : r === "Unsubscribed" ? " is-off" : "")}>
              {r}
            </span>
          ))}
          {person.inWelcomeFlow && <span className="adm-ppl__tag">In the welcome flow</span>}
        </div>
      )}

      <section className="adm-statrow" style={{ ["--n" as string]: 4 }}>
        <Stat label="Events" value={String(new Set(person.events.map((e) => e.eventId)).size)} foot={person.events[0] ? `Last: ${person.events[0].title}` : "None yet"} />
        <Stat label="Emails from us" value={String(person.emailsReceived)} foot="Quick email, confirmations, welcome flow" />
        <Stat label="Newsletters" value={String(person.newslettersWhileSubscribed)} foot="sent to the list while they were on it" />
        <Stat label="First seen" value={fmt(person.firstSeen, false)} foot={person.firstSeen ? new Date(person.firstSeen).getFullYear().toString() : ""} />
      </section>

      <div className="adm-twocol">
        <section className="adm-panel">
          <h2 className="adm-section__title">Events</h2>
          {person.events.length === 0 ? (
            <p className="adm-card__text">They have not been to an event yet.</p>
          ) : (
            <ul className="adm-rows">
              {person.events.map((e, i) => (
                <li key={`${e.eventId}-${i}`} className="adm-row">
                  <span className="adm-chip">
                    <Icon name="calendar-days" size={16} />
                  </span>
                  <span className="adm-row__main">
                    <span className="adm-row__title">{e.title}</span>
                    <span className="adm-card__text">
                      {fmt(e.startsAt)} · {e.how}
                      {e.gaveFeedback ? " · gave feedback" : ""}
                    </span>
                  </span>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="adm-panel">
          <h2 className="adm-section__title">Newsletters</h2>
          {mailchimpConfigured() ? (
            <Suspense fallback={<p className="adm-card__text">Loading their Mailchimp activity…</p>}>
              <NewsletterActivity email={person.email} />
            </Suspense>
          ) : (
            <p className="adm-card__text">Mailchimp is not connected, so opens and clicks cannot be shown.</p>
          )}
        </section>
      </div>

      <section className="adm-panel">
        <h2 className="adm-section__title">History</h2>
        <ul className="adm-ppl__timeline">
          {person.touches.map((t, i) => (
            <li key={i}>
              <span className={"adm-ppl__dot is-" + t.kind}>
                <Icon name={KIND_ICON[t.kind]} size={14} />
              </span>
              <span className="adm-row__main">
                <span className="adm-row__title">{t.title}</span>
                {t.detail && <span className="adm-card__text">{t.detail}</span>}
              </span>
              <span className="adm-ppl__when">{fmt(t.at)}</span>
            </li>
          ))}
        </ul>
      </section>
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

const STATUS: Record<string, string> = {
  subscribed: "Subscribed in Mailchimp",
  unsubscribed: "Unsubscribed in Mailchimp",
  cleaned: "Removed by Mailchimp (the address bounced)",
  pending: "Waiting to confirm in Mailchimp",
  transactional: "In Mailchimp, but not subscribed",
  archived: "Archived in Mailchimp",
};

/** Their audience status, open and click rates, and one line per campaign with what they did. */
async function NewsletterActivity({ email }: { email: string }) {
  const a = await getMemberActivity(email);
  if (!a) return <p className="adm-card__text">They are not in the Mailchimp audience.</p>;

  type Campaign = { title: string; at: string | null; opened: boolean; clicked: string[]; bounced: boolean };
  const byTitle = new Map<string, Campaign>();
  for (const it of a.items) {
    if (!it.title) continue;
    const c = byTitle.get(it.title) ?? { title: it.title, at: null, opened: false, clicked: [], bounced: false };
    const act = it.action.toLowerCase();
    if (act === "sent" || !c.at) c.at = it.at ?? c.at;
    if (act === "open") c.opened = true;
    if (act === "click") {
      c.opened = true;
      if (it.url && !c.clicked.includes(it.url)) c.clicked.push(it.url);
    }
    if (act === "bounce") c.bounced = true;
    byTitle.set(it.title, c);
  }
  const campaigns = [...byTitle.values()].sort((x, y) => (y.at ?? "").localeCompare(x.at ?? ""));
  const rate = (n: number | null) => (n == null ? "" : `${Math.round(n * 100)}%`);

  return (
    <>
      <p className="adm-card__text">
        {STATUS[a.status ?? ""] ?? "In Mailchimp"}
        {a.openRate != null && <> · opens {rate(a.openRate)}</>}
        {a.clickRate != null && <> · clicks {rate(a.clickRate)}</>}
        {a.rating != null && <> · rated {a.rating} of 5</>}
      </p>
      {campaigns.length === 0 ? (
        <p className="adm-card__text">No newsletter activity on record yet.</p>
      ) : (
        <ul className="adm-rows">
          {campaigns.map((c) => (
            <li key={c.title} className="adm-row">
              <span className="adm-row__main">
                <span className="adm-row__title">{c.title}</span>
                <span className="adm-card__text">
                  {fmt(c.at)}
                  {c.clicked.length > 0 && ` · clicked ${c.clicked.map(shortUrl).join(", ")}`}
                </span>
              </span>
              <span className={"adm-ppl__tag" + (c.bounced ? " is-off" : c.opened ? " is-list" : "")}>
                {c.bounced ? "Bounced" : c.clicked.length ? "Clicked" : c.opened ? "Opened" : "Not opened"}
              </span>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}

function shortUrl(u: string) {
  try {
    const url = new URL(u);
    return (url.hostname.replace(/^www\./, "") + url.pathname).replace(/\/$/, "");
  } catch {
    return u;
  }
}
