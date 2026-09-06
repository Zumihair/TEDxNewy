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
| `APOLLO_API_KEY` | For partner + journalist contact lookup | Apollo.io API key, used by the Partners page's Find contacts / Suggest prospects (see [Partnerships portal](#partnerships-portal)) and by the Media room's "Build my media list". Leave unset to hide those tools; the rest of `/admin/partners` and `/admin/media` works without it |
| `HUMANITIX_API_KEY` | For ticket sales | Read-only Humanitix API key behind `/admin/tickets` (live sales, attendee import), the Monday ticket digest, and the live "Only N left" Standard counter on `/signal` (`getSignalStandardRemaining` in `lib/ticket-summary.ts`). Leave unset and all three degrade gracefully (the `/signal` chip stays on "Selling fast") rather than erroring. Set on the Preview environment too if you want the counter to resolve on preview deployments, not just Production |
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
| `/signal` | Bespoke, fully dark-themed ticket page for the 2026 flagship (Signal): photo hero with date/tickets overlaid, an **event partners ribbon**, a real "past editions" timeline, a Signal speaker teaser (real speakers, each name reserving two lines so a long one like "Professor Kelvin Kong AM" wraps without knocking the portraits out of line, plus an always-present "and more" card; on mobile the whole lineup becomes a compact tap-to-open puzzle mosaic via `SignalSpeakerPuzzle`, with the named grid taking over from `sm` up), agenda (incl. an arrival/registration slot), venue (verified address + a Google Maps embed), a "make a weekend of it" panel (light rail, dining, staying over, Darby Street, the after party), sponsors, ticket tiers, a testimonials spotlight (auto-rotating real attendee quotes, prev/next arrows), FAQ, a red final CTA, then a **deep-maroon mailing list section**. An urgency promo banner sits above the header (dismissible from `sm:` up; on a phone it is one nowrap row with the CTA inline and no close button, which is what keeps it 42px instead of 114px), and a floating "Get tickets" button appears once scrolled past the hero. Every "Get tickets" opens the Humanitix pop-up widget rather than navigating away. The Standard tier's chip reads "Selling fast" until stock drops to 20 or fewer, then flips to a live "Only N left" pulled from Humanitix server-side and refreshed on the page's own 60s revalidate (no cron); on a phone the tier carousel opens on Standard rather than the sold-out Concession (`TicketCarouselAutoScroll`). The urgency copy on the pop-up, the minimised tab and both red bars ("almost sold out" / "almost gone") and the small Australian Aboriginal flag beside the footer Acknowledgment of Country all shipped in the same pass. Tapping a speaker opens their bio in the shared `SpeakerModal`, which on mobile is centred, height-capped to the viewport and scroll-contained, and the fixed nav is forced hidden while any modal is open (shared `lib/modal-open.ts` counter, also used by the pop-up) so it can't slide in behind the backdrop. The season announce pop-up is **excluded from this page** (card and minimised tab both), since the page is already the announcement. **Gated behind `SIGNAL_LIVE` in `lib/feature-flags.ts`, which is `true` and live since 2026-08-21: tickets are on sale.** While the flag is off this page redirects to `/signature` and can be previewed privately at `/signal?preview=<SIGNAL_PREVIEW_TOKEN>`. See the CLAUDE.md section "Signature events, Signal, and sponsors" for the full build notes |
| `/newcastle-2050-salon` | Newcastle 2050 Salon recap with autoplay banner + click-to-play recap video + a photo gallery teaser |
| `/talks` | Talks archive with search + year filter; videos rolling out on YouTube through 2026. Opening a talk reflects it in the URL as **`?talk=<speaker-slug>`**, so a single talk is directly linkable/shareable and reopens on load (it clears any year filter or search first, so the target is guaranteed to be in the filtered set). "More about the speaker" inside a talk swaps to that speaker's bio in place (`?speaker=<slug>`), since the old `/speakers` index is retired |
| `/mission` | Mission · six pillars · what is TEDx · acknowledgment · events list |
| `/sponsors` | Tiered partner list (now CMS-backed, `getSponsors()`, admin-editable with logo upload) + "Partner with us" CTA |
| `/volunteer` | Volunteer crew application form |
| `/speak` | Speaker nomination form |
| `/team` | The volunteer crew (admin-managed via `/admin/team`) |
| `/events` `/events/[slug]` | CMS-driven events index + auto-generated event pages (lineup sections + a photo gallery teaser appear when speakers/talks/photos are linked; `link_url` overrides to a custom page, which is what the four bespoke pages below are: `/signal`, `/newcastle-2050-salon`, `/60-second-talk-night`, `/youth-futures-lab`). Every event page ends with the same live "check out our recent events" band (`components/RecentEvents.tsx`). Flagship-kind events (Reframe, Beyond Boundaries) get the Signal treatment instead of the default layout: full-bleed photo hero, full-width story text, and a swipeable speaker carousel with prev/next arrows instead of a grid |
| `/events/[slug]/gallery` | Full photo grid + click-to-enlarge lightbox (`components/PhotoGallery.tsx`) for any event with catalogued photos. See [Event photo galleries](#event-photo-galleries) |
| `/60-second-talk-night` | Salon 2 recap (event was 16 July 2026): muted 4.3s banner loop, the seventeen speakers and their ideas, looping 60s ring, click-to-play recap video, a photo gallery teaser, and The Base as venue partner (logo at `public/images/partners/the-base.webp`). Opens on a light cream hero. The registration form is retired |
| `/youth-futures-lab` | Past event (ran 7 August 2026), full recap: autoplay hero clip, an arrival photo strip, a "Smart. Kind. Real." section, the ten focus questions as a scroll-driven wheel (`components/FocusWheel.tsx`), a three-moment photo band, the recap video, and a photo gallery teaser (76 photos, published 2026-08-17). Its seven committed feature photos live in `public/images/youth-futures/yfl-*.webp`. Decorated throughout with `components/Scribble.tsx` hand-drawn doodles on one continuous cream background |
| `/student-speaker-competition` | Retired 2026-09-06: entries closed on schedule, now a short closed notice. The entry form, its API route and `student_speaker_submissions` are untouched for the 2027 competition; see the CLAUDE.md gotcha for the full retirement |
| `/feedback/[slug]` | Post-event feedback form, opened from a tokenised link (`?t=…`) emailed to each attendee. Resolves the token to its event, records the response, then shows a thank-you that links through to the recap. Nav hidden, noindex |
| `/subscribe` | Standalone subscribe landing — built for Instagram-bio links |
| `/unsubscribe` | Token-based newsletter unsubscribe (confirm page + RFC 8058 one-click POST at `/api/unsubscribe`) |
| `/contact` | General enquiries form + participation cards + newsletter |
| `/privacy` `/terms` `/code-of-conduct` | Legal pages |
| `/thanks` | Post-submit confirmations (source-aware copy) |
| `/sitemap.xml` `/robots.txt` `/opengraph-image` | SEO file conventions |

## Social share cards

Every page has its own share image, all cut from one design: the page's own
photography full bleed, darkened under a maroon scrim, the logo top left, and
a short eyebrow and a headline on the bottom edge. Nothing else goes on the
image: no description line, no date or venue row. The platform prints the
page's own `og:description` directly under it, so anything more in the
picture said the same thing twice. Event cards read just "Salon" or
"Signature" above the event name. A page with no photograph
gets the brand red gradient and is otherwise identical.

| Piece | What it is |
| --- | --- |
| `lib/og-card.tsx` | The design. One renderer, shared by every route |
| `lib/og-content.ts` | The words and the photo for each page, one entry per route. **Edit here** |
| `app/**/opengraph-image.tsx` | Four lines each: look the page up, render it |
| `app/events/[slug]/opengraph-image.tsx` | Built from the CMS row instead, so a new event gets a card with no code change |
| `/dev/og` | Review the whole set (dev only) |

**`/dev/og` is the thing to open after any change.** It shows each generated
card next to the `og:title` and `og:description` fetched live out of that
page's `<head>`, so a card whose words have drifted from the page's own
metadata shows up rather than going unnoticed. Signal is fetched through its
preview token while `SIGNAL_LIVE` is off, so its real card is reviewable
before it goes public.

Two traps worth knowing before editing:

- **Never set `title` or `description` inside `openGraph` in
  `app/layout.tsx`.** Pages that declare no `openGraph` inherit the parent's
  entire object, so a headline there silently overrides every page. It had
  put "TEDxNewy · Season 2026" and a blurb about the 30 April salon on 20 of
  23 pages, months after that event ran. The layout now carries only `type`,
  `siteName` and `locale`, letting each page's own `title`/`description`
  through.
- **Photos are normalised through sharp** before rendering, because the
  rasteriser cannot reliably decode WebP and would draw a blank panel with no
  error. That step also does the 1200x630 crop. **Framing a photo is the
  `crop` field**, a number from 0 (window flush with the top of the source,
  the default, since headlines sit on the bottom edge and faces sit high) to
  1 (flush with the bottom). Nudge it in small steps: 0.5 to 0.3 moves a
  photo down a little. Tall portraits crop to a thin band, so they are the
  most sensitive.

## Discoverability: search engines and AI crawlers

Four things carry this, and they are all in code rather than a dashboard:

- **`app/robots.ts`** allows everything except `/admin`, `/api` and
  `/thanks`. One blanket `userAgent: "*"` rule, so AI crawlers (GPTBot,
  ClaudeBot, PerplexityBot, Google-Extended) are treated exactly like
  Googlebot. There is no per-bot block; if one is ever wanted, this is the
  only file to change.
- **`app/sitemap.ts`** lists the static routes plus every CMS event that
  renders its own page (`link_url` events are skipped so the sitemap never
  publishes a URL that immediately 3xx's). Speakers are deliberately absent:
  a speaker is a `?speaker=` view of a page already listed.
- **Structured data (JSON-LD).** `app/layout.tsx` emits Organization +
  WebSite on every page (names, alt names, logo, socials, area served) —
  this is what a search or AI engine reads to answer "who is TEDxNewy".
  `components/BreadcrumbJsonLd.tsx` adds a breadcrumb per section page. And
  **every event page emits `schema.org/Event`**: `/signal` has its own
  hand-written one, and `app/events/[slug]/page.tsx` builds one from the CMS
  row (name, start, venue, hero image, ticket offer, speaker list), so a new
  event is machine-readable with no code change. Fields are only included
  when the row actually has them, so a sparse event never emits an empty
  `location` or a null date.
- **`public/llms.txt`** is a plain-text summary of the org and its key pages
  aimed at LLM crawlers. The convention is still emerging and adoption is
  inconsistent, so treat it as cheap insurance rather than a load-bearing
  channel. Keep it in step with the Pages table above when routes change.

## Meta Pixel and ads conversions

The Meta (Facebook/Instagram) ads pixel, ID `1515999640565864`, lives in
`components/MetaPixel.tsx` and is mounted once from `app/layout.tsx`, so it
runs on every page. Conversion events are in `lib/pixel-events.ts`.

Three things here are load-bearing, each from a real failure:

- **The base script is `strategy="beforeInteractive"`, and must stay that
  way.** As `afterInteractive` the pixel works fine in a real browser but is
  injected by client JS *after* hydration, so it is not in the server-rendered
  HTML at all. Anything that fetches the raw page — Meta's own pixel
  installation check included — reports **"no pixels found on this page"**.
  That is exactly what happened. `beforeInteractive` inlines it into the
  document, matching Meta's own "paste it in `<head>`" instruction.
- **`PageView` is re-fired on client-side navigation.** App Router
  navigation never reloads the document, so without this Meta would record
  one pageview per visit no matter how many pages someone browsed. The
  component skips the first fire, because the base script already sends that
  one itself.
- **Ticket clicks track on `pointerdown`, not `click`.** The Humanitix
  pop-up widget attaches its own click handling to those exact links and
  swallows the event before a React `onClick` ever runs — verified in a
  browser, not assumed. `pointerdown` fires earlier in the sequence and is
  unaffected.

Two conversion events, and deliberately only two:

| Event | Fires on | Where |
| --- | --- | --- |
| `InitiateCheckout` | Any "Get tickets" click | `components/TicketLink.tsx` (used by `/signal` and the generic event page), plus `StickyTicketButton` and `SignalPromoBanner` |
| `Lead` | A completed subscribe | `components/ThanksConversion.tsx` on `/thanks?source=subscribe`, which covers the homepage, `/subscribe`, `/contact` and `/signal` forms in one place; the season announce pop-up submits by `fetch` and never lands on `/thanks`, so it fires the same event itself |

**There is no `Purchase` event anywhere, on purpose.** Ticketing happens
off-site on Humanitix and nothing on this site can confirm a sale, so
reporting one would be inventing a conversion. Don't add one without a real
signal (a Humanitix webhook) behind it.

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

The sidebar is Overview / Content / Management / Community / Settings
(config: `app/admin/nav-config.ts`, one source for sidebar and dashboard),
filtered to what the signed-in admin's level can reach. Management (Partners,
Documents) sits apart from Content because those two pages run the
partnership/collateral side of the org rather than driving public pages.

The admin has a shared section-colour system in
`app/admin/section-theme.ts`: Content is yellow, Management (Partners,
Media, Tickets, Documents) is coast blue, Community is red, Settings is
green, and Overview/Forms is grey. Each section's colour flows through its
dashboard tile, its page header (`app/admin/PageHeader.tsx`), section labels
(`app/admin/SectionLabel.tsx`), list and table accents, and the selected
sidebar item, so a section reads the same wherever it appears. The dashboard
is a compact bento grid grouped by these families. To recolour a section or
add one, edit `section-theme.ts` (the route to theme mapping lives there);
every segment needs an entry there or it silently falls back to grey.

### Admin UI conventions

Three shared building blocks keep new admin pages feeling like the same
product rather than each growing its own bespoke pattern:

- **Telling the admin what happened**: the result of an action is a **toast**,
  risen from the bottom of the screen and coloured by outcome (green it
  worked, red it did not, yellow it needs attention). `app/admin/Toaster.tsx`
  holds it; `AdminShell` mounts it once, so it is there on every signed-in
  admin page. A client component calls `useToast().success("Saved.")`; a
  server page reading a `?saved=1` style redirect renders
  `{saved && <FlashToast clear="saved">Saved.</FlashToast>}`, which shows
  nothing itself and hands the copy to the toaster. Give any new action the
  same treatment rather than printing a banner into the page.
  - `clear` names the query keys the message came from and strips them from
    the URL once the toast is up. It is not tidiness: without it, saving twice
    in a row redirects to a URL that is already current, nothing remounts, and
    the second save looks like it did nothing. A refresh would also
    re-announce an action from ten minutes ago.
  - A free-text `?flash=` redirect carries a `?tone=` beside it, written with
    `flashUrl()` and read with `asTone()` from `app/admin/flash.ts`.
  - **`Flash` (`app/admin/ui.tsx`) is now only for a STANDING notice** that has
    to survive being read: an unconfigured capability ("Mailchimp isn't
    connected"), a service that could not be reached, a validation message
    bound to a field. It has `info` and `error` tones and deliberately no
    longer has `ok`, so reaching for a green banner to say "Saved" is a type
    error rather than a convention somebody has to have read.
- **Tabs**: `TabBar` in `app/admin/ui.tsx` is the one tab style (an
  underline row, red underline + dark text when active). It's plain links to
  a `?tab=` query param, so it needs no client JS and works the same on a
  slow connection. Used by `/admin/newsletter/campaigns`
  (Drafts/Scheduled/Sent) and `/admin/media` (New release/Contacts). Reach
  for this rather than inventing a pill-chip or button-group tab bar.
- **"Add a thing" modals**: `Modal` in `app/admin/Modal.tsx` is a button
  trigger + portalled overlay dialog (Escape/overlay-click to close, body
  scroll locked while open), used wherever adding a new record used to be
  its own inline `<details>` section or would otherwise crowd the page:
  `/admin/documents` ("Upload a document") and `/admin/partners` ("Add a
  prospect", passed `wide` since its form has several fields side by side).
  A record type with its own dedicated **page** (`/admin/events/new`,
  `/admin/speakers/new`, `/admin/sponsors/new`, `/admin/talks/new`,
  `/admin/team/new`) is a deliberately different, already-consistent-with-
  itself pattern (those forms are bigger, with an image upload and several
  sections) — don't convert just one of those five to a modal without doing
  the rest, or that becomes the new inconsistency.

| Section | Drives |
| --- | --- |
| Dashboard (`/admin`) | Live counts across everything |
| Forms (`/admin/forms`) | One inbox for the public forms: count tiles, a tab per form, search/CSV/detail/bulk actions, contacted tracking, and the Talk Night accepted pipeline with its "Email accepted" flow. Registry: `app/admin/forms/registry.ts`; old per-form routes redirect here. A form flagged `archived` in the registry (currently 60-Second Talk Night) keeps its route and rows but drops out of the dashboard chips, the tile grid and the tab bar via the registry's `VISIBLE_FORMS` list; it stays reachable at `/admin/forms/[slug]` |
| Events (`/admin/events`) | `cms_events` — the header Upcoming menu, `/events` + `/events/[slug]`, `/salons`, and home event cards. Draft events are invisible publicly; announced ones appear everywhere within ~5 minutes. **Every action is a modal** (rebuilt 2026-09-06): click a row to edit it, no "Add event" button (new events are added via SQL now). Each event shows only the chips it actually has data for: Submissions, Attendees, Feedback, Impact report and Demographics are per-event, not a fixed set on every row; see the CLAUDE.md "Modal-first admin CRUD" gotcha for exactly which events get which and why. Attendees/Feedback content is shared between the Events-list modal and the standalone `/admin/events/[id]/attendees` + `/feedback` pages (`AttendeesContent.tsx` / `FeedbackContent.tsx`): import an attendee list, export, email everyone, send the tokenised feedback request, and read responses (at-a-glance overview via `lib/feedback-summary.ts` / `FeedbackOverview.tsx`). Backed by `event_attendees` / `event_feedback_responses` via `lib/event-feedback.ts`; a 3-day reminder runs on the newsletter cron. Historical feedback from our previous survey provider (plus one Google Form export) is a committed static archive in `lib/imported-feedback.ts` (keyed by event slug, not in Supabase), surfaced read-only under "Archived feedback" with a TED-score slot filled by hand |
| Talks (`/admin/talks`) | `/talks`; talks link to events via a dropdown. Add/Edit are modals |
| Speakers (`/admin/speakers`) | `cms_speakers` — the lineup shown on each event page, and the bio that opens when a portrait is clicked. Link a speaker to an event with the Event dropdown, or they appear nowhere. To add a 2026 Signal speaker, set Event = Signal so they show up in the `/signal` lineup teaser. Add/Edit are modals |
| Team (`/admin/team`) | `/team` — public organisers + crew. Add/Edit are modals |
| Sponsors (`/admin/sponsors`) | `cms_sponsors` — `/sponsors` and the `/signal` sponsor strip. Logo upload per sponsor; sponsors without a logo render as a text wordmark instead. Add/Edit are modals |
| Partners (`/admin/partners`) | `cms_partners` + `cms_partner_events` — a light CRM for Signal/season sponsorship prospects: search, a status filter, conversations with no update in 7+ days surfaced first, "Add a prospect" as a wide modal (form + Apollo suggestions), status chips (Prospect → Contacted → In discussion → Confirmed/Declined/Dormant), a per-partner page with outreach-email sending, notes and a full activity timeline, and Apollo.io contact lookup ("Find contacts" at a prospect's domain, "Suggest prospects" by Newcastle employee count). "Open prospectus" opens the personalised prospectus as a page (Save as PDF from there if a file is needed) — there used to also be a server-rendered PDF via headless Chromium; that was dropped (2026-08) after it proved unreliable in production. See [Partnerships portal](#partnerships-portal). Full access only |
| Media (`/admin/media`) | `cms_media_contacts` — the media room, split into a **New release** tab (default) and a **Contacts** tab. New release: an editable pitch subject/body, a Preview (the same phone/email-iframe preview used elsewhere, so you can see exactly what a "Sign as" switch changed before sending), an attachment — upload one or one click to reuse the branded release PDF — and send-to-all or per-contact. Contacts: status per contact (Prospect → Pitched → Responded → Covered/Declined), add/edit/remove, and "Build my media list" filling the board from a curated outlet roster via Apollo (at most one credit per outlet, leaving a "News desk" placeholder where it finds nobody so that outlet isn't retried). Sends log to `email_sends` and stamp the contact's last-contacted date. **Note: no migration in `supabase/migrations/` creates this table** — the code and the production table exist, the SQL does not. Full access only |
| Tickets (`/admin/tickets`) | Live Humanitix sales for every listing: sold and remaining against capacity, a per-ticket-type breakdown, revenue, recent velocity and order-level metrics, plus **one-click attendee import** into any event's `event_attendees` list (so a ticket buyer becomes a feedback-form recipient without a CSV). Read-only against Humanitix, which stays the source of truth for anything to do with money; nothing is cached or copied into our database except imported attendees. A **weekly digest** of the same numbers emails full admins on Monday mornings (Sydney) off the site's single cron. Full access only |
| Documents (`/admin/documents`) | `cms_documents` — a small file library for anything that needs a public, pasteable download link: impact reports, decks, one-off PDFs. Upload goes browser → Storage directly, same pattern as an image upload; download links are public by design. See [Documents library](#documents-library). Full access only |
| Quick email (`/admin/emails`) | One-off branded emails to pasted lists or saved audiences, built with the shared block editor; send history |
| Calendar (`/admin/calendar`) | Four Mon to Sun weeks of everything going out: scheduled social posts, newsletter campaigns, and a read-only band for event dates so you can see the comms lining up against the thing they promote. `?start=<Monday>`; prev/next/Today are plain links, so the page stays a server component. Chips open a detail popover with status, stage, channels, a **Preview** (the same phone mockup and email iframe the list pages use) and a link into the editor. **Drag a future note, social post or newsletter onto a different day to reschedule it** (desktop grid only — the time it fires at never changes, only the day); a plain click still opens the popover. Everything buckets by **Sydney local date**, not UTC. Below `md:` the grid becomes an agenda list (not draggable) |
| Newsletter hub (`/admin/newsletter`) | The subscriber-email home: a tile dashboard with live stats fronting three sub-pages. Campaigns (`/admin/newsletter/campaigns`): Drafts/Scheduled/Sent with the block editor, sent as Mailchimp campaigns. **Scheduling is the only way to send** (there is no "Send now"), so a mis-click stays undoable with Unschedule until the cron picks it up; rows are clickable cards with icon actions. A draft carries an editorial stage (early draft / needs polish / ready to schedule); the picker disappears once a campaign is scheduled or sent, since both are already finalised. **The Drafts tab groups by that stage** under quiet headings, ready first and early draft last, so the top of the list is what could go out today (see [Draft lists group by stage](#draft-lists-group-by-stage)). **A sent campaign is locked** (every field disabled, no Save) — it can still be previewed and **duplicated to a fresh draft**, from the list or from inside the campaign itself. Subscribers (`/admin/subscribers`): the list with subscribed/unsubscribed views, CSV import and Mailchimp sync. Subscriber flow (`/admin/subscriber-flow`): the welcome sequence for new signups (per-step delay, on/off, block editor) — see [Welcome flow](#welcome-flow) for exactly who receives what. The sub-pages keep their routes; the sidebar shows just Quick email, Socials and Newsletter under Community |
| Socials (`/admin/socials`) | `social_posts`/`social_post_media` — the drafts log for Instagram, Facebook and LinkedIn, aligned with the newsletter campaigns model: **Draft → Scheduled → Posted**, same tab bar pattern (`?tab=drafts\|scheduled\|posted`) as `/admin/newsletter/campaigns`. **Status is derived, not picked**: a post with a **schedule date** is Scheduled, **Clear scheduling** wipes that date and drops it straight back to Drafts, and Posted arrives on its own. What you set by hand is the stage (early draft / needs polish / ready to schedule); the picker disappears once the post is Scheduled or Posted, since scheduling something is treating it as finished. **The Drafts tab groups by that stage** (see [Draft lists group by stage](#draft-lists-group-by-stage)). Every row on every tab has a **Duplicate** icon button, so a post can be copied without opening it first. Write the caption (live character counts per channel; a channel only gets its own version if you pick it under "Give a channel its own caption", the usual case being a LinkedIn version for link posts, and unpicking a channel deletes its version on the next save), attach a **video** instead (MP4/MOV, one per post, not mixed with images: Instagram publishes a single video as a **Reel**, Facebook and LinkedIn as a normal video), design carousel graphics in the embedded Creative studio (same tool as `/team-brand?view=creative`; designs save their spec so they stay editable), upload finished images, or pick an existing event photo (see Event photo galleries below). **Publishing goes through Buffer** (`lib/buffer-social.ts`, `social_connections`, collapsible Connections card): channels are connected in Buffer's own dashboard, then **Sync from Buffer** reads that list back. **A schedule date actually publishes**: any synced channel goes out on the cron within ~5 minutes of it, and the Publish button (phone-mockup preview, confirm) is for sending early or retrying. An unconnected channel keeps the original manual run sheet (copy caption, download graphics, open channel, mark as posted). Posted is automatic once every selected channel has actually gone out — there's no manual "mark as posted" pick anymore outside that fallback run sheet. **A posted post is locked**: title, channels, caption, schedule and graphics all become view-only (no Save, no upload/edit/reorder/delete on the media grid, just Download), the run sheet is replaced by a read-only Published summary (per-channel result + permalink), and **Duplicate to drafts** copies the post — caption, channel captions, channels and every media file — into a brand-new draft. See [Publishing and scheduling social posts](#publishing-and-scheduling-social-posts) |
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

### Draft lists group by stage

The **Drafts** tab on both `/admin/socials` and
`/admin/newsletter/campaigns` groups rows by editorial stage, in a fixed
order: **Ready to schedule → Needs polish → Early draft**. Each group gets a
quiet heading (the stage chip, the count, then a hairline), so the top of
the list is always what could go out today and the rough work sits below it
rather than being scattered through by date.

- **Only the Drafts tabs group.** Stage is a drafting judgement and stops
  being shown at all once something is Scheduled or Sent/Posted, so grouping
  the other tabs would sort them by a field they don't display.
- **The per-row stage chip is dropped inside a group**, where it would only
  repeat the heading above it. It still shows on ungrouped lists.
- **Empty stages render nothing** — no heading with an empty list under it.
- Rows keep their existing newest-first order within a group.
- A row whose `stage` is null (written before the migration) or unrecognised
  buckets into **Early draft** via `asStage`, so nothing can silently vanish
  from the list.

The order and the bucketing live in `groupByStage` / `STAGE_ORDER` in
`app/admin/stages.ts`, beside the stage data itself. The heading is
`app/admin/StageHeading.tsx`, which carries **no `"use client"` directive on
purpose**: it is pure presentation, so the server socials page and the
client `CampaignsList` can both import it. Same reasoning as
`newsletter/campaigns/shared.ts`.

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

### Images on social posts

A big photo dropped onto a post is **compressed in the browser before it goes
anywhere** (`compressImage` in `lib/image-compress.ts`, wired into the socials
editor's upload handler). This exists because "image too large" is a real
failure, not a nicety: a straight-from-camera or high-res event photo trips
both our own 8MB `cms-uploads` cap **and** Instagram's own publish limits
(max 8MB, and it downscales anything wider than 1440px), which Buffer surfaces
as a failed publish. Raising the bucket cap would not help — Instagram's 8MB
is the real ceiling — so the fix is to shrink the file, not store a bigger one.

How it behaves, and every part is deliberate:

- **Only when needed.** An image already under the byte budget and within the
  1440px max edge is uploaded **untouched**, so a well-sized photo or a
  studio-designed graphic keeps its exact original file and quality. Work only
  happens on a file that would otherwise be at risk.
- **1440px long edge, JPEG quality 0.85.** 1440 is Instagram's own maximum (it
  downscales past that regardless), so nothing visible on the platform is lost;
  Instagram displays at ~1080px and re-compresses on its own anyway, so the
  controlled version we send is as good as, usually better than, what Instagram
  would have made from the original. If that first pass is still over budget it
  steps quality down, then scale, until it clears a safe ceiling under 8MB.
- **Video is never touched here** (it has its own 50MB path), and **animated
  GIFs and SVGs pass through untouched** — flattening them to a canvas would
  drop the animation or rasterise a vector.
- **Fails safe.** Any decode/encode hiccup falls back to the original file, so
  the compressor can never block an upload that would otherwise have worked. If
  an image genuinely cannot be brought under 8MB, the editor says so and asks
  for a tighter crop rather than failing silently.

Deliberately **socials-only.** The general admin image uploader
(`ImageUploadField`, used for newsletter/speaker/event/print imagery) is left
at full quality, because those paths have no hard publish limit — an oversized
newsletter image only costs a little inbox load time, it never fails to send —
and email and print collateral benefit from the extra fidelity. There is no
reason to compress where nothing would break.

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

**Setup, needed once.** Apply `20260817_social_media_video.sql`, then change
**two** things on the Supabase `cms-uploads` bucket (Storage → `cms-uploads` →
Settings). Both are sized for images out of the box, and either one alone
still blocks video:

1. **Allowed MIME types** — add `video/mp4` and `video/quicktime`. The bucket
   enforces an allowlist and the browser sends the file's own MIME type, so
   `.mov` (which reports as `video/quicktime`) is rejected without this. This
   is the one that bites first: it fails before the size limit is even
   considered.
2. **File size limit** — raise to at least 50MB, matching `VIDEO_MAX_BYTES`.

Get either wrong and the upload fails at the storage layer with Supabase's own
message rather than our friendly one, so if a video upload errors, check these
before reading the code.

Two things worth knowing about how Buffer handles the file: it fetches the URL
**when the post publishes, not when the post is created**, so the media must
stay public and permanent (our `cms-uploads` URLs are; don't switch to signed
or expiring links). And the Reel cover frame is taken from
`metadata.thumbnailOffset`, set to 1000ms rather than 0 because frame zero is
often black.

## Partnerships portal

`/admin/partners` (full access only) is a light CRM for chasing sponsorship
for Signal and the wider season. It replaces tracking prospects in a
spreadsheet with something that logs itself.

**Data model:** `cms_partners` (one row per organisation: contact details,
category, target tier, status, notes, the generated prospectus URL) and
`cms_partner_events` (an append-only activity timeline — every outreach
email, status change and note, each stamped with who and when). Migration
`20260818b_partners.sql`, applied 2026-08-18, seeded with a dozen real
Newcastle-area prospect organisations. Data layer: `lib/partners.ts`.

**Pipeline:** status moves Prospect → Contacted → In discussion → Confirmed
/ Declined / Dormant (`STATUSES` in `lib/partners.ts`). Sending an outreach
email from a fresh Prospect bumps it to Contacted automatically; every other
transition is a manual pick, logged to the timeline. **Status chips are
stepped in intensity along that path** (`STATUS_CHIP` in
`app/admin/partners/page.tsx`): Prospect is a quiet grey, Contacted and In
discussion are progressively stronger tints, and Confirmed is a solid fill
with a checkmark rather than another tint — it's a closed state, not another
shade of "in progress", and it's the number that matters most on the page.

**Outreach email** sends through the same pipe as Quick Compose — Resend,
through the newsletter block renderer, so it carries the house styling and
lands in `email_sends` — with a sensible default subject/body pre-filled per
partner (`defaultOutreach` in `app/admin/partners/actions.ts`), personalised
off the org's name and target tier. Sending stamps `last_contacted_at` and
logs a timeline event; ticking "Attach prospectus" adds a button linking a
PDF — a partner's own from before the removal below if one exists, otherwise
the general prospectus PDF in the Documents library. **The composer sits
behind a closed
`<details>` on the partner page**, collapsed by default: most visits aren't
"send an email right now", so it shouldn't be the first big form on screen.

**The prospectus** is an 8-page A4 document personalised for that one
partner — their name on the cover, their suggested tier highlighted on the
packages page — via `lib/prospectus-render.ts` (pure string templating, same
approach as the impact reports above), served as plain HTML by
`app/api/admin/partners/[id]/prospectus` (GET) and opened in a new tab from
"Open prospectus" on the partner page. **There used to also be a "Generate
prospectus" button** that rendered this same HTML to PDF via headless
Chromium and uploaded it to Vercel Blob (`partner-prospectus/`); that path
proved unreliable in production and was removed 2026-08, in favour of the
one link that always works — a browser's own Save as PDF covers the rest,
same as the impact reports' print view. A partner whose row still carries a
`prospectus_url`/`prospectus_generated_at` from before the removal shows a
"previously generated" download link alongside "Open prospectus"; nothing
writes those columns any more. **Tier pricing is frozen in code on purpose**
(`TIERS` in
`lib/prospectus-render.ts`: Presenting $10,000/one slot, Platinum
$5,000/three, Gold $2,500/six, Community $1,000/open) — a prospectus already
sent to a partner should never quietly change under them. Update the
constant when the actual pricing changes, not the generated PDFs. A fifth
target tier, **In-kind**, sits alongside those four for prospects being
pursued for goods/services rather than cash: it has no fixed price (left out
of the pipeline's $ value totals on the list page) and its prospectus
highlights the Community package rather than none, since that card already
covers in-kind contributions.

**Once a partner is Confirmed, the two-column layout swaps roles, not just
its content.** Apollo's "Find contacts" and "Personalised prospectus" both
assume you're still selling — neither is useful once someone's locked in —
so they're replaced by two cards that take over the **wide left column**,
since brand assets and commitments are the actual remaining job:

- **Brand assets** — `logo_urls` on `cms_partners` (a `text[]`, migration
  `20260819b_partner_logo_list_and_commitments.sql`) is an open-ended list
  rather than fixed light/dark slots: a first pass at two side-by-side
  `ImageUploadField`s didn't fit the column width, and partners don't always
  have exactly two variants anyway. `LogoUploader.tsx` (client) is a small
  grid of thumbnails with a hover-to-remove ×, plus an "Upload logo" button
  underneath — upload as many as needed (light, dark, alternate lockups),
  each one saves itself the moment it finishes uploading into
  `cms-uploads/partners/` (via `addPartnerLogo`/`removePartnerLogo`, no
  batch "Save" step), matching the same pattern as the socials Graphics
  grid rather than the earlier two-field form.
- **Commitments** — a checklist of what's been promised to this partner
  (logo on the stage screen, seats reserved, a newsletter mention…), each
  with a checkbox that ticks instantly (`CommitmentCheckbox.tsx`, calls
  `toggleCommitment` directly rather than through a `<form>`, so it doesn't
  round-trip the page for a click) and a × to remove it. Table
  `cms_partner_commitments` (same migration as above): `label`, `done`,
  `done_at`. The card's intro line doubles as a progress readout ("3 of 5
  done") once there's anything on the list.

**Details itself moves to the narrow right column and locks.**
`app/admin/partners/[id]/LockedDetails.tsx` renders the org name, contact,
email, phone, website, category, tier and notes as plain read-only text with
an **Edit details** button, rather than the live form the un-confirmed
stages use — once a deal is signed, nothing about it should change by
accident. Edit swaps in the exact same fields (still posted through
`updatePartner`); Cancel swaps back without saving. Move a partner back out
of Confirmed and the un-confirmed layout returns (Details live-editable and
wide, Apollo/prospectus narrow); nothing about the logos, commitments or
details themselves is lost either way, since this only changes which view
renders, not what's stored.

**Apollo.io contact discovery** (`lib/apollo.ts`, server-only, needs
`APOLLO_API_KEY` — see [Environment variables](#environment-variables)) adds
two things to a partner's page:
- **Find contacts** looks up people at the partner's domain likely to own a
  sponsorship decision (marketing/brand/comms/community/sponsorship/
  partnerships/engagement titles, or MD/GM/CEO/founder/owner), cheapest
  search first. Revealing one person's actual email is a separate call that
  **spends an Apollo credit**, so it only runs when you explicitly pick that
  person — the list itself costs nothing.
- **Suggest prospects** pulls organisations around Newcastle NSW by employee
  count, to top the pipeline back up without leaving the page.

Every Apollo function returns a soft `{ ok: false, error }` rather than
throwing, so "out of credits" or "plan doesn't include this endpoint" shows
up as a readable message in the admin rather than a 500. If a page reports
Apollo isn't configured, `APOLLO_API_KEY` isn't set on that environment.

## Documents library

`/admin/documents` (full access only) is a small file library for anything
that needs a public, pasteable download link — impact-report PDFs, decks,
one-off files for a partner or a school. Rows in `cms_documents`
(title, description, category, file metadata), files in the public Supabase
Storage bucket `documents` (60MB cap; PDF, Word/Excel/PowerPoint, ZIP, CSV,
plain text, PNG/JPEG/WebP). Migration `20260818_documents.sql`, applied
2026-08-18. Seeded with the six hand-built impact-report PDFs (Newcastle
2050 overview + three rooms, 60-Second Talk Night, Youth Futures Lab) under
`impact-reports/`.

The list is searchable and grouped into collapsible categories (each a
`<details>`, open by default) so it stays browsable as the library grows;
"Upload a document" is a `Modal` (see [Admin UI
conventions](#admin-ui-conventions)) rather than a permanent sidebar form.
Uploading works like an image upload: the browser sends the file straight to
Storage under the admin's own session (`DocumentUploader.tsx`), and the
server action (`app/admin/documents/actions.ts`) only records the row —
there's no server-side file handling to worry about. **Download links are
public on purpose** (no admin gate on the file itself, only on the list
page), so a link copied from here can go straight into an email or a
LinkedIn post. Deleting a document removes the Storage file too, when we
uploaded it (a document with no `storage_path`, i.e. one that only ever
pointed at an external URL, just loses the row).

## Publishing and scheduling social posts

A post in `/admin/socials` reaches its channels one of two ways, and both run
the same code (`publishChannel` in `lib/social-publish.ts`):

- **On its schedule date, by itself.** Put a date on a post and any channel
  connected through Buffer publishes within about 5 minutes of it.
- **By pressing Publish**, on the run sheet a post shows once its stage is
  "ready to schedule". Phone-mockup preview, confirm, goes immediately. Use
  it to send early, to retry a failure, or to post a channel Buffer does not
  cover.

An unconnected channel keeps the original manual run sheet: copy the caption,
download the graphics, post natively, mark it posted.

### The scheduler

`processScheduledPosts` runs inside the existing newsletter cron
(`/api/cron/newsletter`, every 5 minutes), so "scheduled for 6pm" means the
post goes out by about 6:05. It is the site's only cron entry, and everything
scheduled rides on it.

**Before 2026-08-18 none of this existed and a schedule date did nothing.**
`publish_at` drove the Scheduled chip and nothing read it to publish, so a
post reached its time and sat there until somebody noticed. If a scheduled
post is ever not going out, that history is the first thing to rule back in:
check the cron ran, not that somebody forgot to press a button.

What decides whether a post goes out, in full:

- It is **Scheduled** and its date has passed. **The editorial stage is not
  consulted.** A date is the instruction to publish, exactly as it is for a
  newsletter. Gating on `stage === "ready"` would rebuild the original bug: a
  post sitting unsent with nothing on screen explaining why.
- The channel is **connected** through Buffer.
- The channel **has not already gone out**, and has attempts left.

Three pieces of bookkeeping keep that honest, all in
`20260818c_social_autopublish.sql`:

| Thing | Why it exists |
| --- | --- |
| `autopublish_claimed_at` | An in-flight claim, so two overlapping cron passes cannot both publish one post. `not null default '-infinity'`, released back to that sentinel, which keeps the claim a single `< cutoff` comparison covering never-claimed and stale alike. Stale after 10 minutes, for a pass that died mid-flight |
| `autopublish_done_at` | The cron has nothing further to do here: everything connected is out, or what is left is manual or has exhausted its retries. Without it, a post carrying a manual channel could never reach Posted and would be re-claimed every 5 minutes forever |
| `channel_results[].attempts` | Retries stop after 3 per channel. A publish failure is nearly always something real about the post rather than a blip, and retrying every 5 minutes until somebody notices turns one bad post into hundreds of API calls. The Publish button ignores the cap, since somebody is watching |

`autopublishActionable` in `app/admin/socials/shared.ts` is the single rule
behind both "try this channel now" and "is this post finished". Those two
answers have to agree or a post is retried forever or abandoned half-sent, so
keep it one function rather than two lists of conditions.

Saving a post clears `autopublish_done_at`, so an edit makes a settled post
eligible again (new date, channel added, caption trimmed). It deliberately
does **not** clear the claim: a save landing mid-publish would hand the post
to the next pass while Buffer was still being called, which is the one window
that could double-post.

Buffer's own scheduling (`mode: customScheduled` with a `dueAt`) is
deliberately unused. Everything publishes with `mode: shareNow` at the moment
we decide to send, so a post exists in one place only and Unschedule never has
to reach into Buffer to cancel anything.

### Buffer needs different metadata per network

This is the one that will bite. Buffer validates `metadata` **at publish time,
not when the post is created**, so a wrong shape is invisible in the editor
and shows up as a failed publish. Each network genuinely differs, so
`metadataFor` in `lib/buffer-social.ts` is a switch. Every shape below was
established by a real send on 2026-08-18:

| Channel | Metadata | Notes |
| --- | --- | --- |
| Facebook | `{ type: "post" }` | Always `post`, never `reel`. A Facebook Reel has constraints nothing here enforces (vertical, capped length), so a landscape recap cut would be rejected as one and is fine as a video post |
| Instagram | `{ type, shouldShareToFeed: true }` | `shouldShareToFeed` is `Boolean!`, **required even for a plain photo post**. `true` puts a Reel on the profile grid rather than only the Reels tab. `type` is `reel` for a video, `post` otherwise |
| LinkedIn | none at all | `LinkedInPostMetadataInput` has **no** `type` field; sending one fails the post. The key is omitted entirely, not sent as `{}` |

`type` always follows the media, so nothing is asked of a human and nothing is
stored on the post. Instagram publishes video as a Reel because that is how
Instagram takes video at all, which is the same rule `mediaAddError` enforces
up front.

**Two wrong guesses shipped before this settled**: first "only Instagram needs
a type" (Facebook fails identically), then "so every network does" (LinkedIn
has no such field). There is no shared interface to reason from here. Adding a
fourth network means adding it, letting it fail once, and reading what Buffer
says, not inferring from its neighbours.

Stories are never sent on any network. Nothing in the admin models a post that
vanishes after 24 hours: it would need its own lifecycle, and "Posted" would
stop meaning what it means everywhere else.

## Design standards

Two things new work should follow, so the site keeps reading as one product.

### Design system skills

`.claude/skills/tedxnewy-design/` (public site) and
`.claude/skills/tedxnewy-admin-design/` (`/admin`) are Claude Code skills
generated from this repo's own tokens, components and content voice, each
with a `readme.md` worth reading before inventing a new colour, spacing value
or component shape. See "Design system skills" in `CLAUDE.md` for what they
are, why they're git-tracked despite `.claude/` normally being ignored, and
how their token accuracy is checked against the live app rather than taken on
trust.

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

### Motion, and what survives reduced motion

`app/globals.css` neutralises animation site-wide under
`prefers-reduced-motion: reduce` (`* { transition-duration: 0.01ms }`). Two
narrow, deliberate exemptions sit on top of that, both added on request:

- **`components/Scribble.tsx` doodles** keep their draw-in and a halved,
  slowed drift, so the hand-drawn feel survives on a phone with motion
  reduction on.
- **A short list of UI reveals** (2026-08-22): `.faq-panel`, `.faq-chevron`,
  `.quote-fade`, `.dot-morph` and `#hx-popup`. Without these, opening an FAQ
  row, changing testimonial quote and the Humanitix drawer all snapped rather
  than moved, which reads as the page glitching rather than as calm. Note the
  testimonial fade and the drawer slide were already written and simply being
  switched off, so this mostly restores what existed.

**The rule for joining either list: nothing travels, scales, parallaxes or
flashes.** Those are what the preference is actually there to suppress, and
they can genuinely make people unwell. Opacity fades and a box growing to its
own height in place are not that. So the header retreat, `StickyTicketButton`'s
bounce, `NodeNetwork`'s drift and the hero entrances all stay suppressed.

Two practical notes:

- **Check it with emulation, not by eye.** A suppressed transition and a
  working one look identical in a screenshot. Puppeteer's
  `page.emulateMediaFeatures([{ name: "prefers-reduced-motion", value:
  "reduce" }])` plus `getComputedStyle(el).transitionDuration` is how the
  current behaviour was confirmed on production.
- **It is a list of selectors, not a `.keep-motion` utility, on purpose.** A
  utility is an escape hatch that gets sprinkled around until the preference
  means nothing; editing a list is the moment to ask whether the new thing
  really belongs.

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
  (2 or 3 columns, width ratios, vertical align, and the order it stacks in
  on a phone) you fill with text, image and button sub-blocks; buttons have colour themes (incl. a gradient) and
  solid/outline styles; most blocks take an optional standout background
  tint. Alignment is a header-block field, and for text it is a
  **per paragraph** control in the rich text toolbar, so a centred opening
  line can sit above left-aligned body copy. Blocks reorder by drag handle.
  Legacy drafts are migrated on load (old two-column becomes columns, the
  retired countdown is dropped).
  Newsletters and flow emails carry a token-based unsubscribe footer;
  Quick Compose (ad-hoc recipients) omits it.
- **Dark mode is automatic, and it covers what you add.** The email carries
  a real dark variant: the card flips to a dark surface, type and rules
  invert, the wordmark swaps to the white lockup, and **the two things an
  editor picks flip with it**: a standout background tint switches to its
  dark partner, and a button switches to a fill that contrasts on a dark
  card (a near-black Ink or Deep red button INVERTS to a light fill with
  dark text: darkened further it would be a dark shape on a dark card with
  only its label showing). The
  pairings live beside the light values in `BLOCK_BACKGROUNDS` and
  `BUTTON_THEMES`, and the editor swatch shows both halves so the pairing
  is visible while choosing. **The preview has a light/dark toggle** (the
  sun/moon pair beside the desktop/mobile widths): the email's dark mode is
  a `prefers-color-scheme` media query, which answers to the reader's own
  device and cannot be forced from outside the preview iframe, so the
  toggle asks the renderer to pin the scheme instead
  (`previewScheme` in `lib/newsletter-render.tsx`). Preview only: a real
  send never passes it, so every reader's device still decides.
- **Stacking order on a phone.** Alternating image/text rows read well on
  desktop and badly stacked, where they give you image, text, text, image,
  image. A columns block has an **On mobile** setting for that: *Same as
  desktop* (the default), *Image first*, or *Reverse*. It changes the stacked
  order only, never the desktop layout, and *Image first* is safe to leave on
  every row, since it does nothing to the ones already leading with a picture.
  The editor prints the order the block will actually stack in, because only
  a reversal is available: two columns can always honour *Image first*, three
  can only when the image is the last of them.
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
duplicates are collapsed rather than counting raw table rows. Current
audiences: Subscribers, Speaker nominators, Volunteers, Ticket purchasers
(live from Humanitix), and Subscribers-not-ticket-holders. A past event's
registration list (Talk Night, Youth Futures, Student Speaker) is no longer
a Quick Compose audience: import it into that event's attendee list instead
(`/admin/events/[id]/attendees`) and use "Email everyone" from there, so the
send stays scoped to that one event.

Two of the newer audiences can also target a **newsletter** campaign, not
just Quick Compose: the editor's "Send to" field
(`app/admin/newsletter/NewsletterEditor.tsx`) picks Everyone / Ticket
purchasers / Subscribers-not-ticket-holders, built into a throwaway
Mailchimp static segment at send time (`lib/mailchimp.ts`'s `sendCampaign`).
See the CLAUDE.md gotcha on newsletter segments for the full mechanism.

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
recently `20260818c_social_autopublish.sql`
(`social_posts.autopublish_claimed_at` / `autopublish_done_at`, the
bookkeeping behind
[Publishing and scheduling social posts](#publishing-and-scheduling-social-posts)),
and just before that the same day, `20260818b_partners.sql` (`cms_partners` +
`cms_partner_events`, see [Partnerships portal](#partnerships-portal)) and
`20260818_documents.sql` (`cms_documents` + the `documents` storage bucket,
see [Documents library](#documents-library)).
Before that, `20260817_admin_access_levels.sql` (`cms_admins.access_level`, the
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
- **The header retreats on the way down and returns on the way up**
  (2026-08-21), which is where the vertical space on a phone comes back from:
  the banner plus the bar is 99px of permanent chrome, and this hands the
  bar's 57px of it back while you are reading. It moves by `transform`, never
  by `top` (that belongs to the banner), an open menu or drawer always beats
  the retreat, and it never slides away while keyboard focus is inside it.
- **On `/signal` the header's Get tickets button opens the Humanitix pop-up**
  rather than linking to `/signal`, which is the page you are already on: it
  looked live and did nothing there until 2026-08-21. The listing URL lives in
  `lib/tickets.ts` (`TICKET_URL` + `TICKET_POPUP_URL`), imported by the nav,
  `/signal` and `FALLBACK_EVENTS`. It used to be pasted into three files, and
  the slug has silently changed under us once already, so import it rather
  than writing it out again.
- Events auto-flow into the header **Upcoming** menu while they are
  `status = announced` + `show_in_nav = true`. When an event passes, set it to
  **Past** in `/admin/events` (or `update cms_events set status='past'`),
  otherwise it lingers in Upcoming. Youth Futures Lab (ran 7 August 2026) was
  the worked example of this and **its row was flipped on 2026-08-13**, so it
  is no longer pending; Upcoming currently carries Signal and the Student
  Speaker Competition. The static fallback lives in
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
