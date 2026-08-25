The dark band of context-setting totals at the top of Tickets and Partners. Not the same thing as `PulseTile` — a band is one block of page-level numbers, not a row of clickable cards.

```jsx
<StatBand columns={4}>
  <BandStat value="24" label="organisations on the board" />
  <BandStat value="6" label="conversations in play" />
  <BandStat value="$18k" label="confirmed partner value" tone="good" />
  <BandStat value="$34k" label="open pipeline, at suggested tiers" />
</StatBand>
```

Labels are full lowercase phrases that frame the number ("days until Signal 2026", "Angel seats funded, each paying for a second seat"), never a terse caps label — that's what `StatChip` is for. One band per page, at the top, directly under the PageHeader.
