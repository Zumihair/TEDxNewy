# TEDxNewy Admin Design System

The design system for **TEDxNewy's internal admin** — the back office a small team (COO, licensee/CEO, a couple of full admins) uses daily to run events, content, email, partnerships and socials.

This is **not** the public site's design system. The public site at [tedxnewy.com.au](https://tedxnewy.com.au) is warm, cream, pill-shaped and photographic. The admin shares its ink, its red and its typeface, and almost nothing else: it is dense, fast and utilitarian. Compact tables, clickable rows, icon buttons, tight spacing — never big friendly cards.

TEDxNewy is an independently licensed TED event on Awabakal and Worimi Country in Newcastle, Australia, run by Newcastle Ideas Network Limited.

## Sources this was built from

| Source | What was read |
|---|---|
| Local codebase `Website/TEDxNewy` (Next.js 16 · React 19 · Tailwind v4 · Supabase) | `app/globals.css` (all tokens), `app/admin/*` (every shared primitive), `app/layout.tsx` (font), `public/brand/*` (logos) |
| GitHub — [github.com/Zumihair/TEDxNewy](https://github.com/Zumihair/TEDxNewy) | Repo structure and branch (`main`). The same code as the local mount. |
| `Website/TEDxNewy/CLAUDE.md` and `README.md` | The house rules quoted throughout this document — the admin's conventions are written down there in detail, including *why* each one exists. |
| `Website/Assets/` (brand asset library, 9 numbered folders) | Not opened in depth; the logo lockups mirrored into `public/brand/lockups` were the assets needed here. |

**Explore those repositories further** — `CLAUDE.md` in the repo root is unusually thorough and records the reasoning behind nearly every UI decision in this system. Read it before changing a pattern.

## The products

One product surface is covered here: the **admin back-end** (`/admin`). The public marketing site is a separate surface and is deliberately out of scope — see the note at the top.

The admin's five areas, each with its own colour identity:

| Section | Colour | Areas |
|---|---|---|
| Content | Yellow `#8a6d00` | Events, Talks, Speakers, Team, Sponsors |
| Management | Coast blue `#1f4a5c` | Partners, Media, Tickets, Documents |
| Community | Red `#b91404` | Quick email, Calendar, Socials, Newsletter |
| Settings | Green `#2f6f4e` | Notifications, Admins |
| Overview / Forms | Grey `#57534d` | Dashboard, Forms inbox |

A section's hue is used **identically** for its sidebar item, its page header accent, its section-label dot and its dashboard tile border. Route mapping is the second path segment: `/admin/events/*` → yellow, `/admin/partners/*` → coast, and anything unmapped falls back to grey.

**Every new admin section gets a full six-token set** (`ink`, `on-dark`, `chip-bg`, `chip-fg`, `border`, `border-hover`, plus `tint`) — never a one-off colour. See `tokens/sections.css`.

---

## CONTENT FUNDAMENTALS

The admin's copy is written by the person who built it, for the two people who use it. That shows, and it is the house voice.

**Australian English, sentence case, no shouting.** `Organisation`, not Organization. `Prospectus`, `enrolment`, `colour`. Headings are sentence case (`Add event`, `Who's coming to Signal`); the only uppercase is the mono caps label style, which is a *typographic* device, not emphasis.

**Second person, no first person.** Copy addresses the admin directly and never speaks as the system: *"Shown on the public sponsors page."* *"Leave blank to generate it from the title."* Nothing says "we" or "I".

**Hints explain the consequence, not the field.** A hint's job is to say what happens downstream:
- "Connected channels go out on their own within 5 minutes of it; post any unconnected channel by hand."
- "Signed off. Put a date on it and it schedules itself."
- "Internal only — never goes out with the post."
- "Notes are inert: no link to a post, newsletter or event."

**Destructive confirms name the record, say what survives, then state the consequence.** The canonical example, verbatim from `EventsTable.tsx`:
> Delete "TEDxNewy Signal 2026"? Talks and speakers linked to it are kept, just unlinked. This can't be undone.

**Empty and error states give the next action, and are allowed to name a person.**
- "No events yet. Hit Add event to create your first."
- "This feature needs a database update before it can be used. Ask Will to run the database update, then reload this page."
- "That page needs full admin access. Your account is set to community access: Quick email, Calendar, Socials and Newsletter."

That last one is characteristic: it says what went wrong *and* what the account can do instead.

**Labels are short nouns; buttons are short verbs.** `Partners`, `Documents`, `Quick email`. `Add partner`, `Save draft`, `Unschedule`, `Duplicate to drafts`, `Publish now`. Never "Submit", never "Click here".

**The dashboard greets by time of day and first name** — "Morning, Will." / "Afternoon, Will." / "Evening, Will." / "Up late, Will." (before 5am or after 10pm), computed in Sydney time. It's the one warm touch in the whole surface.

**Numbers are always framed.** Never a bare count: `61% sold · +18 this week`, `+37 this week`, `organisations on the board`, `edited 2 hours ago`. Currency is `en-AU`, no cents: `$17,640`.

**No emoji. Anywhere.** Not in labels, not in copy, not in empty states. Icons are lucide glyphs; that is the entire non-verbal vocabulary.

**Vibe:** a well-kept workshop. Direct, unfussy, quietly opinionated, occasionally dry. It assumes the reader is competent and busy.

---

## VISUAL FOUNDATIONS

### Colour

Base surface is **white cards on warm cream** (`#f4efe6`), with the public site's ink (`#141210`) for text. The sidebar is near-black (`#111`). Brand red (`#e02214`) is used **sparingly**: one primary action per screen, the active tab underline, the focus ring, the selected calendar day, and the single "feature" dashboard tile. Section hues do the rest of the colour work.

Every neutral border and fill is **ink at low alpha** — `rgba(20,18,16,0.06)` through `0.18` — never a grey hex. That is where the warmth comes from; a `#e5e5e5` border would read cold against the cream immediately.

Semantic colour is narrow: amber = draft / needs polish, blue = scheduled, green = posted / ready, red = failed or destructive.

### Type

**Bricolage Grotesque** (variable), the same face as the public site, in two registers:
- **Sans** — all UI text, weight 400 body / 500 titles and controls. Display sizes add `font-variation-settings: "opsz" 144` and tight negative tracking (`-0.02em` to `-0.035em`).
- **"Mono"** — the *same family* at 8.5–10.5px, uppercase, weight 600, tracking `0.1em`–`0.28em`. There is **no monospace face shipped**; `--font-mono` is an alias. This style carries every eyebrow, field label, badge and sidebar group heading, and it is what makes the admin look like an instrument panel.

Real sizes are unrounded and should be copied exactly: 17 / 15 / 14.5 / 13.5 / 12.5 / 12 / 11.5, and 10.5 / 9.5 / 9 / 8.5 for caps labels. Anything numeric that changes is `tabular-nums`.

### Spacing and density

Density over decoration, by explicit house style. Row padding is `14px 20px`. Cards are `20px` (`24px` for editors and metric cards). Dashboard tiles are `84px` tall in a five-across grid with a `10px` gap. Content is capped at `1100px` beside a `216px` sidebar. Prefer a compact list to a card grid; prefer clickable rows to separate action buttons; fold rare options behind a toggle rather than showing them.

### Backgrounds

Flat. No gradients anywhere except the one feature dashboard tile (`#e02214 → #b91404`, to bottom-right) and a faint red radial glow that fades in behind a hovered pulse tile. No imagery, no illustration, no texture — the public site's grain overlay and hand-drawn scribbles are **not** part of the admin. The only photography in the admin is user content (event photos in the gallery picker).

### Borders, radii, shadows

- Radii: `6px` small controls · `10px` stat chips · `12px` cards, inputs, modals · `9999px` every button and badge. Nothing else.
- Cards: 1px hairline border + `--shadow-sm` (`0 2px 8px rgba(20,18,16,0.04)`). Dashboard tiles instead take a **2px border in their section hue** and no coloured fill.
- Shadows are warm-tinted (ink at 4–10% alpha), four steps: hairline, sm (cards), md (hover), lg (the floating date picker). Modals use a heavier `0 25px 50px -12px rgba(0,0,0,0.25)`.
- **No inner shadows. No coloured left-border accent cards** — the section colour arrives via the header and the tile border, never a stripe down the side of a card.

### Animation, hover, press

One motion: **`translateY(-2px)` plus a shadow step up**, over `300ms` `cubic-bezier(0.22, 1, 0.36, 1)`, on tiles and the primary button. Colour transitions are `200ms`. Nothing bounces, nothing parallaxes, nothing scales. A toast is the same motion at a bigger amplitude: `translateY(14px)` to `0` with opacity, on the same duration and curve, and `180ms` back out.

- **Hover** on a neutral control deepens its wash (`0.06 → 0.10` alpha); on a row it tints the title to the section ink; on a tile it strengthens the border to `borderHover` and lifts.
- **Press** has no dedicated state — the pill buttons rely on hover plus the pending spinner. A submit swaps its icon for a spinner and disables itself, which is the real press feedback.
- **Focus** is a red pair: border `rgba(224,34,20,0.40)` + `0 0 0 2px rgba(224,34,20,0.20)`.
- **Loading** is always a skeleton matching the page's real layout (`--wash` bars, pulsing), never a spinner-only screen.

### Transparency and blur

Almost none. Overlays are `rgba(0,0,0,0.5)`, flat, no backdrop blur. The mobile top bar is the single exception (`bg-white/90` + `backdrop-blur-sm`). On the dark sidebar, every state is white at an alpha step (`0.04` rest chip, `0.06` hover, `0.10` active).

### Layout rules

Sidebar is `fixed`, 216px, full height, and does not scroll with content. Content is centred, max 1100px, `40px/48px` padding. Below `md:` the sidebar becomes a drawer behind a hamburger in a sticky top bar. The z-index stack is fixed and load-bearing — sidebar 30, drawer 40, chip popover 45, modal 50, dialog 60, post preview 70, date picker 80. Anything new that must sit under a preview has to clear 50, not 70.

### Status vs stage

A UI idea worth carrying into any new screen: things with a lifecycle show **two separate signals**.
- **Status** is *derived*, never picked: a post with a schedule date is Scheduled; Posted is reached by the thing actually happening. Rendered as a coloured `Badge`.
- **Stage** is *chosen* by a human — early draft / needs polish / ready to schedule. Rendered as a grouping heading (`StageHeading`) above the rows it covers, in the order ready → polish → early, so the top of the list is what could go out today.

Do not collapse these into one field. The stage picker only appears while a record is still a draft; once scheduled or sent, the content is treated as finalised.

---

## ICONOGRAPHY

**[lucide](https://lucide.dev) is the entire icon system** — `lucide-react`, imported by name (`Pencil`, `Trash2`, `CalendarDays`, `Handshake`, `Megaphone`, `Ticket`, `ShieldCheck`, `Waypoints`, `ArrowUpRight`). There is no icon font, no SVG sprite, and no bespoke icon set in the codebase.

- Stroke width: `2` for nav and body icons, `2.25` for small action icons, `2.5` for chevrons in headings.
- Sizes: `14` in row buttons, `15` in the sidebar, `16` in fields and modals, `18` in dashboard tiles.
- Nav icons are stored in `nav-config.ts` as **strings** and mapped to components per consumer, so the config stays data-only. Follow that if you add a nav item.
- **No emoji, ever.** No unicode characters used as icons. The one non-lucide glyph is the `·` middle dot used as a separator in meta lines.

Because this design system runs in the browser without a bundler, lucide is loaded from CDN (`unpkg.com/lucide@0.544.0/dist/umd/lucide.min.js`) and wrapped by `Icon` — **an intentional addition**, see below. Same icon set, same names, same stroke weights as the codebase.

### Brand assets

This skill lives inside the site's own repo, so it links straight to the real
lockups at `public/brand/`: the Standard lockup in black, white and mono
(SVG), plus the two horizontal PNGs the app itself uses. Salon and Youth
lockups exist in the workspace asset library in the same three colourways.
Font binary: `public/fonts/BricolageGrotesque.ttf`, the exact variable TTF the
site ships.

TEDx logo rules apply and are not negotiable: place on white, black or a darkened photo only; never recolour outside red / black / white; keep clear space; never rebuild in another font. Full rules live in `public/brand/README.md` and the Logo Usage Guide in the workspace asset library.

---

## Components

Grouped by concern, all in `components/`. The inventory mirrors the shared primitives in `app/admin/` — nothing here was invented to round out a "standard set".

**`components/core/`**
- `Button` — the pill button (primary, secondary, danger, ghost, dark, row) with a pending state
- `IconButton` — icon-only round action, the house pattern for repeated row actions
- `Badge` — derived lifecycle status pill
- `Card` — white card on cream
- `Toast` — the result of an action, risen from the bottom edge (success / error / warning)
- `Flash` — inline banner for a standing notice, NOT an action result (ok / info / error)
- `StatChip` / `StatChipGrid` — metric tiles in a grid
- `TabBar` — the single underline tab row
- `NotSetUp` / `EmptyState` — dashed sunken panels
- `PageSkeleton` / `SkeletonBar` — skeleton loading states
- `Icon` — lucide-by-name wrapper *(intentional addition)*

**`components/chrome/`**
- `PageHeader` — section-coloured page header
- `SectionLabel` — sub-heading with a section-coloured dot
- `SidebarNav` — the near-black grouped sidebar
- `DashboardTile` — family-hued dashboard tile
- `PulseTile` — live-number stat tile with optional progress bar
- `StageHeading` — stage grouping heading for draft lists

**`components/forms/`**
- `Field` — mono caps label + control + hint/error
- `Input` / `Textarea` / `Select` — the form controls
- `AdvancedToggle` — folds rare options away
- `DateTimePicker` — the custom calendar; native date inputs are never used

**`components/feedback/`**
- `Modal` — trigger + portalled overlay, the standard add-a-record flow
- `ConfirmDialog` — every destructive action; never `window.confirm`
- `PromptDialog` — single-field prompt

**`components/data/`**
- `DataList` / `DataRow` / `RowMeta` — dense clickable rows, the default list/table

### Intentional additions

- **`Icon`** — the codebase imports lucide components directly, which a bundler-less browser can't do. This wrapper takes the same lucide names and renders from the UMD global, so cards and kits use identical icon names, sizes and stroke weights.
- **`EmptyState`** — the "no rows yet" panel is written inline in several pages (`EventsTable`, others) rather than shared. Factored out here because every list needs it.
- **`AdvancedToggle`** — the "fold rare options behind a toggle" rule is house style applied ad hoc in the codebase; given a component so new screens get it for free.

### Not recreated

Deliberately out of scope, and documented rather than approximated: the block email editor (`app/admin/_blocks/`), the Creative Studio, `GalleryPicker`, the calendar's drag-to-reschedule, the socials run sheet and per-channel caption editor, and `SubmissionsTable`. If you need one, read the source — these are large, stateful and specific.

**Token accuracy, checked 2026-08-25.** Every value across `tokens/*.css` was
grepped against the live `app/admin/`, `components/` and `app/globals.css`
rather than taken on trust — including values that looked like they might be
Tailwind default utilities (`shadow-modal` turned out to be Tailwind's
built-in `shadow-2xl`, not a custom literal) or expressed as arbitrary
Tailwind classes rather than named constants. Every single one checked out as
a real, recurring value in the codebase. Nothing here is aspirational.

---

## Index

| Path | What it is |
|---|---|
| `styles.css` | The one stylesheet consumers link. `@import` list only. |
| `tokens/fonts.css` | `@font-face` for Bricolage Grotesque |
| `tokens/colors.css` | Base palette, ink scale, hairlines, semantic aliases, status colours |
| `tokens/sections.css` | The five section hues, six tokens each, plus `[data-section]` scopes |
| `tokens/typography.css` | Type scale, tracking, weights, display variation |
| `tokens/spacing.css` | Spacing steps, dense defaults, layout and modal widths |
| `tokens/effects.css` | Radii, shadows, motion, the z-index stack |
| `tokens/base.css` | Body reset, link colours, selection |
| `components/` | The reusable primitives, grouped by concern (see above) |
| `guidelines/` | 21 foundation specimen cards — colours, sections, type, spacing, brand, motion |
| `ui_kits/admin/` | Click-through recreation of the admin: dashboard, events, socials, calendar |
| `../../../public/brand/` | Real lockups (SVG + PNG), black / white / mono — referenced directly, not copied |
| `../../../public/fonts/` | `BricolageGrotesque.ttf` — referenced directly, not copied |
| `thumbnail.html` | Homepage tile |
| `SKILL.md` | Agent Skills entry point |
| `github.md` | Source-repo association for one-click sync |

No font substitution needed — the real variable TTF is one link away, at `public/fonts/`.
