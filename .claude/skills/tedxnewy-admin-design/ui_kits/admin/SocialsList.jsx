const { PageHeader, TabBar, StageHeading, DataList, DataRow, RowMeta, Badge, Button, IconButton, Icon, Modal, ConfirmDialog, Field, Input, Textarea, DateTimePicker, StatChip, StatChipGrid, EmptyState } = window.TEDxNewyAdminDesignSystem_bb30ae;

const POSTS = [
  { id: "1", title: "Signal speaker reveal — Dr Amara Chen", channels: ["Instagram", "LinkedIn"], stage: "ready", status: "draft", when: null, updated: "2 hours ago" },
  { id: "2", title: "Youth Futures Lab recap reel", channels: ["Instagram", "Facebook"], stage: "ready", status: "draft", when: null, updated: "yesterday" },
  { id: "3", title: "Tickets on sale — 48 hours left", channels: ["Instagram", "Facebook", "LinkedIn"], stage: "ready", status: "draft", when: null, updated: "yesterday" },
  { id: "4", title: "Partner thank-you carousel", channels: ["LinkedIn"], stage: "polish", status: "draft", when: null, updated: "3 days ago" },
  { id: "5", title: "Newcastle 2050 white paper teaser", channels: ["LinkedIn"], stage: "polish", status: "draft", when: null, updated: "4 days ago" },
  { id: "6", title: "Volunteer callout — Signal crew", channels: ["Instagram"], stage: "early", status: "draft", when: null, updated: "last week" },
];

const SCHEDULED = [
  { id: "7", title: "Signal lineup announcement", channels: ["Instagram", "Facebook", "LinkedIn"], status: "scheduled", when: "Fri 4 Sep, 6:00pm" },
  { id: "8", title: "60-Second Talk Night highlights", channels: ["Instagram"], status: "scheduled", when: "Mon 7 Sep, 12:30pm" },
];

const POSTED = [
  { id: "9", title: "Salon 2050 wrap", channels: ["Instagram", "Facebook", "LinkedIn"], status: "posted", when: "Tue 12 Aug, 9:00am" },
  { id: "10", title: "Awabakal Country acknowledgement", channels: ["LinkedIn"], status: "posted", when: "Fri 1 Aug, 8:00am" },
];

const STATUS_TONE = { draft: "draft", scheduled: "scheduled", posted: "live" };

