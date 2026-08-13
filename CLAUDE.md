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
  this for free. Two behaviours inside it:
  - **Events are collapsible rows, closed by default.** Not just tidier:
    a closed row renders no thumbnails at all, and one gallery is 280 photos,
    so opening the picker no longer fires hundreds of image requests. Photos
    also load `lazy`.
  - **Used photos are tinted and badged** (megaphone for socials, envelope
    for email), with a tooltip naming the drafts. That mark is **derived on
    every open, never stored**: `lib/photo-usage.ts` (server-only, service
    client) walks `social_post_media` (`image_url` and `source_image_url`,
    so a studio graphic still credits the event photo behind it), plus the
    block JSON of `newsletters` and `subscriber_flow_steps`, and intersects
    the URLs it finds with `event_photos.url`. Nothing writes a flag, so
    deleting a draft clears its marks by itself and no delete path needs a
    cleanup hook. Do not "optimise" this into a stored `used` column: the
    self-clearing behaviour is the whole point. Quick Compose sends
    (`email_sends`, HTML bodies, one row per recipient) and the two saved
    template tables are deliberately NOT scanned; add them to
    `getPhotoUsage()` if that changes. Marked photos stay fully selectable.
    The feed is `app/api/photo-usage/route.ts`, a route rather than a direct
    browser query because the picker also runs on the unauthenticated
    `/team-brand`, where an admin-RLS query would silently return empty:
    signed-in admins get full detail, everyone else gets the marks with
    titles stripped. A failed fetch just means no marks, never a broken
    picker.
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
- **`html` uses `overflow-x: clip`, NOT `hidden`. Don't change it back.**
  (`app/globals.css`.) It's there to stop anything pushing the document
  wider than the viewport on mobile. `hidden` does that too, but it also
  makes the element a scroll container, which silently breaks
  `position: sticky` for every descendant on the page: the symptom is a
  sticky section simply not sticking, with no error anywhere. `clip`
  contains the overflow identically without creating that scroll container.
  The same trap applies locally: **never put `overflow-hidden` on a section
  that contains a sticky child** (this bit `/youth-futures-lab`'s scroll
  wheel once already).
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
  ticket page, dark theme, gated behind `SIGNAL_LIVE` — see the dedicated
  section below for the full build, including `SignalPromoBanner.tsx`,
  `StickyTicketButton.tsx`, `TestimonialCarousel.tsx`), flagship event
  detail pages via `app/events/[slug]/page.tsx`'s `isFlagship` branch
  (`SpeakerCarousel.tsx`)
- Socials drafts log: `app/admin/socials/` (shared defs `shared.ts`,
  actions `actions.ts`, editor `[id]/PostEditor.tsx`, connections UI
  `ConnectionsCard.tsx`); Buffer publishing `lib/buffer-social.ts`; canvas
  renderer `lib/creative-canvas.ts`; shared studio UI
  `components/team-brand/CreativeStudio.tsx` (also used by `/team-brand`)
- Gallery photo picker (event photos, reused wherever an image is picked):
  `components/GalleryPicker.tsx`, wired into `app/admin/ImageUploadField.tsx`
  and `CreativeStudio.tsx`; "already used" marks derived by
  `lib/photo-usage.ts` and served by `app/api/photo-usage/route.ts`
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
- Event recap videos: committed to `public/video/` as two derivatives per
  event, `<event>-banner.mp4` (short muted autoplay loop for the hero, no
  audio track) and `<event>-recap.mp4` (the full cut, with audio, played
  via `components/RecapVideo.tsx`'s click-to-play so the large file isn't
  fetched until asked for), each with a matching `-poster.jpg` frame. Both
  are 1080p H.264 `+faststart`; the recap runs about 25 to 45MB, which is
  in line with what's already committed. The 4K masters live OUTSIDE the
  repo in `../Source-Videos/` (see the workspace CLAUDE.md) and are never
  committed. To cut a new pair, ffmpeg the master: `-ss <start> -t <len>
  -an` for the banner, full length with `-c:a aac` for the recap, and pull
  posters with `-vframes 1`.
