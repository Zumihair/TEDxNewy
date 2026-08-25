import React from "react";
import { Icon } from "../core/Icon.jsx";

const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
const WEEKDAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const pad = (n) => String(n).padStart(2, "0");
const daysInMonth = (y, m) => new Date(Date.UTC(y, m, 0)).getUTCDate();
/** Monday-first lead offset. All date maths goes through Date.UTC, never the
 *  local constructor, which can land on the previous day across a DST jump. */
const firstWeekday = (y, m) => (new Date(Date.UTC(y, m - 1, 1)).getUTCDay() + 6) % 7;

function parse(value) {
  const m = /^(\d{4})-(\d{2})-(\d{2})(?:T(\d{2}):(\d{2}))?$/.exec(value || "");
  if (!m) return null;
  return { y: +m[1], m: +m[2], d: +m[3], hh: m[4] ? +m[4] : 0, mm: m[5] ? +m[5] : 0 };
}
const format = (p, withTime) => `${p.y}-${pad(p.m)}-${pad(p.d)}` + (withTime ? `T${pad(p.hh)}:${pad(p.mm)}` : "");
function label(p, withTime) {
  const d = new Date(Date.UTC(p.y, p.m - 1, p.d));
  const day = new Intl.DateTimeFormat("en-AU", { weekday: "short", day: "numeric", month: "short", year: "numeric", timeZone: "UTC" }).format(d);
  if (!withTime) return day;
  const h12 = p.hh % 12 === 0 ? 12 : p.hh % 12;
  return `${day}, ${h12}:${pad(p.mm)}${p.hh >= 12 ? "pm" : "am"}`;
}

/**
 * The custom date/time picker used everywhere a date is chosen. Native
 * `datetime-local` / `date` inputs are never used in this admin: they look
 * nothing like the rest of it and differ per browser.
 *
 * Value shape is identical to the input it replaced: `YYYY-MM-DDTHH:mm` with
 * time, `YYYY-MM-DD` without, always LOCAL wall-clock, empty string for unset.
 */
