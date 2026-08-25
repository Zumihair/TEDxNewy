const { PageHeader, Card, Button, IconButton, Icon, Field, Input, Textarea, SectionLabel, Flash, ConfirmDialog, AdvancedToggle } = window.TEDxNewyAdminDesignSystem_bb30ae;

const PIPELINE = [
  { id: "prospect", label: "Prospect", hint: "Identified, nobody's reached out yet" },
  { id: "contacted", label: "Contacted", hint: "Outreach sent, no reply yet" },
  { id: "in_discussion", label: "In discussion", hint: "Talking numbers" },
  { id: "confirmed", label: "Confirmed", hint: "Signed" },
];
const ASIDES = [
  { id: "declined", label: "Declined", hint: "Not this year" },
  { id: "dormant", label: "Dormant", hint: "Parked, revisit later" },
];

const TIMELINE = [
  { kind: "status", text: "Moved to In discussion", when: "22 Aug 2026, 4:12 pm" },
  { kind: "email", text: "Sent “TEDxNewy Signal 2026 — partnership”", when: "22 Aug 2026, 9:04 am" },
  { kind: "note", text: "Priya wants the activation to include a student cohort. Worth pricing a Major + in-kind split.", when: "20 Aug 2026, 2:30 pm" },
  { kind: "prospectus", text: "Generated a personalised prospectus (Major · $5k)", when: "18 Aug 2026, 11:15 am" },
  { kind: "email", text: "Sent “Quick intro — TEDxNewy”", when: "12 Aug 2026, 8:41 am" },
  { kind: "status", text: "Moved to Contacted", when: "12 Aug 2026, 8:41 am" },
];

const KIND_ICON = { email: "Mail", status: "ArrowUpRight", note: "StickyNote", prospectus: "FileText" };

const COMMITMENTS = [
  { text: "Logo on the stage screen and website", done: true },
  { text: "Six seats at the flagship event", done: true },
  { text: "Named student cohort (10 places)", done: false },
  { text: "Speaker slot in the pre-show program", done: false },
];

/** The happy path as connected steps, with declined and dormant as quiet
 *  asides. Clicking a step moves the partner there. */
function StageStepper({ status, onSet }) {
  const activeIdx = PIPELINE.findIndex((x) => x.id === status);
  return (
    <Card style={{ padding: "16px 24px" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "12px" }}>
        <ol style={{ display: "flex", flex: 1, flexWrap: "wrap", alignItems: "center", gap: 0, margin: 0, padding: 0, listStyle: "none" }}>
          {PIPELINE.map((s, i) => {
            const state = status === s.id ? "current" : activeIdx > i ? "done" : "todo";
            return (
              <li key={s.id} style={{ display: "flex", alignItems: "center" }}>
                {i > 0 && <span aria-hidden style={{ margin: "0 10px", height: "1px", width: "36px", background: state === "todo" ? "rgba(20,18,16,0.15)" : "var(--red)" }} />}
                <button
                  type="button"
                  title={s.hint}
                  disabled={state === "current"}
                  onClick={() => onSet(s.id)}
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "8px",
                    border: "none",
                    borderRadius: "var(--radius-pill)",
                    padding: "6px 14px 6px 6px",
                    fontFamily: "var(--font-mono)",
                    fontSize: "10px",
                    fontWeight: 600,
                    textTransform: "uppercase",
                    letterSpacing: "0.14em",
                    transition: "all var(--dur-base)",
                    cursor: state === "current" ? "default" : "pointer",
                    background: state === "current" ? "var(--red)" : "transparent",
                    color: state === "current" ? "#fff" : state === "done" ? "var(--red-mid)" : "var(--ink-3)",
                  }}
                >
                  <span aria-hidden style={{
                    display: "inline-flex",
                    height: "20px",
                    width: "20px",
                    alignItems: "center",
                    justifyContent: "center",
                    borderRadius: "var(--radius-pill)",
                    fontSize: "10px",
                    background: state === "current" ? "rgba(255,255,255,0.2)" : state === "done" ? "var(--red)" : "rgba(20,18,16,0.08)",
                    color: state === "current" || state === "done" ? "#fff" : "var(--ink-3)",
                  }}>
                    {state === "done" ? "✓" : i + 1}
                  </span>
                  {s.label}
                </button>
              </li>
            );
          })}
        </ol>
        <div style={{ display: "flex", alignItems: "center", gap: "6px", borderLeft: "1px solid rgba(20,18,16,0.10)", paddingLeft: "16px" }}>
          {ASIDES.map((s) => {
            const active = status === s.id;
            return (
              <button key={s.id} type="button" title={s.hint} disabled={active} onClick={() => onSet(s.id)}
                style={{
                  border: "none",
                  borderRadius: "var(--radius-pill)",
                  padding: "6px 12px",
                  fontFamily: "var(--font-mono)",
                  fontSize: "9.5px",
                  fontWeight: 600,
                  textTransform: "uppercase",
                  letterSpacing: "0.16em",
                  cursor: active ? "default" : "pointer",
                  background: active ? (s.id === "declined" ? "rgba(224,34,20,0.10)" : "var(--surface-chip)") : "transparent",
                  color: active ? (s.id === "declined" ? "var(--red-mid)" : "var(--ink-4)") : "var(--ink-4)",
                }}>
                {s.label}
              </button>
            );
          })}
        </div>
      </div>
    </Card>
  );
}

