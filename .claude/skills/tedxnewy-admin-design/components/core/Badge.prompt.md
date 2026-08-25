Tiny uppercase pill for a record's derived lifecycle status.

```jsx
<Badge tone="draft">Draft</Badge>
<Badge tone="scheduled">Scheduled</Badge>
<Badge tone="live">Posted</Badge>
```

Tones: neutral, red, live (green), soon, draft (amber), scheduled (blue). Status is derived from dates and is never picked by hand; the manually-chosen stage is a StageHeading, not a Badge.
