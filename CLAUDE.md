# CLAUDE.md

Working notes for AI/code sessions on this repo. `README.md` is the full
reference; this is just the things that will bite you if you don't know them.

## The stack, briefly

Next.js 16 (App Router) · React 19 · Tailwind v4 · TypeScript · Supabase
(Sydney) · Resend (transactional email) · Mailchimp (newsletter campaigns) ·
Vercel (auto-deploys on push to `main`, functions pinned to `syd1`).

## Gotchas (read before changing anything here)

- **Deploy = `git push origin main`.** GitHub triggers a production Vercel
  build on push to `main`; other branches make preview URLs. The production
  Vercel/Supabase/Resend/Mailchimp accounts may differ from whatever a
  generic MCP connection shows, so do not assume a project you can see via
  tooling is this site's — the Vercel MCP plugin in particular cannot see
  this project.
- **Vercel CLI access (not MCP):** the repo is `vercel link`-ed locally
  (`.vercel/`, gitignored) to `claused/tedxnewy`. Will's CLI login
  (`williamberry`) has two team scopes — `williamberrys-projects` (his own)
  and `claused` (zumihair's, where this project actually lives) — so every
  `vercel` command needs `--scope claused` or it'll look in the wrong team
  and find nothing. This is how the Blob store was provisioned and how
  deploys can be watched/verified from the CLI.
- **`vercel blob create-store`/`delete-store` re-syncs `.env.local`
  wholesale** as a side effect, which can silently drop unrelated vars that
  aren't set on Vercel (it stripped `SUPABASE_URL`/`SUPABASE_PUBLISHABLE_KEY`
  placeholders once already). Check `.env.local` against
  `.env.local.example` after running either. Also: `create-store`'s "link to
  project?" prompt hangs/loops under a non-interactive shell — pass
  `--yes --environment production --environment preview --environment
  development` up front rather than trying to answer the prompt.
- **Migrations are applied by hand** in the Supabase dashboard SQL editor;
  there is no runner. Every migration in `supabase/migrations/` is applied
  to production (most recently `20260806_event_photos.sql`). Write new ones
  safe to
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
  columns, button, video, divider) are defined in `lib/newsletter-blocks.ts`,
  edited with `app/admin/_blocks/BlockCanvas.tsx`, and rendered server-side by
  `lib/newsletter-render.tsx` (React Email). `columns` is a container (2 or 3
  columns, width ratios + vertical align) holding a stack of curated children
  (text, image, button) per column; buttons carry a colour theme (incl. a
  gradient) and a solid/outline style; images add a full-bleed width; most
  top-level blocks take an optional standout background tint. The canvas
  reorders by drag handle (arrows kept for a11y). `validateBlocks` is the safety
  net: it drops unknown types and migrates any legacy `twoColumn` block to
  `columns` and drops the retired `countdown` on load, so old stored drafts keep
  working with no migration. The newsletter, the subscriber-flow steps, and
  Quick Compose all use it. The
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
- **Socials matches the newsletter campaigns status model.** `/admin/socials`
  (`social_posts` + `social_post_media`, migration `20260719b`; connections +
  results in `social_connections`/`channel_results`, migrations `20260809*`/
  `20260810*`; status aligned to Draft/Scheduled/Posted in `20260811_social_status_align.sql`)
  uses the same three-status shape and `?tab=` tab bar as
  `/admin/newsletter/campaigns` (no separate "needs changes" review status —
  `status_note` is now a plain, always-editable Notes field, not gated to a
  status). A Scheduled channel that has been synced from Buffer
  (`lib/buffer-social.ts`) gets a real **Publish** button with a
  phone-mockup preview confirm before it goes out (`mode: shareNow`,
  immediate, no scheduling). An unconnected channel falls back to the
  original manual run sheet (copy caption, post by hand, mark Posted) — keep
  that fallback framing for any channel that isn't synced. Posted is an
  automatic terminal state (all selected channels succeeded), not something
  picked manually, outside that one fallback button. Channels are connected
  in Buffer's own dashboard, not here (an official API partner for Instagram
  Business/Facebook Pages/LinkedIn Company Pages, so no OAuth app or
  developer review of ours); **Sync from Buffer** on the collapsible
  Connections card (collapsed by default; a connected-count chip and the key
  expiry chip stay visible either way) just reads that list back and matches
  by platform, with a picker if Buffer has more than one channel for the
  same platform. **`BUFFER_API_KEY` expires 10 August 2027** (1-year key) —
  regenerate at publish.buffer.com/settings/api and update it locally and in
  Vercel before
  then; the same date shows on the Connections card itself. Graphics designed
  in the embedded Creative studio store their `PostSpec` json plus the source
  photo, so they can be reopened and re-edited; plain uploads have no spec
  and are not re-editable. A photo picked via **Select from gallery**
  (`components/GalleryPicker.tsx`) stores the original event photo URL
  directly as the source — no re-upload into `cms-uploads`, unlike a
  freshly uploaded file.
