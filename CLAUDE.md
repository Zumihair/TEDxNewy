# CLAUDE.md

Working notes for AI/code sessions on this repo. `README.md` is the full
reference; this is just the things that will bite you if you don't know them.

## The stack, briefly

Next.js 16 (App Router) · React 19 · Tailwind v4 · TypeScript · Supabase
(Sydney) · Resend (transactional email) · Mailchimp (newsletter campaigns) ·
Vercel (auto-deploys on push to `main`, functions pinned to `syd1`).

## Gotchas (read before changing anything here)

- **Deploy = `git push origin main`.** GitHub triggers a production Vercel
  build on push to `main`; other branches make preview URLs.
  - **The GitHub to Vercel link was down earlier on 2026-08-18 and is
    working again as of that evening.** Re-tested by pushing two commits to
    a branch and watching Vercel pick both up on its own within seconds
    (preview builds for `claude/buffer-scheduled-post-delay-xu0cy7`), so
    the automatic path can be trusted again. While it was broken, pushes
    landed on GitHub fine and Vercel simply never heard about them; the
    hand deploy is `npx vercel --prod --scope claused --yes` (see the CLI
    scope note below) if it ever goes quiet again. Check before assuming
    either state.
  - **How to tell in seconds, rather than waiting on `vercel ls`:** a
    commit that Vercel has picked up gets a commit status attached within
    seconds. `gh api repos/Zumihair/TEDxNewy/commits/<sha>/status --jq
    '.state, (.statuses|length)'` returning `pending` with zero statuses
    means the webhook never arrived, and no amount of waiting will help.
    A healthy commit shows one status. This is what identified the outage:
    the commit before it had one success, the two after had none. The production
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
  to production, most recently `20260818c_social_autopublish.sql`
  (`social_posts.autopublish_claimed_at` / `autopublish_done_at`, applied
  2026-08-18, the bookkeeping behind the social scheduler below). Before
  that, the 2026-08-14 batch:
  `20260814_draft_stages.sql`, then `20260814b_flow_enrolment.sql`
  (`subscribers.flow_started_at`), then
  `20260814c_flow_step_enabled_at.sql`
  (`subscriber_flow_steps.enabled_at`), and
  `20260817_admin_access_levels.sql` (`cms_admins.access_level`,
  `is_full_cms_admin()`, restrictive write policies).
  `20260817b_event_reports.sql` (impact reports table, applied
  2026-08-17 via the Supabase MCP). If it is ever missing,
  `/admin/events/[id]/reports` shows a "not set up yet" notice instead
  of crashing. Write new ones safe to
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
- **Newsletter opens and clicks** show on `/admin/newsletter/campaigns` (Sent
  tab, one strip per newsletter) and as a one-liner on the hub tile, pulled
  live from the Mailchimp `/reports` endpoint via `listRecentCampaigns()`.
  A newsletter is matched to its campaign through `newsletters.send_batch_id`
  → `email_sends.batch_id`, whose `resend_id` holds the Mailchimp campaign
  id; subject line is the fallback. The fuller report (bounces, subscriber
  activity) is still `/admin/emails/history`, linked from the Sent tab.
  - **The Sent tab's report fetch is client-side, as of 2026-08-18.**
    `listRecentCampaigns` is a live Mailchimp call; it used to be awaited on
    the server before the campaigns page could render at all, which made
    switching to Sent look hung rather than loading (no visible progress at
    all). Now `app/admin/newsletter/campaigns/page.tsx` runs only the fast
    local Supabase query and renders immediately; `CampaignsList.tsx` (a
    client component, list rendering for all three tabs) fetches
    `/api/admin/newsletter/reports` itself after mount and shows a small
    spinner in each row's results-strip spot until it resolves. The hub tile
    (`app/admin/newsletter/page.tsx`, count=1) and `/admin/emails/history`
    (count=10) still await theirs server-side — cheap enough not to need the
    same treatment, but the same "page looks hung" risk if that ever grows.
  - **Gotcha that bit this exact page once: a plain-data value export from a
    `"use client"` file isn't real data when a server component imports it
    back.** `TABS` (an array) was defined in `CampaignsList.tsx` and imported
    into the server `page.tsx`; only the *type* survives across that
    boundary, the runtime import resolved to a client-reference stub, and
    `TABS.map` threw (`TypeError: TABS.map is not a function`, briefly live
    in production). Fixed by moving `TABS`/`Tab`/`NewsletterListRow` into a
    plain `campaigns/shared.ts` with no client/server directive, imported by
    both. If a "works locally, throws in prod" bug involves a value (not a
    component) crossing from a client file into a server one, this is the
    first thing to check.
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
  newsletters (atomic claim, stale-"sending" recovery after 15 min), the
  welcome-flow drip steps (claim-first ledger upserts on
  `subscriber_flow_sends`, so overlapping runs cannot double-send), and due
  **social posts** (`processScheduledPosts` in `lib/social-publish.ts`, added
  2026-08-18). It is the site's only cron entry in `vercel.json`, so anything
  scheduled rides on it rather than earning its own; the 5-minute cadence is
  what "scheduled for 6pm" means everywhere on the site.
- **A scheduled social post publishes itself, and before 2026-08-18 it did
  not.** `publish_at` used to be decoration: it drove the Scheduled chip via
  `statusFor` and nothing read it to send, so a post sat at its time waiting
  for somebody to press Publish, with the editor's own hint saying "It is a
  target, not a scheduler". That is the bug the scheduler fixes; don't
  reintroduce a date that means nothing. Migration
  `20260818c_social_autopublish.sql` adds the two bookkeeping columns. All
  three channels verified publishing live on 2026-08-18. Full write-up in
  `README.md`, "Publishing and scheduling social posts".
  - **The stage is deliberately NOT consulted.** A date is the instruction to
    publish, exactly as it is for a newsletter. Gating auto-publish on
    `stage === "ready"` would recreate the original failure mode: a post
    sitting unsent with nothing on screen explaining why. The run sheet is
    still stage-gated, because that panel is for a human posting early or
    mopping up a manual channel.
  - **Two columns, because they answer different questions.**
    `autopublish_claimed_at` is an in-flight claim, so overlapping passes
    cannot both publish one post; it is NOT NULL defaulting to `-infinity`
    and released back to that sentinel, which keeps the claim a single
    `< cutoff` comparison covering never-claimed and stale alike (stale after
    10 min, for a run that died mid-flight). `autopublish_done_at` means the
    cron has nothing further to do: every connected channel is out, or what
    is left is manual or has exhausted its retries. Without the second one a
    post carrying a manual channel could never reach Posted and would be
    re-claimed every 5 minutes forever.
  - **Saving a post clears `autopublish_done_at` but NOT the claim.** An edit
    is what makes a settled post actionable again (new date, channel added,
    caption trimmed). Clearing the claim too would hand the post to the next
    pass while Buffer was still being called, which is the one window that
    could double-post.
  - Retries are capped at `AUTOPUBLISH_MAX_ATTEMPTS` (3) per channel, counted
    in `channel_results[channel].attempts`. A publish failure is nearly
    always something real about the post rather than a blip, and retrying
    every 5 minutes until someone notices turns one bad post into hundreds of
    API calls. The Publish button ignores the cap: somebody is watching.
  - `autopublishActionable` in `app/admin/socials/shared.ts` is the single
    rule deciding both "try this channel now" and "is this post finished".
    Those two answers have to agree or a post is retried forever or abandoned
    half-sent, so keep it one function rather than two condition lists.
- **The welcome flow runs on explicit enrolment, in strict order**
  (rebuilt 2026-08-14, migration `20260814b_flow_enrolment.sql`). An
  address enters the flow once, stamped on `subscribers.flow_started_at`;
  NULL means it is not in the flow and never receives a step. Every path
  that creates a genuinely new address enrols it: the public subscribe
  route (which also sends the instant first step) and the Mailchimp
  webhook (enrolment only, so the webhook stays fast and always answers
  200; the cron sends step 1 within 5 minutes). The admin's bulk Mailchimp
  import deliberately does NOT enrol, so the pre-existing list stays out.
  `processFlowDrips` then applies exactly three rules per enabled step:
  due (`now >= flow_started_at + delay_days`), in order (the previous
  ENABLED step is already on record for that subscriber), and was-on-when-
  they-joined (`flow_started_at >= step.enabled_at`, migration
  `20260814c_flow_step_enabled_at.sql`). Nothing else gates a send.
  - `enabled_at` is stamped on a false to true transition only, by
    `enabledPatch` in the flow actions, which both the list toggle and the
    editor's save go through. Re-saving an already-on step must NOT move
    it, or everyone who joined since would be silently cut off. Switching
    a step off leaves the value; the next switch-on overwrites it, which
    is what makes off-then-on restart the step for new joiners only.
  - Net effect, and the thing to preserve: **writing a new step and
    turning it on sends to nobody already in the flow.** It applies to
    people who join from that moment. The backfill treats already-on
    steps as on since their `created_at` so nobody mid-sequence was cut
    off when the column arrived.
  - **The old 3-day grace window is gone**, and that was the bug: steps
    were selected off `subscribers.created_at` within a window, so
    webhook-created addresses were never sent step 1 but were still picked
    up by later steps (step 2 outran step 1), and anyone outside the window
    was skipped for good. Do not reintroduce a window to make enabling a
    step safer. The safety now comes from who is enrolled.
  - Zero-delay steps are included in the cron pass, so it doubles as the
    retry for any instant welcome that failed or never ran. A subscriber
    can never receive two steps in one pass (`sentThisRun`), and each step
    dispatches at most `MAX_PER_STEP_PER_RUN` (200) per pass, with the
    remainder picked up 5 minutes later.
- **Scheduling is the only way to send a newsletter.** The "Send now" button
  and its `sendNewsletterNow` action were removed 2026-08-14: a campaign goes
  out by being scheduled and picked up by the cron, which means a mis-click
  is always undoable with Unschedule right up until it sends. The cron runs
  every 5 minutes, so "send it now" is "schedule it a few minutes out". The
  editor's Send as and Audience fields went with it (one verified sender, one
  audience: nothing to choose), and Delete draft moved to the campaigns list.
