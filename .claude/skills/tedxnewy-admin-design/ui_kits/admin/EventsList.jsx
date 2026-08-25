const { PageHeader, DataList, DataRow, RowMeta, Badge, Button, IconButton, Icon, Modal, ConfirmDialog, Field, Input, Select, DateTimePicker, AdvancedToggle, SectionLabel } = window.TEDxNewyAdminDesignSystem_bb30ae;

const EVENTS = [
  { id: "1", title: "TEDxNewy Signal 2026", kind: "Flagship", status: "draft", date: "Sat 14 Nov 2026", order: 1, tickets: true },
  { id: "2", title: "TEDxNewy Salon: Newcastle 2050", kind: "Salon", status: "past", date: "Thu 30 Apr 2026", order: 2, tickets: true },
  { id: "3", title: "60-Second Talk Night", kind: "Salon", status: "past", date: "Wed 16 Jul 2026", order: 3 },
  { id: "4", title: "Youth Futures Lab", kind: "Special", status: "past", date: "Thu 7 Aug 2026", order: 4 },
  { id: "5", title: "TEDxNewy Salon: What If", kind: "Salon", status: "announced", date: "Fri 27 Nov 2026", order: 5 },
];

const STATUS = { draft: ["draft", "Draft"], announced: ["soon", "Announced"], past: ["neutral", "Past"] };

function EventsList() {
  const [confirming, setConfirming] = React.useState(null);
  const [rows, setRows] = React.useState(EVENTS);
  const [starts, setStarts] = React.useState("2026-11-14T18:30");

  return (
    <div style={{ display: "grid", gap: "20px" }} data-section="yellow">
      <PageHeader
        section="yellow"
        eyebrow="Content"
        title="Events"
        description="Create and edit events. Drives the header menu, /events and the home page."
        actions={
          <Modal title="Add event" trigger={<Button variant="primary" icon={<Icon name="Plus" size={14} strokeWidth={2.25} />}>Add event</Button>}>
            <div style={{ display: "grid", gap: "16px" }}>
              <Field label="Title"><Input placeholder="TEDxNewy Salon: What If" /></Field>
              <Field label="Kind"><Select options={[{ value: "flagship", label: "Flagship" }, { value: "salon", label: "Salon" }, { value: "special", label: "Special" }]} /></Field>
              <Field label="Starts" hint="Sydney local time. Drives the countdown and the Upcoming menu.">
                <DateTimePicker value={starts} onChange={setStarts} />
              </Field>
              <AdvancedToggle label="Advanced">
                <Field label="Slug" hint="Leave blank to generate it from the title."><Input placeholder="salon-what-if" /></Field>
                <Field label="Display order"><Input defaultValue="6" /></Field>
              </AdvancedToggle>
              <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px", borderTop: "1px solid var(--line)", paddingTop: "16px" }}>
                <Button variant="secondary">Cancel</Button>
                <Button variant="primary" icon={<Icon name="Save" size={14} strokeWidth={2.25} />}>Save event</Button>
              </div>
            </div>
          </Modal>
        }
      />

      <div style={{ display: "grid", gap: "8px" }}>
        <SectionLabel section="yellow">All events</SectionLabel>
        <DataList>
          {rows.map((e, i) => (
            <DataRow
              key={e.id}
              first={i === 0}
              title={e.title}
              hoverColor="var(--sec-yellow-ink)"
              meta={<><Badge tone="neutral">{e.kind}</Badge><Badge tone={STATUS[e.status][0]}>{STATUS[e.status][1]}</Badge><span>{e.date}</span><RowMeta>order {e.order}</RowMeta></>}
              actions={
                <>
                  {e.tickets && <Button variant="row" icon={<Icon name="Ticket" size={14} strokeWidth={2.25} />}>Tickets</Button>}
                  {e.status === "past" && <>
                    <Button variant="row" icon={<Icon name="Users" size={14} strokeWidth={2.25} />}>Attendees</Button>
                    <Button variant="row" icon={<Icon name="MessageSquare" size={14} strokeWidth={2.25} />}>Feedback</Button>
                  </>}
                  <IconButton ariaLabel="Edit event"><Icon name="Pencil" size={16} strokeWidth={2.25} /></IconButton>
                  <IconButton ariaLabel="Delete event" tone="danger" onClick={() => setConfirming(e)}><Icon name="Trash2" size={16} strokeWidth={2.25} /></IconButton>
                </>
              }
            />
          ))}
        </DataList>
      </div>

      <ConfirmDialog
        open={!!confirming}
        title="Delete this event?"
        tone="danger"
        confirmLabel="Delete"
        body={confirming ? `Delete “${confirming.title}”? Talks and speakers linked to it are kept, just unlinked. This can’t be undone.` : ""}
        onConfirm={() => { setRows((r) => r.filter((x) => x.id !== confirming.id)); setConfirming(null); }}
        onCancel={() => setConfirming(null)}
      />
    </div>
  );
}

Object.assign(window, { EventsList });
