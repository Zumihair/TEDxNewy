const { PageHeader, Card, Button, IconButton, Icon, Field, Input, Select, Flash, SectionLabel, ConfirmDialog, Modal } = window.TEDxNewyAdminDesignSystem_bb30ae;

/* The result of an action is a toast in this admin, not an inline banner.
   The compiled _ds_bundle.js predates the toaster and exports no Toast, so
   this prototype carries a minimal stand-in; the real component lives at
   components/core/Toast.jsx and app/admin/Toaster.tsx in the site repo.
   Rendered bottom-centre, newest nearest the edge, and it clears itself. */
const TOAST_TONES = {
  success: { background: "#eef9f1", borderColor: "rgba(34,197,94,0.35)", color: "#155724", glyph: "\u2713" },
  error: { background: "#fdeeed", borderColor: "rgba(224,34,20,0.35)", color: "#b91404", glyph: "\u2715" },
  warning: { background: "#fdf6e7", borderColor: "rgba(245,158,11,0.40)", color: "#8a6d00", glyph: "\u26a0" },
};

function ToastStack({ toasts, onDismiss }) {
  return (
    <div style={{ position: "fixed", insetInline: 0, bottom: 0, zIndex: 100, display: "flex", flexDirection: "column", alignItems: "center", gap: "8px", padding: "0 16px 24px", pointerEvents: "none" }}>
      {toasts.map((t) => {
        const s = TOAST_TONES[t.tone] || TOAST_TONES.success;
        return (
          <div
            key={t.id}
            role={t.tone === "error" ? "alert" : "status"}
            style={{ pointerEvents: "auto", display: "flex", alignItems: "flex-start", gap: "10px", width: "100%", maxWidth: "440px", borderRadius: "var(--radius-md)", border: `1px solid ${s.borderColor}`, background: s.background, color: s.color, padding: "12px 16px", fontSize: "13.5px", lineHeight: 1.5, boxShadow: "0 10px 30px rgba(20,18,16,0.10)" }}
          >
            <span aria-hidden style={{ flexShrink: 0 }}>{s.glyph}</span>
            <div style={{ flex: 1, minWidth: 0 }}>{t.message}</div>
            <button type="button" aria-label="Dismiss" onClick={() => onDismiss(t.id)} style={{ flexShrink: 0, border: 0, background: "none", color: "inherit", opacity: 0.55, cursor: "pointer" }}>{"\u2715"}</button>
          </div>
        );
      })}
    </div>
  );
}

const AUDIENCES = [
  { id: "subscribers", label: "Subscribers", hint: "The newsletter list", count: 1284 },
  { id: "talk-night-accepted", label: "Talk Night: accepted", hint: "Accepted for the 60-second Talk Night", count: 34 },
  { id: "talk-night-all", label: "Talk Night: everyone", hint: "Everyone who registered interest, guests included", count: 128 },
  { id: "youth-futures", label: "Youth Futures EOIs", hint: "School contacts who lodged an EOI", count: 41 },
  { id: "student-speaker", label: "Student Speaker entrants", hint: "Student Speaker Competition entrants", count: 18 },
  { id: "nominations", label: "Speaker nominators", hint: "People who nominated a speaker", count: 27 },
  { id: "volunteers", label: "Volunteers", hint: "Volunteer applications", count: 33 },
];

const BLOCK_TYPES = [
  ["Type", "Text"], ["Heading", "Header"], ["Image", "Image"], ["MousePointerClick", "Button"], ["Minus", "Divider"], ["Quote", "Quote"],
];

const BLOCKS = [
  { type: "header", text: "Signal 2026 — the lineup is live" },
  { type: "text", text: "Twelve speakers, one stage, and the question we keep coming back to: what does Newcastle sound like when it says something new?" },
  { type: "image", text: "signal-lineup-2026.jpg" },
  { type: "button", text: "See the lineup →" },
];

