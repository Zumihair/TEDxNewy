/**
 * Plan limits shown on /admin/system-caps. Edit here when a plan changes;
 * nothing else needs touching.
 *
 * Resend is read LIVE from the site's own key (GET /usage), so these two
 * numbers are only the fallback if that call fails. Checked 2026-11-16: the
 * TEDx Resend account is on Pro (50,000 a month, NO daily cap), not the free
 * plan (100 a day, 3,000 a month). If the plan ever changes, set them here:
 * free plan = resendDaily 100, resendMonthly 3000.
 */
export const CAPS = {
  resendDaily: null as number | null,
  resendMonthly: 50_000,

  /** Supabase Pro included amounts (plan assumed from usage: storage is
   *  already over the free plan's 1 GB). */
  supabaseDbBytes: 8 * 1024 ** 3,
  supabaseStorageBytes: 100 * 1024 ** 3,
  supabaseAuthUsers: 100_000,

  /** Vercel Pro. Included function invocations per month; overage is billed,
   *  never cut off. */
  vercelInvocations: 1_000_000,
} as const;

/** vercel.json schedules, as runs per day. Update if vercel.json changes. */
export const CRON_RUNS_PER_DAY = 289; // 288 (every 5 minutes) + 1 (daily)

/**
 * Not readable by the site without an extra token, so shown as a grey
 * "manual" tile with the last reading taken by hand. Update the value and
 * date when you next check (`vercel usage --scope claused`).
 */
export const MANUAL = {
  vercelInvocations: { value: 330_250, cap: 1_000_000, asOf: "16 Nov" },
  vercelCreditUsd: { value: 11.11, cap: 20, asOf: "16 Nov" },
} as const;

export type Untracked = { label: string; cap: string; href: string };

/** Things with limits the site cannot read: just the cap and where to look. */
export const UNTRACKED: Untracked[] = [
  { label: "Buffer", cap: "Rate limit only", href: "https://publish.buffer.com" },
  { label: "Mailchimp", cap: "Plan contacts", href: "https://admin.mailchimp.com" },
  { label: "Mapbox", cap: "200K tiles a month", href: "https://account.mapbox.com/statistics" },
  { label: "YouTube API", cap: "10K units a day", href: "https://console.cloud.google.com/apis/dashboard" },
  { label: "Humanitix", cap: "Not published", href: "https://console.humanitix.com" },
  { label: "Vercel Blob", cap: "1 GB, then billed", href: "https://vercel.com/claused/~/usage" },
  { label: "Supabase egress", cap: "250 GB a month", href: "https://supabase.com/dashboard/project/gurlrjlesdbiqxhavwil" },
];
