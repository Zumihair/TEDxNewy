The admin's fixed 216px near-black sidebar: reversed lockup, "ADMIN" eyebrow, five nav groups, and a signed-in footer.

```jsx
<SidebarNav
  logoSrc="/brand/tedxnewy-white.png"
  active="/admin/partners"
  groups={[
    { heading: "Overview", items: [{ href: "/admin", label: "Dashboard", iconName: "LayoutDashboard", section: "grey" }] },
    { heading: "Management", items: [{ href: "/admin/partners", label: "Partners", iconName: "Handshake", section: "coast" }] },
  ]}
/>
```

The active item's left bar and icon-chip fill use its section's `on-dark` hue — the brighter variant, because the near-black surface kills the ink one. Group order is fixed: Overview, Content, Management, Community, Settings.
