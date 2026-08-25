The container for everything on an admin page — white, 12px radius, hairline ink border, warm `--shadow-sm`.

```jsx
<Card><ul style={{ margin: 0, padding: 0, listStyle: "none" }}>{rows}</ul></Card>
<Card padded>Metrics, forms, prose.</Card>
```

Leave `padded` off when the card holds a divided list of rows (rows own their padding). Cards do NOT get coloured left borders; section colour arrives via the header and the tile border only.