- **`components/GalleryPicker.tsx` is a self-contained gallery photo picker**
  (fetches `cms_events` + `event_photos` straight from the browser client —
  both public-read RLS, so no server action or prop-threading needed). Wired
  into `app/admin/ImageUploadField.tsx` (covers every one of its call sites:
  newsletter image/video-thumbnail/column-image blocks, Speaker/Event/Team
  forms) and into the Creative studio's photo step
  (`components/team-brand/CreativeStudio.tsx`). Any new image picker should
  reuse `ImageUploadField` rather than building its own upload UI, to get
  this for free.
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

## Environment variables (prod, all set)

`SUPABASE_URL`, `SUPABASE_PUBLISHABLE_KEY`, `SUPABASE_SECRET_KEY`,
`RESEND_API_KEY`, `RESEND_FROM`, `CRON_SECRET`, `MAILCHIMP_API_KEY`,
`MAILCHIMP_AUDIENCE_ID`, `MAILCHIMP_WEBHOOK_SECRET`,
`MAILCHIMP_WEBHOOK_SIGNING_SECRET` (stored, not yet verified in code),
`BUFFER_API_KEY` (socials publishing, **expires 10 August 2027** — see the
Socials gotcha above), `BLOB_READ_WRITE_TOKEN` (Vercel Blob, event photo
galleries only — the app doesn't read it, only
`scripts/upload-event-photos.mjs` does), plus optional `NTFY_TOPIC` /
`SLACK_WEBHOOK_URL` / `DISCORD_WEBHOOK_URL`.

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
- Quick Compose ("Quick email" in the sidebar): `app/admin/emails/`
  (audiences `audiences.ts`, saved templates `templates.ts`) ·
  Newsletter hub: `app/admin/newsletter/` (`page.tsx` is a tile dashboard;
  the campaign list lives at `campaigns/`, the editor at `[id]/`; the hub
  also fronts `/admin/subscribers` and `/admin/subscriber-flow`, which keep
  their routes but sit under Newsletter in the sidebar via the nav item's
  `also` prefixes) · Welcome flow: `app/admin/subscriber-flow/`
- Admin section colour theme: `app/admin/section-theme.ts` (consumed by the
  dashboard, `PageHeader.tsx`, `SectionLabel.tsx`, `AdminShell.tsx`)
- Events CMS: `app/admin/events/`, public `app/events/`
- Sponsors CMS: `app/admin/sponsors/`, public `app/sponsors/`, reader
  `getSponsors()` in `lib/cms-content.ts`
- Signature/Signal: `app/signature/` (listing), `app/signal/` (bespoke
  ticket page, dark theme, see the dedicated section above)
- Socials drafts log: `app/admin/socials/` (shared defs `shared.ts`,
  actions `actions.ts`, editor `[id]/PostEditor.tsx`, connections UI
  `ConnectionsCard.tsx`); Buffer publishing `lib/buffer-social.ts`; canvas
  renderer `lib/creative-canvas.ts`; shared studio UI
  `components/team-brand/CreativeStudio.tsx` (also used by `/team-brand`)
