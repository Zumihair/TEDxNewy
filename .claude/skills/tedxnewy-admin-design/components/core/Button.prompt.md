The admin's pill buttons — one red primary per screen, neutral secondary for everything else, and compact `row`/`ghost` variants for actions inside table rows.

```jsx
<Button variant="primary" icon={<Icon name="Plus" size={14} strokeWidth={2.25} />}>Add partner</Button>
<Button variant="row" icon={<Icon name="Pencil" size={14} strokeWidth={2.25} />}>Edit</Button>
<Button variant="danger" icon={<Icon name="Trash2" size={14} strokeWidth={2.25} />}>Delete</Button>
<IconButton ariaLabel="Delete" tone="danger"><Icon name="Trash2" size={16} /></IconButton>
```

Variants: primary (red, lifts 2px on hover), secondary, dark, danger, row, ghost. `pending` swaps the icon for a spinner and disables the button — use it for any form submit. Prefer `IconButton` for repeated row actions; the house style is icon-only for common actions.
