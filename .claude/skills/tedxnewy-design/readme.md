# TEDxNewy Design System

The public-facing design system for **TEDxNewy**, an independently licensed TED
event held on Awabakal and Worimi Country in Newcastle, New South Wales. TEDxNewy
is run by **Newcastle Ideas Network Limited**, is not-for-profit and 100%
volunteer-run, and was formerly TEDxCooksHill.

Warm, editorial, ideas-forward. Cream and near-black as the default palette with
a single confident red as the only accent, deep maroon reserved for the most
premium dark sections. Bricolage Grotesque throughout. Every interactive element
is a soft pill with a gentle lift on hover; every card is a plain white rounded
rectangle with a hairline border. Motion is understated: fades and gentle rises,
one easing curve, nothing flashy. The voice is warm and plainspoken, never
corporate or salesy. This is a community-run TEDx event, not a startup.

> **Two brand systems, kept separate.** The cream-and-ink system documented here
> is the **website** system (tedxnewy.com.au). Anything off the website (print,
> slides, signage, social, email) follows the **official TEDx rules**: TED red,
> black and white, set in Arial or Helvetica. Do not use the website palette or
> Bricolage Grotesque in place of the official identity.

## Sources this was built from

Nothing here is invented. Values were read from:

- **GitHub: [github.com/Zumihair/TEDxNewy](https://github.com/Zumihair/TEDxNewy)** (branch `main`). The live Next.js
  site. Primary sources: `app/globals.css` (tokens, button and card classes,
  keyframes), `app/layout.tsx` (font loading, org metadata), `app/page.tsx`
  (homepage sections), `components/*.tsx` (the component inventory),
  `lib/nav-fallback.ts` (header structure), `public/brand/*` and `public/images/*`
  (assets), `public/llms.txt` (site map and positioning).
  Worth exploring further before any substantial work: the repo's own
  `CLAUDE.md` and `README.md` are unusually detailed design and content briefs,
  and the `app/signal`, `app/events/[slug]` and `components/team-brand` trees
  hold surfaces this system does not yet cover.
- **Attached codebase `Website/`** (the TEDxNewy asset library, not code). Read:
  `Assets/_source/01_web_brand.md`, `03_typography.md`, `04_colour.md`,
  `05_language.md`. Also contains the official rules quick reference, the logo
  usage guide, photography brief, org facts, and the raw source photography that
  the site's optimised images were made from.
- **Brand notes supplied in the brief** (button variants, card treatment, section
  accent, the two surface modes, the carousel pattern, the doodle layer, grain).

This skill lives inside the site's own repo, so nothing needed copying: every
guideline, component preview and UI kit screen links straight to the real
files in `public/` (logos, social icons, fonts, event and speaker
photography). A standalone `assets/` copy would only drift the moment a photo
changed there and not here.

## Index

| Path | What it is |
|---|---|
| `styles.css` | The one entry point consumers link. `@import` lines only. |
| `tokens/` | `colors`, `typography`, `spacing`, `radii-shadows`, `motion`, `fonts`, `base`, `patterns` |
| `components/` | React primitives, grouped by concern (see below) |
| `guidelines/` | Foundation specimen cards (colour, type, spacing, brand) |
| `ui_kits/website/` | Click-through recreation of tedxnewy.com.au |
| `../../../public/` | Logos, social icons, fonts, event and speaker photography — referenced directly, not copied |
| `SKILL.md` | Agent Skills front matter, for use in Claude Code |
| `github.md` | Source repo association and screen map |

### Components

Grouped by concern. Every component has a sibling `.d.ts` (props) and
`.prompt.md` (what and when, with an example).

**`components/core/`** `Button` · `CircleArrowLink` · `Pill` · `SectionKicker` ·
`RedCircle` · `EditionStamp` · `Icon`

**`components/cards/`** `Card` · `PastEventCard` · `SpeakerCard` · `EventRow` ·
`ParticipateCard` · `PhotoPending` · `Stat`

**`components/forms/`** `FormField` · `SubscribeForm`

**`components/feedback/`** `FaqAccordion` · `CountdownClock`

**`components/navigation/`** `SiteHeader` · `SiteFooter` · `PageHero` ·
`SpeakerCarousel`

**`components/motifs/`** `NodeNetwork`

**Intentional additions.** Two components have no single file of their own
upstream: `Icon` (a thin wrapper over the Lucide glyphs the site imports as
`lucide-react`, so consumers get the same icons without a package) and
`ParticipateCard` (the photo-and-scrim card defined twice inline upstream, as
`ParticipateHomeCard` in `app/page.tsx` and `PanelCard` in `components/Nav.tsx`).
`SubscribeForm` likewise lifts the newsletter row that lives inline in
`app/page.tsx`.

**Not covered.** The `Scribble` doodle layer (hand-drawn SVG paths that draw
themselves in on scroll) is documented below but not rebuilt, because its paths
are bespoke artwork rather than a pattern. Also out of scope: the admin CMS
(`app/admin`, 146 files), the team brand portal (`components/team-brand`), and
the email and newsletter render pipeline.

**Token accuracy, checked 2026-08-25.** Every value across `tokens/*.css` was
grepped against the live `app/`, `components/` and `lib/` trees rather than
taken on trust. All but two checked out as real, recurring values in the
codebase (not always named there — a lot of this palette exists only as
repeated hex literals, which is exactly what these tokens are for). The two
exceptions are marked `@status: proposed` inline where they're defined:
`--cream-bar` (`tokens/colors.css`) and `--shadow-panel-dark`
(`tokens/radii-shadows.css`). Treat those two as suggested, not existing,
until a real component uses them.

---

## Content fundamentals

**Voice.** A confident, curious local with something worth sharing. Warm, direct,
never corporate. Plain over polished: short sentences, real words. Local and
proud (Newcastle, the Hunter, Novocastrians). Inviting, not gatekeeping. And the
ideas are the hero, not the organisation.

**Real examples from the site and guides**

- "Ideas that refuse to sit still." (home hero)
- "Ideas worth spreading, from Newcastle" (positioning line)
- "Ideas change everything." (footer)
- "Know someone who should be heard?"
- "Our best talks don't come from LinkedIn bios."
- "It takes a village. Yours, ideally."
- "TEDxNewy is built by Novocastrians, for Novocastrians. Pick a way in."
- "Six crews, year-round roles. No experience needed, just reliability and curiosity."
- "Here's what we've built together so far."

**House style, non-negotiable**

- **No em dashes or en dashes.** They read as machine-written and are not the
  house style. Rewrite, or use a comma, a full stop, or brackets. Hyphens inside
  compound words are fine. (A middot `·` is used freely as a separator in meta
  lines: "30 April 2026 · Q Building, Honeysuckle".)
- **Australian English.** Organise, colour, recognise, programme (except the TEDx
  "program" in the official sense).
- **Sentence case for headings.** Always. Title Case reads corporate.
- **Numbers:** spell out one to nine, figures for 10 and above.
- **Second person.** Address the reader as "you"; the organisation is "we". Never
  "users" or "attendees" when "you" will do.
- **No emoji.** Anywhere. Not in copy, not in UI, not in social captions.
- **Stats stay honest.** The homepage band says "5 events", "since 2024",
  "100% volunteer-run". Do not inflate or invent numbers.

**Licence rules that are also copy rules**

- The brand is **TEDx**; the event is **TEDxNewy**, one word. Never TED-x, TEDX,
  TedX, Tedx, or "TEDx Newy" in body copy. The one exception is X/Twitter, where
  "TEDx Newy" is used so posts are searchable.
- Never place the logo inside a sentence. Type the word TEDx.
- Wherever the logo appears, the tagline "x = independently organized TED event"
  appears with it.
- Outward-facing material carries the independence line: "This independent TEDx
  event is operated under licence from TED."
- Longer material and the website carry a short "What is TEDx" explainer.
- **Acknowledgement of Country**, approved wording, in the footer of every page:
  "TEDxNewy is staged on the land of the Awabakal and Worimi people. We pay our
  respects to Elders past, present and emerging, and acknowledge their continuing
  connection to land, waters and culture. Sovereignty was never ceded." Short
  form for tight spaces: "An independently licensed TED event on Awabakal and
  Worimi Country."

**Microcopy patterns.** CTAs are verbs in the reader's interest: "Get tickets",
"See how it went", "Nominate a speaker", "Learn more", "Read more", "Watch
talks", "View Salons", "Start a conversation". Event meta is always
`date · venue`. Absent content is named, never left blank: an event without
photos says "Photos coming soon"; a nav item without a page carries a "Coming
soon" pill.

---

## Visual foundations

### Colour

Two surface modes, and only two.

**Cream and ink (the default, for every page).** Page background `--cream`
`#f4efe6`, alternate bands `--cream-light` `#f9f5ec`, body text `--ink-2`
`#2a2521`, headings `--ink` `#141210`, captions `--ink-3` `#6b6459`, faint
`--ink-4` `#8a8278`. Cards are pure white on top of cream.

**Dark (a small set: `/`, `/signal`, past flagship event pages).** Hero and
closing sections on `--red-deep` `#2a0604`, mid sections on `--red-section`
`#3d0a05`, the footer on `--ink` `#141210`. Text is white; body copy at 70 to
85% white; kickers use blush red `--red-blush` `#ff9b8f`. These pages exist to
feel premium and flagship. Everything else stays light.

**One accent.** Red `--red` `#e02214` for actions and accents, `--red-mid`
`#b91404` as its hover and for inline links, `--red-bright` `#ff3626` for glow
and live indicators, `--red-dark` `#8c0d05` in gradients. There is exactly one
solid red band on the homepage (the stats), and it is white-on-red. No second
accent hue exists: the coast blue and amber appear only as pill tints and
photo-panel gradients.

**Official TED red** `#e62b1e` (Pantone 485) is a separate token, for official
TEDx material only.

### Type

**Bricolage Grotesque**, one variable family for everything, with an optical size
axis. The TTF is at `public/fonts/`; the live site loads the same family from
Google Fonts. No monospace face is shipped: the "mono" role (kickers, eyebrows,
labels) is the same face, uppercase, at 0.22 to 0.28em tracking.

- **Hero:** `clamp(3.5rem, 12vw, 11rem)`, weight **400**, tracking `-0.035em`,
  line height 0.96.
- **Section headings:** `clamp(2.5rem, 5vw, 4rem)`, weight **500**, tracking
  `-0.025em`, line height 1.02, `font-variation-settings: "opsz" 144`.
- **Card and row titles:** `clamp(1.5rem, 2.4vw, 1.85rem)`, weight 500, tracking
  `-0.02em`, `"opsz" 96`.
- **Body:** fixed pixel sizes, not rem: lead 17.5px/1.7, body 16.5px/1.65, small
  14.5px/1.55, meta 13.5px, caption 12.5px.
- **Kickers:** 10.5px, weight 600, uppercase, 0.22 to 0.28em tracking.
- **Numerals:** tabular figures, `-0.04em` tracking; a stat's suffix (`%`, `+`)
  drops to the section's darker colour so the figure carries.
- `text-wrap: balance` on headings, `pretty` on paragraphs.

Off the website: **Arial** for everything. (The team's automated social-tile
tooling uses Plus Jakarta Sans internally; that is a tooling detail, not a brand
face, and those binaries are deliberately not copied here.)

### Layout

Containers: 1440px for nav and footer chrome, **1240px** for sections, 1100px for
page heroes and prose, 760px for forms and closing sections. Gutters 20px on
mobile, 40px from desktop. Section padding 96px mobile, 128px desktop; the accent
and stat bands run tighter at 80 to 96px. Card gaps 20px mobile, 28px desktop.
Asymmetric editorial grids are common: `4fr / 8fr` for a heading beside its
paragraph, `1.05fr / 1fr` for copy beside a photo panel.

The header is fixed, transparent at the top of a dark hero, and lifts to an
opaque cream bar with `blur(20px) saturate(140%)` once scrolled. It retreats on
scroll down and returns on scroll up. A page-level promo banner can push it down
by publishing `--banner-offset`.

**Card rows are a pattern, not a one-off.** Any row of three or more cards
(speakers, past events, galleries, participate) is a snap-scrolling swipe
carousel on mobile, with a card bleeding to the screen edge so the next one peeks
in, and a grid from tablet up. A slim scrollbar appears from `md` where there is
no swipe gesture.

### Surfaces, borders, radii

- **Cards:** white fill, **8px** radius, 1px hairline border
  `rgba(20,18,16,0.08)`. On hover they lift 2px and gain
  `0 8px 40px rgba(20,18,16,0.08)`. No coloured card fills, no left-border accent
  stripes, no heavy borders.
- **Photo panels:** 12px (`--radius-md`) for rows and tiles, 24px
  (`--radius-lg`) for feature panels and past-event cards.
- **Form fields:** 16px radius, white fill, `rgba(97,74,68,0.13)` border, and a
  3px `rgba(230,43,30,0.2)` focus ring.
- **Everything interactive:** 999px pill.
- **Dividers:** hairline `rgba(20,18,16,0.08)`, warm rules at 0.13, and a 1.5px
  dashed variant at 0.18 for softer breaks. On dark, `rgba(255,255,255,0.10)`.
- **Shadows are warm-tinted and soft**, never neutral grey or tight. `sm`
  `0 2px 8px rgba(20,18,16,.04)`, `md` `0 6px 24px .06`, `lg`
  `0 18px 60px .10`. The red circle CTA carries its own glow
  `0 8px 26px rgba(224,34,20,0.35)`. Dark panels use a long drop,
  `0 30px 80px -30px rgba(0,0,0,0.7)`.
- **Section accent:** a 48x3px rounded red bar under section labels.

### Backgrounds and imagery

Flat colour fields, not gradients, with three deliberate exceptions: the
cursor-following **radial spotlight** on the home hero, a static radial glow
behind dark card sections, and the **kind gradients** that sit behind event
photography (navy for flagship, deep navy for salon, teal for special, brand red
for anything awaiting photos). No full-page background images; photography is
always framed inside a rounded panel or a card, never bled behind text.

A **grain overlay** is available on any colour field: SVG fractal noise at 5%
opacity, `multiply` on cream, and `screen` at 10% on dark. It is on the footer,
the home hero and the dark card sections.

Photography is warm and documentary: real rooms, real Novocastrians, ambient
light, no stock. Photos under text are dropped to 0.65 opacity behind a
`rgba(0,0,0,0.10) to 0.65` bottom scrim so white type always reads. Hover zooms a
photo 3% over 700ms.

The **node network** motif (drifting dots and connecting lines, per-node pulse)
is the one ambient animated background, used on dark flagship and salon sections.
A **60-second soundwave** motif and the **hand-drawn scribble layer** (underlines,
sparks, arrows and stars that draw themselves in on scroll, with a tiny idle
drift) are event-specific accessories. The scribbles are the one place the brand
leans overtly playful, used on youth and community recap content only, and on
invitation.

Transparency and blur are used sparingly and only for chrome: the header bar, the
hero ticker strip (`rgba(0,0,0,0.15)` plus a small blur), and modal scrims. Never
as decoration on content.

### Motion

**One easing curve does nearly everything:** `cubic-bezier(0.22, 1, 0.36, 1)`,
at 300ms for interaction and 260ms for panels.

- **Entrances:** `rise`, opacity 0 to 1 with `translateY(24px)` to 0 over 950ms,
  staggered in 120ms steps (`.rise-d1` to `.rise-d6`).
- **Hover:** buttons shift colour and lift `-1px`; cards lift `-2px` and gain a
  shadow; the red circle CTA slides 4px right and darkens; photos zoom 3%; a row
  title draws a red 1px underline left to right over 500ms.
- **Press:** there is no separate press state. The hover colour holds. Nothing
  shrinks or scales down on click.
- **Focus:** a 2 to 3px red ring at 20 to 40% opacity, offset from the element.
- **Ambient:** the node network drifts 32s, nodes pulse 7s, the edition stamp
  rotates 28s, a live dot uses a soft 2s ping, and a sticky ticket CTA
  double-bounces once every 4s rather than animating continuously.
- **Reduced motion** is respected globally. Two narrow, deliberate exemptions
  exist upstream: the scribble draw-in, and in-place opacity and height reveals
  (FAQ rows, quote swaps). Anything that travels, scales, parallaxes or flashes
  stays suppressed. Do not widen that list.

---

## Iconography

**Lucide** (lucide.dev) is the icon set. The site imports `lucide-react`; this
system ships the glyphs it actually uses through the `Icon` component, at
Lucide's own 24x24 geometry, 2px stroke (2.25 inside red circle CTAs, 1.75 for
quiet placeholder glyphs), round caps and joins. Sizes in use: 14px inline, 16px
in buttons and CTAs, 18 to 20px standalone. Icons take `currentColor`.

