import "server-only";

/**
 * Vercel Web Analytics, read through the REST query API for the admin's
 * Website page. Page views and visitors come from the <Analytics /> beacon in
 * app/layout.tsx; "Ticket click" and "Newsletter signup" are custom events sent
 * from lib/pixel-events.ts beside the Meta Pixel ones.
 *
 * Env:
 *   VERCEL_ANALYTICS_TOKEN  a Vercel access token with read access to the team
 *   VERCEL_PROJECT_ID_ANALYTICS / VERCEL_TEAM_ID_ANALYTICS  optional overrides;
 *                           default to the tedxnewy project on the claused team
 *
 * Every call returns a soft result rather than throwing, like lib/humanitix.ts:
 * the page shows a set-up notice when the token is missing or Web Analytics is
 * not enabled on the project (the API answers 404 "Web Analytics not found").
 * Response rows are parsed defensively because the shape is not ours.
 */

const API = "https://api.vercel.com/v1/query/web-analytics";
const PROJECT = process.env.VERCEL_PROJECT_ID_ANALYTICS || "prj_IMiWu0a5qlapQNksyge8QyvfUq9K";
const TEAM = process.env.VERCEL_TEAM_ID_ANALYTICS || "team_iFWClDxbh02zld2cvTURO7wx";

export const TICKET_EVENT = "Ticket click";
export const SIGNUP_EVENT = "Newsletter signup";

export type AnalyticsFailure = "no-token" | "not-enabled" | "error";
export type Result<T> = { ok: true; data: T } | { ok: false; reason: AnalyticsFailure; message?: string };

type Row = Record<string, unknown>;

function token() {
  return process.env.VERCEL_ANALYTICS_TOKEN || process.env.VERCEL_API_TOKEN || null;
}

export function analyticsConfigured() {
  return !!token();
}

async function query(
  kind: "visits" | "events",
  by: string[],
  range: { since: Date; until: Date },
  opts: { filter?: string; limit?: number } = {},
): Promise<Result<Row[]>> {
  const t = token();
  if (!t) return { ok: false, reason: "no-token" };
  const qs = new URLSearchParams({
    projectId: PROJECT,
    teamId: TEAM,
    since: range.since.toISOString(),
    until: range.until.toISOString(),
    limit: String(opts.limit ?? 100),
  });
  for (const b of by) qs.append("by", b);
  if (opts.filter) qs.set("filter", opts.filter);
  try {
    const res = await fetch(`${API}/${kind}/aggregate?${qs}`, {
      headers: { Authorization: `Bearer ${t}` },
      next: { revalidate: 600 },
      signal: AbortSignal.timeout(8000),
    });
    const json = (await res.json().catch(() => null)) as Row | null;
    if (res.status === 404) return { ok: false, reason: "not-enabled" };
    if (!res.ok) {
      const err = (json?.error ?? {}) as Row;
      return { ok: false, reason: "error", message: typeof err.message === "string" ? err.message : `HTTP ${res.status}` };
    }
    const data = json?.data;
    return { ok: true, data: Array.isArray(data) ? (data as Row[]) : [] };
  } catch (e) {
    return { ok: false, reason: "error", message: e instanceof Error ? e.message : "Request failed" };
  }
}

const num = (v: unknown) => (typeof v === "number" && Number.isFinite(v) ? v : Number(v) || 0);

/** The value of a dimension on a row: `requestPath`, or `eventData/from` as a flat or nested key. */
function dim(r: Row, d: string): string | null {
  const direct = r[d];
  if (typeof direct === "string" || typeof direct === "number") return String(direct);
  const [head, prop] = d.split("/");
  if (prop) {
    const nested = r[head];
    if (nested && typeof nested === "object") {
      const v = (nested as Row)[prop];
      if (typeof v === "string" || typeof v === "number") return String(v);
    }
    if (typeof nested === "string") return nested;
  }
  if (["day", "hour", "week", "month"].includes(d)) {
    for (const k of ["timestamp", "date", "time", "key"]) {
      const v = r[k];
      if (typeof v === "string" || typeof v === "number") return String(v);
    }
  }
  return typeof r.key === "string" ? r.key : null;
}

const views = (r: Row) => num(r.pageviews ?? r.pageViews ?? r.total);
const visitors = (r: Row) => num(r.visitors ?? r.devices);
const count = (r: Row) => num(r.count ?? r.total ?? r.events);

/** Dimension value -> metric, skipping the API's "Others" bucket only when asked. */
function tally(rows: Row[], d: string, metric: (r: Row) => number) {
  const out = new Map<string, number>();
  for (const r of rows) {
    const k = dim(r, d) ?? "(none)";
    out.set(k, (out.get(k) ?? 0) + metric(r));
  }
  return out;
}

const dayKey = (v: string) => {
  const n = Number(v);
  const d = Number.isFinite(n) && v.trim() !== "" && !/[-T]/.test(v) ? new Date(n) : new Date(v);
  return Number.isNaN(d.getTime()) ? v : d.toISOString().slice(0, 10);
};

export type PageRow = { path: string; views: number; visitors: number; ticketClicks: number; signups: number };
export type SourceRow = { name: string; visitors: number; views: number; ticketClicks: number };
export type DayRow = { day: string; views: number; visitors: number; ticketClicks: number; signups: number };

export type WebReport = {
  totals: { views: number; visitors: number; ticketClicks: number; signups: number };
  days: DayRow[];
  pages: PageRow[];
  sources: SourceRow[];
  campaigns: SourceRow[];
  /** Which button drove ticket clicks ("Nav", "Signal hero" and so on). */
  placements: { name: string; count: number }[];
};