function SocialsList() {
  const [tab, setTab] = React.useState("drafts");
  const [confirming, setConfirming] = React.useState(null);
  const [when, setWhen] = React.useState("");

  const rowActions = (p) => (
    <>
      <Button variant="row" icon={<Icon name="Eye" size={14} strokeWidth={2.25} />}>Preview</Button>
      <IconButton ariaLabel="Duplicate to drafts"><Icon name="Copy" size={16} strokeWidth={2.25} /></IconButton>
      <IconButton ariaLabel="Delete post" tone="danger" onClick={() => setConfirming(p)}><Icon name="Trash2" size={16} strokeWidth={2.25} /></IconButton>
    </>
  );

  const meta = (p, showStage) => (
    <>
      <Badge tone={STATUS_TONE[p.status]}>{p.status === "posted" ? "Posted" : p.status === "scheduled" ? "Scheduled" : "Draft"}</Badge>
      <span>{p.channels.join(" · ")}</span>
      {p.when && <span>{p.when}</span>}
      {p.updated && <RowMeta>edited {p.updated}</RowMeta>}
    </>
  );

  const drafts = ["ready", "polish", "early"].map((stage) => ({ stage, rows: POSTS.filter((p) => p.stage === stage) })).filter((g) => g.rows.length);

  return (
    <div style={{ display: "grid", gap: "20px" }} data-section="red">
      <PageHeader
        section="red"
        eyebrow="Community"
        title="Socials"
        description="Draft, design and approve posts for Instagram, Facebook and LinkedIn, then publish straight from here on any channel connected via Buffer."
        actions={
          <Modal title="New social post" size="wide" trigger={<Button variant="primary" icon={<Icon name="Plus" size={14} strokeWidth={2.25} />}>New post</Button>}>
            <div style={{ display: "grid", gap: "16px" }}>
              <Field label="Title" hint="Internal only — never goes out with the post."><Input placeholder="Signal speaker reveal — Dr Amara Chen" /></Field>
              <Field label="Caption"><Textarea rows={4} placeholder="Write the caption every channel gets by default…" /></Field>
              <Field label="Schedule date" hint="Connected channels publish within 5 minutes of it. Leave empty to keep it a draft.">
                <DateTimePicker value={when} onChange={setWhen} />
              </Field>
              <Field label="Stage">
                <div style={{ display: "flex", gap: "8px" }}>
                  {["Early draft", "Needs polish", "Ready to schedule"].map((s, i) => (
                    <Button key={s} variant={i === 0 ? "dark" : "secondary"}>{s}</Button>
                  ))}
                </div>
              </Field>
              <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px", borderTop: "1px solid var(--line)", paddingTop: "16px" }}>
                <Button variant="secondary">Cancel</Button>
                <Button variant="primary" icon={<Icon name="Save" size={14} strokeWidth={2.25} />}>Save draft</Button>
              </div>
            </div>
          </Modal>
        }
      />

      <StatChipGrid columns={4}>
        <StatChip value="6" label="Drafts" />
        <StatChip value="2" label="Scheduled" />
        <StatChip value="14" label="Posted, 28d" />
        <StatChip value="3" label="Channels live" />
      </StatChipGrid>

      <TabBar
        tabs={[{ key: "drafts", label: "Drafts", count: POSTS.length }, { key: "scheduled", label: "Scheduled", count: SCHEDULED.length }, { key: "posted", label: "Posted", count: POSTED.length }]}
        active={tab}
        onSelect={setTab}
      />

      {tab === "drafts" && (
        <div style={{ display: "grid", gap: "16px" }}>
          {drafts.map((g) => (
            <div key={g.stage} style={{ display: "grid", gap: "8px" }}>
              <StageHeading stage={g.stage} count={g.rows.length} />
              <DataList>
                {g.rows.map((p, i) => (
                  <DataRow key={p.id} first={i === 0} title={p.title} hoverColor="var(--sec-red-ink)" meta={meta(p)} actions={rowActions(p)} />
                ))}
              </DataList>
            </div>
          ))}
        </div>
      )}

      {tab === "scheduled" && (
        <DataList>
          {SCHEDULED.map((p, i) => (
            <DataRow key={p.id} first={i === 0} title={p.title} hoverColor="var(--sec-red-ink)" meta={meta(p)}
              actions={<><Button variant="row" icon={<Icon name="Send" size={14} strokeWidth={2.25} />}>Publish now</Button><Button variant="row">Unschedule</Button><IconButton ariaLabel="Delete post" tone="danger" onClick={() => setConfirming(p)}><Icon name="Trash2" size={16} strokeWidth={2.25} /></IconButton></>} />
          ))}
        </DataList>
      )}

      {tab === "posted" && (
        <DataList>
          {POSTED.map((p, i) => (
            <DataRow key={p.id} first={i === 0} title={p.title} hoverColor="var(--sec-red-ink)" meta={meta(p)}
              actions={<><Button variant="row" icon={<Icon name="ExternalLink" size={14} strokeWidth={2.25} />}>Permalink</Button><Button variant="row" icon={<Icon name="Copy" size={14} strokeWidth={2.25} />}>Duplicate to drafts</Button></>} />
          ))}
        </DataList>
      )}

      <ConfirmDialog
        open={!!confirming}
        title="Delete this post?"
        tone="danger"
        confirmLabel="Delete"
        body={confirming ? `Delete “${confirming.title}”? Its media stays in the gallery. This can’t be undone.` : ""}
        onConfirm={() => setConfirming(null)}
        onCancel={() => setConfirming(null)}
      />
    </div>
  );
}

Object.assign(window, { SocialsList });