Glyphs actually in use: `arrow-right` (the workhorse, in every CTA and circle
button), `arrow-up-right` (outbound and "read more"), `chevron-down` (nav and
accordion), `chevron-left` / `chevron-right` (carousel controls), `menu` and `x`
(mobile drawer and modals), `image` (photo-pending placeholder), plus
`calendar`, `map-pin`, `play` and `mail` on event pages. If you need a glyph that
is not in `Icon.jsx`, add it from lucide.dev rather than drawing one.

**Brand and social marks are raster or vector files, not icon-font glyphs.**
`public/brand/social/` holds white Instagram, LinkedIn and TikTok marks for the
dark footer, and red Instagram and LinkedIn marks for white backgrounds such as
the email signature. The footer wraps each in a 36px circle with a
`rgba(255,255,255,0.15)` hairline border. `public/brand/` and `public/brand/lockups/`
hold the horizontal TEDxNewy lockup in black (for light backgrounds) and white
(for dark), plus the Standard, Salon and Youth event lockups as SVG in both
colourways.

**No icon font. No emoji, ever. No unicode characters standing in for icons**,
with one exception: the middot `·` as a separator in meta and kicker lines.

**Logo rules** (from the official guide): place on white, black, or a darkened
photo only. Never recolour outside red, black and white. Keep clear space. Never
rebuild the mark in another font, and never set it inside a sentence.

---

## Using this system

Link one file:

```html
<link rel="stylesheet" href="styles.css">
```

Then reach for the components. The pill button, the white card, the red
circle-arrow CTA, the kicker, and the two surface modes will carry almost any
new page on their own. Build strictly from these tokens and patterns rather than
introducing new colours, radii or button shapes: the goal is that anything
designed here could be dropped into the live site without looking out of place.