const BLOCK_ICON = { header: "Heading", text: "Type", image: "Image", button: "MousePointerClick", divider: "Minus", quote: "Quote" };

function QuickEmail() {
  const [to, setTo] = React.useState("");
  const [loadingAud, setLoadingAud] = React.useState(null);
  const [subject, setSubject] = React.useState("Signal 2026 — the lineup is live");
  const [confirming, setConfirming] = React.useState(false);
  const [bcc, setBcc] = React.useState(false);
  const [toasts, setToasts] = React.useState([]);
  const nextToastId = React.useRef(1);
  const dismissToast = (id) => setToasts((cur) => cur.filter((t) => t.id !== id));
  const toast = (tone, message) => {
    const id = nextToastId.current++;
    setToasts((cur) => [...cur, { id, tone, message }]);
    setTimeout(() => dismissToast(id), tone === "error" ? 9000 : 4500);
  };

  const recipients = React.useMemo(() => new Set(to.split(/[\s,;]+/).map((e) => e.trim().toLowerCase()).filter(Boolean)).size, [to]);

  const fillAudience = (a) => {
    setLoadingAud(a.id);
    setTimeout(() => {
      const sample = Array.from({ length: Math.min(a.count, 6) }, (_, i) => `${a.id.replace(/-/g, ".")}.${i + 1}@example.com`);
      setTo((cur) => (cur ? cur + ", " : "") + sample.join(", ") + (a.count > 6 ? `, …+${a.count - 6} more` : ""));
      setLoadingAud(null);
    }, 450);
  };

  return (
    <div style={{ display: "grid", gap: "24px" }} data-section="red">
      <PageHeader
        section="red"
        eyebrow="Community · Quick Compose"
        title="Quick Compose"
        description="Send a one-off branded email to a custom audience or a saved list. Previews of the automated form emails live at /dev/emails."
        actions={<Button variant="secondary" icon={<Icon name="History" size={14} strokeWidth={2.25} />}>Send history</Button>}
      />

      <Flash tone="info">
        Emails are sending from <code style={{ fontFamily: "var(--font-mono)", fontSize: "12.5px" }}>onboarding@resend.dev</code>. That shared test address is often spam-filed or rejected, which is a likely reason recipients don’t receive messages. Ask Will to switch it to a verified tedxnewy.com.au sender to fix deliverability.
      </Flash>

      <section style={{ display: "grid", gap: "16px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <span style={{ display: "inline-flex", color: "var(--red)" }}><Icon name="Send" size={16} strokeWidth={2.25} /></span>
          <h2 style={{ margin: 0, fontSize: "18px", fontWeight: 600, letterSpacing: "-0.01em", color: "var(--ink)" }}>Compose</h2>
        </div>
        <p style={{ margin: 0, maxWidth: "70ch", fontSize: "13.5px", lineHeight: "var(--leading-body)", color: "var(--ink-3)" }}>
          Build the message from the same blocks as the newsletter (image, text, button and more), wrapped in the standard TEDxNewy shell (logo header, social footer). Use Preview to see it first. Every recipient gets their own separate email, so they never see one another, sent in one batched request so none get dropped to rate limits.
        </p>

        <Card padded>
          <div style={{ display: "grid", gap: "20px" }}>
            <div>
              <SectionLabel section="red">Saved audiences</SectionLabel>
              <div style={{ marginTop: "10px", display: "flex", flexWrap: "wrap", gap: "8px" }}>
                {AUDIENCES.map((a) => (
                  <button key={a.id} type="button" title={a.hint} onClick={() => fillAudience(a)}
                    style={{
                      display: "inline-flex", alignItems: "center", gap: "6px",
                      borderRadius: "var(--radius-pill)", border: "1px solid rgba(20,18,16,0.12)",
                      background: "var(--surface-card)", padding: "6px 14px",
                      fontFamily: "var(--font-mono)", fontSize: "10.5px", fontWeight: 600,
                      textTransform: "uppercase", letterSpacing: "0.14em", color: "var(--ink-3)", cursor: "pointer",
                    }}>
                    {loadingAud === a.id ? <Icon name="Loader" size={12} strokeWidth={2.5} /> : <Icon name="Users" size={12} strokeWidth={2.25} />}
                    {a.label} · {a.count}
                  </button>
                ))}
              </div>
              <p style={{ margin: "10px 0 0", fontSize: "12px", color: "var(--ink-4)" }}>
                Counts are the distinct inboxes each list will actually email — guests included, blanks and duplicates dropped.
              </p>
            </div>

            <Field label="To" hint={recipients ? `${recipients} distinct recipient${recipients === 1 ? "" : "s"}. Each gets their own email; they never see one another.` : "Paste addresses, or click an audience above."}>
              <textarea
                value={to}
                onChange={(e) => setTo(e.target.value)}
                rows={3}
                placeholder="name@example.com, another@example.com"
                style={{ display: "block", width: "100%", boxSizing: "border-box", borderRadius: "var(--radius-md)", border: "1px solid var(--line-input)", background: "var(--surface-card)", padding: "12px 16px", fontFamily: "var(--font-sans)", fontSize: "14.5px", lineHeight: "var(--leading-body)", color: "var(--ink)", resize: "vertical", outline: "none" }}
              />
            </Field>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 260px", gap: "16px", alignItems: "end" }}>
              <Field label="Subject"><Input value={subject} onChange={(e) => setSubject(e.target.value)} /></Field>
              <Field label="Template">
                <Select defaultValue="" options={[
                  { value: "", label: "Start from scratch" },
                  { value: "t1", label: "Talk Night reminder" },
                  { value: "t2", label: "Speaker thank-you" },
                  { value: "t3", label: "Volunteer callout" },
                ]} />
              </Field>
            </div>

            <div>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "12px" }}>
                <SectionLabel section="red">Message</SectionLabel>
                <div style={{ display: "flex", gap: "6px" }}>
                  {BLOCK_TYPES.map(([ic, label]) => (
                    <button key={label} type="button" title={`Add ${label.toLowerCase()} block`}
                      style={{ display: "inline-flex", alignItems: "center", gap: "5px", border: "1px solid rgba(20,18,16,0.12)", borderRadius: "var(--radius-pill)", background: "var(--surface-card)", padding: "4px 10px", fontFamily: "var(--font-sans)", fontSize: "11.5px", fontWeight: 500, color: "var(--ink-3)", cursor: "pointer" }}>
                      <Icon name={ic} size={12} strokeWidth={2.25} />{label}
                    </button>
                  ))}
                </div>
              </div>
              <div style={{ marginTop: "10px", borderRadius: "var(--radius-md)", border: "1px dashed var(--line-dashed)", background: "var(--surface-sunken)", padding: "8px" }}>
                {BLOCKS.map((b, i) => (
                  <div key={i} style={{ display: "grid", gridTemplateColumns: "auto 1fr auto", alignItems: "center", gap: "10px", borderRadius: "var(--radius-sm)", background: "var(--surface-card)", border: "1px solid var(--line)", padding: "10px 12px", marginBottom: i === BLOCKS.length - 1 ? 0 : "6px" }}>
                    <span style={{ display: "inline-flex", alignItems: "center", gap: "6px", fontFamily: "var(--font-mono)", fontSize: "9px", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.14em", color: "var(--ink-4)" }}>
                      <Icon name="GripVertical" size={12} strokeWidth={2} />
                      <Icon name={BLOCK_ICON[b.type]} size={12} strokeWidth={2.25} />
                      {b.type}
                    </span>
                    <span style={{ fontSize: b.type === "header" ? "15px" : "13px", fontWeight: b.type === "header" ? 500 : 400, lineHeight: 1.4, color: b.type === "image" ? "var(--ink-4)" : "var(--ink-2)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{b.text}</span>
                    <span style={{ display: "flex", gap: "2px" }}>
                      <IconButton ariaLabel="Move up"><Icon name="ArrowUp" size={14} strokeWidth={2.25} /></IconButton>
                      <IconButton ariaLabel="Delete block" tone="danger"><Icon name="Trash2" size={14} strokeWidth={2.25} /></IconButton>
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <label style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "13px", color: "var(--ink-2)" }}>
              <input type="checkbox" checked={bcc} onChange={(e) => setBcc(e.target.checked)} style={{ accentColor: "var(--red)" }} />
              Send as one email with everyone BCC'd
              <span style={{ color: "var(--ink-4)" }}>(faster, but recipients can reply-all)</span>
            </label>

            <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", justifyContent: "space-between", gap: "10px", borderTop: "1px solid var(--line)", paddingTop: "16px" }}>
              <Button variant="secondary" icon={<Icon name="BookmarkPlus" size={14} strokeWidth={2.25} />}>Save as template</Button>
              <div style={{ display: "flex", gap: "10px" }}>
                <Modal title="Preview" size="wide" trigger={<Button variant="secondary" icon={<Icon name="Eye" size={14} strokeWidth={2.25} />}>Preview</Button>}>
                  <div style={{ borderRadius: "var(--radius-md)", border: "1px solid var(--line)", overflow: "hidden" }}>
                    <div style={{ background: "var(--ink)", padding: "20px", textAlign: "center" }}>
                      <img src="../../../../../public/brand/tedxnewy-white.png" alt="TEDxNewy" style={{ height: "26px" }} />
                    </div>
                    <div style={{ background: "#fff", padding: "28px" }}>
                      <div style={{ fontSize: "22px", fontWeight: 500, letterSpacing: "-0.02em", color: "var(--ink)", fontVariationSettings: '"opsz" 144' }}>{BLOCKS[0].text}</div>
                      <p style={{ marginTop: "12px", fontSize: "14.5px", lineHeight: "var(--leading-body)", color: "var(--ink-2)" }}>{BLOCKS[1].text}</p>
                      <div style={{ marginTop: "16px", borderRadius: "var(--radius-sm)", background: "var(--surface-chip)", height: "140px", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "var(--font-mono)", fontSize: "10px", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.16em", color: "var(--ink-4)" }}>
                        {BLOCKS[2].text}
                      </div>
                      <div style={{ marginTop: "20px" }}><Button variant="primary">See the lineup →</Button></div>
                    </div>
                    <div style={{ background: "var(--surface-sunken)", padding: "16px 28px", fontSize: "11.5px", color: "var(--ink-4)", textAlign: "center" }}>
                      TEDxNewy · Awabakal and Worimi Country, Newcastle · Unsubscribe
                    </div>
                  </div>
                </Modal>
                <Button variant="primary" icon={<Icon name="Send" size={14} strokeWidth={2.25} />} disabled={recipients === 0} onClick={() => setConfirming(true)}>
                  Send{recipients ? ` to ${recipients}` : ""}
                </Button>
              </div>
            </div>
          </div>
        </Card>
      </section>

      <ConfirmDialog
        open={confirming}
        title={`Send to ${recipients} ${recipients === 1 ? "person" : "people"}?`}
        tone="neutral"
        confirmLabel="Send"
        body={<>This sends <strong>{subject.trim() || "(no subject)"}</strong> to {recipients} {recipients === 1 ? "inbox" : "inboxes"}. Every send is logged in the send history.</>}
        onConfirm={() => { setConfirming(false); toast("success", `Accepted by the email service for ${recipients} recipients. (Accepted means queued for delivery, not a guarantee it reached the inbox.)`); }}
        onCancel={() => setConfirming(false)}
      />

      <ToastStack toasts={toasts} onDismiss={dismissToast} />
    </div>
  );
}

Object.assign(window, { QuickEmail });
