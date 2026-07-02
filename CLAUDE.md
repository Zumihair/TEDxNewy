# CLAUDE.md

Working notes for AI/code sessions on this repo. `README.md` is the full
reference; this is just the things that will bite you if you don't know them.

## The stack, briefly

Next.js 16 (App Router) · React 19 · Tailwind v4 · TypeScript · Supabase
(Sydney) · Resend (email) · Vercel (auto-deploys on push to `main`).

## Gotchas (read before changing anything here)

- **Deploy = `git push origin main`.** GitHub triggers a production Vercel
  build on push to `main`; other branches make preview URLs. There is no
  local Vercel link. The production Vercel/Supabase/Resend accounts may
  differ from whatever a generic MCP connection shows, so don't assume a
  project you can see via tooling is this site's.
- **Migrations are applied by hand.** SQL in `supabase/migrations/*.sql` is
  pasted into the Supabase dashboard SQL editor; there's no runner. Apply a
  migration before deploying code that reads/writes the new column or table.
  Write them safe to re-run (`if not exists`, `drop policy if exists`).
- **Anon key is insert-only on form tables** (RLS). Public form routes can
  `insert` but cannot `select`, so you can't dedup by querying for a recent
  row. Duplicate protection is client-side: wrap public `<form>`s in
  `components/SubmitLockForm.tsx`.
- **Bulk email is batched on purpose.** `sendBulkEmail()` sends a group in
  one Resend batch request. Don't replace it with a per-recipient loop:
  Resend rate-limits at 2 req/sec and the old loop silently dropped everyone
  after the first ~2 per send.
- **`RESEND_FROM` must be a verified `tedxnewy.com.au` sender.** The
  `onboarding@resend.dev` fallback gets spam-filed. `/admin/emails` warns
  when the fallback is active.
- **Email errors are swallowed** (so a send failure can't break a form
  submit). The UI can look fine while mail fails. Source of truth for "did
  it send?" is Resend's own log, surfaced at `/admin/emails/history`
  (Resend activity), not the code or the local `email_sends` table.
- **Verify before pushing:** `npx tsc --noEmit` and `npm run build`. The
  build prints `ENOTFOUND your-project-ref.supabase.co` for statically
  prerendered pages when the local `.env` has a placeholder URL. That's
  expected noise, not a failure (build still exits 0).

## Where things live

- Email builders + branded shell: `lib/email-templates.ts`
- Email delivery (channels, batch send): `lib/email-notify.ts`
- Resend activity read: `lib/resend-activity.ts`
- Admin compose + rich text editor + history: `app/admin/emails/`
- Public form guard: `components/SubmitLockForm.tsx`
- Static content fallback (speakers, sponsors, events): `lib/data.ts`
- Admin submission tables: `app/admin/SubmissionsTable.tsx`

## Writing style

User preference: **no em or en dashes** in copy or docs. Use commas, colons,
or full stops. Applies to email copy, UI text, content, and these files.
