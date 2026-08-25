The one tab pattern in the admin: an underline row with a red underline on the active tab. Use it for drafts / scheduled / sent-style views.

```jsx
<TabBar
  tabs={[{ key: "drafts", label: "Drafts", count: 6 }, { key: "scheduled", label: "Scheduled" }, { key: "sent", label: "Sent" }]}
  active="drafts"
  hrefFor={(k) => `?tab=${k}`}
/>
```

Never build a second tab treatment (pills, segmented control) — this is the house one.