/** Everything the Website page shows, for the last `days` days. */
export async function getWebReport(days: number): Promise<Result<WebReport>> {
  const until = new Date();
  const since = new Date(until.getTime() - days * 86_400_000);
  const range = { since, until };
  const isTicket = `eventName eq '${TICKET_EVENT}'`;
  const isSignup = `eventName eq '${SIGNUP_EVENT}'`;

  const [byDay, byPath, byRef, byCampaign, clicksByDay, clicksByPath, clicksByRef, clicksByCampaign, clicksByPlace, signupsByDay, signupsByFrom] =
    await Promise.all([
      query("visits", ["day"], range),
      query("visits", ["requestPath"], range),
      query("visits", ["referrerHostname"], range, { limit: 25 }),
      query("visits", ["utmCampaign"], range, { limit: 25 }),
      query("events", ["day"], range, { filter: isTicket }),
      query("events", ["requestPath"], range, { filter: isTicket }),
      query("events", ["referrerHostname"], range, { filter: isTicket, limit: 25 }),
      query("events", ["utmCampaign"], range, { filter: isTicket, limit: 25 }),
      query("events", ["eventData/placement"], range, { filter: isTicket, limit: 25 }),
      query("events", ["day"], range, { filter: isSignup }),
      query("events", ["eventData/from"], range, { filter: isSignup }),
    ]);

  // Page views decide whether analytics works at all; events can be empty
  // (no clicks yet, or a plan without custom events) without failing the page.
  if (!byDay.ok) return byDay;
  const rows = (r: Result<Row[]>) => (r.ok ? r.data : []);

  const dayMap = new Map<string, DayRow>();
  const dayRow = (k: string) => {
    const key = dayKey(k);
    let d = dayMap.get(key);
    if (!d) {
      d = { day: key, views: 0, visitors: 0, ticketClicks: 0, signups: 0 };
      dayMap.set(key, d);
    }
    return d;
  };
  // Fill every day so the chart has no gaps.
  for (let t = since.getTime(); t <= until.getTime(); t += 86_400_000) dayRow(new Date(t).toISOString());
  for (const r of rows(byDay)) {
    const d = dayRow(dim(r, "day") ?? "");
    d.views += views(r);
    d.visitors += visitors(r);
  }
  for (const r of rows(clicksByDay)) dayRow(dim(r, "day") ?? "").ticketClicks += count(r);
  for (const r of rows(signupsByDay)) dayRow(dim(r, "day") ?? "").signups += count(r);
  const dayList = [...dayMap.values()].filter((d) => /^\d{4}-\d{2}-\d{2}$/.test(d.day)).sort((a, b) => a.day.localeCompare(b.day));

  const pathClicks = tally(rows(clicksByPath), "requestPath", count);
  const pathSignups = tally(rows(signupsByFrom), "eventData/from", count);
  const pageMap = new Map<string, PageRow>();
  const pageRow = (path: string) => {
    const p = normPath(path);
    let row = pageMap.get(p);
    if (!row) {
      row = { path: p, views: 0, visitors: 0, ticketClicks: 0, signups: 0 };
      pageMap.set(p, row);
    }
    return row;
  };
  for (const r of rows(byPath)) {
    const row = pageRow(dim(r, "requestPath") ?? "(none)");
    row.views += views(r);
    row.visitors += visitors(r);
  }
  for (const [p, n] of pathClicks) pageRow(p).ticketClicks += n;
  for (const [p, n] of pathSignups) pageRow(p).signups += n;
  // /thanks is where the sign-up event fires, not what drove it.
  pageMap.delete("/thanks");

  const sourceRows = (visitsRes: Result<Row[]>, clicksRes: Result<Row[]>, d: string): SourceRow[] => {
    const clicks = tally(rows(clicksRes), d, count);
    const map = new Map<string, SourceRow>();
    for (const r of rows(visitsRes)) {
      const name = dim(r, d) || "(none)";
      const row = map.get(name) ?? { name, visitors: 0, views: 0, ticketClicks: 0 };
      row.visitors += visitors(r);
      row.views += views(r);
      map.set(name, row);
    }
    for (const [name, n] of clicks) {
      const row = map.get(name) ?? { name, visitors: 0, views: 0, ticketClicks: 0 };
      row.ticketClicks += n;
      map.set(name, row);
    }
    return [...map.values()].sort((a, b) => b.visitors - a.visitors || b.ticketClicks - a.ticketClicks);
  };

  const totals = dayList.reduce(
    (t, d) => ({
      views: t.views + d.views,
      visitors: t.visitors + d.visitors,
      ticketClicks: t.ticketClicks + d.ticketClicks,
      signups: t.signups + d.signups,
    }),
    { views: 0, visitors: 0, ticketClicks: 0, signups: 0 },
  );

  return {
    ok: true,
    data: {
      totals,
      days: dayList,
      pages: [...pageMap.values()].sort((a, b) => b.views - a.views),
      sources: sourceRows(byRef, clicksByRef, "referrerHostname"),
      campaigns: sourceRows(byCampaign, clicksByCampaign, "utmCampaign").filter((c) => c.name !== "(none)" && c.name !== ""),
      placements: [...tally(rows(clicksByPlace), "eventData/placement", count)]
        .map(([name, n]) => ({ name, count: n }))
        .sort((a, b) => b.count - a.count),
    },
  };
}

function normPath(p: string) {
  if (!p || p === "(none)") return p || "(none)";
  try {
    const u = new URL(p, "https://tedxnewy.com.au");
    const path = u.pathname.replace(/\/+$/, "");
    return path || "/";
  } catch {
    return p;
  }
}
