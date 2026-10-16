TEDxNewy is an independently licensed TED event on Awabakal and Worimi Country in Newcastle, NSW, run by Newcastle Ideas Network Limited. This system is the brand as it should be, not as the current code happens to be: one palette, two typefaces, one scale and a small set of parts for the site, the admin, emails, documents, the brand hub and every future programme. Where the current site differs, the system wins.

## The idea

**Ideas worth spreading, from Newcastle.** Clean white pages, black type and one red dot that tells you where to look. Maroon for the big moments. Real people, lots of room.

- **One red, exactly TED red.** `red` (#E62B1E) is never tinted or swapped. It marks the most important thing in view: the action, the live moment, the chosen option, the TEDx x.
- **White first.** Every page, card, form, email and document is white. Cream is a single quiet tint for grouping, never a page colour behind red.
- **Maroon for flagship.** Heroes, flagship events and promos go dark: maroon and ink.
- **Pills for anything you press.** Rounded panels for anything you look at.
- **Headings speak for themselves.** No eyebrows, kickers or accent bars above headings, anywhere.

Kept from today's site: TED red, maroon flagship sections, Bricolage Grotesque, the pill button, photo panels with a scrim, the swipe-to-grid card rows and the programme motifs. Everything else has been simplified.

## Two voices

| | Brand voice | Product voice |
|---|---|---|
| Typeface | Bricolage Grotesque (`display`) | Inter (`ui`) |
| Where | The public site, posters, event graphics, the cover of a deck, the brand hub headlines | Admin, email, documents, reports, prospectus, slide body, share cards, forms everywhere |
| Wrap | `.voice-brand` | default (or `.voice-product`) |
| Headings | Weight 500, tight tracking, optical size 144 | Weight 600, snug tracking |

Components follow the voice they sit in: the same `Button` is Bricolage on the site and Inter in the admin. Fields, badges, charts and tables are always Inter. The TEDx logo is artwork, never set in either.

## Content fundamentals

**Voice.** A confident, curious local with something worth sharing. Warm, direct, plainspoken; never corporate or salesy. In the product voice: the same person talking to busy colleagues, brief and occasionally dry.

> Ideas that refuse to sit still.
> Our best talks don't come from LinkedIn bios.
> Delete "TEDxNewy Signal 2026"? Talks and speakers linked to it are kept, just unlinked. This can't be undone.

**Rules everywhere.**

- No em or en dashes. Use a comma, a full stop or brackets. The middot `·` separates meta: `24 October 2026 · Conservatorium of Music`.
- Australian English. Sentence case for every heading, button, label and segment. The only uppercase is inside badges.
- "You" for the reader, "we" for TEDxNewy. The product never says "I".
- No emoji, anywhere.
- One to nine in words, 10 and up as figures. Numbers are framed and honest: `61% sold · +18 this week`. Currency `$17,640`.
- Buttons are verbs in the reader's interest: Get tickets, Nominate a speaker, Add partner. Never Submit, never Click here.
- Hints explain the consequence. Empty states name what is missing and the next step. Destructive confirms name the record, say what survives, then the consequence.

**Licence rules.** The event is **TEDxNewy**, one word. Never place the logo inside a sentence. The tagline "x = independently organized TED event" travels with the logo. Outward material carries "This independent TEDx event is operated under licence from TED." Every footer carries the Acknowledgement of Country: "TEDxNewy is staged on the land of the Awabakal and Worimi people. We pay our respects to Elders past, present and emerging, and acknowledge their continuing connection to land, waters and culture. Sovereignty was never ceded."

## Colour

Three small sets.

### Core

| Role | Tokens |
|---|---|
| Accent | `red` (TED red, exact); `red-dark` for its hover and any red text under 24px |
| Dark | `maroon` and `ink`; `blush` for links and small accents on them |
| Text | `ink` headings, `charcoal` body, `stone` secondary, `ash` disabled and chart labels |
| Surfaces | `white` (default), `cream` (the one tint) |
| Lines | `line`, `line-strong`, `line-inverse` (ink or white at alpha) |
| Overlays | `scrim`, `text-inverse-muted` |

**Four surfaces.** `white` is the default for every page and every product surface. `maroon` is for heroes, flagship sections and promos; `ink` for the footer, the admin rail and video wells. `cream` is a tint, not a page:

- **Use cream for:** alternate bands on long site pages, grouping panels (`Card tint`, empty states, board columns), image placeholders and skeletons, row hover, and the track of segmented controls and meters.
- **Never use cream for:** a page background in the admin, email or documents; anything behind red; anything behind a form.

**Red on white.** TED red on white is 4.4:1. Use `red` for fills (accent buttons, the active switch, meters, chart highlights), for icons and for text from 24px. Smaller red text and links are `red-dark`. On maroon and ink, small accents are `blush`.

### Signal

For anything that reports state: toasts, badges, banners, icons. Each hue has a bold fill, an ink for text and icons, and a tint.

| Hue | Means |
|---|---|
| `success` green | done, confirmed, posted, ready |
| `warning` amber | needs attention, draft, waiting |
| `info` coast blue | scheduled, live, for your information |
| `danger` (`red-dark`) | failed, destructive, sold out, closed |
| neutral | past, archived |

Bold fills take ink text (white on danger). State is never colour alone: every badge, toast and banner carries a word and an icon.

### Data

`chart-1` (red), `chart-2` (blue) and `chart-3` (amber) are validated together for colour-blind separation and 3:1 on white; `chart-other` (ash) is for context, last year and targets. One series is always red. Four or more series fold into "Other". Signal colours never stand in for data series.

### Gradients

Four, all from the core: `grad-brand` (maroon to red, the house gradient and every "waiting for photos" panel), `grad-night` (ink to maroon), `grad-scrim` (over any photo carrying text) and `grad-glow` (red light behind a hero or a big number).

## Type

One scale of ten sizes, `text-xs` 12 to `text-6xl` 120, for both voices.

- **Brand voice:** `hero` (one per page), `display`, `h1`, `h2`, `h3`, `lead`, `body`, `meta`, `small`. Display sizes are fluid; each style's note gives its clamp. Optical size 144 for display, 96 for h2 and h3.
- **Product voice:** `ui-title`, `ui-heading`, `ui-subheading`, `ui-body` (email, docs), `ui-body-sm` (admin default), `ui-caption`, `ui-label`, `ui-numeral`.
- Three weights: 400, 500, 600. Numbers that change are tabular. Headings balance, paragraphs `pretty`. Reading width is `container-text`.
- **Section openings:** a heading, then optionally a `meta` line in `red-dark` (date and place), then an intro. Nothing above the heading. Long editorial pages may separate sections with a full-width ink rule instead.

## Space and layout

- One spacing scale on a 4px base: `space-1` 4 to `space-32` 128.
- Rhythm: `space-2` between related controls, `space-4` default gap, `space-6` card padding and gaps, `space-12` between a heading and its content, `space-16` (product, mobile site) or `space-24` (site desktop) between sections.
- Containers: `container-wide` (nav, footer), `container` (site sections, admin content), `container-text` (prose, forms, email, documents). Gutters `space-6` on mobile, `space-12` from desktop.
- Three or more cards in a row scroll-snap on mobile and grid from tablet.

## Shape and depth

- **Four radii.** `radius-sm` 8 (thumbnails, icon tiles, chart bars), `radius-md` 12 (cards, banners, toasts, modals, textareas), `radius-lg` 24 (media cards, feature panels), `radius-pill` (buttons, inputs, selects, segments, switches, badges).
- **Borders** are 1px `line`. No thick borders, no coloured edge stripes, no inner shadows.
- **Four shadows:** `shadow-sm` (cards on cream, switch thumbs), `shadow-md` (hover, popovers), `shadow-lg` (modals, toasts), `shadow-red` (glow under red on hover).
- **Glass** (`blur-glass`) only behind the scrolled site header. No grain or texture.

## Motion

`ease-out` to enter or respond, `ease-in` to leave, `ease-in-out` for ambient loops. `dur-fast` 150ms, `dur-base` 300ms, `dur-slow` 600ms, `dur-reveal` 900ms.

1. **Hover:** buttons and link cards lift 2px with `shadow-md`; colour shifts over `dur-fast`; photos zoom 3%.
2. **Enter:** content rises 24px and fades in over `dur-reveal`, staggered 120ms, once.
3. **Respond:** a choice slides into place over `dur-base`: the segmented thumb, the switch, a meter filling. Never an underline.
4. **Feedback:** toasts and modals rise in over `dur-base`, leave over `dur-fast` on `ease-in`.
5. **Ambient:** motifs drift at most 16px on loops of 7 to 30s, behind content.

Never bounce, scale up, shrink on press, flash or parallax. With reduced motion, travel and loops stop and choices snap; fades stay.

## Components

`window.TEDxNewy.<Name>`, styled by `components/bundle.css` (`tx-` classes, every value a token).

**Actions.** `Button` has four variants: `accent` (red, one per view: Get tickets, Create, Add partner), `primary` (ink, red on hover, the default and every "go somewhere" link with `arrow-right`), `secondary` (outline: Cancel, Partner with us, Watch the recap, every alternative) and `danger`. Sizes `sm` 32, `md` 40, `lg` 52. `onDark` for maroon and ink. `IconButton` for repeated row actions, always labelled. There is no separate arrow link: a link that goes somewhere is a primary button with `arrow-right`.

**Feedback.** `Toast` (what just happened), `Banner` (what is true right now; `announce` and `bar` for the one promo), `Badge` (one status word in four tones plus neutral; "Sold out" and "Failed" are both danger), `EmptyState`, `Skeleton`.

**Content.** `Card` (white; `href` to lift, `tint` for cream grouping, `dark` for maroon), `MediaCard` (photo or gradient with scrim; a white badge for the programme), `SectionHeader` (heading, meta, intro, action, no eyebrow), `Stat` (with delta and sparkline), `List` and `ListRow`.

**Forms.** `Field` is every input: text, email, search, the one dropdown (`type="select"`) and the one long answer (`type="textarea"`). One height (44px), one shape (pill), one size (16px). `Switch` for on/off applied immediately. `Segmented` is the one switcher for views, filters and ranges, replacing tabs and filter chips.

**Overlay.** `Modal` for add, edit and confirm.

**Data.** `LineChart` (over time; red series, dashed `compare`, crosshair tooltip), `BarChart` (across categories; ink bars, the one that matters in red), `Meter` (toward a target), `Sparkline` (inline trend).

**Navigation.** `AdminNav`, the admin rail (see below). Site header and footer patterns: the header is transparent over a dark hero and white with `blur-glass` once scrolled, hides on scroll down, returns on scroll up, and carries one accent button; the footer is ink with the white lockup, social marks and the Acknowledgement.

## The admin

The admin is rebuilt around six workspaces instead of 19 sidebar pages. The **Admin models** cards show each one.

| Workspace | Opens on | Segments (replacing) |
|---|---|---|
| Home | Greeting, Needs you, four live numbers, ticket sales, this week | none |
| Events | One event at a time, picked from the breadcrumb | Overview, Programme (Talks, Speakers), Tickets, People (Attendees, Side Quest), Feedback, Report |
| Comms | One calendar of everything going out | Calendar, Newsletter (with Subscribers and Welcome flow), Socials, Email, Audience |
| Partners | The pipeline as a board | Pipeline, Sponsors, Media |
| Inbox | Every form submission as one triage queue | All, Contact, Applications |
| Library | Things we keep | Documents, Brand, Team, Talks archive |

Settings (admins, notifications, connections) sit under the rail's Settings item. **Cmd K** jumps to any record and runs actions.

**Rules that cut clicks**

- A record opens in a modal or side panel over its list; saving keeps you where you were.
- Views switch with `Segmented`, never a new page. Filters and ranges are segments too.
- On/off settings are `Switch`es that save immediately; everything else saves once, at the bottom of the modal.
- Every workspace leads with numbers that answer "how are we going" (`Stat`, `Meter`, a chart) before the list.
- One `accent` Create button per workspace; secondary actions are `IconButton`s on the row.
- Lists are dense (`ListRow`); boards are for things that move through stages (partners, drafts).

## Programme motifs

Each programme or flagship gets its own motif, recognisable at a glance and plainly TEDxNewy.

**Primitives:** the **dot** (people and places; one red dot stands in for the TEDx x), the **line** (paths and signals) and the **arc** (reach and time).

**Rules**

1. One ink per motif: `ink` on white, `white` or `blush` on maroon and ink. At most three red accents.
2. Strokes at `motif-stroke`; no fills except dots; no gradients inside a motif.
3. Behind content at `motif-opacity`; full strength only when the motif is the subject.
4. Ambient motion within `drift`, loops of 7 to 30s, frozen by reduced motion. A draw-in on first view is allowed, once.
5. A texture, not a picture: no objects, faces, logos or words.
6. One line states the idea, and that line decides the geometry.

| Motif | Programme | Idea | Geometry |
|---|---|---|---|
| `Network` | Newcastle 2050 salon | Connection, a planned city | Dots joined to nearest neighbours |
| `Waves` | 60-Second Talk Night | Voice and time | Stacked sine lines flowing, the middle one red |
| `Scribble` | Youth Futures Lab | Play, young voices | Hand-drawn marks that draw themselves in |

**Making a new one:** write the one-line idea, pick the primitive that says it, choose an arrangement (scatter, grid, stack, radiate, orbit) and one ambient motion, build it in one ink with up to three red accents, then test it behind an `h1` on maroon and on white, and with reduced motion on.

## Iconography

Lucide only: 24px geometry, 2px stroke (2.25 for small action icons), round caps, `currentColor`. 14 in rows, 16 in buttons and fields, 18 in the nav, 20 to 24 standalone. The Icon card shows the recommended set grouped by job (navigation and actions, events and programme, comms and partners, data and status) so new tools reach for the same glyphs. No emoji, no unicode stand-ins (the middot excepted). Social marks are files, in **Social**.

## Logos

**Logos** holds every lockup: `black` on white, `white` on maroon or ink, `mono` on red. Standard by default; Salon and Youth for those formats; Tagline carries "Ideas change everything." Never recolour, keep clear space, never rebuild in type. The Standard, Salon and Youth SVGs were re-traced on 16 October 2026 from the official PNGs, in `#e62b1e`, because the earlier traces had filled in the counters of the e, o and a. The repo's `public/brand/lockups/*.svg` still have that fault; replace them with these. The Tagline SVGs were always clean.

## Brand hub (/team-brand)

The **Brand hub** card is the redesign of `/team-brand`, modelled on the Unjumbled brand-files and template hubs.

- **Brand files:** a sticky bar to pick the lockup set (Standard, Salon, Youth, Tagline) and PNG size, and download everything as a zip; logo cards with SVG, PNG and Copy; colour swatches that copy their hex and a `colours.css`; both typefaces with downloads; motif files.
- **Templates:** stationery (email signature, letterhead, slide deck, name badge, video call background, social tiles) and an event kit (run sheet, speaker brief, volunteer briefing, partner prospectus, impact report, signage). Each opens an editable page: click text to fill it in, then print, save as PDF or copy.
- **Studio:** the Creative studio for social posts, using event galleries, the three shapes and the programme motifs.

Hub pages are in the brand voice for headings and the product voice for every control.

## Imagery

Photography lives on the site. Direction: warm and documentary, real rooms and real Novocastrians, ambient light, no stock. Always framed (a `MediaCard` or a `radius-lg` panel), text only over `grad-scrim`. An event without photos shows `grad-brand` with "Photos coming soon".

## Moving the current site to this system

- Pages and admin move from cream to white; cream remains only as the tint described above.
- `red-deep` and `red-section` become `maroon`; `red-blush` becomes `blush`; `ink-2` and `ink-3` become `charcoal` and `stone`; `cream-deep` goes. Near-black wells become `ink` or `maroon`. Navy and teal event gradients go; programmes are told apart by their motif.
- Every kicker and eyebrow, with its red rule, is removed. Section headers become heading, optional meta, intro.
- Tabs and filter chips become `Segmented`. Inline yes/no settings become `Switch`.
- Inputs become 44px pills at 16px; there is one dropdown.
- The circle-arrow link becomes a primary button with `arrow-right`; ghost and outline-light buttons merge into `secondary`.
- Grain is dropped.
- Admin, email, OG cards, reports and prospectus move to Inter; Plus Jakarta Sans goes.
- The admin's 19 pages fold into six workspaces; section colours go, because each workspace is now one page.
