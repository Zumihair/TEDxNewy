"use client";

import Link from "next/link";
import { useEffect, useLayoutEffect, useRef, useState, type ReactNode } from "react";
import { lockupPath } from "@/lib/brand-portal-data";
import { ORG } from "@/lib/data";
import { Icon } from "@/components/ds";
import {
  agendaDoc,
  downloadBlob,
  letterheadDoc,
  minutesDoc,
  type SignArrow,
  type SignStyle,
} from "@/lib/template-docs";
import { canvasBlob, renderCard, type CardInput } from "@/lib/card-canvas";
import { signagePdf } from "@/lib/sign-pdf";

/** Scales a fixed-size page down so the whole thing is visible without scrolling. */
function FitPage({ width, height, children }: { width: number; height: number; children: ReactNode }) {
  const box = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);
  useLayoutEffect(() => {
    const el = box.current;
    if (!el) return;
    const fit = () => setScale(Math.min(1, el.clientWidth / width));
    fit();
    const ro = new ResizeObserver(fit);
    ro.observe(el);
    return () => ro.disconnect();
  }, [width]);
  return (
    <div ref={box} className="tpl-fit" style={{ height: height * scale }}>
      <div style={{ width, height, transform: `scale(${scale})`, transformOrigin: "top left" }}>{children}</div>
    </div>
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
      <div>Date</div>
      <div style={{ marginTop: 24 }}>Recipient name<br />Organisation<br />Address</div>
      <div style={{ marginTop: 24 }}>Dear Name,</div>
      <div style={{ marginTop: 16 }}>Write your letter here.</div>
      <div style={{ marginTop: 24 }}>Warm regards,<br /><br />Name<br />Role, TEDxNewy</div>
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
          <div>{v}</div>
        </div>
      ))}
    </div>
  );
}

function Minutes() {
  const items = [
    ["1", "Welcome and apologies", "", ""],
    ["2", "Minutes of the last meeting", "", "Accepted or amended"],
    ["3", "Item", "", ""],
    ["4", "Item", "", ""],
    ["5", "Other business", "", ""],
  ];
  return (
    <div className="tpl-page tpl-a4">
      <header className="tpl-row tpl-between">
        <h1 className="tpl-h1">Meeting minutes</h1>
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
        <tbody>{items.map((r, i) => <tr key={i}>{r.map((c, j) => <td key={j}>{c || " "}</td>)}</tr>)}</tbody>
      </table>
      <h2 className="tpl-h2" style={{ marginTop: 24 }}>Actions</h2>
      <table className="tpl-table" style={{ marginTop: 6 }}>
        <thead><tr><th>Action</th><th style={{ width: 150 }}>Owner</th><th style={{ width: 110 }}>Due</th></tr></thead>
        <tbody>{[0, 1, 2].map((i) => <tr key={i}><td>Action</td><td>Owner</td><td>Due</td></tr>)}</tbody>
      </table>
      <div style={{ marginTop: 20 }}>
        <div className="tpl-small">Next meeting</div>
        <div>Date, time and place</div>
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
        <h1 className="tpl-h1">Agenda</h1>
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
        <tbody>{rows.map((r, i) => <tr key={i}>{r.map((c, j) => <td key={j}>{c || " "}</td>)}</tr>)}</tbody>
      </table>
      <div style={{ marginTop: 20 }}>
        <div className="tpl-small">Please bring or read beforehand</div>
        <div>List any papers or reports.</div>
      </div>
      <footer className="tpl-foot tpl-small">{ORG.legalName} · {ORG.url}</footer>
    </div>
  );
}

const NEXT: Record<SignArrow, SignArrow> = { right: "left", left: "up", up: "right" };
const ROT: Record<SignArrow, number> = { right: 0, left: 180, up: -90 };

function Signage({ arrow, onArrow, sign, title, sub }: { arrow: SignArrow; onArrow: () => void; sign: SignStyle; title: string; sub: string }) {
  const logo = sign === "white" ? "black" : sign === "red" ? "mono" : "white";
  return (
    <div className={`tpl-page tpl-a3 tpl-signpage tpl-signpage--${sign}`}>
      <div className="tpl-sign">
        <Logo h={64} colourway={logo} />
        <h1 className="tpl-sign__title">{title}</h1>
        <div className="tpl-sign__sub">{sub}</div>
        <button type="button" className="tpl-sign__arrowbtn" onClick={onArrow} aria-label="Turn the arrow" title="Click to turn the arrow">
          <svg viewBox="0 0 24 24" width="150" height="150" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" style={{ transform: `rotate(${ROT[arrow]}deg)`, transition: "transform 260ms var(--ease-out)" }}>
            <path d="M5 12h14" />
            <path d="m13 6 6 6-6 6" />
          </svg>
        </button>
      </div>
    </div>
  );
}

function CardPreview({ side, c }: { side: "front" | "back"; c: CardInput }) {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    if (ref.current) renderCard(ref.current, side, c).catch(() => {});
  }, [side, c]);
  return <canvas ref={ref} className="tpl-cardprev" aria-label={`Card ${side}`} />;
}