- Gallery photo picker (event photos, reused wherever an image is picked):
  `components/GalleryPicker.tsx`, wired into `app/admin/ImageUploadField.tsx`
  and `CreativeStudio.tsx`
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
- Event photo galleries: per-event photos hosted on Vercel Blob (store
  `tedxnewy-event-photos`, project-linked, `BLOB_READ_WRITE_TOKEN` in env),
  catalogued in `event_photos` (migration `20260806_event_photos.sql`,
  public read). Reader: `getPhotosForEvent` in `lib/cms-content.ts`. Public
  UI: a 6-photo teaser + "See the full gallery" button wherever an event's
  photos are shown, full grid + lightbox at `/events/[slug]/gallery`
  (`components/PhotoGallery.tsx`), plus a homepage section (`app/page.tsx`,
  "Check out our gallery") listing every event that has photos with a
  two-image preview each. To publish a batch: drop the raw photos in
  `raw-event-photos/<event-slug>/` (see its README), run `node
  --env-file=.env.local scripts/upload-event-photos.mjs <event-slug>`
  (resizes to a 2400px display WebP + 640px thumbnail WebP, uploads both to
  Blob), then paste the generated `catalogue.sql` into the Supabase SQL
  editor to publish. No production Supabase credentials are ever needed
  locally for this flow. **Gotcha:** the teaser only renders for free on the
  generic `/events/[slug]` template. `newcastle-2050-salon` and
  `60-second-talk-night` are bespoke hand-built pages that `link_url`
  redirects to instead (see the header nav section below), so each fetches
  its own event + photos and carries its own copy of the teaser section —
  a new bespoke event page needs the same wiring added by hand.
- Season announcement pop-up (October 24 signature event): mounted site-wide
  in `app/layout.tsx`, component `components/SeasonAnnouncePopup.tsx`, image
  `public/images/season-2026-announce.webp`. Shows once, 5s after first
  visit; closing with the X minimises it to a reopenable edge tab (persisted
  in localStorage key `season-announce-oct24`); a completed signup hides it
  for good. Samples the page background behind it at trigger time to switch
  between a dark and a light card, so it does not need a hardcoded page
  list. Has a `FORCE_SHOW_FOR_PROOFING` flag at the top of the file (off by
  default) that makes it ignore stored dismissal state and show on every
  visit; only for a proofing pass, never leave it on in a deploy.

## Header nav behaviour (deliberate design)

`components/Nav.tsx` follows one rule: **blend at the top, contrast on
scroll.** At the very top the bar is transparent and its logo/links take the
hero's contrast colour; once scrolled it lifts into an opaque cream surface
with a soft shadow. `heroIsDark = pathname === "/" || pathname === "/signal"`
are the only dark heroes (white content over them); every other public page
opens on a cream hero (ink content). Opening a menu/drawer at the top of a
dark hero tints the bar deep maroon; everywhere else the open state is the
cream surface. If you add a new dark-hero page, extend the `heroIsDark` check
or the top state will show ink links over a dark background. The desktop and
mobile nav CTA both point at **`/signal`** and read "Get tickets" (was
"Subscribe" → `/subscribe` before the 2026 flagship went on sale).

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

## Signature events, Signal, and sponsors (2026-08)

Past-events browsing was rebuilt around three flagship-shaped destinations
instead of Talks/Salons/Speakers. The header's Past Events cards are now
**Signature / Salons / All Talks** (`lib/nav-fallback.ts`); Speakers dropped
off that menu (still reachable at `/speakers`, just not surfaced there).

- **`/signature`** is modelled on `/salons`: an upcoming card (Signal) up
  top, then past flagships (Reframe 2025, Beyond Boundaries 2024) below,
  each linking to its own event page. Built from `getEvents({ kind:
  "flagship" })`, no hardcoded event list.
- **Signal is the 2026 flagship**, not a separate thing: the CMS row keeps
  its original slug `flagship-2026` (id stability, existing references) but
  now titles itself "Signal" with `link_url = '/signal'` and a real
  `ticket_url`, so `/events/flagship-2026` redirects straight to the bespoke
  page, same pattern as `newcastle-2050-salon` and `60-second-talk-night`.
  The homepage's flagship tile and the nav's Upcoming item both link to
  `/signal` directly (hardcoded, not derived from the CMS row's link, so
  they work even before/without that row existing).
