"use client";

import Link from "next/link";
import { useState, type ReactNode } from "react";
import { lockupPath } from "@/lib/brand-portal-data";
import { ORG } from "@/lib/data";
import { Icon } from "@/components/ds";

/** Click-to-edit text: type over it, then print. Nothing is saved. */
function E({ children, block }: { children: ReactNode; block?: boolean }) {
  const Tag = block ? "div" : "span";
  return (
    <Tag className="tpl-edit" contentEditable suppressContentEditableWarning spellCheck>
      {children}
    </Tag>
  );
}

const Logo = ({ h = 36, colourway = "black" }: { h?: number; colourway?: "black" | "white" | "mono" }) => (
  // eslint-disable-next-line @next/next/no-img-element
  <img src={lockupPath("Standard", colourway, "png")} alt="TEDxNewy" style={{ height: h, width: "auto" }} />
);

function Letterhead() {
  return (
    <div className="tpl-page tpl-a4">
      <header className="tpl-row tpl-between">
        <Logo h={40} />
        <div className="tpl-small tpl-right">
          <div>{ORG.legalName}</div>
          <div>ACN {ORG.acn}</div>
          <div>{ORG.url}</div>
        </div>
      </header>
      <div className="tpl-rule" />
      <E block>Date</E>
      <div style={{ marginTop: 24 }}>
        <E block>Recipient name<br />Organisation<br />Address</E>
      </div>
      <div style={{ marginTop: 24 }}>
        <E block>Dear Name,</E>
      </div>
      <div style={{ marginTop: 16 }}>
        <E block>Write your letter here. Click anywhere on this page to edit it.</E>
      </div>
      <div style={{ marginTop: 24 }}>
        <E block>Warm regards,<br /><br />Name<br />Role, TEDxNewy</E>
      </div>
      <footer className="tpl-foot tpl-small">
        {ORG.legalName} · {ORG.licence}
      </footer>
    </div>
  );
}

function Meta({ rows }: { rows: [string, string][] }) {
  return (
    <div className="tpl-meta">
      {rows.map(([k, v]) => (
        <div key={k}>
          <div className="tpl-small">{k}</div>
          <E block>{v}</E>
        </div>
      ))}
    </div>
  );
}

function Minutes() {
  const items = [
    ["1", "Welcome and apologies", "", ""],
    ["2", "Minutes of the last meeting", "", "Accepted / amended"],
    ["3", "Item", "", ""],
    ["4", "Item", "", ""],
    ["5", "Other business", "", ""],
  ];
  const actions = [
    ["Action", "Owner", "Due"],
    ["Action", "Owner", "Due"],
    ["Action", "Owner", "Due"],
  ];
  return (
    <div className="tpl-page tpl-a4">
      <header className="tpl-row tpl-between">
        <h1 className="tpl-h1"><E>Meeting minutes</E></h1>
        <Logo />
      </header>
      <Meta
        rows={[
          ["Meeting", "Board meeting"],
          ["Date and time", "Date, start to finish"],
          ["Location", "Venue or link"],
          ["Chair", "Name"],
          ["Minutes by", "Name"],
          ["Present", "Names"],
          ["Apologies", "Names"],
        ]}
      />
      <table className="tpl-table">
        <thead><tr><th style={{ width: 28 }}>No.</th><th style={{ width: 150 }}>Item</th><th>Discussion</th><th style={{ width: 150 }}>Decision</th></tr></thead>
        <tbody>
          {items.map((r, i) => (
            <tr key={i}>{r.map((c, j) => <td key={j}><E>{c}</E></td>)}</tr>
          ))}
        </tbody>
      </table>
      <h2 className="tpl-h2" style={{ marginTop: 24 }}>Actions</h2>
      <table className="tpl-table" style={{ marginTop: 6 }}>
        <thead><tr><th>Action</th><th style={{ width: 150 }}>Owner</th><th style={{ width: 110 }}>Due</th></tr></thead>
        <tbody>
          {actions.map((r, i) => (
            <tr key={i}>{r.map((c, j) => <td key={j}><E>{c}</E></td>)}</tr>
          ))}
        </tbody>
      </table>
      <div style={{ marginTop: 20 }}>
        <div className="tpl-small">Next meeting</div>
        <E block>Date, time and place</E>
      </div>
      <footer className="tpl-foot tpl-small">{ORG.legalName} · {ORG.url}</footer>
    </div>
  );
}

function Agenda() {
  const rows = [
    ["6:00", "Welcome and apologies", "Chair", ""],
    ["6:05", "Minutes of the last meeting", "Chair", ""],
    ["6:10", "Item", "Name", ""],
    ["6:30", "Item", "Name", ""],
    ["6:50", "Other business", "All", ""],
    ["7:00", "Close", "Chair", ""],
  ];
  return (
    <div className="tpl-page tpl-a4">
      <header className="tpl-row tpl-between">
        <h1 className="tpl-h1"><E>Agenda</E></h1>
        <Logo />
      </header>
      <Meta
        rows={[
          ["Meeting", "Board meeting"],
          ["Date and time", "Date, start to finish"],
          ["Location", "Venue or link"],
          ["Chair", "Name"],
        ]}
      />
      <table className="tpl-table">
        <thead><tr><th style={{ width: 70 }}>Time</th><th>Item</th><th style={{ width: 120 }}>Lead</th><th style={{ width: 170 }}>Notes</th></tr></thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={i}>{r.map((c, j) => <td key={j}><E>{c}</E></td>)}</tr>
          ))}
        </tbody>
      </table>
      <div style={{ marginTop: 20 }}>
        <div className="tpl-small">Please bring or read beforehand</div>
        <E block>List any papers or reports.</E>
      </div>
      <footer className="tpl-foot tpl-small">{ORG.legalName} · {ORG.url}</footer>
    </div>
  );
}

