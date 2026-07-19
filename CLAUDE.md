# CLAUDE.md

Working notes for AI/code sessions on this repo. `README.md` is the full
reference; this is just the things that will bite you if you don't know them.

## The stack, briefly

Next.js 16 (App Router) · React 19 · Tailwind v4 · TypeScript · Supabase
(Sydney) · Resend (transactional email) · Mailchimp (newsletter campaigns) ·
Vercel (auto-deploys on push to `main`, functions pinned to `syd1`).

## Gotchas (read before changing anything here)

- **Deploy = `git push origin main`.** GitHub triggers a production Vercel
  build on push to `main`; other branches make preview URLs. There is no
  local Vercel link. The production Vercel/Supabase/Resend/Mailchimp
  accounts may differ from whatever a generic MCP connection shows, so do
  not assume a project you can see via tooling is this site's.
- **Migrations are applied by hand** in the Supabase dashboard SQL editor;
  there is no runner. As of 2026-07-06 every migration in
  `supabase/migrations/` is applied to production. Write new ones safe to
  re-run (`if not exists`, `drop policy if exists`), with SHORT lines and
  short single-piece string literals: the owner's clipboard path corrupts
  long lines and multi-line `||` string concatenations, producing misleading
  errors like `relation "a" does not exist`. No JSON literals in seeds; seed
  skeleton rows and author content in the admin instead.
- **Anon key is insert-only on form tables** (RLS). Public form routes can
  `insert` but cannot `select`. Duplicate protection is client-side
  (`components/SubmitLockForm.tsx`). All eight form routes also run the
  server-side bot filter `checkSubmission` from `lib/anti-spam.ts`.
- **Service key boundary.** `lib/supabase-admin.ts` (`getAdminSupabase`,
  env `SUPABASE_SECRET_KEY`) bypasses RLS. Only server-only code imports it:
  the cron route, the unsubscribe routes/page, the Mailchimp webhook, and
  the newsletter/flow send libs. Never import it anywhere client-reachable.
- **Newsletter campaigns send through Mailchimp, not Resend.** When
  `MAILCHIMP_API_KEY` + `MAILCHIMP_AUDIENCE_ID` are set (they are, in prod),
  `lib/newsletter-send.ts` creates and sends a Mailchimp campaign to the
  audience "TEDxNewy Email Subscribers". Without them it falls back to
  per-recipient Resend, which hits the free 100/day cap on real lists.
  Transactional email (confirmations, Quick Compose, welcome flow) stays on
  Resend either way. The Mailchimp API key expires around July 2027; when
  sends go quiet, rotate it first.
- **Scheduling runs on a Vercel cron** hitting `/api/cron/newsletter` every
  5 minutes with `Authorization: Bearer $CRON_SECRET`. It sends due
  newsletters (atomic claim, stale-"sending" recovery after 15 min) and the
  welcome-flow drip steps (claim-first ledger upserts on
  `subscriber_flow_sends`, so overlapping runs cannot double-send).
- **One block editor drives all rich email.** Blocks (header, text, image,
  two-column, button, video, countdown, divider) are defined in
  `lib/newsletter-blocks.ts`, edited with `app/admin/_blocks/BlockCanvas.tsx`,
  and rendered server-side by `lib/newsletter-render.tsx` (React Email). The
  newsletter, the subscriber-flow steps, and Quick Compose all use it. The
  renderer's `unsubscribeUrl` is optional: newsletters and flow steps pass it
  (compliance footer), Quick Compose omits it (ad-hoc recipients have no
  tokens). Keep multi-part JSX text as single string expressions in the
  footer: React Email separates adjacent text nodes with HTML comments and
  some mail clients eat the whitespace at that boundary.
- **Bulk email is batched on purpose.** `sendBulkEmail()` and
  `sendBulkEmailPersonalized()` send via Resend's batch endpoint in chunks
  of 100 with a paced per-recipient fallback. Do not replace with a naive
  per-recipient loop: Resend rate-limits at 2 req/sec and the old loop
  silently dropped everyone after the first ~2. Same trap in reverse: call
  these helpers ONCE with the whole recipient array; never call them inside a
  per-recipient loop (passing a one-element array each iteration re-creates the
  exact per-request storm the batching exists to prevent, and quietly drops
  sends on a big list). Build the full messages array, send once, then act on
  the returned per-recipient results.
- **Events are CMS content** (`cms_events`) edited at `/admin/events`. Public
  consumers (`/events`, `/salons`, the home page) fall back to static content
  (`lib/data.ts`, `FALLBACK_EVENTS`) if Supabase is unreachable, so the site
  never breaks.
- **The public header nav is static, defined in code** (`lib/nav-fallback.ts`,
  consumed by `components/Nav.tsx` via `getNavConfig()`). To change a header
  menu, edit that file. The one dynamic piece is the "Upcoming" menu, filled
  from announced events (`status = announced` + `show_in_nav`) so publishing an
  event in `/admin/events` keeps the header in sync. Nav caching is
  `unstable_cache` tag "nav" (revalidate 300); `/admin/events` actions
  revalidate it. There is no nav admin and no `cms_nav_*` tables in code (the
  old `/admin/navigation` editor was removed 2026-07-19). Nav.tsx also renders
  an always-present `sr-only` link list so the mega-menu's destinations are in
  the SSR HTML for crawlers and assistive tech (the visual menu mounts its
  links only on hover/click).
