Two dashed sunken panels: `NotSetUp` for a page whose table doesn't exist yet, `EmptyState` for a list with no rows.

```jsx
<NotSetUp />
<EmptyState>No events yet. Hit Add event to create your first.</EmptyState>
```

Every admin page that reads a recently-added table renders `NotSetUp` rather than crashing before the migration runs.