- Event photo galleries: per-event photos hosted on Vercel Blob (store
  `tedxnewy-event-photos`, project-linked, `BLOB_READ_WRITE_TOKEN` in env),
  catalogued in `event_photos` (migration `20260806_event_photos.sql`,
  public read). Reader: `getPhotosForEvent` in `lib/cms-content.ts`. Public
  UI: a 6-photo teaser + "See the full gallery" button wherever an event's
  photos are shown, full grid + lightbox at `/events/[slug]/gallery`
  (`components/PhotoGallery.tsx`), plus a homepage section (`app/page.tsx`,
  "Check out our gallery") listing every event that has photos with a
  two-image preview each. The preview always takes the first two photos by
  `display_order` ascending, same field/order as the full gallery, no
  separate "featured" flag; to pin specific photos into that preview without
  reordering the whole gallery, set just those photos' `display_order` to
  negative values (e.g. -2/-1) via the Supabase Table Editor so they sort
  first regardless of everything else's positive values (done 2026-08-13 for
  all three galleries). To publish a batch: drop the raw photos in
  `raw-event-photos/<event-slug>/` (see its README), run `node
  --env-file=.env.local scripts/upload-event-photos.mjs <event-slug>`
  (resizes to a 2400px display WebP + 640px thumbnail WebP, uploads both to
  Blob), then paste the generated `catalogue.sql` into the Supabase SQL
  editor to publish. No production Supabase credentials are ever needed
  locally for this flow. Safe to re-run for a full swap of an existing
  event's gallery (e.g. `reframe-2025` was fully replaced with a new
  280-photo batch 2026-08-12): the generated SQL deletes that event's
  existing rows before inserting, and Blob uploads overwrite by pathname,
  so nothing needs manual cleanup first — just replace the contents of
  `raw-event-photos/<slug>/` and re-run. **Gotcha before uploading a batch
  Will drops in an ad-hoc folder:** sample a few photos spread across it
  first — the source filenames are the photographer's own export naming,
  not evidence of which event/chapter they're actually from (one such
  "reframe" batch turned out to be a different TEDx chapter's own event).
  **Gotcha:** the teaser only renders for free on the
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
  visit; only for a proofing pass, never leave it on in a deploy. The
  collapsed label reads "Join the club".
  **The minimised state is two different elements by breakpoint, on
  purpose.** The rotated vertical edge tab (`fixed right-0`) renders from
  `sm:` up only. On mobile it kept landing partly off-screen: first fixed
  globally with `overflow-x` on `html` (below), then with a
  `window.visualViewport` measurement, and neither fully held, because some
  mobile/in-app browsers size `position: fixed` against a layout viewport
  that doesn't match what's visible. Rather than keep chasing the offset,
  mobile gets its own compact pill inset from the corner
  (`fixed bottom-4 right-4`, plain horizontal text) where being a few pixels
  out is invisible. Don't "simplify" these back into one flush-to-the-edge
  element.

## Header nav behaviour (deliberate design)

