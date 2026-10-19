import { requireAdmin } from "@/lib/cms-auth";
import { getPersonRows } from "@/lib/people";
import { PageHeader } from "../ui";
import PeopleList from "./PeopleList";

export const dynamic = "force-dynamic";

/**
 * People: everyone we hold an email for, in one list. Each row is derived on
 * request from the subscriber list, event attendees, forms, emails and
 * partners (lib/people.ts), so nothing here needs keeping in step.
 */
export default async function PeoplePage() {
  await requireAdmin();
  const rows = await getPersonRows();

  const subscribed = rows.filter((r) => r.subscribed === true).length;
  const attended = rows.filter((r) => r.eventCount > 0).length;
  const regulars = rows.filter((r) => r.eventCount > 1).length;

  return (
    <div className="adm-stack">
      <PageHeader
        title="People"
        description="Everyone we have an email for: the events they have been to, the emails they have had and the forms they have sent."
      />

      <section className="adm-statrow" style={{ ["--n" as string]: 4 }}>
        <Stat label="People" value={rows.length} foot="with an email address" />
        <Stat label="On the mailing list" value={subscribed} foot={pct(subscribed, rows.length)} />
        <Stat label="Came to an event" value={attended} foot={pct(attended, rows.length)} />
        <Stat label="Came to two or more" value={regulars} foot={attended ? `${pct(regulars, attended, false)} of attendees` : "no events yet"} />
      </section>

      <PeopleList rows={rows} />
    </div>
  );
}

function pct(n: number, of: number, suffix = true) {
  if (!of) return suffix ? "0% of everyone" : "0%";
  const p = `${Math.round((n / of) * 100)}%`;
  return suffix ? `${p} of everyone` : p;
}

function Stat({ label, value, foot }: { label: string; value: number; foot: string }) {
  return (
    <div className="adm-stat2">
      <span className="adm-stat2__label">{label}</span>
      <span className="adm-stat2__value">{value.toLocaleString("en-AU")}</span>
      <span className="adm-stat2__foot">
        <span>{foot}</span>
      </span>
    </div>
  );
}