- **One block editor drives all rich email.** Blocks (header, text, image,
  columns, button, video, divider) are defined in `lib/newsletter-blocks.ts`,
  edited with `app/admin/_blocks/BlockCanvas.tsx`, and rendered server-side by
  `lib/newsletter-render.tsx` (React Email). `columns` is a container (2 or 3
  columns, width ratios + vertical align) holding a stack of curated children
  (text, image, button) per column; buttons carry a colour theme (incl. a
  gradient) and a solid/outline style; images add a full-bleed width; most
  top-level blocks take an optional standout background tint. `divider` has
  four looks (hairline, accent bar, 70% short line, X mark) in three colours
  (soft, ink, red), defined in `DIVIDER_STYLES`/`DIVIDER_COLOURS` and drawn
  by `DividerView` in the renderer; both fields default to the original
  full-width hairline, so dividers saved before the options existed render
  unchanged. The X mark is a three-cell React Email `Row` (a real table) so
  Outlook can be trusted with it, and the ink colour carries an
  `e-rule-ink` class that flips it light in dark mode, where near-black
  would vanish. **Alignment splits by block type.** A header carries an
  optional `align` (left / centre / right), stored only when it is not left,
  since it has no toolbar of its own. Text aligns **per paragraph** instead,
  from the rich text toolbar's own justify buttons, which write
  `text-align` straight onto the paragraph the cursor is in; `align` still
  exists on text blocks and text column children as the block default, but
  nothing sets it any more (a text block briefly had a block-level picker on
  2026-08-19, so a draft from that day can carry one, and the renderer still
  honours it). Two things make that work,
  both load-bearing:
  - **`styleRichBodyForEmail` MERGES its inline styles into an existing
    `style` attribute** rather than prepending a second one. With two
    `style` attributes a browser keeps only the first, so the old blunt
    `<p` to `<p style="margin:0 0 14px"` replacement silently threw the
    alignment away. Verified: a `<p>` with duplicate style attributes
    computes `text-align: start`.
  - **A line typed with no paragraph around it gets wrapped in a bare
    `<div>`** when it is aligned (that is what execCommand does), so `div`
    is in the list of tags that receive the paragraph margin, or that line
    would lose its spacing.
  The subject-line preview field is labelled **Preview text**
  in the UI; the column and every internal name is still `preheader`. The canvas
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
- **A columns block can choose the order it stacks in on a phone**
  (`mobileOrder`: `asShown` default / `imageFirst` / `reverse`, resolved by
  `stacksReversed` + `stackOrder` in `lib/newsletter-blocks.ts`). Undefined
  means unchanged, so every columns block saved before this stacks as it did.
  - **It works by emitting the columns BACKWARDS with `direction: rtl` on the
    row**, and that is the whole mechanism: stacked cells follow markup order,
    side-by-side cells follow reading direction, so reversing the markup
    reorders the phone while the rtl puts desktop back exactly where the
    author left it. Verified in a browser at 900px and 375px. Deliberately
    NOT the duplicate-and-hide approach (two copies of the row, each hidden
    at one width): one copy cannot fall out of sync with the other, and no
    client can end up showing both.
  - **Only a reversal is available, so `imageFirst` is not always
    expressible.** Two columns can always honour it. Three can only when the
    image is last, since reversing an image in the middle just moves it to
    the middle of the other end. That case falls back to `asShown` rather
    than shuffling into an order nobody asked for, and the editor prints the
    resolved stacking order underneath the picker so it is visible rather
    than a silent no-op.
  - **Gutters key off the DESKTOP position, `nl-col-last` off the STACK
    position.** `padding-left`/`padding-right` are physical and do not flip
    with `direction`, so they follow the column's desktop index; the
    bottom-spacing class has to follow markup order, since that is what the
    phone stacks. Reversing swaps which index is which, so they are computed
    from two different numbers on purpose.
