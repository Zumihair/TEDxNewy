The dashboard's two tile types: `PulseTile` for the live-numbers band across the top, `DashboardTile` for the family clusters below it.

```jsx
<PulseTile label="Signal tickets" value="184/300" sub="61% sold · +18 this week" pct={61} accent />
<DashboardTile section="coast" title="Partners" count={24} icon={<Icon name="Handshake" size={18} strokeWidth={2.25} />} />
<DashboardTile section="coast" title="Tickets" tool icon={<Icon name="Ticket" size={18} strokeWidth={2.25} />} />
<DashboardTile section="red" title="Quick email" feature icon={<Icon name="Send" size={18} strokeWidth={2.25} />} />
```

Tiles are 84px in a 5-across grid, grouped under a `SectionLabel` per family. Only ONE `feature` tile per dashboard.