`components/Nav.tsx` follows one rule: **blend at the top, contrast on
scroll.** At the very top the bar is transparent and its logo/links take the
hero's contrast colour; once scrolled it lifts into an opaque cream surface
with a soft shadow. `heroIsDark` is `pathname === "/" || pathname === "/signal"`
plus the current flagship event detail slugs
(`/events/reframe-2025`, `/events/beyond-boundaries-2024` — see the
Signature/Signal section below) — these are the only dark heroes (white
content over them); every other public page opens on a cream hero (ink
content). Opening a menu/drawer at the top of a dark hero tints the bar deep
maroon; everywhere else the open state is the cream surface. If you add a new
dark-hero page, extend the `heroIsDark` check or the top state will show ink
links over a dark background. The desktop and mobile nav CTA reads "Get
tickets" → `/signal` only when `SIGNAL_LIVE` is `true`; while it's gated the
CTA reverts to its pre-Signal "Subscribe" → `/subscribe` (see the `SIGNAL_LIVE`
bullet below — don't hardcode "Get tickets"/`/signal` here again, it's
computed from the flag). The bar's `top` is also not always `0`: it reads
`var(--banner-offset, 0px)` so a page-specific promo banner (currently only
Signal's) can push it down without touching this shared file per page — see
the `SignalPromoBanner` bullet below.

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
- This whole rebuild shipped on branch `signature-events-rebuild` and was
  merged to `main` on 2026-08-11 (Signature/Salons/All Talks, sponsors CMS,
  event page enrichments are all live in Production). Preview deploys had
  needed `SUPABASE_URL`/`SUPABASE_PUBLISHABLE_KEY` added to Vercel's Preview
  environment (see the Vercel access gotcha above); they weren't there
  before this branch, because every prior deploy went straight to
  Production.
- **Signal itself is gated behind `SIGNAL_LIVE` in `lib/feature-flags.ts`**
  (currently `false`): it has no confirmed speakers yet, sponsor logos are
  still mostly text wordmarks, and the "weekend experience" partner
  venues/businesses are unnamed placeholders pending real deal details from
  Will, so it isn't ready for public ticket sales. While the flag is off,
  `/signal` and `/events/flagship-2026` redirect to `/signature`, and the
  header's "Upcoming" menu shows a "Signal · Coming soon" row with no href
  instead of hiding it outright (`lib/nav-fallback.ts`'s static item, and
  `fetchNavConfig` in `lib/cms-content.ts` which strips `link_url` off the
  live DB-driven Signal row the same way — `eventsToNavItems` already
  badges any href-less event "Coming soon"). `/signature`, `/events` and
  the homepage's "Our recent events" section (which only shows past
  flagship/salon events now, see below) don't reference Signal at all while
  it's gated, and the header CTA reverts to its pre-Signal "Subscribe" →
  `/subscribe`. The rest of Signal (content, admin CRUD, the bespoke page
  itself) is fully built and live in the database; flipping `SIGNAL_LIVE`
  to `true` and pushing to `main` is the only step needed to open it to the
  public once speakers/sponsors/weekend info are ready — the redirects and
  nav gating above all revert automatically. Add speakers via
  `/admin/speakers`, Event = Signal (the "Revealed soon" card keeps doing
  its job until then); sponsor logos upload via `/admin/sponsors`.
  **`/signal?preview=<SIGNAL_PREVIEW_TOKEN>`** (the token lives in
  `lib/feature-flags.ts`) bypasses the redirect for a private link while
  gated — obscurity, not real access control, and the page stays
  `robots: noindex` either way. Signal also has a real testimonials section
  now (`components/TestimonialCarousel.tsx`: one quote spotlighted at a
  time, auto-advancing every 5s with a cross-fade — always-on, no
  hover-pause, that was tried and explicitly removed — plus manual
  prev/next arrows that reset the timer, and dot indicators) sitting
  between sponsors and FAQ, seeded with real attendee quotes from past
  events (not placeholders — don't overwrite with lorem ipsum if
  refactoring nearby). Two more Signal-only pieces:
  `components/SignalPromoBanner.tsx` (dismissible top banner, early-bird
  offer copy) and `components/StickyTicketButton.tsx` (floating "Get
  tickets" pill, shown once scrolled past the hero and hidden again near
  the final CTA, brief bounce animation every 4s via `.cta-jump` in
  `globals.css`). The banner is the one that reads/writes
  `--banner-offset` on `<html>` (see the header nav section above) —
  measured from its own rendered height via a ref, not hardcoded, so it
  stays correct if the copy ever wraps to two lines at some breakpoint.