- **Email dark mode is one rule list, emitted three ways** (`DARK_RULES` in
  `lib/newsletter-render.tsx`). It is `[selector, declarations]` pairs rather
  than a CSS string because the same list has to go out inside
  `@media (prefers-color-scheme: dark)`, again prefixed with Outlook.com's
  `[data-ogsb]`/`[data-ogsc]` dark-mode attributes, and a third time bare for
  the admin's pinned preview. Hand-written as a string, the two that existed
  before had already drifted: the Outlook mirror was missing `.e-rule`. Add
  anything new to the list rather than writing a rule by hand.
  - **`previewScheme` (RenderOptions) is PREVIEW ONLY.** `"dark"` drops the
    media query and applies the rules unconditionally, `"light"` leaves them
    out entirely (so an admin on a dark-mode machine still sees the light
    version). A real send must leave it undefined or the email carries one
    scheme's colours to every reader regardless of their device. The three
    `preview*` server actions (`previewNewsletter`, `previewCompose`,
    `previewStep`) take it; nothing on a send path does, test sends included.
  - **A toggle in the preview is the only way to see the other half.** Dark
    mode is a media query inside the document, so it follows the viewer's OS
    and nothing outside the iframe can override it: the toggle re-renders on
    the server rather than switching a class. `SchemeToggle.tsx` is shared by
    `PreviewModal` (pop-up) and `PreviewPane` (flow editor's side panel).
  - **A button flips too, and a near-black one INVERTS.** `buttonPaletteDark`
    maps each theme to what it becomes on the dark card: Ink and Deep red go
    to a LIGHT fill with dark text, because darkening a near-black button on a
    #1c1a18 card leaves a dark shape with only its label showing. That was the
    reported bug. Red solid is left alone (vivid on both surfaces); only its
    outline, which is red-on-background, lifts to `ACCENT_DARK`. The classes
    are per theme AND variant, since a solid and an outline of one colour flip
    differently. The theme is LOWERCASED in the class, so `redDeep` is
    `.e-btn-reddeep-s`: grepping the camelCase name finds nothing.
  - **Block background tints flip from `BLOCK_BACKGROUNDS.darkSwatch`**, so
    the editor swatch and the rendered email read from one place. The pickers
    draw a split light/dark swatch off the same values: the pairing is the
    feature, so it is shown rather than described.
  - **`<Body>` alone does not paint the page surround.** React Email's Body
    renders an inner table cell that copies the body's inline style but NOT
    its className, so cream sat around the card on a dark device while
    everything else had flipped. The outer `Section` carries `e-bg` too, which
    covers it. Don't remove that class thinking it duplicates the body's.
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
- **`/speakers` is retired (2026-08-16). Speaker bios open in place.**
  There is no speakers index any more: `/speakers` and `/speakers/[slug]`
  redirect to `/talks` (`next.config.js`), and a speaker is now a
  `?speaker=<slug>` view on whatever page shows their card. The machinery is
  `components/SpeakerLineup.tsx`, a client provider that owns the modal, the
  prev/next cycling and the URL sync (`replaceState` on the CURRENT pathname,
  so the same component works on any page). Wrap any set of speaker cards in
  it and the cards inside become buttons. It works by React context rather
  than rendering the cards itself, because the four places that show a lineup
  all have their own markup: the event-page grid, the flagship carousel,
  Signal's dark teaser (`app/signal/SignalSpeakerCard.tsx`), and `/talks`
  (where TalkModal's "More about the speaker" opens it). **A card outside a
  lineup renders as plain content, not a dead link** — so if bios stop
  opening, the missing `<SpeakerLineup>` wrapper is the first thing to check.
  Event pages must fetch via `getSpeakersWithTalksForEvent` (not
  `getSpeakersForEvent`) or the modal has no talk video to show. Speakers are
  deliberately absent from `sitemap.ts`: a query-string view of a URL already
  listed is noise.
- **Every event page ends with the same live "recent events" band**
  (`components/RecentEvents.tsx`): the three most recent past events straight
  from `cms_events`, with the current one excluded. The point is that marking
  an event Past in `/admin/events` updates every event page at once, so
  nobody maintains a hardcoded list. Wired into the generic
  `/events/[slug]` template AND each bespoke page, since those inherit
  nothing. `variant="inline"` on `/signal` only, because that page is already
  dark and a second background would stack. **Adding a bespoke event page?
  Add the band to it by hand**, same as the photo teaser.
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
- **Sidebar groups, as of 2026-08-18: Overview / Content / Management /
  Community / Settings** (`NAV_GROUPS` in `app/admin/nav-config.ts`).
  Management holds Partners, Media, Tickets and Documents, split out of
  Content because they run the partnership/collateral side of the org rather
  than driving a public page. The dashboard's "Manage" clusters read the same `NAV_GROUPS`
  by heading (`FAMILIES` in `app/admin/page.tsx`), so a new group needs an
  entry there too or its tiles just vanish from the dashboard while staying
  reachable from the sidebar — that's the one place the two lists don't
  share a single source.
- **Admin access has two levels.** `cms_admins.access_level` is `full` or
  `community` (migration `20260817_admin_access_levels.sql`), set per person
  from `/admin/admins`. Full is everything; community is Quick email,
  Calendar, Socials, Newsletter (plus Subscribers and the welcome flow, which
  live under Newsletter). The route list is `COMMUNITY_PREFIXES` in
  `app/admin/access.ts`, which also filters the sidebar
  (`visibleGroupsFor`, applied in `app/admin/layout.tsx` and passed into
  `AdminShell` as a `groups` prop) and the dashboard tiles (`canAccessPath`).
  **Enforcement is per page and per action, not in middleware**:
  `requireFullAdmin()` (`lib/cms-auth.ts`) guards every non-community page
  and `actions.ts`, `requireAdmin()` (either level) guards the rest.
  Middleware stays session-only on purpose, so a role lookup isn't added to
  every admin navigation. **Any new admin page is full-access by default:**
  guard it with `requireFullAdmin()` unless it belongs to Community, in which
  case add its prefix to `COMMUNITY_PREFIXES` too, or the sidebar and the
  guard will disagree. Postgres backs this up: `is_full_cms_admin()` plus
  three RESTRICTIVE policies mean only a full admin can insert/update/delete
  `cms_admins`, even straight through the REST API with their own token.
  `requireAdmin()` reads the row with `select("*")` and treats a missing
  `access_level` as `full`, so an unapplied migration degrades safely rather
  than locking everyone out. Nobody can change their own level or remove
  their own access, which is what guarantees at least one full admin survives
  any operation.
- **`/admin/calendar` is the Community overview**, second in the group after
  Quick email. Four Mon to Sun weeks (`?start=<Monday>`, prev/next are plain
  links so the page stays a server component) showing scheduled social posts
  (`social_posts`, anchored on `posted_at ?? publish_at`), newsletter
  campaigns (`newsletters`, `sent_at ?? scheduled_at`) and a read-only band
  for `cms_events.starts_at`. Two queries per table rather than one `.or()`,
  merged by id. **Everything buckets by Sydney local date**, never UTC
  (`app/admin/calendar/dates.ts`: day keys are plain `YYYY-MM-DD` strings
  stepped with `Date.UTC`, so DST can't shift a cell and a 9pm post can't
  land on tomorrow). The previews are the existing `RowPreviewButton`s from
  socials and newsletter, so a post previews here exactly as on its own list
  page. Below `md:` the grid is replaced by an agenda list; seven columns on
  a phone is unreadable.
  - **Chips are coloured by TYPE, not status** (`TYPE_CHIP` in
    `CalendarBoard.tsx`): newsletters red, socials green, notes grey. That is
    what makes the month scannable, and it is what Will asked for. The cost
    is that the grid no longer separates draft from scheduled by colour, so
    a draft is drawn with a dashed outline and lighter fill (`DRAFT_TINT`),
    and the popover still shows the untouched `STATUS_CHIP`/`STAGE_CHIP`
    pills. A legend under the toolbar explains the three colours; don't drop
    it, three unexplained tints are a puzzle rather than a shortcut.
  - **Notes (`calendar_notes`, migration `20260818_calendar_notes.sql`) are
    deliberately inert.** Date, title, optional description, nothing else.
    No foreign key to a post, newsletter or event, and no reader outside
    this page, so a note can never disturb something scheduled to go out.
    Both admin levels can read and write them (`requireAdmin()`, not
    `requireFullAdmin()`, matching the page itself).
    - **`day` is a plain `date` column, not a timestamptz.** Everything else
      on the board is an instant that must be bucketed into a Sydney day
      key; a note has no time, so a bare date keeps it out of that
      conversion entirely and it cannot drift a day either way. Query it
      with the day keys (`gte(startKey)`/`lte(endKey)`), never the ISO
      bounds used for the other tables.
    - Notes sort last within a day, are appended after the time sort, and
      are excluded from the "N scheduled items" count.
    - The popover swaps Preview/Open for Edit/Delete. `NoteDialog` sets
      `role="dialog"` for the same reason the preview modals do: the
      popover stands down from all its dismiss paths while one is on
      screen, and without it the first click inside the dialog would close
      the popover and unmount the dialog mid-edit. It sits at z-[60],
      above the popover (z-45).
    - **`deleteNote` selects the deleted rows and treats zero as a
      failure.** An RLS-blocked delete returns no error and no rows, which
      is exactly how an admin delete silently no-opped for weeks once
      before. The board surfaces that message rather than appearing to
      work.
  **Three things in the chip popover are load-bearing, each from a real bug:**
  - It renders **once at board level and portalled to the body**, never
    inside the chip. Both preview modals `createPortal` into `document.body`,
    so a modal opened from inside the popover sits OUTSIDE the popover's DOM
    subtree; the outside-click handler then reads every click in the modal as
    "outside", closes the popover, and unmounts the modal with it. That was
    "Preview does nothing".
  - **Every dismiss path stands down while a `[role="dialog"]` is on screen**
    (outside mousedown, Escape, scroll, resize). A React `stopPropagation`
    inside those modals cannot help: these are native listeners on document
    and window. The scroll guard matters on its own, or scrolling inside the
    newsletter preview's own scroll container unmounts it.
  - **z-45, deliberately.** Above the page, BELOW both preview modals. Note
    the two modals sit on different layers (`PreviewModal` is z-50,
    `PostPreview` is z-70), so a popover between them looks fine on socials
    and broken on newsletters. Anything new that must sit under a preview
    has to clear z-50, not z-70.
- **Status is derived, stage is chosen.** Socials and newsletter campaigns
  both split "where is this in its lifecycle" from "how finished is it".
  Lifecycle status is never picked by hand any more: a social post with a
  **schedule date** (the `publish_at` column, labelled "Schedule date" in the
  editor) is Scheduled (computed by `statusFor` in
  `app/admin/socials/shared.ts`, applied on every save), a newsletter is
  Scheduled once it has a schedule, and Posted/Sent is reached by the thing
  actually happening. What a human sets is `stage`: early draft / needs
  polish / ready (`app/admin/stages.ts`, column `stage` on both tables,
  migration `20260814_draft_stages.sql`). Both list pages `select("*")`
  rather than naming columns, so a missing `stage` column (migration not yet
  applied) can't empty the list. The socials run sheet is gated on
  `stage === "ready"`, not on the tab. **Clear scheduling** on the post editor
  (`clearSchedule` in `app/admin/socials/actions.ts`) wipes `publish_at` and
  drops the post back to Drafts immediately; it still routes the new status
  through `statusFor` rather than hardcoding "draft", so it can't drift from
  what a save would produce, and it no-ops on a posted post because Posted is
  terminal.
  - **The Drafts tabs GROUP by stage** (2026-08-20): ready to schedule,
    then needs polish, then early draft, each under a quiet heading, so the
    top of the list is what could go out today. Order and bucketing are
    `STAGE_ORDER`/`groupByStage` in `app/admin/stages.ts`, kept beside the
    stage data itself; the heading is `app/admin/StageHeading.tsx`.
    - **Only the Drafts tabs group**, because stage isn't even displayed on
      Scheduled/Sent rows — grouping those would sort by an invisible field.
    - **`StageHeading.tsx` carries no `"use client"` directive on purpose.**
      It's pure presentation, so the server socials page and the client
      `CampaignsList` can both import it. Same fix pattern as
      `newsletter/campaigns/shared.ts`; don't "helpfully" add the directive.
    - The per-row stage chip is suppressed inside a group (it would just
      repeat its own heading) and empty stages render no heading at all.
      A null/unknown `stage` buckets into early via `asStage`, so a
      pre-migration row can never drop out of the list.
  - **The stage picker only shows on a draft, as of 2026-08-18.** Once a post
    or campaign is Scheduled or Posted/Sent, the content is treated as
    finalised, so `stage === "draft"` (not `!readOnly`) gates the picker in
    both `PostEditor.tsx` and `NewsletterEditor.tsx`. A scheduled item still
    shows a one-line "editing that again needs Unschedule/Clear scheduling"
    note in its place.
  - **A posted social post is fully locked, same day.** `PostEditor.tsx`
    swaps the whole editable form for a read-only view once
    `post.status === "posted"`: no inputs, no Save, the media grid drops to
    view + Download only, and the "Get it out" run sheet is replaced by a
    read-only Published summary (per-channel result + permalink, same data,
    `resultFor`). The way out is **Duplicate to drafts**
    (`duplicatePost` in `app/admin/socials/actions.ts`), which copies the
    post and its media into a new draft with stage reset to early. A sent
    newsletter was already `readOnly` (inputs disabled); it now also gets a
    **Duplicate to draft** button inside the editor itself (previously only
    on the campaigns list), reusing the existing `duplicateNewsletter`
    action.
- **Socials matches the newsletter campaigns status model.** `/admin/socials`
  (`social_posts` + `social_post_media`, migration `20260719b`; connections +
  results in `social_connections`/`channel_results`, migrations `20260809*`/
  `20260810*`; status aligned to Draft/Scheduled/Posted in `20260811_social_status_align.sql`)
  uses the same three-status shape and `?tab=` tab bar as
  `/admin/newsletter/campaigns` (no separate "needs changes" review status —
  `status_note` is now a plain, always-editable Notes field, not gated to a
  status). **Per-channel captions are opt-in per channel**, not one global
  toggle: "Select a channel to modify the caption for" offers a chip per
  channel the post is going to, and only a picked channel renders a textarea.
  The usual case is a LinkedIn version for link posts. Unpicking a channel is
  how you delete its version: the `caption_<id>` input stops existing, so the
  next save writes it away. Don't reintroduce hidden inputs for unpicked
  channels or that deletion path silently breaks. A Scheduled channel that has been synced from Buffer
  (`lib/buffer-social.ts`) publishes on the cron when its date arrives, and
  also gets a real **Publish** button with a phone-mockup preview confirm for
  sending it early. Both routes go through `publishChannel` in
  `lib/social-publish.ts` and both use `mode: shareNow`: **Buffer's own
  scheduling (`customScheduled` + `dueAt`) is deliberately not used**, so a
  post exists in one place only and Unschedule never has to reach into Buffer
  to cancel something. An unconnected channel falls back to the
  original manual run sheet (copy caption, post by hand, mark Posted) — keep
  that fallback framing for any channel that isn't synced.
  - **Buffer's per-channel `metadata` differs per network, and the only way
    to learn it is to publish and read the error.** It is validated at
    publish time, not when the draft is built, so a wrong shape shows up as
    a failed publish with nothing wrong on screen. `metadataFor` in
    `lib/buffer-social.ts` is a switch over the three, each verified against
    a real send on 2026-08-18:
    - **Facebook**: `{ type: "post" }` and nothing else. Always `post`, never
      `reel`, because a Facebook Reel carries constraints nothing here
      enforces (vertical, capped length) and a landscape recap cut would be
      rejected as one.
    - **Instagram**: `{ type, shouldShareToFeed }`. **`shouldShareToFeed` is
      `Boolean!`, required even for a plain photo post**, and we send `true`
      so a Reel lands on the profile grid rather than only the Reels tab.
      `type` is `reel` for a video and `post` otherwise, which is the rule
      `mediaAddError` already enforces (Instagram publishes video as a Reel;
      a post is one video or images, never both).
    - **LinkedIn**: NO metadata at all. `LinkedInPostMetadataInput` has no
      `type` field, and sending one fails the post. The key is omitted
      entirely rather than sent as an empty object.
    Two wrong guesses got shipped before this settled: first "only Instagram
    needs a type" (Facebook fails the same way), then "so every network
    does" (LinkedIn has no such field). **Do not infer a fourth network's
    shape from these three** and do not assume a shared interface across
    them: add it, let it fail once, and read what Buffer says.
  - Stories are deliberately never sent on any network. Nothing in the admin
    models a post that vanishes after 24 hours: it would need its own
    lifecycle, and "Posted" would stop meaning what it means everywhere else.

- **Social posts take video as well as images** (migration
  `20260817_social_media_video.sql`). `social_post_media.media_type` is
  `image` or `video`; **`image_url` holds the video URL too**, rather than a
  second nullable column every reader would have to coalesce. Rows written
  before the migration have no column at all, so always go through
  `mediaType()`/`isVideo()` in `app/admin/socials/shared.ts`, never read
  `media_type` directly.
  - **A post is either ONE video or a set of images, never both.** That is
    Instagram's rule (a single video publishes as a Reel; it won't take a
    video beside photos). Enforced three deep: `mediaAddError()` in the
    editor before the file is even uploaded, again in `addMedia`, and a
    partial unique index in Postgres. Don't relax one without the others.
  - Buffer's `assets` array takes exactly one of image/video per entry;
    video is `{ video: { url, metadata: { thumbnailOffset } } }`. The offset
    is 1000ms, not 0, because frame zero is often black. **Buffer fetches the
    URL when the post goes out, not when it is created**, so the media must
    stay public and permanent: our `cms-uploads` URLs are, don't swap them
    for signed or expiring ones.
  - **The `cms-uploads` bucket needs two settings changed for video, and
    either one alone still blocks it**: `video/mp4` + `video/quicktime` added
    to the allowed MIME types (the bucket enforces an allowlist and the
    browser sends the file's own type, so `.mov` is refused without it), and
    the file size limit raised to at least `VIDEO_MAX_BYTES` (50MB, vs 8MB
    for images). Both fail at the storage layer with Supabase's own message,
    not ours, so check the bucket before the code when an upload errors. The
    Creative studio is image-only and hides itself on a video post.
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
- **Unsaved-changes guard is shared.** `app/admin/useUnsavedGuard.ts` holds
  both halves (a `beforeunload` handler, and a capture-phase document click
  listener that catches in-app anchor clicks before the router sees them,
  since Next's `<Link>` gives no cancellable navigation hook). The newsletter
  builder and the socials post editor both use it; give any new admin editor
  the same treatment rather than letting a back click drop edits.
- **Dates are picked with `app/admin/DateTimePicker.tsx`, not native inputs.**
  The browser `datetime-local` / `date` controls looked nothing like the rest
  of the admin and differ per browser, so socials, newsletters and calendar
  notes all use this one component. **Its value shape is identical to the
  input it replaced** (`YYYY-MM-DDTHH:mm` in `datetime` mode,
  `YYYY-MM-DD` in `date` mode, always LOCAL wall-clock, empty string for
  unset), which is why no call site had to change how it stores anything.
  Pass `name` when a plain `FormData` submit needs it: that renders a hidden
  input alongside (the calendar note dialog relies on this). Two details:
  - **All date maths goes through `Date.UTC`**, never `new Date(y, m, d)`,
    even though the values are local wall-clock. The local constructor can
    land on the previous day across a DST jump; the parts here are only used
    to count days and weekdays, so UTC arithmetic is correct and immune.
    Same reasoning as `app/admin/calendar/dates.ts`.
  - The panel portals to the body at **z-[80]**, above the calendar's chip
    popover (45), both preview modals (50, 70) and `NoteDialog` (60), since
    it can open on top of any of them. Escape is handled in the CAPTURE
    phase so it closes the picker rather than the dialog behind it.
  - `app/admin/events/EventForm.tsx` still uses a native `datetime-local`;
    it was out of scope for the original change, not a deliberate exception.
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
- **Social share cards are one shared design, driven by a catalogue.**
  `lib/og-card.tsx` renders every card (page photo full bleed, maroon scrim,
  logo top left, and a one-word-ish eyebrow above the headline on the bottom
  edge, and **nothing else on the image by design**: no description line and
  no date/venue row. The platform already prints the page's `og:description`
  beneath the image, so anything more in the picture duplicated it. Event
  cards therefore read just "Salon" or "Signature" above the event name. The
  headline is set large and allowed to wrap to two lines, which is why the
  scrim starts darkening by 55% rather than 74%) and
  `lib/og-content.ts` holds the words and photo for each route. Every
  `app/**/opengraph-image.tsx` is a four-line file that looks its page up, so
  changing a card means editing the catalogue, not the routes. Event pages
  are the exception: `app/events/[slug]/opengraph-image.tsx` builds from the
  `cms_events` row (hero image, then first gallery photo, then a fallback),
  so a new event gets a real card with no code change. **Review the whole set
  at `/dev/og`** (dev only, 404s in production): it renders each card beside
  the `og:title`/`og:description` fetched live from that page, so a card and
  its headline drifting apart is visible rather than silent.
  Four things in here are load-bearing:
  - **Photos go through sharp first**, never straight to the rasteriser.
    Most of our imagery is WebP, which it cannot reliably decode: the card
    renders with a blank panel and no error. sharp also crops to 1200x630 and
    re-encodes to JPEG, which keeps event photos off the 2400px originals.
  - **Not Bricolage Grotesque.** The only file of it we have is a variable
    font and the rasteriser's parser throws on it (`Cannot read properties of
    undefined (reading '256')`, which reads like our bug and is not). Google
    Fonts publishes no static instance. Plus Jakarta Sans is used instead,
    matching `lib/brandkit-canvas.ts`'s generated brand assets.
  - **Two logo files, picked by background.** `tedxnewy-white.png` keeps TEDx
    in brand red, which vanishes on the red gradient used when a page has no
    photo; the mono lockup is solid white and is used there instead.
  - **Cropping is a number per page**, `crop` 0 to 1, where the 1200x630
    window sits on the source: 0 flush with the top (the default, since the
    headline occupies the bottom edge and faces sit high), 1 flush with the
    bottom. Done by hand with a scale-then-`extract` in `loadImage`, because
    sharp's cover crop only takes gravity keywords and the useful adjustments
    are small ("move it down a bit" is 0.5 to 0.3). Not sharp's `attention`
    strategy: that chose a different region per image and once cropped a crew
    photo down to a torso.
- **Do not put `title` or `description` inside `openGraph` in
  `app/layout.tsx`.** A page that declares no `openGraph` of its own inherits
  the parent's whole object, so a headline set there is stamped on every page
  that does not override it. That is exactly what had happened: 20 of 23
  pages shared as "TEDxNewy · Season 2026" with a blurb promoting the
  30 April salon, months after it ran, and nothing surfaced it because each
  page's own `<title>` was correct. The layout now sets only `type`,
  `siteName` and `locale`, which lets Next fall back to each page's own
  `title`/`description`. `/dev/og` is the check.
- **The Meta ads pixel must load `beforeInteractive`, and that is not a
  style preference.** `components/MetaPixel.tsx` (ID `1515999640565864`,
  mounted once from `app/layout.tsx`) originally used `afterInteractive`.
  It worked perfectly in a real browser and still reported **"no pixels
  found on this page"** in Meta's installation check, because
  `afterInteractive` injects the script from client JS after hydration, so
  it is absent from the server-rendered HTML that any plain-fetch checker
  reads. `beforeInteractive` inlines it into the document. Don't "tidy" it
  back to a later strategy.
  - **`PageView` is re-fired on route change.** App Router navigation never
    reloads the document, so the base snippet's own PageView is the only one
    that would ever be recorded. The component skips its own first fire so
    that initial view isn't double-counted.
  - **Conversions live in `lib/pixel-events.ts`, and there are only two.**
    `InitiateCheckout` on any Get tickets click, `Lead` on a completed
    subscribe. **There is deliberately no `Purchase` event**: checkout
    happens on Humanitix and nothing here can confirm a sale, so firing one
    would be inventing a conversion. Don't add it without a real webhook.
  - **Ticket clicks track on `pointerdown`.** The Humanitix widget swallows
    `click` on those links before React sees it (verified in a browser, not
    assumed), so an `onClick` here silently never fires. `components/
    TicketLink.tsx` exists so server components can render an instrumented
    ticket link without going client themselves.
  - **`Lead` is caught centrally on `/thanks`**
    (`components/ThanksConversion.tsx`, gated on `source=subscribe` and no
    error), which covers every plain-POST subscribe form at once — homepage,
    `/subscribe`, `/contact`, `/signal`. A new subscribe form needs nothing.
    The one exception is `SeasonAnnouncePopup`, which submits by `fetch` and
    never navigates, so it fires the event itself.
- **Every event page emits `schema.org/Event`, built from the CMS row**
  (`app/events/[slug]/page.tsx`), so a new event is machine-readable to
  search and AI crawlers with no code change. Optional fields are only
  included when the row has them, so a sparse event can't emit an empty
  `location` or a null `startDate`. `/signal` has its own hand-written one
  because it isn't generated from the template. There is also
  `public/llms.txt`, a plain-text org summary for LLM crawlers; keep it in
  step with the routes when pages come and go.
- **Verify before pushing:** `npx tsc --noEmit` and `npm run build`. The
  build prints `ENOTFOUND your-project-ref.supabase.co` when the local
  `.env` has a placeholder URL. Expected noise, not a failure (exit 0).
- **`.env.local` has PLACEHOLDER Supabase credentials, so localhost cannot
  render anything CMS-driven.** `getEvents`/`getEventBySlug` fail, the site
  falls back to `FALLBACK_EVENTS` in `lib/cms-content.ts`, and the result is
  not a broken page but a *different* one: four of those fallback rows have
  `heroImageUrl: null`, so cards that show photos in production render the
  red "Photos coming soon" state locally, and the homepage gallery section
  does not render at all. **Do not chase those as bugs**, and do not judge a
  CMS-dependent layout from localhost.
- **For anything visual on a CMS-driven surface, screenshot PRODUCTION.**
  Neither `tsc` nor the build can see layout, and localhost shows the
  fallback. Puppeteer is already a dependency (it came with the impact
  reports work) and drives local Chrome fine:
  `puppeteer.launch({ executablePath: "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe", headless: true })`,
  then clip to a section's bounding box, or measure an element and assert on
  the numbers. This is how the collapsed homepage feature panel above was
  found, after `tsc` and `npm run build` had both passed clean.
- **To eyeball a block-built email, add a throwaway dev route.** There is no
  standing gallery for these: `/dev/emails` renders the TRANSACTIONAL
  templates only, and everything that renders a newsletter sits behind
  `requireAdmin()`, which localhost's placeholder Supabase credentials cannot
  get past. A route under `app/dev/` calling `renderNewsletter` with a
  hand-written block array and returning the html works in seconds, and is
  the only way to see what a change to `lib/newsletter-render.tsx` actually
  produces. Pass `previewScheme` to see either colour scheme without touching
  your OS setting. Delete it before committing (or it fails the build's route
  typing once the folder is gone). In this container Chromium for puppeteer
  is at `/opt/pw-browsers/chromium`, and the script has to live in the repo
  root to resolve `puppeteer-core`.
- **Adding a dependency? Commit `package-lock.json` in the same commit,
  and nothing will tell you if you forget.** `vercel.json` sets
  `installCommand` to `npm install`, not `npm ci`, so a lockfile missing
  the package still deploys green: npm just resolves it fresh. The damage
  is silent, and it is twofold. Every build re-resolves the range, so the
  version that ships is whatever is newest that day rather than anything
  pinned (worst on things like the headless Chromium the PDF route uses,
  where a patch bump breaks output with no code change to blame), and
  `npm ci` refuses to install at all, locally or in any future CI. This
  happened for real: `836e31b` added `@sparticuz/chromium` and
  `puppeteer-core` to `package.json` alone and went unnoticed until a
  later session ran `npm install` and saw 915 unexpected lockfile lines.
  Repaired in `45cb6a1`. To check the tree is honest, run
  `npm ci --dry-run`: it is fast, touches nothing, and fails loudly when
  the manifest and lockfile disagree.

## Environment variables (prod, all set)

`SUPABASE_URL`, `SUPABASE_PUBLISHABLE_KEY`, `SUPABASE_SECRET_KEY`,
`RESEND_API_KEY`, `RESEND_FROM`, `CRON_SECRET`, `MAILCHIMP_API_KEY`,
`MAILCHIMP_AUDIENCE_ID`, `MAILCHIMP_WEBHOOK_SECRET`,
`MAILCHIMP_WEBHOOK_SIGNING_SECRET` (stored, not yet verified in code),
`BUFFER_API_KEY` (socials publishing, **expires 10 August 2027** — see the
Socials gotcha above), `APOLLO_API_KEY` (Partners page contact lookup AND the
Media room's journalist search — both degrade gracefully without it, just
hiding those tools), `HUMANITIX_API_KEY` (read-only ticket sales, powering
`/admin/tickets` and the weekly digest; `humanitixConfigured()` gates both, so
an unset key shows a "not configured" notice rather than erroring),
`BLOB_READ_WRITE_TOKEN` (Vercel Blob, event photo
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
- Speaker bios in place: `components/SpeakerLineup.tsx` (+ `SpeakerCard.tsx`,
  `SpeakerModal.tsx`, `SpeakerCarousel.tsx`, `app/signal/SignalSpeakerCard.tsx`)
- Shared "recent events" band: `components/RecentEvents.tsx` · canonical event
  link helper: `eventHref()` in `lib/cms-content.ts`
- Running a new event, end to end, and publishing a photo gallery (where the
  raw photos go, the upload script, and everywhere the photos then show up
  including the admin picker): see "Running a new event, end to end" and
  "Event photo galleries" in `README.md`
- Community calendar: `app/admin/calendar/` (`page.tsx` server + queries,
  `CalendarBoard.tsx` client grid/agenda, `dates.ts` Sydney day keys,
  `types.ts`) · admin access levels: `app/admin/access.ts` +
  `requireFullAdmin()` in `lib/cms-auth.ts`
- Admin section colour theme: `app/admin/section-theme.ts` (consumed by the
  dashboard, `PageHeader.tsx`, `SectionLabel.tsx`, `AdminShell.tsx`)
- Events CMS: `app/admin/events/`, public `app/events/`
- Impact reports (per past event, admin only, exported to PDF): list +
  editor `app/admin/events/[id]/reports/`, content model
  `lib/report-schema.ts`, storage + data seeding `lib/event-reports.ts`
  (table `event_reports`, migration `20260817b_event_reports.sql`, apply by
  hand), HTML renderer `lib/report-render.ts`, preview/print route
  `app/api/admin/reports/[id]/preview`, server PDF route
  `app/api/admin/reports/[id]/pdf` (headless Chromium via
  `@sparticuz/chromium` + `puppeteer-core`, listed in
  `serverExternalPackages`; output stored on Vercel Blob at
  `event-reports/<slug>/`). Report font committed at
  `public/fonts/BricolageGrotesque.ttf`. Full write-up in `README.md`
  "Impact reports". Design lineage: the hand-built Newcastle 2050 LinkedIn
  PDFs (Aug 2026): 4:5 pages, one idea per page, big type, real quotes.
- Documents library (admin only, `/admin/documents`): `app/admin/documents/`
  (page, `actions.ts`, client `DocumentUploader.tsx`). Rows in
  `cms_documents`, files in the public Supabase Storage bucket `documents`
  (60 MB cap, PDF/Office/ZIP/images), migration `20260818_documents.sql`
  (applied 2026-08-18). Uploads go browser → Storage under the admin's own
  session, like image uploads; the server action only records the row.
  Download links are public URLs on purpose, so they can be pasted into
  emails and LinkedIn posts. Seeded with the six hand-built impact-report
  PDFs (Newcastle 2050 overview + three rooms, 60-Second Talk Night, Youth
  Futures Lab) under `impact-reports/`; their HTML sources live outside the
  repo in Jake's `Documents\TEDxNewy Impact Reports\source\`.
- Partnerships portal (admin only, `/admin/partners`): a light CRM for
  Signal/season prospects. Pages + actions in `app/admin/partners/`
  (pipeline list with status chips, detail page with outreach email
  composer, status control, notes timeline); data layer `lib/partners.ts`
  (tables `cms_partners` + `cms_partner_events`, migration
  `20260818b_partners.sql`, applied 2026-08-18, seeded with a dozen
  Newcastle prospect orgs). "Generate prospectus" renders a per-partner
  Signal prospectus (8pp A4, their name on the cover, suggested tier
  highlighted) via `lib/prospectus-render.ts` — pure string templating,
  frozen numbers on purpose — through
  `app/api/admin/partners/[id]/prospectus` (GET print view, POST headless
  Chromium → Vercel Blob at `partner-prospectus/`, URL stamped on the row).
  Outreach emails send via Resend through the newsletter renderer, log to
  `email_sends` and the partner timeline, stamp `last_contacted_at` and
  bump a prospect to "contacted". The composer sits behind a closed
  `<details>` on the partner page (collapsed by default, 2026-08-19) since
  most visits aren't "send an email right now". Prospectus package pricing
  lives in `TIERS` in `lib/prospectus-render.ts`; update there when pricing
  changes. A fifth target tier, `in_kind`, has no fixed price (excluded from
  the list page's $ pipeline totals) and highlights the Community package in
  the generated prospectus, since In-kind itself isn't one of the four
  priced packages.
  - **Status chips step up in intensity toward Confirmed** (`STATUS_CHIP` in
    `app/admin/partners/page.tsx`, 2026-08-19): Prospect is quiet grey,
    Contacted/In discussion are progressively stronger tints, Confirmed is a
    solid fill with a checkmark. Confirmed is a closed state, not another
    shade of "in progress" — the previous all-pastel chips made 2 confirmed
    partners hard to pick out from the rest of the board.
  - **Once a partner is Confirmed, the two-column layout swaps roles.**
    Apollo's "Find contacts" and "Personalised prospectus" both assume
    you're still selling, so they disappear entirely; the WIDE left column
    instead holds Brand assets and Commitments (2026-08-19, both replacing
    an earlier same-day version — see below).
    - **Brand assets is an open-ended logo list, not fixed light/dark
      slots.** The first cut used two side-by-side `ImageUploadField`s and
      didn't fit the column width, so `cms_partners.logo_urls` (`text[]`,
      migration `20260819b_partner_logo_list_and_commitments.sql`) replaced
      the earlier `logo_light_url`/`logo_dark_url` columns entirely.
      `LogoUploader.tsx` (client) is a thumbnail grid with a hover ×, plus
      an "Upload logo" button — each upload saves itself immediately via
      `addPartnerLogo` (into `cms-uploads/partners/`, same bucket as any
      other admin image), each remove via `removePartnerLogo`, both called
      directly (not `<form action>`) so the grid updates without a
      round-trip. No batch "Save" step, matching the socials Graphics grid
      rather than the retired two-field form.
    - **Commitments is a checklist of what's been promised.** Table
      `cms_partner_commitments` (same migration): `label`, `done`,
      `done_at`. `CommitmentCheckbox.tsx` calls `toggleCommitment` directly
      (same reasoning as the logo grid: instant, no navigation) rather than
      through a form; adding (`addPartnerCommitment`) and removing
      (`deletePartnerCommitment`) a whole item are plain form actions,
      since those aren't the frequent click. The intro line doubles as a
      progress readout ("3 of 5 done") once the list isn't empty.
    **Details moves to the narrow right column and locks**:
    `LockedDetails.tsx` renders it read-only with an Edit button rather than
    a live form, since a signed deal's org name, contact and tier shouldn't
    be one accidental keystroke from changing. Edit swaps in the same fields
    `updatePartner` always took, Cancel swaps back without saving. Moving
    the partner back out of Confirmed restores the un-confirmed layout
    (Details live-editable and wide, Apollo/prospectus narrow); nothing
    about the logos, commitments or details is lost either way — this is a
    view swap, not a data migration.
- Ticket sales (admin only, `/admin/tickets`, Management): live Humanitix
  numbers plus a one-click attendee import. Client `lib/humanitix.ts`
  (`listHumanitixEvents`, `getHumanitixEventStats`, the attendee list), page +
  `actions.ts` in `app/admin/tickets/`, import lands in `event_attendees` via
  `importHumanitixAttendees` in `lib/event-feedback.ts`, so an imported buyer
  is immediately a feedback-form recipient. Weekly digest to full admins in
  `lib/ticket-digest.ts`.
  - **The Humanitix API is READ-ONLY and so is everything here.** Nothing on
    this page can change a listing, a price or a ticket. Humanitix stays the
    source of truth for money (same reason `TICKET_TIERS` on `/signal` is a
    hand-kept copy, see the Signal section).
  - **No table of our own.** Every number is fetched live per request
    (`dynamic = "force-dynamic"`, `cache: "no-store"`), so there is nothing to
    sync and nothing to go stale. The only thing written to our database is an
    imported attendee row.
  - **Every function returns a soft failure** (`{ ok: false, error }`) rather
    than throwing, because Humanitix response shapes are not pinned by a
    schema we control. Parsing is deliberately defensive: unknown in,
    best-effort numbers out. Keep new readers on that pattern.
  - **The weekly digest rides the one cron** (`maybeSendTicketDigest()` in
    `/api/cron/newsletter`, like everything else scheduled here). It no-ops
    outside the Monday 8am Sydney hour and uses `email_sends` as its
    idempotency guard, so ~2000 cron ticks a week cost nothing and the digest
    still goes out exactly once however many ticks land inside the hour.
  - **The public sell-through badge was built and then removed** (`f3ed21f`,
    `lib/ticket-pulse.ts` deleted). Event pages show no live ticket counts.
    If that idea comes back, it was dropped on purpose, not lost.
- Media room (admin only, `/admin/media`, Management): Newcastle journalist
  contacts and the Signal media release, in `app/admin/media/` (page,
  `actions.ts`, client `BuildMediaList.tsx`) over `lib/media.ts`, with
  Apollo lookups through `lib/apollo.ts` and
  `app/api/admin/media/suggest/route.ts`. Deliberately a smaller shape than
  `lib/partners.ts`: one table, a status per contact
  (prospect / pitched / responded / covered / declined), sends logged to
  `email_sends`.
  - **`cms_media_contacts` has NO migration in `supabase/migrations/`.** The
    table exists in production and the code reads it, but nothing in the repo
    creates it, so a rebuild from migrations alone would miss it. Jake built
    this area; check with him before writing one, and don't assume the shape
    from `lib/media.ts` alone.
  - **"Build my media list" spends Apollo credits**, at most one reveal per
    outlet. An outlet where Apollo finds nobody gets a "News desk" placeholder
    row rather than nothing, specifically so it stays visible for manual
    filling and is not retried (and re-charged) on every run.
  - **The release sends one email at a time, not through the batch endpoint.**
    The branded PDF attachment rules batching out, which is why the page sets
    `maxDuration = 60`. This is the one deliberate exception to the "always
    batch" rule in the bulk email gotcha above.
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
  `ConnectionsCard.tsx`); publishing + the scheduler `lib/social-publish.ts`
  (`publishChannel` shared by the button and the cron,
  `processScheduledPosts` called from `/api/cron/newsletter`);
  Buffer API client `lib/buffer-social.ts`; canvas
  renderer `lib/creative-canvas.ts`; shared studio UI
  `components/team-brand/CreativeStudio.tsx` (also used by `/team-brand`)
- Gallery photo picker (event photos, reused wherever an image is picked):
  `components/GalleryPicker.tsx`, wired into `app/admin/ImageUploadField.tsx`
  and `CreativeStudio.tsx`; "already used" marks derived by
  `lib/photo-usage.ts` and served by `app/api/photo-usage/route.ts`
- Draft stage (early / polish / ready), shared by socials and campaigns:
  `app/admin/stages.ts` · unsaved-changes guard: `app/admin/useUnsavedGuard.ts`
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
  **It has TWO variants, chosen by `SIGNAL_LIVE`** (2026-08-20). Flag off:
  the pre-sale card above, photo plus email capture, storage key
  `season-announce-oct24`, edge tab "Join the club". Flag on: an image-free
  card (no photo, by request) reading "Tickets are on sale." with a single
  "Grab tickets now" link straight to Humanitix, storage key
  `signal-tickets-onsale`, edge tab "Get tickets". **The two keys are
  deliberately separate**, so somebody who dismissed or completed the
  pre-sale card still sees the on-sale one; don't merge them. Without the
  photo the card is only a few lines tall, so the on-sale variant also stays
  a centred card on mobile instead of going full-page, and its close button
  moves onto the card (there is no photo to sit over).
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

**On `/signal` the CTA opens the Humanitix pop-up instead of navigating**
(2026-08-21). It used to be a `<Link>` to `/signal`, so on the one page where
someone is most likely to press it, the button looked live and did nothing.
That page loads the widget script, which intercepts clicks on
`TICKET_POPUP_URL`, so `ticketsInPlace` swaps the `<Link>` for an `<a>` with
that href. Two details: the tracking is on `pointerdown`, since the widget
swallows the click before React sees it (see the Meta Pixel section), and the
href is a real working URL, so a page where the widget hasn't loaded navigates
to checkout rather than doing nothing. The button is rendered by `renderCta`
rather than an inline component, because the desktop bar and the mobile drawer
style it differently and a component defined during render would remount the
anchor on every render of Nav.

**The bar retreats on the way down and returns on the way up** (2026-08-21),
which is where the vertical space on a phone comes back from: banner plus nav
is 99px of permanent chrome, and this hands the nav's 57px of it back while
you are reading. Four things in it are deliberate:
- **It is a `transform`, not a change to `top`.** `top` belongs to the banner
  (`--banner-offset`) and animating both would have the two fighting over one
  property. `translateY(-115%)` clears the bar's drop shadow as well as its
  box, and since the banner is z-60 against the nav's z-50, any part still on
  screen slides in behind it rather than over it.
- **An open menu or drawer always wins** (`barRetreated = retreated &&
  !barExpanded`), or tapping the burger low on a page would slide the drawer
  away as it opened.
- **Two guards stop it feeling twitchy**: nothing happens in the first
  `HIDE_AFTER` (160) pixels, since at the top of a page there is nothing to
  reclaim and a bar that vanishes on the first flick reads as a glitch; and a
  movement under `DIRECTION_NOISE` (6px) is not treated as a direction at all,
  which is what keeps rubber-banding from flickering it.
- **It never retreats out from under the keyboard.** If focus is inside the
  bar the scroll handler leaves it alone, and `onFocus` on the `<nav>` brings
  it straight back, so tabbing can't strand someone on an off-screen control.
  The scroll listener tracks its previous offset in a plain local, not state:
  it is written on every scroll event and must not re-render anything.

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
- **Signal is the 2026 flagship**, not a separate thing: the CMS row titles
  itself "Signal" with `link_url = '/signal'` and a real `ticket_url`, slug
  `signal-2026` (renamed 2026-08-16 from the original placeholder
  `flagship-2026` to match the `<name>-<year>` convention of the other
  flagship slugs, `reframe-2025` and `beyond-boundaries-2024`, after a
  stray duplicate draft row titled "Signal" with slug `signal` was found
  and deleted), so `/events/signal-2026` redirects straight to the bespoke
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
  newest-first from `sortEvents`, so Signal leads; on mobile it's a
  horizontal scroll-snap carousel, `sm:` and up it's the static 3-up grid),
  a **speaker teaser** pulling Signal's own lineup via
  `getSpeakersForEvent(signalEvent.id)` — the whole section is hidden while
  that comes back empty (0 today; add via `/admin/speakers` with Event =
  Signal), and once there's at least one speaker it renders with an
  always-present dashed "Revealed soon ?" card appended after them (cap
  intentionally left uncapped, the mystery card is just always last),
  agenda, venue (verified real address, Corner Laman Street and Auckland
  Street, Newcastle NSW 2300, plus a Google Maps iframe embed with a CSS
  `invert()`/`hue-rotate()` filter so it doesn't look like a bright white
  hole in a dark page), a "make a weekend of it" panel (`WEEKEND_NOTES`:
  light rail from the Interchange, the dining deal, staying over, Darby
  Street, the after party — **no venue is named**, because those partners
  aren't signed; everything else there is plain Newcastle geography or
  already true of the ticket), sponsors, a
  single-open FAQ accordion (`components/FaqAccordion.tsx` — opening one
  question closes whichever was open before it; plain `<details>` tags
  can't do this since each tracks its own state; its `a` field takes a
  ReactNode, so an answer can carry a link. **The answer is always in the
  DOM and opens by growing `0fr` to `1fr`**: it can't be `{open && ...}`,
  since an element that doesn't exist yet has nothing to transition from,
  and the grid-row trick animates to the content's own height without
  measuring anything in JS. `inert` keeps the closed answer, and any link
  inside it, out of the tab order and the accessibility tree), a "see more
  events" band,
  then a **red** (`#e02214`) final CTA — deliberately not the same
  near-black as the footer directly below it, or the two blend into one
  another — and finally a **deep-maroon (`#2a0604`) mailing list section**,
  which exists in that colour so the page steps red to maroon to near-black
  footer instead of the band disappearing into the footer. That form is a
  plain POST to `/api/subscribe` like every other one, so it inherits the
  bot filter, the welcome flow and the `/thanks` redirect that fires the ads
  `Lead` event; nothing about it is bespoke.
  An **event partners ribbon** (the same `signalSponsors` list as the
  sponsors section, so a new partner appears in both with no code change)
  sits between the about section and the past-editions timeline. It has a
  top border only: the section under it opens with `border-t`, and two
  adjacent borders read as one doubled line.
  Several sections deliberately have **no eyebrow kicker** (2026-08-20: "The
  flagship story", "The day", "Tickets", "Good to know" were all removed).
  Their headings also lost the `mt-4` that spaced them from the kicker, so
  they sit flush against the section padding; re-adding a kicker means
  putting that margin back.
- **Get tickets everywhere opens the Humanitix pop-up widget**, not a new
  tab: `next/script` loads
  `https://events.humanitix.com/scripts/widgets/popup.js` (`strategy=
  "afterInteractive"`), and every ticket link's `href` is
  `https://events.humanitix.com/tedxnewy-signal/tickets?widget=popup`
  (`TICKET_POPUP_URL` in `app/signal/page.tsx`). The widget's own JS
  intercepts the click; the href is a real, working fallback URL if it
  doesn't load.
  - **The Humanitix slug has already changed once under us, silently.** It
    was `tedxnewy-signature-event` until 2026-08-19, when the listing moved
    to `tedxnewy-signal` and the old URL started returning a plain 404. The
    site kept rendering perfectly and every Get tickets button led to a dead
    end, because nothing here checks that the URL still resolves. If tickets
    ever "stop working" with no deploy behind it, curl the URL before
    reading any code: a 404 from events.humanitix.com is the whole answer.
    **The slug is now in ONE place in code**, `lib/tickets.ts`
    (`TICKET_URL` + `TICKET_POPUP_URL`), imported by `app/signal/page.tsx`,
    `FALLBACK_EVENTS` in `lib/cms-content.ts` and `components/Nav.tsx`. It was
    written out in three files until 2026-08-21; keep new consumers importing
    it rather than pasting the URL again. The live `cms_events` row still
    carries its own copy and has to be changed in the admin.
  - **The widget swallows the click event on those links.** Anything that
    needs to observe a ticket click (the ads pixel does) has to listen on
    `pointerdown`; a React `onClick` never runs. See the Meta Pixel section.
- **Partner logos are capped on BOTH axes, and one carries a per-name
  multiplier** (`LOGO_SCALE` in `app/signal/page.tsx`, currently just
  University of Newcastle at 1.15x). Two separate things make one shared cap
  wrong:
  - Logos range from a near-square crest to a 10:1 wordmark, so a
    height-only cap lets the widest run three times the width of the others.
  - **How much of a logo file is actually ink varies wildly**, and
    `object-contain` scales the whole canvas, padding included. Henderson's
    original upload was 84% transparent padding (artwork 844x82 inside a
    1080x398 canvas) and University of Newcastle's 29%, so at the same cap
    their visible marks rendered far smaller than SRN's, which has none.
  - **So the multipliers are tuned to the files CURRENTLY uploaded**, and the
    upload and the number have to change together: a newly cropped file at an
    old multiplier renders roughly twice its intended size, an old padded file
    at a new multiplier about half.
    - **Both were re-cropped and swapped on 2026-08-21**, which is why
      Henderson has left the map (2 to 1) and UoN came down (1.5 to 1.15).
      Verified on production rather than assumed: the served files are
      SHA256-identical to the cropped masters, and the three logos measure
      150.0x14.6, 117.7x41.4 and 143.3x36.0 in the ribbon at 1280px.
    - Masters, the ink-vs-canvas measurements and the swap procedure live
      OUTSIDE the repo in `../Source-Images/partners/` (see its README).
      Measure a new file rather than guessing a number: compare the canvas
      against the bounding box of pixels with alpha above ~16.
    - Once every partner's file is cropped to its true content every
      multiplier reaches 1 and `LOGO_SCALE` can go away entirely.
  - `/sponsors` is unaffected by any of this, since it renders into a fixed
    `h-16 w-40` box.
- **`/signal` is excluded from the season announce pop-up**
  (`EXCLUDED_PREFIXES` in `components/SeasonAnnouncePopup.tsx`): the page is
  itself the announcement and already carries a promo banner, a sticky
  ticket button and a mailing list section. The `isExcluded` guard returns
  null for the whole component before the minimised branch, so this takes
  the "Join the club" edge tab with it, not just the card.
- **Doors are 1:30pm, not 2pm.** The venue panel and the Event JSON-LD both
  said 2pm until 2026-08-20, which is when the *talks* start; the agenda's
  own arrival slot (1:30pm to 2:00pm, "doors open") and the Humanitix
  listing both say 1:30. Three places state a time on this page — the venue
  panel, `AGENDA`, and `startDate` in the Event JSON-LD — so change them
  together.
- **The three ticket tiers on `/signal` are a COPY of the Humanitix
  listing, and nothing keeps them in sync.** `TICKET_TIERS` at the top of
  `app/signal/page.tsx` holds Concession ($59.99), Standard ($99.99) and
  Angel ($159.99), with wording taken from the listing rather than
  rewritten. Checkout charges whatever Humanitix says, so **a price changed
  there and not here is a page that lies about money**. Re-check the listing
  whenever tickets are touched. Details that are all deliberate:
  - **The fee is a bare "+ booking fee", never a figure.** It differs per
    tier and Humanitix can change it without telling us, so printing an
    amount is the fastest way to misstate a price. Don't "improve" this by
    adding the numbers back.
  - **Concession and Standard share one `STANDARD_INCLUDES` array.** They
    are the same offer at two prices; only eligibility differs. Keep both
    pointing at the one array so they cannot drift apart.
  - Concession names who the tier suits and does NOT demand a valid
    concession card, which is a deliberate softening of the listing's
    wording.
  - **Angel's list is Will's own copy**, including "Exclusive early access
    to the event as a thank-you", which is the one line NOT on the Humanitix
    listing. If the listing is ever rewritten, reconcile the two.
  - The First Release shirt is a **banner above the cards** and belongs to
    that release only: delete the block when it sells out rather than
    leaving it promising something checkout will not deliver.
  - Cards do not deep-link a tier (the pop-up widget has no per-tier entry
    point), Standard carries the "Selling fast" badge via a `featured` flag,
    and the buttons sit in an `mt-auto` wrapper so they line up across the
    row however many lines each tier's list runs to.
  - Section order on the page is sponsors, then tickets, then testimonials,
    then FAQ, then recent events, then the red final CTA, then the mailing
    list band.
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
- **The homepage `<title>` is derived from `SIGNAL_LIVE` too**, so it is not
  a separate thing to remember when tickets open: `HOME_TITLE` in
  `app/page.tsx` reads "TEDxNewy · Tickets coming soon!" while the flag is
  off and "TEDxNewy · Tickets on sale NOW!" once it is on. That string is the
  headline Google shows for a "TEDxNewy" search. Don't hardcode it back to
  one value, and don't add a second manual step: flipping the flag is meant
  to move the CTA, the redirects, the nav item AND this in one push. Google
  re-crawls on its own schedule, so the new headline takes days to show.
- **Signal itself is gated behind `SIGNAL_LIVE` in `lib/feature-flags.ts`**,
  which is **`true` and live in production as of 2026-08-21**: tickets are on
  sale. The flip was the scheduled merge of `claude/tickets-on-sale` into
  `main` that morning, so the merge itself was the go-live. Everything below
  describes what the flag does in each position and stays accurate whichever
  way it is set; the flag goes back to `false` when sales close and the site
  reverts on its own. While the flag is off,
  `/signal` and `/events/signal-2026` redirect to `/signature`, and the
  header's "Upcoming" menu shows a "Signal · Coming soon" row with no href
  instead of hiding it outright (`lib/nav-fallback.ts`'s static item, and
  `fetchNavConfig` in `lib/cms-content.ts` which strips `link_url` off the
  live DB-driven Signal row the same way — `eventsToNavItems` already
  badges any href-less event "Coming soon"). `/signature`, `/events` and
  the homepage's "Our recent events" section (which only shows past
  flagship/salon events now, see below) don't reference Signal at all while
  it's gated, and the header CTA reverts to its pre-Signal "Subscribe" →
  `/subscribe`. The rest of Signal (content, admin CRUD, the bespoke page
  itself) is fully built and live in the database, so **the flag is the only
  step in either direction**: setting it and pushing to `main` opens or closes
  the whole thing, and the redirects and nav gating above revert on their own.
  - **The flag drives the whole ticket-sales dressing, not just the page**
    (built 2026-08-20). Flipping it also swaps the homepage hero
    (`components/SignalHomeHero.tsx` replaces `CursorSpotlightHero`, i.e.
    "Ideas that refuse to sit still" is PAUSED, not deleted, and returns by
    itself when the flag goes back to false after sales close), mounts the
    site-wide announcement bar (`components/SiteBanner.tsx`), swaps the
    season pop-up to its tickets-on-sale variant, and moves the header CTA
    and `HOME_TITLE`. **Add anything new for the sales window to the flag,
    never to a second switch**: the whole point is that opening and closing
    sales is one line.
  - **Two CTAs, two destinations, on purpose.** The site banner and the
    homepage hero link to `/signal` (the event page sells the day, the
    tiers and the venue). The pop-up links straight to Humanitix checkout.
    Don't "tidy" them into one destination.
  - **The banner is site-wide but each variant has its own copy.**
    `SignalPromoBanner.tsx` is now parametrised (`message`, `shortMessage`,
    `ctaLabel`, `external`, `icon`, `storageKey`); `/signal` mounts it itself
    with the early bird offer and the Humanitix pop-up URL, `SiteBanner`
    mounts it everywhere else with the on-sale line and an internal link,
    skipping `/signal` (which has its own) and the routes where Nav hides.
    Only the site-wide one passes `storageKey`, so a dismissal sticks across
    navigations rather than returning on every click.
  - **On a phone the bar is ONE nowrap row and cannot be dismissed**
    (2026-08-21). Both halves of that are the same fix. It used to wrap: the
    copy ran two or three lines and the CTA dropped below it, and because
    `body` padding tracks the banner's height, a tall bar pushes every page
    down by that much. `/signal` was the worst at **114px**, the site-wide bar
    75px; both are now 42px. So the close button is `sm:` and up only, and the
    horizontal space it was reserving (`px-10`) holds the CTA inline beside
    the text instead. Below `sm` the row is `flex-nowrap`, so it physically
    cannot become a block again.
    - **That makes `shortMessage` load-bearing, not a nicety.** A caller
      passing only a long `message` gets it squeezed against the CTA on a
      narrow phone. Give every call site a short form that fits one line at
      375px and check it there.
    - **Losing dismissal on mobile is the trade, and it was asked for.** Don't
      "restore" the X below `sm` without also solving the height.
    - **Watch the JSX whitespace in that short copy.** `</strong> tickets`
      split across two lines renders as "Signaltickets": JSX strips the space
      between a tag and text that wraps. Use an explicit `{" "}`, which is
      what the original copy did and what a rewrite dropped for a moment.
  - **`body` now carries `padding-top: var(--banner-offset)`**
    (`app/globals.css`). The banner is `fixed` and publishes its height for
    the nav's `top`; with the bar on every page, the pushed-down nav would
    otherwise cover the top of every hero that knows nothing about it.
    `/signal`'s hero had that offset baked into its own `pt-[calc(...)]` and
    it was REMOVED in the same change: leaving it would double-count. A new
    page needs no offset handling at all. Add speakers via
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
  `globals.css`). Three things in that pill are load-bearing:
  - **It measures the hero element by `afterId`, not a fraction of the
    viewport.** The old `scrollY > innerHeight * 0.9` heuristic ran visibly
    late on phones: a `92vh` hero is measured against the LARGE viewport
    while `innerHeight` reports the small one with browser chrome showing,
    and the promo banner pushes everything down again. `/signal` passes
    `afterId="signal-hero"`; don't rename that id without updating the prop.
  - **The horizontal centring lives on the WRAPPER, never the anchor.**
    `.cta-jump` animates `transform` on the anchor and a CSS animation
    outranks a utility class, so `-translate-x-1/2` there is dropped the
    moment the bounce runs and the button sits half a width off centre.
    Same trap as the Scribble tilt. For the same reason the anchor
    transitions named properties, not `all`.
  - From `md:` up it sits **centred on the bottom edge** and grows past
    `DEEP_POINT` (45% of scrollable height): bigger type, stronger glow,
    and the `note` prop appears beside the label. Mobile keeps the corner,
    where a centred pill would cover what is being read.
  The banner is the one that reads/writes
  `--banner-offset` on `<html>` (see the header nav section above) —
  measured from its own rendered height via a ref, not hardcoded, so it
  stays correct if the copy ever wraps to two lines at some breakpoint.
- **The homepage's two event sections are both derived, and must stay that
  way** (`app/page.tsx`). `const [featured, ...olderEvents] = pastEvents`
  (already newest-first): the newest past event gets the "Just wrapped"
  feature, the next three fill the grid under "And that's just the latest."
  **Do not hardcode either.** The feature used to be pinned to the
  60-Second Talk Night, and when Youth Futures Lab happened it not only
  went stale, it hid the newer event completely: the grid filtered to
  `flagship || salon`, so a `special` fell through both sections and the
  most recent event appeared nowhere. The grid now takes every kind and
  excludes only the featured one.
  - Feature copy comes from the CMS row: `tagline`, falling back to the
    first paragraph of `blurb`, never both (matching how `/events` picks a
    description). Nothing on it is written in code.
  - **It degrades on purpose.** With no `hero_image_url` and no catalogued
    photos it drops to a single column rather than rendering an empty
    panel, and the three-frame gallery strip only appears once
    `event_photos` has rows. Both fill back in on their own; neither needs
    a code change.
  - **The image column is `w-full`, and it must not go back to
    `md:justify-self-end`.** Justifying to the end sizes a grid item to its
    content, and the content here is an aspect-ratio box whose only child is
    an absolutely positioned image, so there is nothing to measure and the
    entire panel collapses to a thumbnail on desktop. This shipped
    unnoticed because the branch had never rendered: `featuredImage` falls
    back through `hero_image_url` then the first gallery photo, and both
    were null until the Youth Futures Lab photos landed 2026-08-17.
  - **The hero frame and the photo strip are ONE link, to the event page**,
    not two links with the strip going to the gallery under a "See all N
    photos" caption. The caption read as a weak afterthought next to the
    big image and split the feature's attention; the event page carries its
    own gallery link, so the feature only has to get people there.
  - **"Check out our gallery" is a horizontal scroller at EVERY
    breakpoint**, a deliberate exception to the house
    carousel-on-mobile-grid-on-desktop rule. Three galleries show at a time
    on desktop (cards at `lg:w-[31%]`, so the next peeks in) and the rest
    are reached by scrolling, which keeps the section one band tall however
    many events accumulate. As a wrapping grid it grew a second row the
    moment a fourth gallery was published.
- **An event with no `hero_image_url` gets a red "Photos coming soon" card,
  not a blank one** (`components/PhotoPending.tsx`). It paints its OWN brand
  gradient over the panel, deliberately overriding the event's `kind` colour,
  so a photo-less Salon or special doesn't show up navy or teal: an
  awaiting-photos card should read as one state, and those kind colours are
  tuned to sit behind photography, not text. One `PENDING_GRADIENT` constant
  in that file controls it everywhere. Automatic and self-clearing: nothing is
  added per event, and setting the hero image in `/admin/events` swaps in the
  real photo with no deploy. It reaches `/events`, `/salons`, `/signature`,
  the homepage grid and the recent-events band because those all render
  through `EventRow` or `PastEventCard`. **Give any new event card component
  the same `image ? <PhotoFill/> : <PhotoPending/>` fallback.** The one
  exception is the homepage "Just wrapped" feature, which drops to a single
  column instead (a placeholder at that size reads weaker than clean
  full-width text; in a grid a missing panel breaks the rhythm).
- **A row of cards is a swipe carousel on mobile and a grid on desktop.**
  This is the house pattern; use it for any new multi-card row rather than
  letting three or four tall cards stack into a very long phone scroll. Live
  on both homepage card rows, the homepage Participate row, `SpeakerCarousel`
  and the Signal past-editions timeline. The recipe, and every part of it is
  load-bearing:
  ```
  ul:  carousel-scrollbar -mx-5 flex snap-x snap-mandatory scroll-pl-5
       gap-5 overflow-x-auto px-5 pb-4
       md:mx-0 md:scroll-pl-0 md:grid md:grid-cols-3 md:overflow-visible md:px-0 md:pb-0
  li:  w-[78vw] shrink-0 snap-start sm:w-[46vw] md:w-auto
  ```
  - `-mx-5` + `px-5` is a **bleed**: the row runs to the screen edge so the
    next card peeks in and reads as swipeable, while the first card still
    lines up with the body text.
  - **`scroll-pl-5` is not optional.** `snap-start` aligns to the scrollport
    edge, which the negative margin has moved to the screen edge, so without
    matching scroll-padding every card *after a swipe* lands flush against
    the edge while only the first respects the margin. Keep the value equal
    to the horizontal padding (`px-5` → `scroll-pl-5`; `md:px-6` →
    `md:scroll-pl-6`).
  - Card width in `vw` with `shrink-0`, so the peek is proportional.
  - `.carousel-scrollbar` (globals.css) hides the bar on touch and shows a
    slim one from `md` up, where there's no swipe gesture.
  When a row is a dense grid rather than cards (the admin calendar), the
  mobile fallback is an **agenda list** instead: seven columns never fits.
- **Brand consistency rules for anything new.** Take colour from the system,
  don't invent it: `app/admin/section-theme.ts` for admin surfaces, and on
  the public site the brand red `#e02214` (hover `#b91404`), deep maroon
  `#3d0a05`/`#2a0604` for dark sections, cream `#f4efe6`, ink `#141210`.
  A **holding or empty state is red**, never a section's own accent colour
  (see `PhotoPending` above), so "waiting on content" reads the same
  everywhere. The tab and iOS icons (`app/icon.tsx`, `app/apple-icon.tsx`)
  are a bold white "x" in the brand red, matching the circular socials
  avatar; the tab one is a transparent-cornered circle, the iOS one is
  full-bleed and opaque because iOS fills transparency with black and applies
  its own mask. Change one, change both. A four-letter "TEDx" wordmark was
  tried in the tab icon and dropped: at 16 to 32px a wordmark turns to mush,
  a single mark stays legible. The X is **drawn as two rotated bars, not a
  typed character**: a glyph sits on its baseline and rendered ~3px low and
  slightly right (its centring uses the advance width, which includes
  trailing letter-spacing). Don't simplify it back to text. Constraints are
  in the files: keep the bars' half-diagonal inside the circle radius, and
  keep the bar height EVEN or the mark lands on a half pixel and drifts low.
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
  an arrival strip, a "Smart. Kind. Real." section, the ten questions as a
  scroll wheel (`components/FocusWheel.tsx`, below), a three-moment photo
  band, the full recap video, and a
  gallery section that renders a real 6-photo teaser once `event_photos`
  has rows for it and a "gallery coming soon" card until then (so no code
  change is needed when the photos land). **The photos landed 2026-08-17**
  (76 of them, on Blob), so the teaser is live and the coming-soon branch
  is now just the fallback. The same batch supplied the page's seven
  committed feature photos in `public/images/youth-futures/yfl-*.webp`:
  `yfl-card` is the event's `hero_image_url` (so it is also the card on
  `/salons`, `/events`, the homepage feature and the recent-events band),
  three scene shots carry the arrival strip in the details section, and
  three carry the "From a blank table to a room full of ideas" band
  between the wheel and the recap video. Both of those rows follow the
  house swipe-carousel-to-grid recipe. Their captions are grounded in the
  day's run card (`../Source-Data/youth-futures-lab-resources/`), not
  invented: the solo thinking sprint, the roaming questions, the wheel
  that drew the running order. The whole page sits on one
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
  nothing travels, scales, parallaxes or flashes. See the reduced-motion
  section below for the second, separate exemption list and the rule that
  decides what may join it.

- **A short list of UI reveals also survives `prefers-reduced-motion`**
  (2026-08-22, `app/globals.css`, added on request). The blanket block
  (`* { transition-duration: 0.01ms !important }`) was flattening the site's
  own feedback on any phone with motion reduction on: opening an FAQ row,
  changing testimonial quote and the Humanitix drawer all snapped, which
  reads as the page glitching rather than as calm. Exempt today:
  `.faq-panel`, `.faq-chevron`, `.quote-fade`, `.dot-morph` and `#hx-popup`.
  - **The rule for joining the list: nothing travels, scales, parallaxes or
    flashes.** These are opacity fades and a box growing to its own content
    height, in place. That is why the nav's retreat, `StickyTicketButton`'s
    bounce, `NodeNetwork`'s drift and the hero entrances are all deliberately
    still suppressed, and they were checked: with reduced motion emulated the
    nav still measures `1e-05s`.
  - **It is a list of selectors, not a `.keep-motion` utility, on purpose.**
    A utility is an escape hatch that gets sprinkled around until the
    preference means nothing. A list has to be edited, which is the moment to
    ask whether the new thing really belongs.
  - **`#hx-popup` restores Humanitix's OWN animation rather than adding one.**
    Their widget injects `<dialog id="hx-popup">` carrying
    `transition: transform 0.3s ease-in-out`, and our blanket rule was
    flattening it, so the side-car teleported into place. Verified sliding
    from x=390 to x=0 over ~280ms with reduced motion on. That id is a third
    party's, so if they rename it this quietly goes back to snapping, which
    is a safe way to fail.
  - Elements on this list must NOT also carry a Tailwind `duration-*` class:
    the two set the same property and which wins depends on stylesheet order.
    Durations live in the component via `--motion-ms` where they vary.
  - **Verify this with emulation, never by eye.** Puppeteer's
    `page.emulateMediaFeatures([{ name: "prefers-reduced-motion", value:
    "reduce" }])` plus reading `getComputedStyle(el).transitionDuration` is
    how the above was confirmed; a suppressed transition and a working one
    look identical in a still.
  - **A stale dev server will hide CSS changes entirely.** These rules read
    as absent (`transition-duration: 0s`) against `next dev` while the built
    bundle had them. If a new rule in `globals.css` seems to do nothing,
    check the compiled chunk under `.next/` before debugging the CSS, or test
    against `npm run build` + `next start` on another port.

## Writing style

User preference: **no em or en dashes** in copy or docs. Use commas, colons,
or full stops. Applies to email copy, UI text, content, and these files.