export default function TemplateEditor({ slug, title }: { slug: string; title: string }) {
  const [arrow, setArrow] = useState<SignArrow>("right");
  const [sign, setSign] = useState<SignStyle>("white");
  const [signTitle, setSignTitle] = useState("This way to the auditorium");
  const [signSub, setSignSub] = useState("Doors open at 10:30");
  const [card, setCard] = useState<CardInput>({ name: "", role: "", email: "", phone: "" });
  const [busy, setBusy] = useState(false);

  const slugName = slug;
  const run = async (make: () => Promise<Blob>, file: string) => {
    setBusy(true);
    try {
      downloadBlob(await make(), file);
    } finally {
      setBusy(false);
    }
  };
  const saveCard = async (side: "front" | "back") => {
    setBusy(true);
    try {
      const c = document.createElement("canvas");
      await renderCard(c, side, card);
      downloadBlob(await canvasBlob(c), `tedxnewy-business-card-${side}.png`);
    } finally {
      setBusy(false);
    }
  };

  let body: ReactNode = null;
  let hint = "Preview it here, then download the Word document to fill in and send.";
  let controls: ReactNode = null;
  let action: ReactNode = null;

  if (slug === "letterhead") {
    body = <FitPage width={794} height={1123}><Letterhead /></FitPage>;
    action = <button type="button" className="tx-btn tx-btn--accent" disabled={busy} onClick={() => run(letterheadDoc, "tedxnewy-letterhead.docx")}>Download Word document</button>;
  } else if (slug === "minutes") {
    body = <FitPage width={794} height={1123}><Minutes /></FitPage>;
    action = <button type="button" className="tx-btn tx-btn--accent" disabled={busy} onClick={() => run(minutesDoc, "tedxnewy-minutes.docx")}>Download Word document</button>;
  } else if (slug === "agenda") {
    body = <FitPage width={794} height={1123}><Agenda /></FitPage>;
    action = <button type="button" className="tx-btn tx-btn--accent" disabled={busy} onClick={() => run(agendaDoc, "tedxnewy-agenda.docx")}>Download Word document</button>;
  } else if (slug === "business-card") {
    hint = "Add the details, then save the front and back as PNG files for your printer.";
    body = (
      <div className="tpl-cardrow">
        <div><div className="tpl-small" style={{ marginBottom: 6 }}>Front</div><CardPreview side="front" c={card} /></div>
        <div><div className="tpl-small" style={{ marginBottom: 6 }}>Back</div><CardPreview side="back" c={card} /></div>
      </div>
    );
    controls = (
      <div className="adm-fields">
        {(
          [
            ["name", "Full name", "First Last"],
            ["role", "Role", "Role"],
            ["email", "Email", "name@tedxnewy.com.au"],
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
    action = (
      <>
        <button type="button" className="tx-btn tx-btn--accent" disabled={busy} onClick={() => saveCard("front")}>Save front (PNG)</button>
        <button type="button" className="tx-btn tx-btn--secondary" disabled={busy} onClick={() => saveCard("back")}>Save back (PNG)</button>
      </>
    );
  } else if (slug === "signage") {
    hint = "Click the arrow to turn it, pick a colour and edit the words. Then download it as a PDF to print on A4.";
    body = (
      <FitPage width={1123} height={794}>
        <Signage arrow={arrow} onArrow={() => setArrow(NEXT[arrow])} sign={sign} title={signTitle} sub={signSub} />
      </FitPage>
    );
    controls = (
      <>
        <div className="adm-fields">
          <label className="block">
            <span className="adm-field__l">Main words</span>
            <input className="tx-input" value={signTitle} onChange={(e) => setSignTitle(e.target.value)} />
          </label>
          <label className="block">
            <span className="adm-field__l">Smaller line</span>
            <input className="tx-input" value={signSub} onChange={(e) => setSignSub(e.target.value)} />
          </label>
        </div>
        <div className="adm-pills" role="tablist" aria-label="Sign colour">
          {(["white", "red", "black"] as SignStyle[]).map((s) => (
            <button key={s} type="button" role="tab" aria-selected={sign === s} onClick={() => setSign(s)} className={"adm-pill" + (sign === s ? " is-active" : "")}>
              {s[0].toUpperCase() + s.slice(1)}
            </button>
          ))}
        </div>
      </>
    );
    action = (
      <button type="button" className="tx-btn tx-btn--accent" disabled={busy} onClick={() => run(() => signagePdf({ title: signTitle, sub: signSub, arrow, style: sign }), "tedxnewy-sign.pdf")}>
        Download PDF
      </button>
    );
  }
  if (!body) return null;
  void slugName;

  return (
    <div className="adm-stack adm-stack--tight">
      <div className="adm-head">
        <div>
          <Link href="/admin/brand/templates" className="adm-head__back">
            <Icon name="arrow-left" size={14} /> Templates
          </Link>
          <h1 className="adm-head__title" style={{ marginTop: 12 }}>{title}</h1>
          <p className="adm-head__desc">{hint}</p>
        </div>
        <div className="adm-head__actions">{action}</div>
      </div>
      {controls}
      <div className="tpl-stage tpl-stage--fit">{body}</div>
    </div>
  );
}