- **The form admin pages live in one hub** at `/admin/forms` (registry
  in `app/admin/forms/registry.ts`, slugs: youth-futures, student-speaker,
  talk-night, nominations, volunteers, sponsors, contact). The old routes
  redirect. Admin sidebar config is the single source
  `app/admin/nav-config.ts` (consumed by AdminShell and the dashboard).
  A registry entry flagged `archived: true` (currently talk-night) stays
  routable with its rows intact but drops out of the dashboard chips, the hub
  tile grid and the per-form tab bar. Those three surfaces read the exported
  `VISIBLE_FORMS` (archived filtered out), not `FORM_REGISTRY`. Retire a form
  by setting the flag; un-retire by removing it.
- **`RESEND_FROM` must be a verified `tedxnewy.com.au` sender** (prod uses
  `noreply@tedxnewy.com.au`). The `onboarding@resend.dev` fallback gets
  spam-filed.
- **Email errors are swallowed on form routes** (a send failure must not
  break a submit). The newsletter/flow pipelines do NOT swallow; they record
  results. Source of truth for delivery is Resend's log at
  `/admin/emails/history` and Mailchimp's campaign reports.
- **Admin performance patterns:** auth is deduplicated per request via React
  `cache()` in `lib/cms-auth.ts`; every admin section has a `loading.tsx`
  skeleton; form-action buttons use `app/admin/PendingButtons.tsx`
  (useFormStatus). Keep new admin pages on these patterns. No
  `window.confirm`/`window.prompt`: use `app/admin/ConfirmDialog.tsx`.
- **Admin colour is one section theme.** `app/admin/section-theme.ts` maps
  each area to a colour by route segment (Content coast blue, Community red,
  Settings green, Forms amber). It feeds the dashboard bento tiles, the
  themed `PageHeader` and `SectionLabel` (both client, they read the route),
  list/table accents, and the selected sidebar item. When building an admin
  page, take colour from the theme (`THEMES` / `sectionThemeFor`) instead of
  hardcoding red, so the section stays consistent everywhere it appears.
- **Quick Compose extras.** Audience chip counts come from the same list
  that sends (`app/admin/emails/audiences.ts`), so they include guest emails
  and dedupe rather than counting raw rows. Sends confirm the recipient
  count first, get attributed to the signed-in admin (`sent_by` on
  `email_sends`, shown as a colour chip in the history), and admins can save
  reusable templates (`compose_templates`, `app/admin/emails/templates.ts`).
  Those two features have hand-applied migrations dated `20260711_*`.
- **Verify before pushing:** `npx tsc --noEmit` and `npm run build`. The
  build prints `ENOTFOUND your-project-ref.supabase.co` when the local
  `.env` has a placeholder URL. Expected noise, not a failure (exit 0).

## Environment variables (prod, all set as of 2026-07-06)

`SUPABASE_URL`, `SUPABASE_PUBLISHABLE_KEY`, `SUPABASE_SECRET_KEY`,
`RESEND_API_KEY`, `RESEND_FROM`, `CRON_SECRET`, `MAILCHIMP_API_KEY`,
`MAILCHIMP_AUDIENCE_ID`, `MAILCHIMP_WEBHOOK_SECRET`,
`MAILCHIMP_WEBHOOK_SIGNING_SECRET` (stored, not yet verified in code),
plus optional `NTFY_TOPIC` / `SLACK_WEBHOOK_URL` / `DISCORD_WEBHOOK_URL`.

## Where things live

- Block schema + validation: `lib/newsletter-blocks.ts`
- Block renderer (React Email): `lib/newsletter-render.tsx`
- Newsletter send pipeline (Mailchimp or Resend): `lib/newsletter-send.ts`
- Welcome-flow sends (instant + cron drips): `lib/subscriber-flow-send.ts`
- Mailchimp client (campaigns, audience sync, webhook): `lib/mailchimp.ts`,
  `app/api/mailchimp/webhook/`
- Transactional builders + branded shell: `lib/email-templates.ts`
- Email delivery (channels, batch send): `lib/email-notify.ts`
- Resend activity read: `lib/resend-activity.ts`
- Shared block editor + preview: `app/admin/_blocks/`
- Quick Compose: `app/admin/emails/` (audiences `audiences.ts`, saved
  templates `templates.ts`) · Newsletter: `app/admin/newsletter/` ·
  Welcome flow: `app/admin/subscriber-flow/`
- Admin section colour theme: `app/admin/section-theme.ts` (consumed by the
  dashboard, `PageHeader.tsx`, `SectionLabel.tsx`, `AdminShell.tsx`)
