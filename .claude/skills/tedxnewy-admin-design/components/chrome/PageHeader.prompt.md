Every admin page starts with a PageHeader; it carries the route's section colour so the page matches its sidebar item and dashboard tile.

```jsx
<PageHeader
  section="coast"
  eyebrow="Management"
  title="Partners"
  description="The partner pipeline: prospects, outreach emails, and per-partner prospectus PDFs."
  actions={<Button variant="primary" icon={<Icon name="Plus" size={14} />}>Add partner</Button>}
/>
<SectionLabel section="coast">Outreach</SectionLabel>
```

Sections: yellow (Content), coast (Management), red (Community), green (Settings), grey (Overview/Forms). In the codebase the section is derived from the route — pass it explicitly here, and never colour a page off-family.
