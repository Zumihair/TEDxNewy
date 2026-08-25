Every destructive action confirms through this dialog — a native `window.confirm` is never acceptable in this admin.

```jsx
<ConfirmDialog
  open={open}
  title="Delete this event?"
  body={'Delete "Signal 2026"? Talks and speakers linked to it are kept, just unlinked. This can\'t be undone.'}
  confirmLabel="Delete"
  tone="danger"
  onConfirm={remove}
  onCancel={() => setOpen(false)}
/>
```

Body copy names the record, says what survives, and ends with the consequence. Pair with an optimistic row removal so the list repaints immediately. `PromptDialog` is the same shell with one field.
