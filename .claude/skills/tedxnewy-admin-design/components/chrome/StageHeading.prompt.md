Groups a draft list by the human-chosen stage, so the top of the list is what could go out today.

```jsx
<StageHeading stage="ready" count={3} />
{readyRows}
<StageHeading stage="polish" count={2} />
```

Order is always ready → polish → early, and empty stages render no heading. This is the manual "how finished is this" signal; the derived lifecycle status is a `Badge`. Suppress the per-row stage chip inside a group — it would just repeat the heading. Only draft views group; Scheduled/Sent rows don't display stage at all.
