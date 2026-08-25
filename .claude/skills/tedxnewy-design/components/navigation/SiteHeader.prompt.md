The site's fixed header: transparent over a dark hero, lifting to an opaque cream bar once scrolled, with a full-width mega-menu panel per group.

```jsx
<SiteHeader logo="/brand/tedxnewy-black.png" logoLight="/brand/tedxnewy-white.png"
  darkHero scrolled={false} cta={{ label: "Get tickets", href: "/signal" }}
  groups={[{ key: "upcoming", label: "Upcoming", style: "list", kicker: "On the horizon",
    heading: "What's coming up", blurb: "The events we're building toward across the season.",
    items: [{ label: "Signal", href: "/signal", description: "24 October · Conservatorium of Music" }] }]} />
```

Groups are Upcoming / Past Events / Participate / About. Top-level labels never navigate. Panels come in two shapes only: `list` (lede left, divided rows right) and `cards` (three 4:3 photo cards).