- Events CMS: `app/admin/events/`, public `app/events/`
- Header nav (static, in code): `lib/nav-fallback.ts`, `components/Nav.tsx`
  (event injection in `getNavConfig`, `lib/cms-content.ts`)
- Forms hub: `app/admin/forms/` (registry + dynamic page)
- Admin sidebar config: `app/admin/nav-config.ts`
- Admin primitives: `app/admin/ui.tsx`, `PageHeader.tsx`, `SectionLabel.tsx`,
  `PendingButtons.tsx`, `ConfirmDialog.tsx`, `SubmissionsTable.tsx`
  (`ui.tsx` re-exports `PageHeader`/`SectionLabel`, which are client so they
  can read the route to colour themselves)
- Public form guard: `components/SubmitLockForm.tsx` · bot filter:
  `lib/anti-spam.ts`
- Static content fallback: `lib/data.ts`
- Unsubscribe: `app/unsubscribe/`, `app/api/unsubscribe/`

## Header nav behaviour (deliberate design)

`components/Nav.tsx` follows one rule: **blend at the top, contrast on
scroll.** At the very top the bar is transparent and its logo/links take the
hero's contrast colour; once scrolled it lifts into an opaque cream surface
with a soft shadow. `heroIsDark = pathname === "/"` is the only dark hero
(white content over it); every other public page opens on a cream hero (ink
content). Opening a menu/drawer at the top of the home hero tints the bar deep
maroon; everywhere else the open state is the cream surface. If you add a new
dark-hero page, extend the `heroIsDark` check or the top state will show ink
links over a dark background.

## Events, the Upcoming menu, and "past" hygiene

The header **Upcoming** menu auto-injects any `cms_events` row that is
`status = announced` + `show_in_nav = true` (see `getNavConfig` in
`lib/cms-content.ts`). Status is the source of truth: when an event has
happened, set it to **Past** in `/admin/events`, or it stays in Upcoming
forever. The 60-Second Talk Night (16 July 2026) is now a past `special`;
its recap lives at `/60-second-talk-night` and it is surfaced on `/salons`
with a hardcoded row (a `special`, so the CMS salon query does not catch it).

## Event attendees + feedback (generic, per-event)

Any event can keep an attendee list and collect feedback, keyed on
`cms_events`. Two service-role-only tables (RLS on, no anon/authenticated
policies): `event_attendees` (one row per person, guests expanded, a flexible
`details` jsonb, plus a `feedback_token` and `feedback_requested/reminded/
completed_at`) and `event_feedback_responses`. All access goes through
`lib/event-feedback.ts` (`import "server-only"`, uses `getAdminSupabase`).

- Admin: `/admin/events/[id]/attendees` (import from Talk Night registrations,
  or CSV; export; "Email everyone" deep-links Quick Compose; "Send feedback
  request") and `/admin/events/[id]/feedback` (responses + stats + CSV). Both
  linked from the events list.
- Feedback glance overview: the feedback page opens with one metric card per
  question, not just avg rating. Aggregation is `lib/feedback-summary.ts`
  (pure, no server-only deps, runs client + server); cards render in
  `FeedbackOverview.tsx`. Native responses are mapped onto the same
  `ImportedQuestion` / `ImportedResponse` shape so one summariser drives both.
- Imported historical feedback (events run before this flow existed) is a
  committed static archive in `lib/imported-feedback.ts`, keyed by
  `cms_events.slug`, NOT in Supabase: the per-event question sets differ from
  the native schema, and a committed module dodges the SQL-paste corruption on
  long free-text. Generated from source CSVs by a parser (edit the CSV +
  re-run, do not hand-edit rows). Rendered read-only by `ImportedFeedback.tsx`
  under "Archived feedback". Each dataset has a `tedScore` slot (null shows an
  "Awaiting" placeholder); fill it by hand when TED provides the score. Current
  datasets: `newcastle-2050-salon`, `reframe-2025`.
- Public form: `/feedback/[slug]?t=TOKEN`, one token per attendee, reuses
  `SubmitLockForm` + anti-spam, posts to `/api/event-feedback`. Nav hidden,
  noindex. Dev preview: `?t=preview` (form) / `?t=preview&done=1` (thank-you).
- Emails in `lib/email-templates.ts`: `feedbackRequestEmail` (rich follow-up:
  gated recap teaser, partner thank-yous via `TALK_NIGHT_FEEDBACK_EXTRAS`,
  directors' sign-off) and `feedbackReminderEmail`. Partner logos are
  transparent PNGs for mail-client support (`public/images/partners/*.png`);
  webp is site-only. Preview all at `/dev/emails`.
- Reminder: `processFeedbackReminders()` runs inside the existing
  `/api/cron/newsletter` cron, one nudge to non-responders after 3 days,
  claim-first so runs can't double-send.
- Migrations (hand-applied): `20260718_talk_night_feedback.sql` then
  `20260718b_event_feedback_yesno.sql`.

## Writing style

User preference: **no em or en dashes** in copy or docs. Use commas, colons,
or full stops. Applies to email copy, UI text, content, and these files.
