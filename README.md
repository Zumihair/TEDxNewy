# TEDxNewy

The TEDxNewy 2026 website — an independently organised TED event on Awabakal and Worimi Country (Newcastle, Australia).

Stack: **Next.js 15 App Router · React 19 · Tailwind CSS v4 · TypeScript**.
Deployment target: **Vercel**.

## Getting started

```bash
npm install
npm run dev
```

The site runs at `http://localhost:3000`.

## Pages

| Route | Purpose |
| --- | --- |
| `/` | Home — hero, mission, stats, featured speakers, archive, sponsors, CTA |
| `/speakers` | 2026 lineup grid |
| `/speakers/[slug]` | Individual speaker page |
| `/about` | Mission, numbers, team |
| `/sponsors` | Tiered partner list + partner CTA |
| `/watch` | Archive grouped by year |
| `/tickets` | Pricing tiers + waitlist form |
| `/nominate` | Speaker nomination form |
| `/apply` | Volunteer crew application form |
| `/thanks` | Post-submit confirmation |
| `/api/{tickets,nominate,apply}` | Form endpoints (currently log + redirect) |

## Design system

- **Type**: Fraunces (display serif) + Inter (sans) + JetBrains Mono (accent)
- **Palette**: warm cream paper, deep ink, TEDx red `#e62b1e`, amber `#e89a3c`, coast blue `#1d4d5c`, harbor teal `#7ca7a8`
- **Flare elements**: looping marquee, grain overlay, accent-color speaker cards with initials, italic serif callouts, scribble underline on hero, numbered section labels, asymmetric sponsor grid

Tokens live in `app/globals.css` via Tailwind v4 `@theme`.

## Filling placeholders

Speaker data, sponsor list, and team are defined in `lib/data.ts`. Replace in place.
Speaker imagery is currently initials-on-colour blocks — swap the hero block in `components/SpeakerCard.tsx` and `app/speakers/[slug]/page.tsx` for `next/image` when photography is ready.

## Deploy

```bash
vercel
```

No env vars required for the scaffold. Form endpoints currently `console.log` — wire to your CRM / email provider of choice when ready.
