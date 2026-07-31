# TEDxNewy

The TEDxNewy website — an independently licensed TED event in Newcastle,
Australia, on Awabakal and Worimi Country. Formerly TEDxCooksHill.

**Live:** https://tedxnewy.vercel.app · (custom domain `tedxnewy.com.au`
to be wired)

## Stack

- **Next.js 16** (App Router) · **React 19** · **Tailwind CSS v4** · **TypeScript**
- **Bricolage Grotesque** (variable, opsz axis) — single sans family
- **Supabase** (Sydney region) — form submissions, CMS content (talks,
  speakers, team, posts, events, nav), newsletters + welcome flow, and the
  admin email log (`email_sends`)
- **Resend** — transactional + admin-composed email (see [Email system](#email-system))
- **Mailchimp** — newsletter campaign delivery + audience sync (see [Email system](#email-system))
- **Vercel** — hosting; auto-deploys on push to `main`; functions pinned to
  Sydney (`syd1`) next to Supabase; a cron hits `/api/cron/newsletter`
  every 5 minutes for scheduled sends

## Local development

```bash
npm install
cp .env.local.example .env.local   # fill SUPABASE_URL + SUPABASE_PUBLISHABLE_KEY
npm run dev
```

Site runs at http://localhost:3000.

### Environment variables

Set in `.env.local` for dev and in the Vercel project for production.

| Var | Required | Purpose |
| --- | --- | --- |
| `SUPABASE_URL` | Yes | Supabase project URL |
| `SUPABASE_PUBLISHABLE_KEY` | Yes | Anon/publishable key. Insert-only on form tables via RLS (see [Form submissions](#form-submissions)) |
| `RESEND_API_KEY` | For email | Resend key. Use a **full-access** key: sending needs it, and the Send history view reads `GET /emails` (a send-only key returns 401/403) |
| `RESEND_FROM` | For email | Verified sender, e.g. `TEDxNewy <noreply@tedxnewy.com.au>`. If unset, falls back to `onboarding@resend.dev`, which gets spam-filed (see [Email system](#email-system)) |
| `SUPABASE_SECRET_KEY` | For newsletter/flow | Service key (bypasses RLS). Used only by the cron, unsubscribe routes, the Mailchimp webhook, and the send pipelines via `lib/supabase-admin.ts` |
| `CRON_SECRET` | For scheduling | Bearer token Vercel sends when its cron calls `/api/cron/newsletter` |
| `MAILCHIMP_API_KEY` | For newsletter | Marketing API key (expires ~July 2027; rotate when campaign sends go quiet) |
| `MAILCHIMP_AUDIENCE_ID` | For newsletter | The production audience ("TEDxNewy Email Subscribers") campaigns send to and signups sync into |
| `MAILCHIMP_WEBHOOK_SECRET` | For sync | Gates `/api/mailchimp/webhook?secret=...`, which writes Mailchimp subscribes/unsubscribes back to the local table |
| `MAILCHIMP_WEBHOOK_SIGNING_SECRET` | Stored | Mailchimp's webhook signing secret; kept for future signature verification, not checked yet |
| `NTFY_TOPIC` / `SLACK_WEBHOOK_URL` / `DISCORD_WEBHOOK_URL` | Optional | Extra channels for new-submission alerts to the team |

Email degrades gracefully: with no `RESEND_API_KEY` the app logs what it
*would* have sent instead of failing, and with no Mailchimp vars the
newsletter falls back to per-recipient Resend (capped at Resend's free
100/day, so real campaigns need Mailchimp configured).

## Pages

| Route | Purpose |
| --- | --- |
| `/` | Hero, most recent event (60-Second Talk Night recap), Our Signature Events (October flagships + a teased 2026 placeholder), stats, what is TEDx, participate, identity + subscribe |
| `/speakers` | All past speakers with search + year filter; click any portrait for an in-page modal bio |
| `/speakers/[slug]` | Direct deep-link page per speaker (10 routes, pre-rendered) |
| `/salons` | Salon series: 60-Second Talk Night + Newcastle 2050: What If? as past salons, plus a "Subscribe to find out when" CTA for future salons. The Talk Night is a `special` in the events CMS, so it is surfaced here with a hardcoded row rather than the CMS salon query |
| `/newcastle-2050-salon` | Newcastle 2050 Salon recap with autoplay banner + click-to-play recap video |
| `/talks` | Talks archive with search + year filter; videos rolling out on YouTube through 2026 |
| `/mission` | Mission · six pillars · what is TEDx · acknowledgment · events list |
| `/sponsors` | Tiered partner list + "Partner with us" CTA |
| `/volunteer` | Volunteer crew application form |
| `/speak` | Speaker nomination form |
| `/team` | The volunteer crew (admin-managed via `/admin/team`) |
| `/ideas` `/ideas/[slug]` | Online Ideas blog with markdown rendering |
| `/events` `/events/[slug]` | CMS-driven events index + auto-generated event pages (lineup sections appear when speakers/talks are linked; `link_url` overrides to a custom page) |
| `/60-second-talk-night` | Salon 2 recap (event was 16 July 2026): muted 4.3s banner loop, the seventeen speakers and their ideas, looping 60s ring, click-to-play recap video, and The Base as venue partner (logo at `public/images/partners/the-base.webp`). Opens on a light cream hero. The registration form is retired |
| `/youth-futures-lab` `/student-speaker-competition` | Custom event pages with registration/entry forms |
| `/feedback/[slug]` | Post-event feedback form, opened from a tokenised link (`?t=…`) emailed to each attendee. Resolves the token to its event, records the response, then shows a thank-you that links through to the recap. Nav hidden, noindex |
| `/subscribe` | Standalone subscribe landing — built for Instagram-bio links |
| `/unsubscribe` | Token-based newsletter unsubscribe (confirm page + RFC 8058 one-click POST at `/api/unsubscribe`) |
| `/contact` | General enquiries form + participation cards + newsletter |
| `/privacy` `/terms` `/code-of-conduct` | Legal pages |
| `/thanks` | Post-submit confirmations (source-aware copy) |
| `/sitemap.xml` `/robots.txt` `/opengraph-image` | SEO file conventions |

## Architecture

- `app/` — App Router routes
- `components/` — shared UI (Nav with mega-menu dropdowns, Footer, hero, photo cards, forms)
- `lib/data.ts` — speakers, sponsors, season events, ORG metadata
- `lib/supabase.ts` — server-side client + IP/UA capture helper
- `public/` — brand logo (white + black variants), event photography, speaker portraits, salon videos

## Admin / CMS

Sign in at **`/admin/login`** with an email that's on the `cms_admins`
allowlist in Supabase. You'll receive a one-time magic link — no
password to remember.

The sidebar is Overview / Content / Community / Settings (config:
`app/admin/nav-config.ts`, one source for sidebar and dashboard).

The admin has a shared section-colour system in
`app/admin/section-theme.ts`: Content is coast blue, Community red, Settings
green, Forms amber. Each section's colour flows through its dashboard tile,
its page header (`app/admin/PageHeader.tsx`), section labels
(`app/admin/SectionLabel.tsx`), list and table accents, and the selected
sidebar item, so a section reads the same wherever it appears. The dashboard
is a compact bento grid grouped by these families. To recolour a section or
add one, edit `section-theme.ts` (the route to theme mapping lives there).

| Section | Drives |
| --- | --- |
| Dashboard (`/admin`) | Live counts across everything |
| Forms (`/admin/forms`) | One inbox for the public forms: count tiles, a tab per form, search/CSV/detail/bulk actions, contacted tracking, and the Talk Night accepted pipeline with its "Email accepted" flow. Registry: `app/admin/forms/registry.ts`; old per-form routes redirect here. A form flagged `archived` in the registry (currently 60-Second Talk Night) keeps its route and rows but drops out of the dashboard chips, the tile grid and the tab bar via the registry's `VISIBLE_FORMS` list; it stays reachable at `/admin/forms/[slug]` |
| Events (`/admin/events`) | `cms_events` — the header Upcoming menu, `/events` + `/events/[slug]`, `/salons`, and home event cards. Draft events are invisible publicly; announced ones appear everywhere within ~5 minutes. Each event also has **Attendees** and **Feedback** views (`/admin/events/[id]/attendees` + `/feedback`): import an attendee list (Talk Night registrations or CSV), export, email everyone, send the tokenised feedback request, and read responses. The feedback view opens with an at-a-glance overview, one metric card per question (rating averages with a mini distribution, yes/no percentages, choice breakdowns), computed by `lib/feedback-summary.ts` and rendered by `FeedbackOverview.tsx`. Backed by `event_attendees` / `event_feedback_responses` via `lib/event-feedback.ts`; a 3-day reminder runs on the newsletter cron. Historical feedback from our previous survey provider is a committed static archive in `lib/imported-feedback.ts` (keyed by event slug, not in Supabase), surfaced read-only under "Archived feedback" with a TED-score slot filled by hand |
| Talks (`/admin/talks`) | `/talks`; talks link to events via a dropdown |
| Speakers (`/admin/speakers`) | `/speakers`; speakers link to events via a dropdown |
| Team (`/admin/team`) | `/team` — public organisers + crew |
| Online Ideas (`/admin/posts`) | `/ideas` — blog with markdown editor |
| Quick email (`/admin/emails`) | One-off branded emails to pasted lists or saved audiences, built with the shared block editor; send history |
| Newsletter hub (`/admin/newsletter`) | The subscriber-email home: a tile dashboard with live stats fronting three sub-pages. Campaigns (`/admin/newsletter/campaigns`): Drafts/Scheduled/Sent with the block editor, sent as Mailchimp campaigns, scheduled sends fire via the cron. Subscribers (`/admin/subscribers`): the list with subscribed/unsubscribed views, CSV import and Mailchimp sync. Subscriber flow (`/admin/subscriber-flow`): the welcome sequence for new signups (per-step delay, on/off, block editor). The sub-pages keep their routes; the sidebar shows just Quick email, Socials and Newsletter under Community |
| Socials (`/admin/socials`) | `social_posts`/`social_post_media` — the drafts log for Instagram, Facebook and LinkedIn. Write the caption (with optional per-channel versions and live character counts), design carousel graphics in the embedded Creative studio (same tool as `/team-brand?view=creative`; designs save their spec so they stay editable) or upload finished images, and move each post Draft → Changes needed → Ready to post → Posted. **Posting is manual by design**: nothing auto-publishes; the Ready state shows a run sheet (copy caption, download graphics, open channel, mark as posted) until a scheduler like Buffer or Composio is connected |
| Navigation (`/admin/navigation`) | `cms_nav_groups`/`cms_nav_items` — the public header mega-menu |
| Notifications (`/admin/notifications`) | Who gets emailed per form |
| Admins (`/admin/admins`) | `cms_admins` sign-in allowlist |

To add a new admin, use **`/admin/team`** (or insert directly in Supabase):

```sql
insert into cms_admins (email, name) values ('teammate@tedxnewy.com.au', 'Name');
```

If Supabase is unreachable, public pages fall back to the static
content seeded in `lib/data.ts` — the site never breaks.

### Image uploads

Speaker portraits, team photos and blog hero images all support
direct upload from the admin — drag &amp; drop onto the preview, click
to pick, or paste an external URL. Files land in a public Supabase
Storage bucket (`cms-uploads`) under `speakers/`, `team/`, or
`posts/`. The bucket is anon-readable; only authenticated admins can
write (RLS via `is_cms_admin()`).

## Form submissions

All forms POST URL-encoded data to `/api/{subscribe,apply,nominate,contact}`,
which inserts into the matching Supabase table and redirects to
`/thanks?source=<form>`.

RLS is enabled on every table: `anon` can insert only, and reads /
updates / deletes require `is_cms_admin()`. So form data is visible
through the Supabase dashboard and to signed-in admins, never to the
public.

> **Consequence to remember:** because the public key is insert-only, a
> form route **cannot** query the table to check for a recent duplicate
> (RLS blocks the SELECT). That's why duplicate protection lives on the
> client, not the server (below).

### Duplicate-submission guard

Every public form is a native POST wrapped in
**`components/SubmitLockForm.tsx`** (client). On the first submit it locks
and disables the submit button, so a double-click, or a held Enter, can't
fire two POSTs and create duplicate rows. It intentionally locks on the
form's **submit** event, not the button's click: by then the request is
already committed, so disabling the button stops a second POST without
cancelling the first. It's JavaScript-dependent by design (an acceptable
trade for an occasional double-click). To add a new form, wrap its
`<form>` in `<SubmitLockForm>` instead of a bare `<form>`.

### Viewing submissions in `/admin`

All seven forms live in the **Forms hub**: `/admin/forms` (count tiles)
and `/admin/forms/[form]` (tabbed inbox). Each tab renders the shared
**`app/admin/SubmissionsTable.tsx`** with a per-form config from
`app/admin/forms/registry.ts` (columns, search keys, actions, pipelines,
spam preset). The old per-form routes redirect. Subscribers keep their own
page at `/admin/subscribers`.

The six enquiry/application pages also pass a `contactedAction` to opt
into **contacted tracking**: a per-row checkbox plus an
All / Uncontacted / Contacted filter, so admins can tick off follow-ups.
It's backed by a `contacted boolean` column + an "admins can update" RLS
policy on each table (migration
`supabase/migrations/20260613_submission_contacted.sql`). The toggle is
optimistic and persists via the per-table `set...Contacted` server
actions in `app/admin/submissions-actions.ts`. Subscribers are
deliberately left out — "contacted" doesn't apply to a mailing list. To
add the feature to another submission table: add the column + update
policy, fetch `contacted`, write a `set...Contacted` action, and pass it
as `contactedAction`.

## Email system

Two delivery rails, one editor:

- **Resend** carries transactional email: form confirmations, team
  notifications, Quick Compose sends, and the subscriber welcome flow.
- **Mailchimp** carries newsletter campaigns: `lib/newsletter-send.ts`
  renders the campaign, creates it via the Marketing API
  (`lib/mailchimp.ts`), and sends it to the "TEDxNewy Email Subscribers"
  audience. Sync is two-way: site signups upsert into the audience, site
  unsubscribes propagate, and a secret-gated webhook
  (`/api/mailchimp/webhook`) writes Mailchimp-side changes back.
- **The block editor** (`lib/newsletter-blocks.ts` +
  `app/admin/_blocks/BlockCanvas.tsx`, rendered server-side by React Email
  in `lib/newsletter-render.tsx`) drives the newsletter, the welcome flow
  steps, and Quick Compose. Blocks: header, text, image (with a full-bleed
  width), columns, button, video thumbnail, divider. Columns is a container
  (2 or 3 columns, width ratios, vertical align) you fill with text, image
  and button sub-blocks; buttons have colour themes (incl. a gradient) and
  solid/outline styles; most blocks take an optional standout background
  tint. Blocks reorder by drag handle. Legacy drafts are migrated on load
  (old two-column becomes columns, the retired countdown is dropped).
  Newsletters and flow emails carry a token-based unsubscribe footer;
  Quick Compose (ad-hoc recipients) omits it.
- **Scheduling**: a Vercel cron calls `/api/cron/newsletter` every 5
  minutes with `CRON_SECRET`. It recovers stuck sends, dispatches due
  newsletters (atomic claim, no double sends), and runs the welcome-flow
  drip steps (claim-first ledger in `subscriber_flow_sends`).

The transactional rail lives in two files:

- **`lib/email-templates.ts`**: the branded HTML shell (`emailShell`) and
  every message builder, so the live emails and the `/dev/emails` preview
  gallery never drift. `composeEmail()` builds the admin's one-off message:
  it takes either `bodyHtml` (rich HTML from the Compose editor, lightly
  sanitised and given inline styles because email clients ignore `<style>`)
  or plain `body`, and derives a `text/plain` part via `htmlToPlainText()`.
  Automated `confirm*` (to submitters) and `notify*` (to the team) builders
  live here too.
- **`lib/email-notify.ts`**: delivery. `sendFormNotification()` fans a
  new-submission alert to configured channels (Resend + optional
  ntfy/Slack/Discord). `sendConfirmationEmail()` sends one message.
  `sendBulkEmail()` sends the same message to many recipients and returns a
  per-recipient `{ ok, id, error }` result.

### Why bulk sends are batched (don't undo this)

`sendBulkEmail()` sends a whole group in **one Resend batch request**, then
falls back to paced individual sends only if a batch is rejected as a unit.
This is deliberate: the original Compose loop sent one request per recipient
with no pacing, hit Resend's **2 requests/second** limit, and **silently
swallowed the 429s**, so a group send delivered only the first ~2 per send
and dropped the rest with no error shown. Do **not** reintroduce a
per-recipient send loop for bulk mail.

### Sender + deliverability

`RESEND_FROM` must be a **verified `tedxnewy.com.au` sender** (SPF/DKIM in
Resend). Unset, it falls back to `onboarding@resend.dev`, a shared test
address that recipients' servers spam-file or reject, which presents as
"they never got it." `/admin/emails` shows a warning banner when the
fallback is active.

### Quick Compose (`/admin/emails`)

`ComposeForm.tsx` uses the shared block editor: pick recipients (pasted or
via saved audience chips that pull live from the submission tables), set a
subject, build the message from blocks, and preview the exact rendered
email in a pop-up. Before anything leaves, a confirmation dialog states how
many people it will reach (even one). Sends go per recipient through
`sendBulkEmail` and each send records to `email_sends` with sent/failed
counts reported back, tagged with the admin who sent it (`sent_by`). The
Talk Night accepted pipeline deep-links here with recipients and template
pre-filled.

Audience chips show the exact number of inboxes they will email: the count
comes from the same list that sends (`app/admin/emails/audiences.ts`), so
guest addresses are included and duplicates collapsed rather than counting
raw table rows. "Talk Night: accepted" and "Talk Night: everyone" both
include the +1 guest emails.

Templates come in two kinds: the built-in starters in
`lib/email-templates.ts`, and admin-authored ones saved from the composer
(the "Save as template" button) into the `compose_templates` table via
`app/admin/emails/templates.ts`. Saved templates store the subject plus the
block JSON, show under "Your saved templates" in the dropdown, and can be
deleted there.

### Send history (`/admin/emails/history`)

Two sources, because neither alone is complete:

1. **Resend activity**: live from Resend's `GET /emails`
   (`lib/resend-activity.ts`), the most recent 100 emails with real
   delivery status (`delivered`/`bounced`/…), covering *everything* the
   site sends. Needs a full-access `RESEND_API_KEY`.
2. **Compose log**: the local `email_sends` table, grouped by send with
   per-recipient results. Only records Compose sends, and only from when
   the table was created (migration `20260702_email_sends.sql`). Written
   from the server action under the admin session (RLS: admin read +
   insert). Each send shows the admin who sent it as a colour-coded chip
   (the colour is derived from their email); the `sent_by` column was
   added in migration `20260711_email_sent_by.sql`.

## Database migrations

SQL in `supabase/migrations/*.sql` is applied **by hand** in the Supabase
dashboard SQL editor. There is no automated runner. Each file's header
says so, and all are written to be safe to re-run (`if not exists`,
`drop policy if exists`). **Apply a new migration before deploying code
that depends on it.** RLS across these tables uses the `is_cms_admin()`
helper (defined in the CMS setup migration); the anon key inserts into form
tables but can never read them.

**Status: every migration in the folder is applied to production as of
2026-07-06** (newsletters + templates + unsubscribe columns, subscriber
flow, correctness indexes + FKs, events + nav tables with seeds, plus the
Quick Compose additions: sender attribution `20260711_email_sent_by.sql`
and admin-authored templates `20260711_compose_templates.sql`).

Writing new migrations: keep lines short and string literals short and
single-piece. The hand-paste path has corrupted long lines and multi-line
`||` concatenations before, producing misleading parse errors. Never put
JSON literals in seeds; seed skeleton rows and author content in the admin.

## Deploy flow

Wired to GitHub: pushing to `main` triggers a production Vercel deploy.
Pushes to other branches create preview deployments.

```bash
git push origin main          # → production
git push origin <branch>      # → preview URL
```

Manual deploys are still possible via `vercel deploy --prod` if needed.

## Notes for future maintainers

- The home-page hero (`components/CursorSpotlightHero.tsx`) is brand-locked
  — don't change without a deliberate design call.
- The header bar (`components/Nav.tsx`) follows one model: **blend at the top,
  contrast on scroll.** At the very top the bar is transparent and its
  logo/links take the hero's contrast colour (white over the dark home hero,
  ink over cream heroes); once scrolled it lifts into an opaque cream surface
  with a soft shadow so it reads as a distinct bar over any section. Opening a
  menu or the drawer at the top of the dark home hero tints the bar deep
  maroon to match; everywhere else the open state uses the cream surface. The
  only dark-hero route is `/` (`heroIsDark = pathname === "/"`); every other
  public page opens on a cream hero. Add any future dark-hero route to that
  check.
- Events auto-flow into the header **Upcoming** menu while they are
  `status = announced` + `show_in_nav = true`. When an event passes, set it to
  **Past** in `/admin/events` (or `update cms_events set status='past'`),
  otherwise it lingers in Upcoming. The static fallback lives in
  `lib/nav-fallback.ts` + `FALLBACK_EVENTS` in `lib/cms-content.ts`.
- The site-wide promo pop-up (`components/TalkNightBanner.tsx`) is currently
  off: its import and `<TalkNightBanner />` mount in `app/layout.tsx` are
  commented out. To run a promo again, uncomment both lines and update the
  copy, link and event date inside the component. The component is kept as a
  reusable template.
- Real talk videos live on YouTube. When they're up, populate
  `lib/data.ts talks[]` with `youtubeId`s — `/watch` will pick them up.
- `lib/data.ts` is the static fallback layer only: live content (talks,
  speakers, team, posts, events, nav) comes from Supabase `cms_*` tables
  and the site falls back to `lib/data.ts` / `lib/nav-fallback.ts` when
  Supabase is unreachable.
- Salon videos are 1080p H.264 MP4s with poster frames
  (`public/video/salon-recap.mp4` ~26 MB, banner ~2.4 MB). The original
  4K HEVC `.mov` masters were removed from the working tree (they did not
  decode outside Safari); originals live in `../Source-Images`. Consider
  YouTube for anything bigger.
- The Mailchimp API key expires around July 2027. When newsletter sends go
  quiet, rotate the key in Mailchimp and update `MAILCHIMP_API_KEY` in
  Vercel before debugging anything else.
- Email failures are **swallowed by design** (a send error must never
  break a form submission, the row is already saved). So the send
  UI/logs can look fine while mail silently fails. The truth is Resend's
  own log, surfaced in `/admin/emails/history` (Resend activity). When
  "recipients didn't get it," start there, not the code.
- Automated confirmations/notifications are **not** in the `email_sends`
  log yet (only Compose sends are). They do appear in the Resend activity
  view. If you want them in the local log too, call the logging path from
  the API routes.
