# TEDxNewy

The TEDxNewy website — an independently licensed TED event in Newcastle,
Australia, on Awabakal and Worimi Country. Formerly TEDxCooksHill.

**Live:** https://tedxnewy.vercel.app · (custom domain `tedxnewy.com.au`
to be wired)

## Stack

- **Next.js 16** (App Router) · **React 19** · **Tailwind CSS v4** · **TypeScript**
- **Bricolage Grotesque** (variable, opsz axis) — single sans family
- **Supabase** (Sydney region) — form submissions: `subscribers`, `applications`, `nominations`, `contact_messages`
- **Vercel** — hosting; auto-deploys on push to `main`

## Local development

```bash
npm install
cp .env.local.example .env.local   # fill SUPABASE_URL + SUPABASE_PUBLISHABLE_KEY
npm run dev
```

Site runs at http://localhost:3000.

## Pages

| Route | Purpose |
| --- | --- |
| `/` | Hero, what's next, past events, stats, what is TEDx, participate, identity + subscribe |
| `/speakers` | 2025 Reframe lineup; click any portrait for an in-page modal bio |
| `/speakers/[slug]` | Direct deep-link page per speaker (10 routes, pre-rendered) |
| `/salons` | Past Salon series — Newcastle 2050: What If? plus future-events teaser |
| `/tickets` | Newcastle 2050 Salon recap with autoplay banner + click-to-play recap video |
| `/watch` | Talks archive — videos rolling out on YouTube through 2026 |
| `/about` | Mission · six pillars · what is TEDx · acknowledgment · events list |
| `/sponsors` | Tiered partner list + "Partner with us" CTA |
| `/apply` | Volunteer crew application form |
| `/nominate` | Speaker nomination form |
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

RLS is enabled on every table with `anon`-insert policies only; reads /
updates / deletes are blocked from public, so form data is only visible
through the Supabase dashboard.

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
- Large media files (e.g. `public/video/salon-recap.mov`, ~78 MB) push
  fine but are above GitHub's 50 MB recommended size. Consider Git LFS
  or moving to Vercel Blob / YouTube as the archive grows.
