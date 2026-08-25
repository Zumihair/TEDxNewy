The admin's list/table: a card of hairline-divided rows, ~14px vertical padding. Prefer this over a card grid.

```jsx
<DataList>
  <DataRow
    first
    title="TEDxNewy Signal 2026"
    hoverColor="var(--sec-yellow-ink)"
    meta={<><Badge tone="neutral">Flagship</Badge><Badge tone="draft">Draft</Badge><span>Sat 14 Nov</span><RowMeta>order 1</RowMeta></>}
    actions={<><IconButton ariaLabel="Edit"><Icon name="Pencil" size={16} /></IconButton><IconButton ariaLabel="Delete" tone="danger"><Icon name="Trash2" size={16} /></IconButton></>}
  />
</DataList>
```

The row title is the click target — don't add a separate "Open" button. Repeated actions are icon-only. Abbreviate long lists in a mock (3 rows standing in for 30) rather than inventing columns.