/** 90 x 55 mm cards, eight to a sheet: fronts on the first page, backs on the second. */
function BusinessCards({ f }: { f: { name: string; role: string; email: string; phone: string } }) {
  const front = (k: number) => (
    <div key={k} className="tpl-card tpl-card--front">
      <Logo h={22} />
      <div>
        <div className="tpl-card__name">{f.name || "Your name"}</div>
        <div className="tpl-card__role">{f.role || "Role"}, TEDxNewy</div>
      </div>
      <div className="tpl-card__contact">
        {f.email && <div>{f.email}</div>}
        {f.phone && <div>{f.phone}</div>}
        <div>{ORG.url}</div>
      </div>
    </div>
  );
  const back = (k: number) => (
    <div key={k} className="tpl-card tpl-card--back">
      <Logo h={26} colourway="mono" />
      <div className="tpl-card__tag">Ideas change everything.</div>
    </div>
  );
  const eight = Array.from({ length: 8 }, (_, i) => i);
  return (
    <>
      <div className="tpl-page tpl-a4 tpl-cards">{eight.map(front)}</div>
      <div className="tpl-page tpl-a4 tpl-cards" style={{ marginTop: 24 }}>{eight.map(back)}</div>
    </>
  );
}

type Arrow = "right" | "left" | "up";
type SignStyle = "white" | "red" | "black";
const NEXT: Record<Arrow, Arrow> = { right: "left", left: "up", up: "right" };
const ROT: Record<Arrow, number> = { right: 0, left: 180, up: -90 };

function Signage({ arrow, onArrow, sign }: { arrow: Arrow; onArrow: () => void; sign: SignStyle }) {
  const logo = sign === "white" ? "black" : sign === "red" ? "mono" : "white";
  return (
    <div className={`tpl-page tpl-a3 tpl-signpage tpl-signpage--${sign}`}>
      <div className="tpl-sign">
        <Logo h={64} colourway={logo} />
        <h1 className="tpl-sign__title"><E block>This way to the auditorium</E></h1>
        <div className="tpl-sign__sub"><E block>Doors open at 10:30</E></div>
        <button
          type="button"
          className="tpl-sign__arrowbtn"
          onClick={onArrow}
          aria-label="Change the arrow direction"
          title="Click to change the arrow"
        >
          <svg viewBox="0 0 24 24" width="150" height="150" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" style={{ transform: `rotate(${ROT[arrow]}deg)`, transition: "transform 260ms var(--ease-out)" }}>
            <path d="M5 12h14" />
            <path d="m13 6 6 6-6 6" />
          </svg>
        </button>
      </div>
    </div>
  );
}

export default function TemplateEditor({ slug, title }: { slug: string; title: string }) {
  const [arrow, setArrow] = useState<Arrow>("right");
  const [sign, setSign] = useState<SignStyle>("white");
  const [card, setCard] = useState({ name: "", role: "", email: "", phone: "" });

  let body: ReactNode = null;
  let hint = "Click any text to edit it, then print or save as PDF. Nothing is stored.";
  let controls: ReactNode = null;

  if (slug === "letterhead") body = <Letterhead />;
  else if (slug === "minutes") body = <Minutes />;
  else if (slug === "agenda") body = <Agenda />;
  else if (slug === "business-card") {
    hint = "Fill in the details, then print on card stock at 100% scale. Fronts are on page one, backs on page two.";
    body = <BusinessCards f={card} />;
    controls = (
      <div className="adm-fields no-print">
        {(
          [
            ["name", "Full name", "Will Berry"],
            ["role", "Role", "Chief Operating Officer"],
            ["email", "Email", "will@tedxnewy.com.au"],
            ["phone", "Phone (optional)", "0400 000 000"],
          ] as const
        ).map(([k, label, ph]) => (
          <label key={k} className="block">
            <span className="adm-field__l">{label}</span>
            <input className="tx-input" value={card[k]} placeholder={ph} onChange={(e) => setCard({ ...card, [k]: e.target.value })} />
          </label>
        ))}
      </div>
    );
  } else if (slug === "signage") {
    hint = "Click the arrow to turn it. Pick a colour, edit the words, then print on A3 or save as PDF.";
    body = <Signage arrow={arrow} onArrow={() => setArrow(NEXT[arrow])} sign={sign} />;
    controls = (
      <div className="adm-pills no-print" role="tablist" aria-label="Sign colour">
        {(["white", "red", "black"] as SignStyle[]).map((s) => (
          <button key={s} type="button" role="tab" aria-selected={sign === s} onClick={() => setSign(s)} className={"adm-pill" + (sign === s ? " is-active" : "")}>
            {s[0].toUpperCase() + s.slice(1)}
          </button>
        ))}
      </div>
    );
  }
  if (!body) return null;

  return (
    <div className="adm-stack">
      <div className="adm-head tpl-toolbar no-print">
        <div>
          <Link href="/admin/brand/templates" className="adm-head__back">
            <Icon name="arrow-left" size={14} /> Templates
          </Link>
          <h1 className="adm-head__title" style={{ marginTop: 12 }}>{title}</h1>
          <p className="adm-head__desc">{hint}</p>
        </div>
        <div className="adm-head__actions">
          <button type="button" className="tx-btn tx-btn--accent" onClick={() => window.print()}>
            Print or save as PDF
          </button>
        </div>
      </div>
      {controls}
      <div className="tpl-stage">{body}</div>
    </div>
  );
}
