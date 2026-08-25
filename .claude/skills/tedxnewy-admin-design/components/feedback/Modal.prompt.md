The one add-a-record pattern: a button opens a modal. Never a bespoke inline `<details>` panel per page.

```jsx
<Modal title="Add partner" trigger={<Button variant="primary" icon={<Icon name="Plus" size={14} />}>Add partner</Button>}>
  <Field label="Organisation"><Input /></Field>
</Modal>
```

Sizes: default (520), wide (760), xl (960 — charts, maps). The header stays pinned and only the body scrolls. It portals to the body so no ancestor transform can trap the overlay.
