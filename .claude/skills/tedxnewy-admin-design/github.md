repo: Zumihair/TEDxNewy
branch: main
path: app/admin

## Last sync

date: 2026-08-25T07:22:06Z

### Updated in this project

- Built the initial design system from the admin's shared primitives in `app/admin/`.
- Token CSS lifted verbatim from `app/globals.css` (@theme) and `app/admin/section-theme.ts`.
- Copied the real logo lockups and the Bricolage Grotesque variable TTF from `public/`.
- Added a click-through admin UI kit: dashboard, events, socials, calendar.
- **2026-08-25:** this skill moved from a standalone package into the repo
  itself, at `.claude/skills/tedxnewy-admin-design/`. The copied `assets/`
  folder (a byte-identical duplicate of `public/`) was deleted and every
  reference repointed at the real `public/` files, so there is exactly one
  copy of every logo, icon and font from here on. If this project is ever
  pushed back to the claude.ai Design System pane via `/design-sync`, note
  that the local `assets/` folder no longer exists — a push needs to source
  fresh copies from `public/` at push time rather than expecting them already
  bundled here, and the compiled `_ds_bundle.js` / `_ds_manifest.json` still
  carry the old `assets/...` paths until regenerated.

## Screen map

| Screen / file | Built from |
|---|---|
| `tokens/colors.css`, `tokens/typography.css`, `tokens/effects.css`, `tokens/spacing.css` | `app/globals.css` |
| `tokens/sections.css` | `app/admin/section-theme.ts` |
| `tokens/fonts.css` | `app/layout.tsx`, linked directly to `public/fonts/BricolageGrotesque.ttf` |
| `components/core/*` | `app/admin/ui.tsx`, `app/admin/PendingButtons.tsx` |
| `components/chrome/PageHeader.jsx` | `app/admin/PageHeader.tsx`, `app/admin/SectionLabel.tsx` |
| `components/chrome/SidebarNav.jsx` | `app/admin/AdminShell.tsx`, `app/admin/nav-config.ts` |
| `components/chrome/DashboardTile.jsx` | `app/admin/page.tsx` |
| `components/chrome/StageHeading.jsx` | `app/admin/StageHeading.tsx`, `app/admin/stages.ts` |
| `components/forms/Field.jsx` | `app/admin/ui.tsx` (Field, inputCls) |
| `components/forms/DateTimePicker.jsx` | `app/admin/DateTimePicker.tsx` |
| `components/feedback/Modal.jsx` | `app/admin/Modal.tsx` |
| `components/feedback/ConfirmDialog.jsx` | `app/admin/ConfirmDialog.tsx` |
| `components/data/DataList.jsx` | `app/admin/events/EventsTable.tsx` |
| `components/core/PageSkeleton.jsx` | `app/admin/loading.tsx` |
| `ui_kits/admin/Dashboard.jsx` | `app/admin/page.tsx`, `app/admin/forms/registry.ts` |
| `ui_kits/admin/EventsList.jsx` | `app/admin/events/EventsTable.tsx` |
| `ui_kits/admin/SocialsList.jsx` | `app/admin/socials/shared.ts`, `app/admin/stages.ts` |
| `ui_kits/admin/CalendarBoard.jsx` | `app/admin/calendar/CalendarBoard.tsx` |
| (logos, referenced directly) | `public/brand/`, `public/brand/lockups/` |
