const { PageHeader, Button, Icon, Badge, Modal, Field, Input, Textarea, DateTimePicker, SectionLabel } = window.TEDxNewyAdminDesignSystem_bb30ae;

/* Chips are coloured by TYPE, not status: newsletters red, socials green,
   notes grey — that is what makes the month scannable. A draft is drawn with
   a dashed outline and a lighter fill instead. */
const TYPE_CHIP = {
  newsletter: { bg: "var(--sec-red-chip-bg)", fg: "var(--sec-red-ink)", border: "rgba(185,20,4,0.35)" },
  social: { bg: "var(--sec-green-chip-bg)", fg: "var(--sec-green-ink)", border: "rgba(47,111,78,0.35)" },
  note: { bg: "var(--sec-grey-chip-bg)", fg: "var(--sec-grey-ink)", border: "rgba(87,83,77,0.35)" },
};

const ITEMS = {
  3: [{ type: "social", label: "Speaker reveal", time: "6:00pm", draft: true }],
  4: [{ type: "social", label: "Signal lineup", time: "6:00pm" }, { type: "newsletter", label: "September dispatch", time: "7:30am" }],
  7: [{ type: "social", label: "Talk Night highlights", time: "12:30pm" }],
  9: [{ type: "note", label: "Prospectus to Newcastle Permanent" }],
  11: [{ type: "newsletter", label: "Ticket reminder", time: "9:00am", draft: true }],
  14: [{ type: "social", label: "Volunteer callout", time: "8:00am", draft: true }],
  16: [{ type: "note", label: "Venue walkthrough, Q Building" }],
  18: [{ type: "social", label: "Partner thank-you", time: "5:00pm" }],
  22: [{ type: "newsletter", label: "48 hours left", time: "6:00am" }],
  25: [{ type: "social", label: "Countdown day 1", time: "7:00am" }, { type: "note", label: "AV run sheet due" }],
};

const WEEKDAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

function CalendarBoard() {
  const [day, setDay] = React.useState("2026-09-09");
  return (
    <div style={{ display: "grid", gap: "20px" }} data-section="red">
      <PageHeader
        section="red"
        eyebrow="Community"
        title="Calendar"
        description="Four weeks at a glance: scheduled social posts, newsletters and the events they line up against."
        actions={
          <Modal title="Add a note" trigger={<Button variant="primary" icon={<Icon name="Plus" size={14} strokeWidth={2.25} />}>Add note</Button>}>
            <div style={{ display: "grid", gap: "16px" }}>
              <Field label="Day"><DateTimePicker value={day} onChange={setDay} withTime={false} /></Field>
              <Field label="Title"><Input placeholder="Prospectus to Newcastle Permanent" /></Field>
              <Field label="Description" hint="Notes are inert: no link to a post, newsletter or event."><Textarea rows={3} /></Field>
              <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px", borderTop: "1px solid var(--line)", paddingTop: "16px" }}>
                <Button variant="secondary">Cancel</Button>
                <Button variant="primary">Save note</Button>
              </div>
            </div>
          </Modal>
        }
      />

      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "12px", flexWrap: "wrap" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <Button variant="row" icon={<Icon name="ChevronLeft" size={14} strokeWidth={2.25} />}>Previous</Button>
          <span style={{ fontSize: "13.5px", fontWeight: 500, color: "var(--ink)" }}>31 Aug – 27 Sep 2026</span>
          <Button variant="row">Next <Icon name="ChevronRight" size={14} strokeWidth={2.25} /></Button>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
          {[["newsletter", "Newsletters"], ["social", "Socials"], ["note", "Notes"]].map(([k, l]) => (
            <span key={k} style={{ display: "inline-flex", alignItems: "center", gap: "6px", fontFamily: "var(--font-mono)", fontSize: "9.5px", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.16em", color: "var(--ink-3)" }}>
              <span style={{ height: "10px", width: "10px", borderRadius: "3px", background: TYPE_CHIP[k].bg, border: `1px solid ${TYPE_CHIP[k].border}` }} />
              {l}
            </span>
          ))}
        </div>
      </div>

      <div style={{ borderRadius: "var(--radius-md)", border: "1px solid var(--line)", background: "var(--surface-card)", boxShadow: "var(--shadow-sm)", overflow: "hidden" }}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", borderBottom: "1px solid var(--line)" }}>
          {WEEKDAYS.map((d) => (
            <div key={d} style={{ padding: "8px 10px", fontFamily: "var(--font-mono)", fontSize: "9px", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.16em", color: "var(--ink-4)" }}>{d}</div>
          ))}
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)" }}>
          {Array.from({ length: 28 }, (_, i) => {
            const n = i + 1;
            const items = ITEMS[n] || [];
            return (
              <div key={n} style={{ minHeight: "92px", padding: "6px", borderRight: (n % 7 === 0) ? "none" : "1px solid var(--line)", borderBottom: n <= 21 ? "1px solid var(--line)" : "none", display: "grid", gap: "4px", alignContent: "start" }}>
                <div style={{ fontFamily: "var(--font-mono)", fontSize: "10px", fontWeight: 600, color: n === 9 ? "var(--red)" : "var(--ink-4)", fontVariantNumeric: "tabular-nums" }}>{n}</div>
                {items.map((it, j) => {
                  const c = TYPE_CHIP[it.type];
                  return (
                    <button key={j} type="button" style={{
                      textAlign: "left",
                      border: it.draft ? `1px dashed ${c.border}` : "1px solid transparent",
                      borderRadius: "6px",
                      background: it.draft ? "color-mix(in srgb, " + "#fff 55%, " + c.bg + ")" : c.bg,
                      color: c.fg,
                      padding: "4px 6px",
                      fontFamily: "var(--font-sans)",
                      fontSize: "10.5px",
                      fontWeight: 500,
                      lineHeight: 1.25,
                      overflow: "hidden",
                    }}>
                      {it.time && <span style={{ opacity: 0.7, fontVariantNumeric: "tabular-nums" }}>{it.time} </span>}
                      {it.label}
                    </button>
                  );
                })}
              </div>
            );
          })}
        </div>
      </div>

      <p style={{ margin: 0, fontSize: "12.5px", lineHeight: "var(--leading-body)", color: "var(--ink-4)" }}>
        Everything buckets by Sydney local date, never UTC. Drag a future chip onto another day to reschedule it — the day moves, the time doesn’t. Nothing can be dropped into the past.
      </p>
    </div>
  );
}

Object.assign(window, { CalendarBoard });