function PartnerDetail({ partner, onBack }) {
  const p = partner || { org: "Hunter Water", cat: "Utilities", website: "hunterwater.com.au", status: "in_discussion", contact: "Priya Raman", email: "priya.raman@hunterwater.com.au" };
  const [status, setStatus] = React.useState(p.status);
  const [emailOpen, setEmailOpen] = React.useState(false);
  const [removing, setRemoving] = React.useState(false);
  const done = COMMITMENTS.filter((c) => c.done).length;

  return (
    <div style={{ display: "grid", gap: "20px" }} data-section="coast">
      <PageHeader
        section="coast"
        eyebrow="Partnerships"
        title={p.org}
        backHref="#"
        description={[p.cat, p.website].filter(Boolean).join(" · ")}
        actions={<Button variant="danger" icon={<Icon name="Trash2" size={14} strokeWidth={2.25} />} onClick={() => setRemoving(true)}>Remove</Button>}
      />

      <StageStepper status={status} onSet={setStatus} />

      <div style={{ display: "grid", gridTemplateColumns: "1fr 380px", gap: "28px", alignItems: "start" }}>
        <div style={{ display: "grid", gap: "24px" }}>
          {/* Collapsed by default: most visits aren't "send an email right now". */}
          <div>
            <button type="button" onClick={() => setEmailOpen((o) => !o)} aria-expanded={emailOpen}
              style={{ display: "flex", width: "100%", alignItems: "center", justifyContent: "space-between", gap: "8px", border: "none", background: "none", padding: 0, cursor: "pointer" }}>
              <SectionLabel section="coast">Email {p.contact ?? "them"}</SectionLabel>
              <span style={{ display: "inline-flex", color: "var(--ink-4)", transform: emailOpen ? "rotate(180deg)" : "none", transition: "transform var(--dur-base)" }}>
                <Icon name="ChevronDown" size={16} strokeWidth={2.25} />
              </span>
            </button>
            {emailOpen && (
              <Card padded style={{ marginTop: "12px" }}>
                <div style={{ display: "grid", gap: "16px" }}>
                  <Field label="To"><Input defaultValue={p.email} /></Field>
                  <Field label="Subject"><Input defaultValue="TEDxNewy Signal 2026 — partnership" /></Field>
                  <Field label="Message" hint="Plain text; a blank line starts a new paragraph. Sent with the house email styling.">
                    <Textarea rows={8} defaultValue={"Hi Priya,\n\nThanks for making time last week. I've put together a version of the prospectus with the student cohort costed in — it's attached.\n\nHappy to walk through it whenever suits.\n\nWill"} />
                  </Field>
                  <label style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "13px", color: "var(--ink-2)" }}>
                    <input type="checkbox" defaultChecked style={{ accentColor: "var(--red)" }} />
                    Include the prospectus PDF
                    <span style={{ color: "var(--ink-4)" }}>(their personalised version)</span>
                  </label>
                  <div><Button variant="primary" icon={<Icon name="Send" size={14} strokeWidth={2.25} />}>Send email</Button></div>
                </div>
              </Card>
            )}
          </div>

          <section>
            <SectionLabel section="coast">Prospectus</SectionLabel>
            <Card padded style={{ marginTop: "12px" }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "16px", flexWrap: "wrap" }}>
                <div>
                  <div style={{ fontSize: "14.5px", fontWeight: 500, color: "var(--ink)" }}>Major · $5k, personalised</div>
                  <div style={{ marginTop: "4px", fontSize: "12.5px", color: "var(--ink-3)" }}>Generated 18 Aug 2026 · 6 pages</div>
                </div>
                <div style={{ display: "flex", gap: "8px" }}>
                  <Button variant="secondary" icon={<Icon name="ExternalLink" size={14} strokeWidth={2.25} />}>Open PDF</Button>
                  <Button variant="secondary" icon={<Icon name="RefreshCw" size={14} strokeWidth={2.25} />}>Regenerate</Button>
                </div>
              </div>
            </Card>
          </section>

          <section>
            <SectionLabel section="coast">Activity</SectionLabel>
            <Card style={{ marginTop: "12px" }}>
              <ul style={{ margin: 0, padding: 0, listStyle: "none" }}>
                {TIMELINE.map((e, i) => (
                  <li key={i} style={{ display: "grid", gridTemplateColumns: "28px 1fr auto", gap: "12px", alignItems: "start", padding: "14px 20px", borderTop: i ? "1px solid var(--line)" : "none" }}>
                    <span style={{ display: "inline-flex", height: "24px", width: "24px", alignItems: "center", justifyContent: "center", borderRadius: "var(--radius-pill)", background: "var(--sec-coast-chip-bg)", color: "var(--sec-coast-chip-fg)" }}>
                      <Icon name={KIND_ICON[e.kind]} size={13} strokeWidth={2.25} />
                    </span>
                    <span style={{ fontSize: "13.5px", lineHeight: "var(--leading-body)", color: "var(--ink-2)" }}>{e.text}</span>
                    <span style={{ fontFamily: "var(--font-mono)", fontSize: "10.5px", color: "var(--ink-4)", whiteSpace: "nowrap", paddingTop: "3px" }}>{e.when}</span>
                  </li>
                ))}
              </ul>
            </Card>
          </section>

          <section>
            <SectionLabel section="coast">Add a note</SectionLabel>
            <Card padded style={{ marginTop: "12px" }}>
              <div style={{ display: "grid", gap: "12px" }}>
                <Textarea rows={3} placeholder="What was said, what they asked for, what happens next…" />
                <div style={{ display: "flex", justifyContent: "flex-end" }}>
                  <Button variant="primary" icon={<Icon name="Plus" size={14} strokeWidth={2.25} />}>Add note</Button>
                </div>
              </div>
            </Card>
          </section>
        </div>

        <div style={{ display: "grid", gap: "24px" }}>
          <section>
            <SectionLabel section="coast">Commitments · {done}/{COMMITMENTS.length}</SectionLabel>
            <Card style={{ marginTop: "12px" }}>
              <ul style={{ margin: 0, padding: 0, listStyle: "none" }}>
                {COMMITMENTS.map((c, i) => (
                  <li key={i} style={{ display: "grid", gridTemplateColumns: "auto 1fr auto", alignItems: "center", gap: "10px", padding: "12px 16px", borderTop: i ? "1px solid var(--line)" : "none" }}>
                    <input type="checkbox" defaultChecked={c.done} style={{ accentColor: "var(--red)" }} />
                    <span style={{ fontSize: "13px", lineHeight: 1.4, color: c.done ? "var(--ink-4)" : "var(--ink-2)", textDecoration: c.done ? "line-through" : "none" }}>{c.text}</span>
                    <IconButton ariaLabel="Remove commitment" tone="danger"><Icon name="X" size={14} strokeWidth={2.25} /></IconButton>
                  </li>
                ))}
              </ul>
              <div style={{ display: "flex", gap: "8px", borderTop: "1px solid var(--line)", padding: "12px 16px" }}>
                <Input placeholder="Add a commitment…" style={{ padding: "8px 12px", fontSize: "13px" }} />
                <Button variant="secondary" icon={<Icon name="Plus" size={14} strokeWidth={2.25} />}>Add</Button>
              </div>
            </Card>
          </section>

          <section>
            <SectionLabel section="coast">Partnership details</SectionLabel>
            <Card padded style={{ marginTop: "12px" }}>
              <div style={{ display: "grid", gap: "16px" }}>
                <Field label="Contact name"><Input defaultValue={p.contact} /></Field>
                <Field label="Email"><Input defaultValue={p.email} /></Field>
                <Field label="Category"><Input defaultValue={p.cat} /></Field>
                <AdvancedToggle label="More">
                  <Field label="Website"><Input defaultValue={p.website} /></Field>
                  <Field label="Suggested tier" hint="Drives the $ figure on the board and the prospectus."><Input defaultValue="Major · $5k" /></Field>
                </AdvancedToggle>
                <div style={{ display: "flex", justifyContent: "flex-end" }}>
                  <Button variant="primary" icon={<Icon name="Save" size={14} strokeWidth={2.25} />}>Save</Button>
                </div>
              </div>
            </Card>
          </section>

          <section>
            <SectionLabel section="coast">Find contacts</SectionLabel>
            <Card padded style={{ marginTop: "12px" }}>
              <p style={{ margin: 0, fontSize: "12.5px", lineHeight: "var(--leading-body)", color: "var(--ink-3)" }}>
                Apollo looks up decision-makers at {p.website ?? "their domain"} and offers them as contacts. Not recreated in this kit.
              </p>
            </Card>
          </section>
        </div>
      </div>

      <ConfirmDialog
        open={removing}
        title="Remove this partner?"
        tone="danger"
        confirmLabel="Remove"
        body={`Remove “${p.org}” from the board? Their notes, emails and prospectus history go with them. This can’t be undone.`}
        onConfirm={() => { setRemoving(false); onBack && onBack(); }}
        onCancel={() => setRemoving(false)}
      />
    </div>
  );
}

Object.assign(window, { PartnerDetail });
