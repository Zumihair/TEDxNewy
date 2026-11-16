import { Sparkline } from "@/components/ds";
import { requireAdmin } from "@/lib/cms-auth";
import { getServerSupabase } from "@/lib/supabase-server";
import { getSystemCaps, cronLoad, type FlowMeter, type LevelMeter, type Meter } from "@/lib/system-caps";
import { UNTRACKED } from "@/lib/system-caps-config";
import { pct, type CapStatus } from "@/lib/system-caps-math";
import { PageHeader, SectionLabel } from "../ui";

export const dynamic = "force-dynamic";
export const metadata = { title: "System caps · Admin · TEDxNewy" };

const n = (v: number) => Math.round(v).toLocaleString("en-AU");

function bytes(v: number): string {
  const abs = Math.abs(v);
  if (abs >= 1024 ** 3) return `${(v / 1024 ** 3).toFixed(2)} GB`;
  if (abs >= 1024 ** 2) return `${(v / 1024 ** 2).toFixed(1)} MB`;
  return `${Math.round(v / 1024)} KB`;
}

const STATE: Record<CapStatus, string> = { ok: "Fine", watch: "Keep an eye on it", close: "Close to the cap" };

function Bar({ used, cap, status }: { used: number; cap: number | null; status: CapStatus }) {
  if (!cap) return null;
  return (
    <span className={`adm-cap__bar is-${status}`} role="img" aria-label={`${pct(used, cap)} percent used`}>
      <i style={{ width: `${Math.max(pct(used, cap), used > 0 ? 1 : 0)}%` }} />
    </span>
  );
}

function FlowCard({ m }: { m: FlowMeter }) {
  return (
    <section className="adm-cap">
      <div className="adm-cap__top">
        <h2 className="adm-cap__label">{m.label}</h2>
        <span className="adm-cap__state">{STATE[m.status]}</span>
      </div>
      <div className="adm-cap__value">
        {n(m.last30)}
        {m.monthlyCap && <span className="adm-cap__of"> of {n(m.monthlyCap)}</span>}
      </div>
      <Bar used={m.last30} cap={m.monthlyCap} status={m.status} />
      <div className="adm-cap__rows">
        <div>
          Today <b>{n(m.today)}</b>
          {m.dailyCap ? <> of <b>{n(m.dailyCap)}</b></> : " (no daily cap)"}
        </div>
        <div>
          7 day average <b>{n(m.avg7)}</b> a day
        </div>
        <div>
          Next 30 days at this pace <b>{n(m.next30)}</b>
          {m.monthlyCap ? <> ({pct(m.next30, m.monthlyCap)}% of the cap)</> : null}
        </div>
      </div>
      {m.history.length > 1 && <Sparkline values={m.history} width={260} height={36} />}
      <p className="adm-cap__note">Last 30 days. {m.note}</p>
    </section>
  );
}

function LevelCard({ m }: { m: LevelMeter }) {
  const fmt = (v: number) => (m.unit === "bytes" ? bytes(v) : n(v));
  return (
    <section className="adm-cap">
      <div className="adm-cap__top">
        <h2 className="adm-cap__label">{m.label}</h2>
        <span className="adm-cap__state">{STATE[m.status]}</span>
      </div>
      <div className="adm-cap__value">
        {fmt(m.current)}
        {m.cap && <span className="adm-cap__of"> of {fmt(m.cap)}</span>}
      </div>
      <Bar used={m.current} cap={m.cap} status={m.status} />
      <div className="adm-cap__rows">
        {m.perDay !== null && (
          <div>
            Growing <b>{m.unit === "bytes" ? bytes(m.perDay) : n(m.perDay)}</b> a day
          </div>
        )}
        {m.in30 !== null && (
          <div>
            In 30 days at this pace <b>{fmt(m.in30)}</b>
            {m.cap ? <> ({pct(m.in30, m.cap)}% of the cap)</> : null}
          </div>
        )}
      </div>
      {m.history.length > 1 && <Sparkline values={m.history} width={260} height={36} />}
      <p className="adm-cap__note">{m.note}</p>
    </section>
  );
}

function UnavailableCard({ m }: { m: Extract<Meter, { kind: "unavailable" }> }) {
  return (
    <section className="adm-cap">
      <div className="adm-cap__top">
        <h2 className="adm-cap__label">{m.label}</h2>
      </div>
      <p className="adm-cap__note">{m.note}</p>
    </section>
  );
}

export default async function SystemCapsPage() {
  await requireAdmin();
  const supabase = await getServerSupabase();
  const meters = await getSystemCaps(supabase);
  const cron = cronLoad();

  return (
    <div className="adm-stack">
      <PageHeader title="System caps" description="How close we are to the limits of the services the site runs on." />

      <div className="adm-caps">
        {meters.map((m) =>
          m.kind === "flow" ? (
            <FlowCard key={m.key} m={m} />
          ) : m.kind === "level" ? (
            <LevelCard key={m.key} m={m} />
          ) : (
            <UnavailableCard key={m.key} m={m} />
          ),
        )}
      </div>

      <SectionLabel>Scheduled jobs</SectionLabel>
      <div className="adm-caplist">
        {cron.jobs.map((j) => (
          <div key={j.path}>
            <strong>{j.path}</strong>
            <span>
              Every {j.every}, about {n(j.perDay * 30)} runs a month.
            </span>
          </div>
        ))}
        <div>
          <strong>Total</strong>
          <span>
            About {n(cron.perMonth)} runs a month, {(cron.shareOfIncluded * 100).toFixed(1)}% of the 1,000,000 function invocations Vercel Pro
            includes. Calculated from the schedule, not measured.
          </span>
        </div>
      </div>

      <SectionLabel>Not tracked automatically</SectionLabel>
      <div className="adm-caplist">
        {UNTRACKED.map((u) => (
          <div key={u.service}>
            <strong>
              {u.service} ({u.risk === "safe" ? "safe" : "watch"})
            </strong>
            <span>Limit: {u.cap}</span>
            <span>Our load: {u.load}</span>
            <span>Check at: {u.where}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
