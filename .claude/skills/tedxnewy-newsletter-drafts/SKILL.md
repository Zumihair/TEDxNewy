---
name: tedxnewy-newsletter-drafts
description: Create DRAFT newsletter campaigns for /admin/newsletter/campaigns from a brief (images, buttons, dividers, columns), as an SQL file that you apply to Supabase yourself. Use whenever asked to write, draft or prepare any TEDxNewy newsletter or email campaign (event news, announcements, thank-yous, recaps, speaker or partner features, calls to action, updates for subscribers, ticket holders or any other group), not only ticket-holder emails.
---

# Creating newsletter drafts

Drafts are written as code, validated against the real block schema, and
turned into one idempotent SQL file. Since 2026-10-28 sessions can write to
the live database through the `supabase-tedx` MCP, so run the SQL with
`execute_sql` and read it back. Drafts land as `status draft`, `stage early`,
no schedule: they cannot send.

## Steps

1. **Read the brief.** Who is it for (`audience`: `subscribers`,
   `ticket-purchasers` or `subscribers-not-ticket-purchasers`), what is the
   one thing it should get the reader to do, which facts are involved.
2. **Check the facts** before writing them, from whatever the brief is
   about. For the current event, agenda and event details are in
   `lib/signal-content.ts` and `app/signal/page.tsx` (ticket tiers, FAQ),
   partners in `lib/signal-links-partners.ts`, the Event Week Guide in
   `app/signal/links/GuideGallery.tsx`; for other topics use the matching
   page, CMS code or the folders under `1. Business/TEDx/`. Never invent a time, price, venue
   or offer. If a fact is unknown, leave it out and tell Will.
3. **Images** must be absolute public URLs. Put files in
   `public/images/newsletter/` (JPG or PNG, 1200px wide is plenty; email
   clients cannot show WebP reliably) and reference them as
   `img("file.jpg")`. They only exist for readers once deployed to `main`.
   Placeholders are fine: use an existing photo from `public/images/` and
   say so. Images already uploaded in the admin (Supabase storage) can also
   be used and cropped with the block's `ratio`; static files are not
   cropped, so pre-crop them.
4. **Write `scripts/newsletter-drafts/drafts/<slug>.mts`**, default-exporting
   a `Draft` built with the helpers in `scripts/newsletter-drafts/dsl.mts`
   (`header`, `text`, `image`, `button`, `divider`, `columns`, `video`).
   Copy any existing file in `drafts/` as the pattern.
5. **Build:** `npx tsx scripts/newsletter-drafts/build.mts <slug>` (or no
   argument for all). It fails on an em or en dash and on blocks the editor
   would drop. It writes `supabase/migrations/<date>_newsletter_drafts_*.sql`.
6. **Deploy** the images: commit only this task's files and push to `main`
   without asking (Will's standing OK for draft content), then curl each image
   URL for 200. Apply the SQL via the MCP and verify. Re-running is safe: a draft whose title already
   exists is skipped, so edits made in the admin are never overwritten. To
   regenerate one, delete it in the admin first.
7. Tell Will every fact you could not verify, and where each button goes.

## Block cheat sheet

- `header(id, text, { size: "lg" | "md", align })`: lg once at the top, md
  for sections.
- `text(id, html)`: rich text. Only `<p>`, `<strong>`, `<em>`, `<a href>`,
  `<ul><li>`, `<br>`. The last paragraph's bottom margin is trimmed
  automatically.
- `image(id, src, alt, { width: 40|60|80|100|"full", ratio, href })`. `full`
  runs edge to edge (ignored if the block has a `bg`). `ratio`: `square`,
  `5:4`, `4:3`, `16:9`, `banner`, `portrait` (Supabase-hosted images only).
- `button(id, label, href, { theme: red|redDeep|ink|gradient, variant:
  solid|outline, align })`: one solid red primary per email, secondary
  actions `ink` outline.
- `divider(id, "thin"|"accent"|"short"|"x", "soft"|"ink"|"red")`.
- `columns(id, [[child...], [child...]], { ratio: "50-50"|"33-66"|"66-33"|
  "40-60"|"60-40" (three columns: "33-33-33"|"25-50-25"|...), valign })`.
  Children: `cText`, `cImage`, `cButton`. Columns stack on phones.
- Optional `bg: "cream"|"sand"|"blush"|"stone"` on text, header, image,
  button and columns for a tinted box.
- `video(id, href, thumbnailSrc, caption)`.

## House rules

- Voice: warm, plain, local. Contractions are fine. Short paragraphs, lead
  with the point. Sign off "Will and the TEDxNewy team" (list mail) or "Will".
- **Never use em or en dashes.** Rephrase, and use "to" for ranges.
- Facts live in the site code, not memory. For example, Signal is Saturday
  24 October 2026, Conservatorium of Music, doors 1:30pm. Always re-check,
  since dates and details change.
- Footer, unsubscribe and logo are added by the renderer. Do not add them.
- Draft only. Never schedule or send from here.
