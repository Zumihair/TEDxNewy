# TEDxNewy

The TEDxNewy website — an independently licensed TED event in Newcastle,
Australia, on Awabakal and Worimi Country. Formerly TEDxCooksHill.

**Live:** https://tedxnewy.vercel.app · (custom domain `tedxnewy.com.au`
to be wired)

## Stack

- **Next.js 16** (App Router) · **React 19** · **Tailwind CSS v4** · **TypeScript**
- **Bricolage Grotesque** (variable, opsz axis) — single sans family
- **Supabase** (Sydney region) — form submissions (`subscribers`, `applications`, `nominations`, `contact_messages`, `partner_enquiries`, `talk_night_registrations`, `youth_futures_registrations`, `student_speaker_entries`) + CMS content + the admin email log (`email_sends`)
- **Resend** — transactional + admin-composed email (see [Email system](#email-system))
- **Vercel** — hosting; auto-deploys on push to `main`

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
| `NTFY_TOPIC` / `SLACK_WEBHOOK_URL` / `DISCORD_WEBHOOK_URL` | Optional | Extra channels for new-submission alerts to the team |

Email degrades gracefully: with no `RESEND_API_KEY` the app logs what it
*would* have sent instead of failing.

## Pages

| Route | Purpose |
| --- | --- |
| `/` | Hero, what's next, past events, stats, what is TEDx, participate, identity + subscribe |
| `/speakers` | All past speakers with search + year filter; click any portrait for an in-page modal bio |
| `/speakers/[slug]` | Direct deep-link page per speaker (10 routes, pre-rendered) |
| `/salons` | Past Salon series: Newcastle 2050: What If? plus future-events teaser |
| `/newcastle-2050-salon` | Newcastle 2050 Salon recap with autoplay banner + click-to-play recap video |
| `/talks` | Talks archive with search + year filter; videos rolling out on YouTube through 2026 |
| `/mission` | Mission · six pillars · what is TEDx · acknowledgment · events list |
| `/sponsors` | Tiered partner list + "Partner with us" CTA |
| `/volunteer` | Volunteer crew application form |
| `/speak` | Speaker nomination form |
| `/team` | The volunteer crew (admin-managed via `/admin/team`) |
| `/ideas` `/ideas/[slug]` | Online Ideas blog with markdown rendering |
| `/subscribe` | Standalone subscribe landing — built for Instagram-bio links |
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

Current modules:

| Section | Status | Drives |
| --- | --- | --- |
| Talks (`/admin/talks`) | Live | `/watch` (ISR every 60s) |
| Speakers (`/admin/speakers`) | Live | `/speakers`, `/speakers/[slug]` |
| Team (`/admin/team`) | Live | `/team` — public organisers + crew |
| Online Ideas (`/admin/posts`) | Live | `/ideas`, `/ideas/[slug]` — blog with markdown editor |
| Admins (`/admin/admins`) | Live | `cms_admins` sign-in allowlist |
| 60-Second Talk Night (`/admin/talk-night`) | Live | EOIs for the community event; new/accepted/declined status pipeline |
| Emails (`/admin/emails`) | Live | Compose branded one-off emails, preview, send history (see [Email system](#email-system)) |
| Salons + events | Coming next | `/salons`, home Past Events |
| Site settings | Coming next | Hero copy, ORG details, social handles |

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

Every form's admin page (`/admin/applications`, `/admin/nominations`,
`/admin/contact-messages`, `/admin/partner-enquiries`,
`/admin/youth-futures`, `/admin/student-speaker-competition`, plus
`/admin/subscribers`) renders the shared **`app/admin/SubmissionsTable.tsx`**
client component. Pass it `rows`, declarative `columns`, a `deleteAction`,
and it gives you search, CSV export, a detail modal, and an optional
spam heuristic.

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

All email goes through **Resend**. Two files:

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

### Compose (`/admin/emails`)

`ComposeForm.tsx` + `RichTextEditor.tsx` (a contentEditable WYSIWYG:
bold/italic/underline/link/lists, paste-forced-to-plain-text, no new deps).
It posts `bodyHtml`. **Preview** renders the real email through the same
`composeEmail()` the send uses. Each send records to `email_sends` and
reports sent/failed counts back to the page.

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
   insert).

## Database migrations

SQL in `supabase/migrations/*.sql` is applied **by hand** in the Supabase
dashboard SQL editor. There is no automated runner. Each file's header
says so, and all are written to be safe to re-run (`if not exists`,
`drop policy if exists`). **Apply a new migration before deploying code
that depends on it.** RLS across these tables uses the `is_cms_admin()`
helper (defined in the CMS setup migration); the anon key inserts into form
tables but can never read them.

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
- Real talk videos live on YouTube. When they're up, populate
  `lib/data.ts talks[]` with `youtubeId`s — `/watch` will pick them up.
- Speaker bios + talk titles live in `lib/data.ts speakers[]`. Replace
  the placeholder strings as content lands; the UI hides empty fields.
- Large media files (e.g. `public/video/salon-recap.mp4`, ~78 MB) push
  fine but are above GitHub's 50 MB recommended size. Consider Git LFS
  or moving to Vercel Blob / YouTube as the archive grows.
- Email failures are **swallowed by design** (a send error must never
  break a form submission, the row is already saved). So the send
  UI/logs can look fine while mail silently fails. The truth is Resend's
  own log, surfaced in `/admin/emails/history` (Resend activity). When
  "recipients didn't get it," start there, not the code.
- Automated confirmations/notifications are **not** in the `email_sends`
  log yet (only Compose sends are). They do appear in the Resend activity
  view. If you want them in the local log too, call the logging path from
  the API routes.