- **Homepage "Our recent events"** (`app/page.tsx`) shows the 3 most recent
  past flagship + Salon events (`pastEvents.filter(kind flagship||salon)`,
  already newest-first, `.slice(0, 3)`) as `PastEventCard`s, then two
  buttons — "View Salons" → `/salons`, "View Signature events" →
  `/signature` — instead of a full grid. No Signal tile here any more;
  Signal's own visibility lives in the nav and `/signature` per the bullet
  above.
- **Flagship (Signature) event detail pages get the Signal treatment.**
  `app/events/[slug]/page.tsx` branches on `event.kind === "flagship"`: a
  full-bleed photo hero with title/meta overlaid (same visual language as
  `/signal`), a full-width story (no `max-w` clamp on the blurb paragraphs),
  and a speaker lineup that's a swipeable horizontal carousel
  (`components/SpeakerCarousel.tsx`: touch/trackpad swipe on every
  breakpoint via `snap-x snap-mandatory overflow-x-auto`, plus prev/next
  arrow buttons and a visible slim scrollbar — `.carousel-scrollbar` in
  `globals.css` — from `md:` up, since a mouse has no swipe gesture of its
  own) instead of a grid. Salon/special events keep the original text-hero
  + grid layout. Because Nav.tsx's `heroIsDark` check is a hardcoded
  pathname allowlist (it has no access to the event's `kind`), the two
  current flagship slugs (`/events/reframe-2025`,
  `/events/beyond-boundaries-2024`) are hardcoded into that check alongside
  `/signal` — add any future past-flagship slug there too, or its header
  will render ink-on-dark.
- **Nav "Past Events" card images and sponsor logos both had the same root
  cause: unoptimised source files, not a code bug.** The original Salons/
  All Talks nav card images and the University of Newcastle/Henderson/Frekl
  sponsor logos all rendered smaller or slower than their neighbours purely
  because of the source asset, not the box/CSS around them — worth checking
  first if a "why is this one image slow/small" question comes up again.
  The nav card images (`lib/nav-fallback.ts`) are now `/images/nav-
  signature.webp`, `/images/salon-2050/community-event.webp`, and
  `/images/nav-all-talks.webp`: properly sized/compressed WebP (~100-120KB)
  reusing real event photos, replacing a `salon-whatif.jpg` that was never
  loaded anywhere else on the site (always a cold cache fetch) and a
  `stage-benjie.jpg` that, while reused elsewhere, was a ~450KB unoptimised
  JPG. Sponsor logos on `/sponsors` (`app/sponsors/page.tsx`) render inside
  a fixed `h-16 w-40` (`sm:h-20 sm:w-48`) box with `object-contain`, but
  that alone doesn't fix a logo whose *source file* has large transparent
  padding baked in (object-contain scales the whole canvas, padding
  included) — the University of Newcastle/Henderson/Frekl files had 68-81%
  transparent vertical padding, invisible until you diff the canvas size
  against the actual opaque-pixel bounding box. Fixed by re-cropping those
  three logo files to their true content and handing them to Will to
  re-upload via `/admin/sponsors`; no code change fixes a padded source
  file.
- **Body paragraphs go full-width, not headings.** Site-wide, `<p>` (and a
  couple of `<blockquote>`/`<div>`) elements that sit alone in a genuine
  single-column section (no adjacent 2-column element, not a centred
  empty-state message, not a photo caption overlay) had their
  `max-w-[Nch]` reading-width clamp removed so they fill the section like
  the heading above them does. Headings keep their clamps (they're there
  for balanced wrapping, not reading width) as do paragraphs that are
  legitimately narrow by context: 2-column/CTA-row layouts, centred hero
  taglines, centred empty-state or confirmation messages, modal dialogs,
  and photo captions overlaid on an image.
- **Youth Futures Lab is a past Salon with a full recap page.** It ran
  7 August 2026; its `cms_events` row is `status = past` (flipped by hand
  2026-08-13) and its kind is `special`, so the salon query doesn't catch
  it. It's surfaced on `/salons` under "Past salons" as a hardcoded row
  *above* 60-Second Talk Night, since it's the more recent of the two
  (7 August vs. 16 July 2026); those two rows are manually ordered, not
  sorted. `app/youth-futures-lab/page.tsx` was rebuilt from a "recap coming
  soon" placeholder into the real recap (2026-08-13): autoplay hero clip,
  a "Smart. Kind. Real." section, the ten questions as a scroll wheel
  (`components/FocusWheel.tsx`, below), the full recap video, and a
  gallery section that renders a real 6-photo teaser once `event_photos`
  has rows for it and a "gallery coming soon" card until then (so no code
  change is needed when the photos land). The whole page sits on one
  `var(--color-cream)` background with `Scribble` doodles scattered
  across every section, so they read as one continuous layer.
  Copy is drawn from the day's actual run sheet and workshop materials, in
  `../Source-Data/youth-futures-lab-resources/`. **Two standing copy rules
  for this page:** no "pitching"/"arguing" framing (teams "work an idea
  through" and "share" it), and Newcastle is a "region", not a "city".
- **`components/FocusWheel.tsx`** is the scroll-driven dial on
  `/youth-futures-lab`: a ring of icons that rotates as you scroll a tall
  track, bringing one question to the top at a time, with the heading,
  description, active question and progress dots all inside one sticky
  `100svh` frame. Four things in it are load-bearing and were each arrived
  at by fixing a real bug, so don't undo them casually:
  - The **index comes off raw `scrollYProgress`, never the spring.** A
    spring rings as it settles, so rounding its value flips the index back
    and forth across a boundary while the scroll sits still. That was the
    flicker. The spring drives the ring's rotation only.
  - **Hysteresis** (`STEP_THRESHOLD`, 0.62) means the copy changes only
    once the scroll has travelled most of the way to the next question,
    then holds, so it can't dither where a reader stops, and a fast flick
    jumps to the landing question instead of strobing through every step.
  - The copy **swaps in place: no `key` remount, no opacity animation.**
    Any fade-in paints the new text below full opacity for a beat, and
    that dip is itself the flash (from 0 it's a fully blank frame). Two
    earlier attempts to mask changes instead of removing their cause (a
    debounce, which deadlocked because every scroll event restarted the
    timer; then a velocity-driven blur, which just made the copy hard to
    read) are documented in the file so they don't get retried.
  - The text is **absolutely positioned in a fixed-height box**, or
    questions of differing lengths reflow the section on every step.
- **`components/Scribble.tsx`** is a small reusable decorative doodle:
  thirteen hand-drawn-style SVG presets (lightbulb, spark, squiggle,
  spiral, arrow, star, circle, burst, check, and four *different*
  underlines: vary them, one identical rule under every heading reads as
  a UI border rather than something drawn), plus optional `rotate` and
  `driftSeconds`. `pathLength=1` on every `<path>` so `stroke-dasharray`/
  `dashoffset` work regardless of actual path geometry, and an
  IntersectionObserver adds `.scribble-visible` (see `app/globals.css`)
  the first time each scrolls into view, "drawing" it in, after which a
  slow idle drift keeps it alive rather than freezing. Two gotchas:
  `overflow="visible"` is set on the svg because SVG clips to its viewBox
  and these paths are drawn to the edges, so without it every stroke is
  sliced in half; and the tilt rides on a `--sc-rot` custom property
  rather than `transform`, because the drift keyframes own `transform` and
  a CSS animation outranks an inline style (setting transform directly
  snaps every doodle back to 0deg the moment the drift starts).
  **These doodles carry a deliberate, narrow exemption from the global
  `prefers-reduced-motion` block** (requested by Will so the hand-drawn
  feel survives on phones with motion reduction on): the draw-in and a
  half-amplitude, half-speed drift still run. It's justified because
  nothing travels, scales, parallaxes or flashes. Do not widen that
  exemption to other animations.

## Writing style

User preference: **no em or en dashes** in copy or docs. Use commas, colons,
or full stops. Applies to email copy, UI text, content, and these files.