- **`/signal`** is a bespoke, fully dark-themed ticket-sale page (the one
  deliberate exception alongside `/` to `heroIsDark`, see above), with an
  ambient `NodeNetwork` background (`variant="light"`, low opacity, fixed).
  Content is standardised on one container everywhere:
  `mx-auto max-w-[1100px] px-5 md:px-6` — before standardising this, three
  different max-widths were in play and it read as misaligned; don't
  reintroduce a one-off width without a reason. Sections, top to bottom:
  full-bleed photo hero (date + Get tickets overlaid on the image, no
  separate light hero block above it), about, a **real data-driven "past
  editions" timeline** (`getEvents({ kind: "flagship" })`, already
  newest-first from `sortEvents`, so Signal leads), a **speaker teaser**
  pulling Signal's own lineup via `getSpeakersForEvent(signalEvent.id)` with
  an always-present dashed "Revealed soon ?" card appended after whatever
  real speakers exist (0 today; add via `/admin/speakers` with Event =
  Signal, cap intentionally left uncapped, the mystery card is just always
  last), agenda, venue (verified real address, Corner Laman Street and
  Auckland Street, Newcastle NSW 2300, plus a Google Maps iframe embed with
  a CSS `invert()`/`hue-rotate()` filter so it doesn't look like a bright
  white hole in a dark page), an honest "make a weekend of it" placeholder
  (no invented partner venues, just "details coming soon"), sponsors, FAQ, a
  "see more events" band, then a **red** (`#e02214`) final CTA — deliberately
  not the same near-black as the footer directly below it, or the two blend
  into one another.
- **Get tickets everywhere opens the Humanitix pop-up widget**, not a new
  tab: `next/script` loads
  `https://events.humanitix.com/scripts/widgets/popup.js` (`strategy=
  "afterInteractive"`), and every ticket link's `href` is
  `https://events.humanitix.com/tedxnewy-signature-event/tickets?widget=popup`
  (`TICKET_POPUP_URL` in `app/signal/page.tsx`). The widget's own JS
  intercepts the click; the href is a real, working fallback URL if it
  doesn't load.
- **Sponsors are a CMS entity now**, not the old hardcoded `lib/data.ts`
  array: `cms_sponsors` (migration `20260813_sponsors.sql`, seeded from the
  old static list so nothing changed on first run), reader `getSponsors()`
  in `lib/cms-content.ts` (Supabase, falls back to the static array). Admin
  CRUD at `/admin/sponsors` under Content in the sidebar, mirrors the
  Speakers admin pattern exactly (`SponsorForm.tsx`/`SponsorsList.tsx`/
  `actions.ts`), with a logo upload field (`ImageUploadField`, folder
  `sponsors`). `/sponsors` and `/signal`'s sponsor strip both read
  `getSponsors()`; a sponsor with no `logo_url` still renders as a text
  wordmark on both, so adding a sponsor without a logo file never breaks
  the page. `/signal`'s strip additionally excludes a short hardcoded
  name list (`SIGNAL_SPONSOR_EXCLUDE` — currently Elqo, Newy Digital,
  Frekl) that Will wants on `/sponsors` but not on the ticket page; that
  list is a deliberate editorial choice, not a tier rule, so don't try to
  derive it from `tier` instead.
- Two backfill migrations were needed because `cms_talks`/`cms_speakers`
  predate the events CMS table and had never been linked to their event:
  `20260812_link_flagship_lineups.sql` (event_id backfill by matching the
  old `event`/`year` columns) and `20260812b_flagship_story_blurbs.sql`
  (replaced Beyond Boundaries' and Reframe's one-line blurbs with an actual
  short story, rendered as real paragraphs by `/events/[slug]` now that it
  splits `blurb` on `\n\n`). All four migrations from this work
  (`20260811_signal_event.sql`, the two above, and `20260813_sponsors.sql`)
  are applied to production as of 2026-08-13.
- This whole rebuild shipped on branch `signature-events-rebuild`
  (Vercel Preview only, deliberately not merged to `main` yet — it's still
  being proofed). Preview deploys needed `SUPABASE_URL`/
  `SUPABASE_PUBLISHABLE_KEY` added to Vercel's Preview environment (see the
  Vercel access gotcha above); they weren't there before this branch,
  because every prior deploy went straight to Production.
- Known open items on that branch: Signal has no confirmed speakers yet
  (add two via `/admin/speakers`, Event = Signal, and the "Revealed soon"
  card keeps doing its job); sponsor logos are still text wordmarks except
  wherever a logo gets uploaded in `/admin/sponsors`; the "weekend
  experience" partner venues/businesses are unnamed on purpose, pending real
  deal details from Will.

## Writing style

User preference: **no em or en dashes** in copy or docs. Use commas, colons,
or full stops. Applies to email copy, UI text, content, and these files.
