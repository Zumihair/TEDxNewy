Row of filter pills above a board or list — pipeline statuses on Partners, past events on Tickets.

```jsx
<FilterChip active count={24}>All</FilterChip>
<FilterChip count={6} passive={{ bg: "var(--pipe-contacted-chip-bg)", fg: "var(--pipe-contacted-chip-fg)" }} title="Outreach sent, no reply yet">Contacted</FilterChip>
```

When a filter maps to a status that already has a chip colour, pass `passive` so the pill wears that colour at rest — the row then doubles as a legend. `title` carries the status hint. In the real admin these are plain links to `?status=`, so filtering needs no client JS.