export function DateTimePicker({ value = "", onChange, withTime = true, placeholder, id, name, inline = false }) {
  const parsed = parse(value);
  const today = React.useMemo(() => {
    const n = new Date();
    return { y: n.getFullYear(), m: n.getMonth() + 1, d: n.getDate(), hh: n.getHours(), mm: 0 };
  }, []);
  const [open, setOpen] = React.useState(inline);
  const [view, setView] = React.useState(() => ({ y: (parsed ?? today).y, m: (parsed ?? today).m }));
  const commit = (next) => onChange && onChange(format(next, withTime));
  const ph = placeholder ?? (withTime ? "Pick a date and time" : "Pick a date");

  const trigger = (
    <div style={{ position: "relative", width: "100%" }}>
      <button
        id={id}
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="dialog"
        aria-expanded={open}
        style={{
          display: "flex",
          width: "100%",
          boxSizing: "border-box",
          alignItems: "center",
          gap: "8px",
          borderRadius: "var(--radius-md)",
          border: "1px solid " + (open ? "var(--focus-border)" : "var(--line-input)"),
          boxShadow: open ? "0 0 0 2px var(--focus-ring)" : "none",
          background: "var(--surface-card)",
          padding: "12px 16px",
          paddingRight: parsed ? "40px" : "16px",
          textAlign: "left",
          fontFamily: "var(--font-sans)",
          fontSize: "var(--text-input)",
          color: parsed ? "var(--ink)" : "var(--text-placeholder)",
        }}
      >
        <Icon name="CalendarDays" size={16} strokeWidth={2} color={parsed ? "var(--red)" : "var(--ink-5)"} />
        <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{parsed ? label(parsed, withTime) : ph}</span>
      </button>
      {parsed && (
        <button
          type="button"
          aria-label="Clear date"
          onClick={() => onChange && onChange("")}
          style={{
            position: "absolute",
            right: "8px",
            top: "50%",
            transform: "translateY(-50%)",
            display: "inline-flex",
            height: "24px",
            width: "24px",
            alignItems: "center",
            justifyContent: "center",
            border: "none",
            borderRadius: "var(--radius-pill)",
            background: "transparent",
            color: "var(--ink-5)",
          }}
        >
          <Icon name="X" size={14} strokeWidth={2.25} />
        </button>
      )}
    </div>
  );

  const total = daysInMonth(view.y, view.m);
  const lead = firstWeekday(view.y, view.m);
  const cells = [...Array(lead).fill(null), ...Array.from({ length: total }, (_, i) => i + 1)];
  const hh = parsed?.hh ?? 9;
  const mm = parsed?.mm ?? 0;
  const h12 = hh % 12 === 0 ? 12 : hh % 12;
  const isPm = hh >= 12;
  const todayKey = format(today, false);
  const step = (delta) => {
    const m0 = view.m - 1 + delta;
    setView({ y: view.y + Math.floor(m0 / 12), m: ((m0 % 12) + 12) % 12 + 1 });
  };
  const setTime = (h, m) => commit({ ...(parsed ?? today), hh: h, mm: m });

  const panel = (
    <div
      role="dialog"
      aria-label="Choose a date"
      style={{
        width: "var(--picker-w)",
        boxSizing: "border-box",
        borderRadius: "var(--radius-md)",
        border: "1px solid rgba(20,18,16,0.12)",
        background: "var(--surface-card)",
        padding: "12px",
        boxShadow: "var(--shadow-lg)",
        position: inline ? "relative" : "absolute",
        top: inline ? undefined : "calc(100% + 6px)",
        left: 0,
        zIndex: "var(--z-datepicker)",
      }}
    >
      <div style={{ marginBottom: "8px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <RoundBtn ariaLabel="Previous month" onClick={() => step(-1)}><Icon name="ChevronLeft" size={16} strokeWidth={2.25} /></RoundBtn>
        <div style={{ fontSize: "13.5px", fontWeight: "var(--weight-medium)", color: "var(--ink)" }}>{MONTHS[view.m - 1]} {view.y}</div>
        <RoundBtn ariaLabel="Next month" onClick={() => step(1)}><Icon name="ChevronRight" size={16} strokeWidth={2.25} /></RoundBtn>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(7,1fr)", gap: "2px" }}>
        {WEEKDAYS.map((d) => (
          <div key={d} style={{ paddingBottom: "4px", textAlign: "center", fontFamily: "var(--font-mono)", fontSize: "9px", fontWeight: "var(--weight-semibold)", textTransform: "uppercase", letterSpacing: "0.14em", color: "var(--ink-5)" }}>
            {d[0]}
          </div>
        ))}
        {cells.map((d, i) => {
          if (d === null) return <div key={`lead-${i}`} />;
          const key = `${view.y}-${pad(view.m)}-${pad(d)}`;
          const isSelected = parsed && parsed.y === view.y && parsed.m === view.m && parsed.d === d;
          const isToday = key === todayKey;
          return (
            <button
              key={key}
              type="button"
              onClick={() => {
                commit({ ...(parsed ?? { ...today, hh: 9, mm: 0 }), y: view.y, m: view.m, d });
                if (!withTime && !inline) setOpen(false);
              }}
              style={{
                display: "flex",
                height: "32px",
                alignItems: "center",
                justifyContent: "center",
                border: "none",
                borderRadius: "var(--radius-pill)",
                fontFamily: "var(--font-sans)",
                fontSize: "12.5px",
                background: isSelected ? "var(--red)" : "transparent",
                color: isSelected ? "#fff" : isToday ? "var(--red)" : "var(--ink)",
                fontWeight: isSelected || isToday ? "var(--weight-semibold)" : "var(--weight-body)",
                boxShadow: !isSelected && isToday ? "inset 0 0 0 1px rgba(224,34,20,0.35)" : "none",
              }}
            >
              {d}
            </button>
          );
        })}
      </div>
      {withTime && (
        <div style={{ marginTop: "12px", borderTop: "1px solid var(--line)", paddingTop: "12px", display: "flex", alignItems: "center", gap: "8px" }}>
          <Icon name="Clock" size={14} strokeWidth={2} color="var(--ink-5)" />
          <MiniSelect ariaLabel="Hour" value={h12} onChange={(v) => setTime((isPm ? 12 : 0) + (v % 12), mm)} options={Array.from({ length: 12 }, (_, i) => i + 1)} />
          <span style={{ fontSize: "13px", color: "var(--ink-3)" }}>:</span>
          <MiniSelect ariaLabel="Minute" value={mm} onChange={(v) => setTime(hh, v)} options={Array.from({ length: 12 }, (_, i) => i * 5)} format={pad} />
          <div style={{ marginLeft: "auto", display: "inline-flex", overflow: "hidden", borderRadius: "var(--radius-pill)", border: "1px solid var(--line-input)" }}>
            {["am", "pm"].map((p) => {
              const on = (p === "pm") === isPm;
              return (
                <button
                  key={p}
                  type="button"
                  onClick={() => setTime(p === "pm" ? (hh % 12) + 12 : hh % 12, mm)}
                  style={{ border: "none", padding: "6px 10px", fontFamily: "var(--font-sans)", fontSize: "12px", fontWeight: "var(--weight-medium)", textTransform: "uppercase", background: on ? "var(--red)" : "var(--surface-card)", color: on ? "#fff" : "var(--ink-3)" }}
                >
                  {p}
                </button>
              );
            })}
          </div>
        </div>
      )}
      <div style={{ marginTop: "12px", display: "flex", alignItems: "center", gap: "6px", borderTop: "1px solid var(--line)", paddingTop: "10px" }}>
        <button
          type="button"
          onClick={() => commit(withTime ? today : { ...today, hh: 0, mm: 0 })}
          style={{ border: "none", borderRadius: "var(--radius-pill)", background: "var(--wash)", padding: "6px 12px", fontFamily: "var(--font-sans)", fontSize: "12px", fontWeight: "var(--weight-medium)", color: "var(--ink)" }}
        >
          {withTime ? "Now" : "Today"}
        </button>
        {!inline && (
          <button
            type="button"
            onClick={() => setOpen(false)}
            style={{ marginLeft: "auto", border: "none", borderRadius: "var(--radius-pill)", background: "var(--red)", padding: "6px 16px", fontFamily: "var(--font-sans)", fontSize: "12px", fontWeight: "var(--weight-medium)", color: "#fff" }}
          >
            Done
          </button>
        )}
      </div>
    </div>
  );

  if (inline) return panel;
  return (
    <div style={{ position: "relative" }}>
      {name && <input type="hidden" name={name} value={value} />}
      {trigger}
      {open && panel}
    </div>
  );
}

function RoundBtn({ ariaLabel, onClick, children }) {
  return (
    <button
      type="button"
      aria-label={ariaLabel}
      onClick={onClick}
      style={{ display: "inline-flex", height: "28px", width: "28px", alignItems: "center", justifyContent: "center", border: "none", borderRadius: "var(--radius-pill)", background: "transparent", color: "var(--ink-3)" }}
    >
      {children}
    </button>
  );
}

function MiniSelect({ ariaLabel, value, onChange, options, format: fmt }) {
  return (
    <select
      aria-label={ariaLabel}
      value={value}
      onChange={(e) => onChange(Number(e.currentTarget.value))}
      style={{ borderRadius: "var(--radius-sm)", border: "1px solid var(--line-input)", background: "var(--surface-card)", padding: "6px 8px", fontFamily: "var(--font-sans)", fontSize: "13px", color: "var(--ink)" }}
    >
      {options.map((o) => (
        <option key={o} value={o}>{fmt ? fmt(o) : o}</option>
      ))}
    </select>
  );
}
