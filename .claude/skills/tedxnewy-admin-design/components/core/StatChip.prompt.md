The standard way to show metrics: small value + label tiles in a grid, never a run-on sentence of numbers.

```jsx
<StatChipGrid>
  <StatChip value="18" label="Sold, 7d" />
  <StatChip value="64" label="Sold, 28d" />
  <StatChip value="2" label="Cancelled" />
</StatChipGrid>
```

Values are tabular-nums with `opsz 144`; labels are the mono caps style. Three across by default.
