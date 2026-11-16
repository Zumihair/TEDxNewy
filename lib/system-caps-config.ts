/**
 * Plan limits shown on /admin/system-caps. These are the plans as audited on
 * 2026-11-16; edit here when a plan changes, nothing else needs touching.
 * Where a figure is an assumption rather than read from the provider it says
 * so, and the page repeats that.
 */

export const CAPS = {
  /** Resend. The plan is not readable from the site's own key, but the site
   *  has sent 270 in a day, so it is a paid plan. Pro is 50,000 a month with
   *  no daily cap. A free plan header, when Resend sends one, overrides this
   *  on the page. */
  resendMonthly: 50_000,
  resendDaily: null as number | null,
  resendAssumed: true,

  /** Supabase Pro included amounts. Storage already exceeds the free plan's
   *  1 GB, which is why Pro is assumed. */
  supabaseDbBytes: 8 * 1024 ** 3,
  supabaseStorageBytes: 100 * 1024 ** 3,
  supabaseAuthUsers: 100_000,
  supabaseAssumed: true,

  /** Vercel Pro. Function invocations included per month (the dashboard's
   *  usage page is the source of truth; overage is billed, not cut off). */
  vercelInvocations: 1_000_000,
  vercelCreditUsd: 20,
} as const;

/** vercel.json schedules, as runs per day. Update if vercel.json changes. */
export const CRON_RUNS_PER_DAY = [
  { path: "/api/cron/newsletter", perDay: 288, every: "5 minutes" },
  { path: "/api/cron/ticket-holders", perDay: 1, every: "daily at 19:00 UTC" },
] as const;

export type Untracked = {
  service: string;
  cap: string;
  load: string;
  risk: "safe" | "watch";
  where: string;
};

/** Things with limits that the site cannot read automatically. */
export const UNTRACKED: Untracked[] = [
  {
    service: "Vercel function invocations, CPU and bandwidth",
    cap: "Pro: 1M invocations included, then a $20 monthly usage credit; overage is billed, never cut off",
    load: "Cron is about 8,700 invocations a month. Last cycle total was about 330K invocations and $11 of the $20 credit.",
    risk: "safe",
    where: "Vercel dashboard, Usage",
  },
  {
    service: "Supabase egress and API requests",
    cap: "Pro: 250 GB egress a month, no request cap",
    load: "Cron makes about 12 small queries per run, roughly 100K a month, almost all empty results.",
    risk: "safe",
    where: "Supabase dashboard, Usage",
  },
  {
    service: "Buffer API",
    cap: "Rate limited per minute, no monthly post cap for posts sent now",
    load: "A handful of calls per published post. The Slack link lookup only runs after a post goes out.",
    risk: "safe",
    where: "Buffer, API settings",
  },
  {
    service: "Mailchimp",
    cap: "10 simultaneous connections, plan contact limit applies",
    load: "One daily sync plus webhook calls on sign-ups.",
    risk: "safe",
    where: "Mailchimp account, Usage",
  },
  {
    service: "Humanitix API",
    cap: "Not published",
    load: "Read by the daily sync and when ticket pages are opened.",
    risk: "safe",
    where: "Humanitix dashboard",
  },
  {
    service: "YouTube Data API",
    cap: "10,000 units a day",
    load: "Cached by the site, a few calls a day.",
    risk: "safe",
    where: "Google Cloud console, Quotas",
  },
  {
    service: "Mapbox map tiles",
    cap: "200,000 tile requests a month free",
    load: "A page view loads roughly 10 to 20 tiles. Watch only if a map page goes viral.",
    risk: "watch",
    where: "Mapbox account, Statistics",
  },
  {
    service: "Vercel Blob storage",
    cap: "Pro: 1 GB included, then billed per GB",
    load: "About 0.24 GB stored last cycle.",
    risk: "safe",
    where: "Vercel dashboard, Storage",
  },
  {
    service: "Slack webhook",
    cap: "About 1 message a second",
    load: "One message per published post.",
    risk: "safe",
    where: "n/a",
  },
];
