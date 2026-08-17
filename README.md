# TEDxNewy

The TEDxNewy website — an independently licensed TED event in Newcastle,
Australia, on Awabakal and Worimi Country. Formerly TEDxCooksHill.

**Live:** https://tedxnewy.com.au

## Stack

- **Next.js 16** (App Router) · **React 19** · **Tailwind CSS v4** · **TypeScript**
- **Bricolage Grotesque** (variable, opsz axis) — single sans family
- **Supabase** (Sydney region) — form submissions, CMS content (events,
  talks, speakers, team, sponsors), newsletters + welcome flow, socials
  drafts, and the admin email log (`email_sends`)
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
| `BUFFER_API_KEY` | For socials publishing | Personal API key from [publish.buffer.com/settings/api](https://publish.buffer.com/settings/api). **Expires 10 August 2027** (1-year key) — regenerate before then; also shown on the Connections card in `/admin/socials` |
| `NTFY_TOPIC` / `SLACK_WEBHOOK_URL` / `DISCORD_WEBHOOK_URL` | Optional | Extra channels for new-submission alerts to the team |
| `BLOB_READ_WRITE_TOKEN` | For event photo uploads | Vercel Blob store token (store `tedxnewy-event-photos`), used only by `scripts/upload-event-photos.mjs`. Not read by the app itself, the site just renders the public Blob URLs already saved in `event_photos` |

Email degrades gracefully: with no `RESEND_API_KEY` the app logs what it
*would* have sent instead of failing, and with no Mailchimp vars the
newsletter falls back to per-recipient Resend (capped at Resend's free
100/day, so real campaigns need Mailchimp configured).

## Pages

| Route | Purpose |
| --- | --- |
| `/` | Hero; a "Just wrapped" feature for the single most recent past event (derived from the CMS, not hardcoded, with a strip of real photos from its gallery once catalogued); "And that's just the latest." with the next three events + "View Salons"/"View Signature events"; photo galleries promo (one card per event with photos); stats, what is TEDx, participate, identity + subscribe. Both card rows are swipeable carousels on mobile and grids on desktop |
| `/salons` | Salon series: Youth Futures Lab + 60-Second Talk Night + Newcastle 2050: What If? as past salons (newest first), plus a "Subscribe to find out when" CTA for future salons. The first two are `special` in the events CMS, so they're surfaced here with hardcoded rows rather than the CMS salon query |
| `/signature` | Flagship events: Signal (2026, upcoming — gated, see below) plus Reframe (2025) and Beyond Boundaries (2024) as past editions. Built from `getEvents({ kind: "flagship" })`, modelled on `/salons` |
| `/signal` | Bespoke, fully dark-themed ticket page for the 2026 flagship (Signal): photo hero with date/tickets overlaid, a real "past editions" timeline, a Signal speaker teaser (real speakers plus an always-present "revealed soon" card), agenda (incl. an arrival/registration slot), venue (verified address + a Google Maps embed), an honest weekend-experience placeholder, sponsors, a testimonials spotlight (auto-rotating real attendee quotes, prev/next arrows), FAQ, and a red final CTA. A dismissible early-bird promo banner sits above the header, and a floating "Get tickets" button appears once scrolled past the hero. Every "Get tickets" opens the Humanitix pop-up widget rather than navigating away. **Gated behind `SIGNAL_LIVE` in `lib/feature-flags.ts`** while speakers/sponsors/weekend info are still pending — preview privately at `/signal?preview=<SIGNAL_PREVIEW_TOKEN>`. See the CLAUDE.md section "Signature events, Signal, and sponsors" for the full build notes |
| `/newcastle-2050-salon` | Newcastle 2050 Salon recap with autoplay banner + click-to-play recap video + a photo gallery teaser |
| `/talks` | Talks archive with search + year filter; videos rolling out on YouTube through 2026. "More about the speaker" inside a talk opens that speaker's bio in place (`?speaker=<slug>`), since the old `/speakers` index is retired |
| `/mission` | Mission · six pillars · what is TEDx · acknowledgment · events list |
| `/sponsors` | Tiered partner list (now CMS-backed, `getSponsors()`, admin-editable with logo upload) + "Partner with us" CTA |
| `/volunteer` | Volunteer crew application form |
| `/speak` | Speaker nomination form |
| `/team` | The volunteer crew (admin-managed via `/admin/team`) |
| `/events` `/events/[slug]` | CMS-driven events index + auto-generated event pages (lineup sections + a photo gallery teaser appear when speakers/talks/photos are linked; `link_url` overrides to a custom page, which is what the four bespoke pages below are: `/signal`, `/newcastle-2050-salon`, `/60-second-talk-night`, `/youth-futures-lab`). Every event page ends with the same live "check out our recent events" band (`components/RecentEvents.tsx`). Flagship-kind events (Reframe, Beyond Boundaries) get the Signal treatment instead of the default layout: full-bleed photo hero, full-width story text, and a swipeable speaker carousel with prev/next arrows instead of a grid |
| `/events/[slug]/gallery` | Full photo grid + click-to-enlarge lightbox (`components/PhotoGallery.tsx`) for any event with catalogued photos. See [Event photo galleries](#event-photo-galleries) |
| `/60-second-talk-night` | Salon 2 recap (event was 16 July 2026): muted 4.3s banner loop, the seventeen speakers and their ideas, looping 60s ring, click-to-play recap video, a photo gallery teaser, and The Base as venue partner (logo at `public/images/partners/the-base.webp`). Opens on a light cream hero. The registration form is retired |
| `/youth-futures-lab` | Past event (ran 7 August 2026), full recap: autoplay hero clip, a "Smart. Kind. Real." section, the ten focus questions as a scroll-driven wheel (`components/FocusWheel.tsx`), the recap video, and a photo gallery teaser that appears by itself once `event_photos` has rows. Decorated throughout with `components/Scribble.tsx` hand-drawn doodles on one continuous cream background |
| `/student-speaker-competition` | Custom event page with an entry form |
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
- `lib/data.ts` — ORG metadata plus the static fallback content used when
  Supabase is unreachable (speakers, events). Sponsors moved to the CMS
- `lib/supabase.ts` — server-side client + IP/UA capture helper
- `public/` — brand logo (white + black variants), event photography, speaker portraits, salon videos

## Admin / CMS

Sign in at **`/admin/login`** with an email that's on the `cms_admins`
allowlist in Supabase. You'll receive a one-time magic link — no
password to remember.

Every admin has an **access level** (`cms_admins.access_level`): `full` sees
everything, `community` is limited to Quick email, Calendar, Socials and
Newsletter. See [Access levels](#access-levels) below.

The sidebar is Overview / Content / Community / Settings (config:
`app/admin/nav-config.ts`, one source for sidebar and dashboard), filtered
to what the signed-in admin's level can reach.

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
| Speakers (`/admin/speakers`) | `cms_speakers` — the lineup shown on each event page, and the bio that opens when a portrait is clicked. Link a speaker to an event with the Event dropdown, or they appear nowhere. To add a 2026 Signal speaker, set Event = Signal so they show up in the `/signal` lineup teaser |
| Team (`/admin/team`) | `/team` — public organisers + crew |
| Sponsors (`/admin/sponsors`) | `cms_sponsors` — `/sponsors` and the `/signal` sponsor strip. Logo upload per sponsor; sponsors without a logo render as a text wordmark instead |
| Quick email (`/admin/emails`) | One-off branded emails to pasted lists or saved audiences, built with the shared block editor; send history |
| Calendar (`/admin/calendar`) | Four Mon to Sun weeks of everything going out: scheduled social posts, newsletter campaigns, and a read-only band for event dates so you can see the comms lining up against the thing they promote. `?start=<Monday>`; prev/next/Today are plain links, so the page stays a server component. Chips open a detail popover with status, stage, channels, a **Preview** (the same phone mockup and email iframe the list pages use) and a link into the editor. Everything buckets by **Sydney local date**, not UTC. Below `md:` the grid becomes an agenda list |
| Newsletter hub (`/admin/newsletter`) | The subscriber-email home: a tile dashboard with live stats fronting three sub-pages. Campaigns (`/admin/newsletter/campaigns`): Drafts/Scheduled/Sent with the block editor, sent as Mailchimp campaigns. **Scheduling is the only way to send** (there is no "Send now"), so a mis-click stays undoable with Unschedule until the cron picks it up; rows are clickable cards with icon actions, and a draft carries an editorial stage (early draft / needs polish / ready to schedule). Subscribers (`/admin/subscribers`): the list with subscribed/unsubscribed views, CSV import and Mailchimp sync. Subscriber flow (`/admin/subscriber-flow`): the welcome sequence for new signups (per-step delay, on/off, block editor) — see [Welcome flow](#welcome-flow) for exactly who receives what. The sub-pages keep their routes; the sidebar shows just Quick email, Socials and Newsletter under Community |
| Socials (`/admin/socials`) | `social_posts`/`social_post_media` — the drafts log for Instagram, Facebook and LinkedIn, aligned with the newsletter campaigns model: **Draft → Scheduled → Posted**, same tab bar pattern (`?tab=drafts\|scheduled\|posted`) as `/admin/newsletter/campaigns`. **Status is derived, not picked**: a post with a **schedule date** is Scheduled, **Clear scheduling** wipes that date and drops it straight back to Drafts, and Posted arrives on its own. What you set by hand is the stage (early draft / needs polish / ready to schedule), which is also what reveals the run sheet. Write the caption (live character counts per channel; a channel only gets its own version if you pick it under "Select a channel to modify the caption for", the usual case being a LinkedIn version for link posts, and unpicking a channel deletes its version on the next save), attach a **video** instead (MP4/MOV, one per post, not mixed with images: Instagram publishes a single video as a **Reel**, Facebook and LinkedIn as a normal video), design carousel graphics in the embedded Creative studio (same tool as `/team-brand?view=creative`; designs save their spec so they stay editable), upload finished images, or pick an existing event photo (see Event photo galleries below). **Publishing goes through Buffer** (`lib/buffer-social.ts`, `social_connections`, collapsible Connections card): channels are connected in Buffer's own dashboard, then **Sync from Buffer** reads that list back. A synced channel gets a real Publish button (phone-mockup preview, confirm, posts immediately) once Scheduled; an unconnected channel keeps the original manual run sheet (copy caption, download graphics, open channel, mark as posted). Posted is automatic once every selected channel has actually gone out — there's no manual "mark as posted" pick anymore outside that fallback run sheet |
| Notifications (`/admin/notifications`) | Who gets emailed per form |
| Admins (`/admin/admins`) | `cms_admins` sign-in allowlist, plus each admin's **access level** (Full / Community). Full access only |

The public header nav is **static, defined in code** (`lib/nav-fallback.ts`),
not a CMS section. The old `/admin/navigation` editor was removed in July
2026; the one dynamic piece is the Upcoming menu, filled from announced
events. The `/admin/posts` blog editor and its `/ideas` pages were removed at
the same time.

To add a new admin, use **`/admin/admins`** (or insert directly in Supabase):

```sql
insert into cms_admins (email, name, access_level)
values ('teammate@tedxnewy.com.au', 'Name', 'community');
```

### Access levels

`cms_admins.access_level` is `full` or `community` (migration
`20260817_admin_access_levels.sql`). Full is everything. Community is Quick
email, Calendar, Socials and Newsletter, plus Subscribers and the welcome
flow, which live under Newsletter. Set it per person from `/admin/admins`.

Three layers keep those in agreement, and a change needs all three:

1. **The route list** — `COMMUNITY_PREFIXES` in `app/admin/access.ts`. This
   also drives the sidebar (`visibleGroupsFor`, applied in
   `app/admin/layout.tsx`) and the dashboard tiles (`canAccessPath`), so the
   nav and the guards can't drift apart.
2. **The guards** — `requireFullAdmin()` from `lib/cms-auth.ts` on every
   non-community page and `actions.ts`; `requireAdmin()` (either level)
   everywhere else. Enforcement is per page and per action, not in
   middleware, which stays session-only so a role lookup isn't added to every
   admin navigation. Server actions are guarded individually, so a community
   admin can't invoke a full-admin action from a page they can reach.
3. **Postgres** — `is_full_cms_admin()` plus three RESTRICTIVE policies mean
   only a full admin can insert/update/delete `cms_admins`, even straight
   through the REST API with their own session token. The UI is not the
   security boundary.

**Adding an admin page? It is full-access by default.** Guard it with
`requireFullAdmin()`. Only if it belongs to Community do you add its prefix
to `COMMUNITY_PREFIXES` as well, and guard it with `requireAdmin()` instead.

Two deliberate properties worth preserving: `requireAdmin()` reads the row
with `select("*")` and treats a missing `access_level` as `full`, so an
unapplied migration degrades safely rather than locking everyone out; and
nobody can change their own level or remove their own access, which is what
guarantees at least one full admin survives any operation.

If Supabase is unreachable, public pages fall back to the static
content seeded in `lib/data.ts` — the site never breaks.

### Image uploads

Speaker portraits, team photos and blog hero images all support
direct upload from the admin — drag &amp; drop onto the preview, click
to pick, or paste an external URL. Files land in a public Supabase
Storage bucket (`cms-uploads`) under `speakers/`, `team/`, or
`posts/`. The bucket is anon-readable; only authenticated admins can
write (RLS via `is_cms_admin()`).

## Running a new event, end to end

Everything below is CMS-driven, so the usual case needs **no code and no
deploy**. The order matters: publish the event first, and the header menu,
`/events`, `/salons` or `/signature`, and the "recent events" band on every
other event page all pick it up on their own within about a minute.

### 1. Create the event (always)

`/admin/events` → New event. The fields that carry weight:

| Field | Why it matters |
| --- | --- |
| `slug` | The URL (`/events/<slug>`) and the key everything else joins on. Convention is `<name>-<year>`, e.g. `signal-2026`, `reframe-2025`. Don't change it later; links and photo catalogues point at it |
| `kind` | `flagship` surfaces on `/signature` and gets the photo-hero + speaker-carousel layout. `salon` surfaces on `/salons`. `special` surfaces on neither, so it needs a hand-added row if you want it listed |
| `status` | `draft` is invisible publicly. `announced` puts it in the header's **Upcoming** menu (with `show_in_nav`). `past` moves it into the archives and into the "recent events" band |
| `starts_at` | Drives ordering everywhere, and the date band on `/admin/calendar` |
| `date_label` / `short_date` | The human-readable strings shown on cards. `starts_at` is not formatted for display |
| `hero_image_url` | The card image used by every listing and the recent-events band. **Optional at announce time**: without it the card renders a red "Photos coming soon" panel automatically (see [Event cards without a photo](#event-cards-without-a-photo)), so you can announce an event before photography exists and just set this later |
| `link_url` | Set this **only** if the event gets a bespoke hand-built page. `/events/<slug>` then redirects there. See step 5 |

### 2. Add the lineup (when there is one)

`/admin/speakers` → set **Event** on each speaker, and `/admin/talks` → set
**Event** on each talk. A speaker with no event linked appears nowhere: the
lineup on the event page is what surfaces them, and clicking a portrait opens
their bio, talk video and socials in place. There is no separate speakers
index any more (see [Access levels](#access-levels) for who can edit this).

### 3. Announce it

Set `status = announced` and `show_in_nav = true`. That is the whole
publishing step. Then work the comms from `/admin/calendar`: draft the social
posts in `/admin/socials` with a schedule date, and the newsletter in
`/admin/newsletter/campaigns`, and the calendar shows them against the event
date so you can see the run-up at a glance.

### 4. After the event

1. Flip `status` to **`past`** in `/admin/events`. Nothing else moves it, and
   an event left `announced` sits in the Upcoming menu forever.
2. Upload the photos: drop them in `raw-event-photos/<event-slug>/` and run
   the publish flow in [Event photo galleries](#event-photo-galleries). The
   gallery teaser and the homepage gallery section appear by themselves once
   `event_photos` has rows for the slug, and the photos also become pickable
   inside the admin (Creative studio, newsletter blocks, image fields).
3. Import the attendee list and send the feedback request from
   `/admin/events/[id]/attendees`.

### 5. Only if it needs a bespoke page

Most events do not. The generic `/events/[slug]` template already renders the
hero, story, lineup, talks, photo teaser and recent-events band. Build a
custom page only when the event needs a genuinely different layout (a ticket
page like `/signal`, or a recap like `/youth-futures-lab`).

If you do, remember a bespoke page **inherits nothing** from the template.
Wire in by hand:

- `link_url` on the CMS row, pointing at the new path.
- `<RecentEvents excludeSlug="<slug>" />` at the foot of the page.
- The photo gallery teaser, if the event has photos.
- `<SpeakerLineup>` around any speaker cards, or their bios won't open.
- The slug in `Nav.tsx`'s `heroIsDark` list, if the page opens on a dark hero.

### Event cards without a photo

An event with no `hero_image_url` does **not** get a blank card. Its photo
panel renders `components/PhotoPending.tsx`: a small image icon, the event
name, and **"Photos coming soon"**, on the brand red gradient.

Two things about it are deliberate, and worth keeping if you touch it:

- **It is always red, whatever the event's `kind`.** It paints its own
  gradient over the panel, so a photo-less Salon or special doesn't sit under
  the navy or teal `KIND_GRADIENT` the card would otherwise use. An
  awaiting-photos card should read as one consistent state, not three
  different-coloured ones, and those kind colours are tuned to sit behind
  photography rather than behind text. The gradient it uses is the same one
  `KIND_GRADIENT.flagship` uses, so it stays inside the existing palette.
  There is a single `PENDING_GRADIENT` constant at the top of the component:
  change it there and every surface follows.
- **It is automatic, and self-clearing.** Nothing is added per event and
  nothing needs removing later. Announce an event with no photo and it looks
  intentional; set `hero_image_url` in `/admin/events` and the real photo
  takes over on its own, with no deploy.

It covers `/events`, `/salons`, `/signature`, the homepage grid and the
recent-events band, because those all render through `EventRow` or
`PastEventCard`. **Building a new event card component? Give its photo panel
the same fallback** rather than letting it render an empty gradient:

```tsx
{image ? <PhotoFill src={image} … /> : <PhotoPending title={title} />}
```

The one deliberate exception is the homepage's "Just wrapped" feature, which
drops to a single column instead. A placeholder at that size reads weaker
than a clean full-width text feature; in a grid, a missing panel breaks the
rhythm and the placeholder earns its place.

## Impact reports (per event, admin)

Every past event has an **Impact report** chip in `/admin/events` that opens
`/admin/events/[id]/reports`: a list of shareable PDF reports for that event,
plus a "Create draft" form. A new draft is seeded from what the event already
has on file (gallery photos, attendee count, feedback ratings and yes/no
splits, testimonials the attendee agreed we can quote, speakers and talks,
active sponsors as partners) and then edited by hand: cover, a numbers page,
a four-photo page, any number of one-idea-per-page "statement" pages (headline,
a sentence or two, a real quote, an optional photo, cream/dark/accent tone),
a feedback page and a close page. The right-hand preview re-renders as you
type. Pages are 4:5 (216 × 270 mm), LinkedIn's native document ratio, in the
site's own type and colours (Bricolage Grotesque, cream/ink/TEDx red).

Two ways to get a PDF:

- **Generate PDF** renders the saved report with headless Chromium on the
  server (`@sparticuz/chromium` + `puppeteer-core`, route
  `app/api/admin/reports/[id]/pdf`), stores it on Vercel Blob under
  `event-reports/<event-slug>/…pdf` and stamps the URL on the report, so it
  stays available from the list ("Open PDF") for the whole team.
- **Open print view** opens the bare report in a new tab and triggers the
  browser's print dialog: choose Save as PDF. Zero dependencies; the fallback
  if Chromium ever fails to start.

Where things live: content model + parser `lib/report-schema.ts` (pure),
storage + live-data seeding `lib/event-reports.ts` (server-only, table
`event_reports`, migration `supabase/migrations/20260817b_event_reports.sql`,
full-admin write), HTML renderer `lib/report-render.ts` (string templating,
shared by preview, print view and PDF), admin pages
`app/admin/events/[id]/reports/` (list, `actions.ts`, `[reportId]/` editor),
preview/print route `app/api/admin/reports/[id]/preview` (GET saved,
`?print=1` auto-prints; POST renders an unsaved config for the editor's
iframe). The report font is committed at `public/fonts/BricolageGrotesque.ttf`
so the PDF renderer never depends on Google Fonts. Locally, set
`CHROME_EXECUTABLE_PATH` to a Chrome/Edge binary for the PDF route.

The report stores everything it shows in its own `config`, so a report keeps
reading the same after the underlying feedback or gallery changes; the live
data only seeds a new draft and feeds the "From the data" suggestion chips.

## Event photo galleries

Full photo sets from an event (attendee-facing, "come get your photos"
rather than admin content) live on **Vercel Blob**, not Supabase Storage —
volume and egress make Blob the cheaper fit for hundreds of photos per
event. There is no admin UI for this yet; it's a manual, scripted
publish flow run from the repo.

**Before you start:** the event must already exist in `/admin/events`, and
you need its exact `slug`. Everything below keys on that slug.

The upload script does **not** check the slug against the CMS — it only
checks that a folder of that name exists. A typo therefore gets all the way
to step 3 and then fails in Postgres with a not-null violation on
`event_id`, because the generated SQL looks the event up by slug
(`select id from cms_events where slug = '…'`) and finds nothing. Nothing is
corrupted when that happens, but you will have already uploaded the images to
Blob under the wrong path, so fix the folder name and re-run rather than
hand-editing the SQL.

### Adding a gallery

**1. Put the photos here:**

```
TEDxNewy/raw-event-photos/<event-slug>/
```

One folder per event, named exactly for the slug (e.g.
`raw-event-photos/reframe-2025/`). Any filenames, any count, straight from
the photographer — the script renames and resizes everything. The folder is
git-ignored, so nothing large lands in the repo; only the generated WebPs go
to Blob. Create the folder if it doesn't exist, and see
`raw-event-photos/README.md`.

> **Check the batch first.** If the photos came from an ad-hoc drop rather
> than straight from the photographer, open a few spread across the folder
> before uploading. The filenames are the photographer's own export naming,
> not proof of which event or even which organisation they're from — one
> batch labelled "reframe" turned out to be a different TEDx chapter's event.

**2. Upload and catalogue:**

```bash
node --env-file=.env.local scripts/upload-event-photos.mjs <event-slug>
```

It resizes each photo to a 2400px display WebP plus a 640px thumbnail,
uploads both to the `tedxnewy-event-photos` Blob store, and writes
`raw-event-photos/<event-slug>/catalogue.sql`.

`--env-file=.env.local` is not optional: the only thing the script needs from
the environment is `BLOB_READ_WRITE_TOKEN`, and it exits with a clear message
if that isn't set. No Supabase credentials are involved at this step.

**3. Publish:** paste that `catalogue.sql` into a fresh Supabase SQL editor
tab. This is the only step that touches the database, and it never needs a
production Supabase key on your machine.

Re-running a batch is safe: the generated SQL deletes that event's existing
rows before inserting, and Blob uploads overwrite by pathname. To swap a
gallery wholesale, replace the contents of the folder and run it again.

### Where the photos then show up

Once the SQL is in, no deploy is needed. Photos appear:

- **Publicly** — a 6-photo teaser on the event page, the full grid and
  lightbox at `/events/<slug>/gallery`, and a two-image preview in the
  homepage gallery section.
- **In the admin, everywhere an image is picked** — this is the part worth
  knowing. `components/GalleryPicker.tsx` reads `cms_events` and
  `event_photos` straight from the browser, so a freshly catalogued gallery
  turns up immediately in the **Creative studio** (`/admin/socials` designs
  and `/team-brand`), **newsletter image, video-thumbnail and column blocks**,
  and the logo/portrait fields on the **Event, Speaker, Sponsor and Team**
  forms. Anything using `app/admin/ImageUploadField.tsx` gets it for free, so
  build new image pickers on that rather than rolling your own upload UI.

Two behaviours inside the picker: events are **collapsible rows, closed by
default** (one gallery is 280 photos, so an open-by-default picker would fire
hundreds of image requests), and photos already used in a social post or an
email are **tinted and badged**. That mark is derived on every open by
`lib/photo-usage.ts`, never stored, so deleting a draft clears its badge by
itself. Don't "optimise" it into a `used` column; the self-clearing is the
point. Marked photos stay fully selectable.

Data model: `event_photos` (migration `20260806_event_photos.sql`,
public read, admin/service write) keyed on `event_id`, read by
`getPhotosForEvent()` in `lib/cms-content.ts`. Public UI: a 6-photo
teaser + "See the full gallery" button wherever an event's photos are
shown, and the full grid + lightbox at `/events/[slug]/gallery`
(`components/PhotoGallery.tsx`). The homepage's two-image preview per
event (`app/page.tsx`, "Check out our gallery") just takes the first two
photos by `display_order` ascending, no separate "featured" flag; pin
specific photos into that preview by giving just those two a negative
`display_order` (e.g. -2/-1) in the Supabase Table Editor so they sort
first ahead of everything else's positive values.

**Bespoke event pages don't get the teaser for free.** The generic
`/events/[slug]` template renders it automatically, but the hand-built pages
that `link_url` redirects to each fetch their own event + photos and carry
their own copy of the teaser section. `/newcastle-2050-salon`,
`/60-second-talk-night` and `/youth-futures-lab` all have it wired already
(Youth Futures Lab renders a "gallery coming soon" card until its photos
land, then swaps to the real teaser by itself). A new bespoke page needs the
same section added by hand, same as the recent-events band.

### Video on social posts

Buffer publishes video to Instagram, Facebook and LinkedIn, and a **single**
video on Instagram goes out as a **Reel**. Attach one in `/admin/socials` the
same way as an image: Upload, pick an MP4 or MOV.

Rules, and where each is enforced:

- **One video per post, never mixed with images.** Instagram's constraint, not
  ours. Checked in the editor before the file uploads (`mediaAddError`), again
  server-side in `addMedia`, and backed by a partial unique index in Postgres.
- **50MB cap** (`VIDEO_MAX_BYTES`), against 8MB for images.
- The Creative studio is an image tool, so it hides itself on a video post.

**Setup step, needed once:** the Supabase `cms-uploads` bucket has its own file
size limit, currently sized for images. Raise it to at least 50MB in
Supabase → Storage → `cms-uploads` → Settings, or video uploads fail at the
storage layer with Supabase's error rather than our friendly one. Apply
`20260817_social_media_video.sql` first.

Two things worth knowing about how Buffer handles the file: it fetches the URL
**when the post publishes, not when the post is created**, so the media must
stay public and permanent (our `cms-uploads` URLs are; don't switch to signed
or expiring links). And the Reel cover frame is taken from
`metadata.thumbnailOffset`, set to 1000ms rather than 0 because frame zero is
often black.

## Design standards

Two things new work should follow, so the site keeps reading as one product.

### Card rows: swipe on mobile, grid on desktop

Any row of three or more cards uses this pattern rather than stacking
vertically on phones, which turns a section into a very long scroll. In use on
both homepage event rows, the homepage Participate row, `SpeakerCarousel` and
the Signal past-editions timeline.

```html
<ul class="carousel-scrollbar -mx-5 flex snap-x snap-mandatory scroll-pl-5
           gap-5 overflow-x-auto px-5 pb-4
           md:mx-0 md:scroll-pl-0 md:grid md:grid-cols-3
           md:overflow-visible md:px-0 md:pb-0">
  <li class="w-[78vw] shrink-0 snap-start sm:w-[46vw] md:w-auto">…</li>
</ul>
```

Every part earns its place:

| Class | Why |
| --- | --- |
| `-mx-5` + `px-5` | The **bleed**. The row runs to the screen edge so the next card peeks in and reads as swipeable, while the first card still lines up with the body text |
| `scroll-pl-5` | **Required, not decorative.** `snap-start` aligns to the scrollport edge, which `-mx-5` has moved to the screen edge. Without matching scroll-padding, every card *after a swipe* lands flush against the edge and only the first respects the margin. Keep it equal to the horizontal padding: `px-5` → `scroll-pl-5`, `md:px-6` → `md:scroll-pl-6` |
| `w-[78vw] shrink-0` | Proportional card width, so the peek holds across screen sizes |
| `.carousel-scrollbar` | Hides the scrollbar on touch, shows a slim one from `md` up where there's no swipe gesture (`app/globals.css`) |
| `md:grid …` | Reverts to a normal grid once there's room; the scroll classes go inert |

For a **dense grid** rather than cards, the mobile fallback is an agenda list
instead of a carousel: the admin calendar's seven Mon-to-Sun columns never fit
on a phone, so below `md` it lists only the days that have something.

### Branding

Take colour from the system rather than inventing it.

- **Admin**: `app/admin/section-theme.ts` maps each section to a colour
  (Content coast blue, Community red, Settings green, Forms amber). Use
  `THEMES` / `sectionThemeFor()`; don't hardcode a hex in a new admin page.
- **Public site**: brand red `#e02214` (hover `#b91404`), deep maroon
  `#3d0a05` / `#2a0604` for dark sections, cream `#f4efe6`, ink `#141210`.
- **Holding and empty states are red**, never the surrounding section's own
  accent. That's why `PhotoPending` overrides the event's `kind` colour: an
  "awaiting content" state should read the same everywhere, not navy on one
  card and teal on another.
- **Icons**: `app/icon.tsx` (browser tab) and `app/apple-icon.tsx` (iOS home
  screen) are a bold white "x" in brand red, matching the circular avatar the
  socials use. The tab icon is a circle with transparent corners so it reads
  on light and dark tab strips; the iOS one is full-bleed and opaque, because
  iOS fills transparency with black and applies its own rounded mask. **Change
  one, change both.** Keep it to a single mark: a "TEDx" wordmark was tried
  and dropped, because a tab icon renders at 16 to 32px where four letters
  turn to mush. The X is **drawn as two rotated bars, not typed as a
  character** — a text glyph sits on its baseline, which rendered the mark
  ~3px low and slightly right in a 32px circle. Bars are positioned by
  arithmetic and land dead centre. Both files document the size limits; if you
  change them, re-render and measure rather than eyeballing a 32px thumbnail.
- **Logos** live in `public/brand/` — see that folder's README before adding
  or renaming anything, since several files are referenced by absolute URL
  from the email signature and JSON-LD.

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
  width), columns, button, video thumbnail, divider (four looks — hairline,
  accent bar, 70% short line, X mark — in soft, ink or red). Columns is a container
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
  steps (claim-first ledger in `subscriber_flow_sends`).

<a id="welcome-flow"></a>

**Welcome flow: who receives what.** An address *enters* the flow once,
stamped on `subscribers.flow_started_at`. Null means it is not in the flow
and will never receive a step, which is how the list imported from
Mailchimp stays out of it. Both paths that create a genuinely new address
enrol it: the public subscribe route (which also sends the instant first
step) and the Mailchimp webhook (enrolment only, so the endpoint stays fast
and always answers 200; the cron sends step 1 within five minutes). The
admin's bulk Mailchimp import deliberately does not enrol.

`processFlowDrips` then sends a step to a subscriber only when all three
hold:

1. **Due** — `now >= flow_started_at + delay_days`.
2. **In order** — the previous *enabled* step is already on record for
   them, so nobody gets step 2 without step 1.
3. **Was on when they joined** — `flow_started_at >= step.enabled_at`, the
   moment the step was last switched on. So writing a new step and turning
   it on reaches nobody already in the flow; it applies to people who join
   from then on. Turning a step off and back on restarts that line, while
   re-saving an already-on step deliberately does not move it.

Nothing else gates a send. Zero-delay steps are included in the cron pass,
so it doubles as the retry for an instant welcome that failed; a subscriber
can never receive two steps in one pass, and each step dispatches at most
200 per pass with the rest picked up five minutes later.

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
helper (defined in the CMS setup migration, which predates this folder); the
anon key inserts into form tables but can never read them. `cms_admins`
additionally has `is_full_cms_admin()` guarding its writes, so only a full
admin can change the allowlist or anyone's access level.

**Status: every migration in the folder is applied to production**, most
recently `20260817_admin_access_levels.sql` (`cms_admins.access_level`, the
`is_full_cms_admin()` helper and the restrictive write policies behind
[Access levels](#access-levels)). Before that, the 2026-08-14 batch:
`20260814_draft_stages.sql` (the `stage`
column on `social_posts` and `newsletters`), `20260814b_flow_enrolment.sql`
(`subscribers.flow_started_at`) and `20260814c_flow_step_enabled_at.sql`
(`subscriber_flow_steps.enabled_at`), the last two being the welcome-flow
rebuild above. Earlier batches: event photo galleries
(`20260806_event_photos.sql`, see
[Event photo galleries](#event-photo-galleries)),
newsletters + templates + unsubscribe columns, subscriber flow,
correctness indexes + FKs, events + nav tables with seeds, Quick Compose
sender attribution (`20260711_email_sent_by.sql`) and admin-authored
templates (`20260711_compose_templates.sql`).

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
  dark-hero routes are `/`, `/signal`, and the flagship event detail pages
  (`/events/reframe-2025`, `/events/beyond-boundaries-2024`); every other
  public page opens on a cream hero. Add any future dark-hero route to that
  check (in `heroIsDark` in `Nav.tsx`), or its header will render ink links
  over a dark background. The bar's `top` position also isn't always `0` —
  it reads a `--banner-offset` CSS var so a page-specific promo banner
  (currently only Signal's) can push it down without every other page
  knowing that banner exists.
- Events auto-flow into the header **Upcoming** menu while they are
  `status = announced` + `show_in_nav = true`. When an event passes, set it to
  **Past** in `/admin/events` (or `update cms_events set status='past'`),
  otherwise it lingers in Upcoming — Youth Futures Lab (ran 7 August 2026)
  is a live example of this pending as of writing: the site code already
  treats it as past everywhere, but its DB row still needs that manual
  flip. The static fallback lives in
  `lib/nav-fallback.ts` + `FALLBACK_EVENTS` in `lib/cms-content.ts`.
- The site-wide promo pop-up (`components/TalkNightBanner.tsx`, a bottom-corner
  banner) is currently off: its import and `<TalkNightBanner />` mount in
  `app/layout.tsx` are commented out. To run a promo again, uncomment both
  lines and update the copy, link and event date inside the component. The
  component is kept as a reusable template.
- The pop-up that **is** live is a different, unrelated component:
  `components/SeasonAnnouncePopup.tsx`, a large centred (full-page on mobile)
  announcement for the October 24 signature event reveal, with a mailing-list
  signup. Shows once, 5s after a visitor's first page load; closing it with
  the X minimises it to a reopenable edge tab (localStorage key
  `season-announce-oct24`) rather than dismissing it outright; a completed
  signup hides it for good. It samples the page background behind it at
  trigger time to pick a dark or light card, so it doesn't need a hardcoded
  list of dark-hero routes the way `Nav.tsx` does. Has a
  `FORCE_SHOW_FOR_PROOFING` flag at the top of the file (off by default) that
  ignores stored dismissal state and shows on every visit — only for a
  proofing pass, never leave it on in a deploy.
- Real talk videos live on YouTube. Add each one in `/admin/talks` with its
  `youtubeId` and link it to its event and speaker; `/talks` picks it up
  within a minute. (`lib/data.ts` is only the offline fallback, not where
  talks are authored.)
- `lib/data.ts` is the static fallback layer only: live content (talks,
  speakers, team, sponsors, events) comes from Supabase `cms_*` tables
  and the site falls back to `lib/data.ts` / `lib/nav-fallback.ts` when
  Supabase is unreachable.
- Salon videos are 1080p H.264 MP4s with poster frames
  (`public/video/salon-recap.mp4` ~26 MB, banner ~2.4 MB). The original
  4K HEVC `.mov` masters were removed from the working tree (they did not
  decode outside Safari); masters live outside the repo in `../Source-Videos`.
  Consider YouTube for anything bigger.
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
