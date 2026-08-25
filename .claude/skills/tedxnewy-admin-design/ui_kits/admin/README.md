# UI kit — TEDxNewy Admin

A click-through recreation of the internal admin at `/admin` in the TEDxNewy Next.js app. Open `index.html`.

## What's here

| File | Screen | Section hue |
|---|---|---|
| `index.html` | The shell: dark sidebar, route switching, skeleton on navigation | — |
| `Dashboard.jsx` | `/admin` — pulse band, dark forms-inbox banner, family tile clusters | grey |
| `EventsList.jsx` | `/admin/events` — dense clickable rows, add-event modal, delete confirm | yellow |
| `SocialsList.jsx` | `/admin/socials` — tab bar, stage-grouped drafts, new-post modal | red |
| `CalendarBoard.jsx` | `/admin/calendar` — four Mon–Sun weeks, chips coloured by type | red |
| `nav.js` | The nav data (five groups, matching `app/admin/nav-config.ts`) | — |

Every other sidebar item routes to a "not in this UI kit" page rather than a half-built screen. The four recreated screens between them exercise every shared primitive in `components/`.

## Fidelity notes

- Built from the real source (`app/admin/*`), not screenshots: sizes, paddings and hex values are copied unrounded.
- Data is invented but plausible; the real admin reads Supabase. Long lists are abbreviated (5 events standing in for the full roster).
- The calendar's drag-to-reschedule, the run sheet, per-channel captions, the block email editor and the Creative Studio are **not** recreated — they're documented in the readme but were out of scope for a static kit.
- Loading uses `PageSkeleton`, matching the admin's own `app/admin/loading.tsx`.
