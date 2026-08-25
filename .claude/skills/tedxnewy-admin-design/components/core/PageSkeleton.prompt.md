Loading states are always a skeleton matching the page's real layout — never a spinner-only screen.

```jsx
<PageSkeleton rows={3} />
<SkeletonBar width="40%" height={36} radius="var(--radius-md)" />
```

Bars are `--wash` (ink at 6%) on the cream page; the whole block pulses.
