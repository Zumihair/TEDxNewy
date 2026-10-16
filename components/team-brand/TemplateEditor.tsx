"use client";

import Link from "next/link";
import type { ReactNode } from "react";
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

const Logo = ({ h = 36 }: { h?: number }) => (
  // eslint-disable-next-line @next/next/no-img-element
  <img src={lockupPath("Standard", "black", "png")} alt="TEDxNewy" style={{ height: h, width: "auto" }} />
);

function Letterhead() {
  return (
    <div className="tpl-page tpl-a4">
      <header className="tpl-row tpl-between">
        <Logo h={40} />
        <div className="tpl-small tpl-right">
          <div>{ORG.legalName}</div>
          <div>ACN {ORG.acn}</div>
          <div>{ORG.email}</div>
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
        {ORG.legalName} · {ORG.formerly}. {ORG.licence}
      </footer>
    </div>
  );
}

function NameBadges() {
  return (
    <div className="tpl-page tpl-a4">
      <div className="tpl-badges">
        {Array.from({ length: 6 }, (_, i) => (
          <div key={i} className="tpl-badge">
            <Logo h={26} />
            <div className="tpl-badge__name"><E block>First Last</E></div>
            <div className="tpl-badge__role"><E block>Role or organisation</E></div>
            <div className="tpl-badge__event"><E>Signal · 24 October 2026</E></div>
          </div>
        ))}
      </div>
    </div>
  );
}

function RunSheet() {
  const rows = [
    ["7:00", "Crew call and bump in", "Producer", "Doors, AV check, signage up"],
    ["9:30", "Speakers arrive", "Speaker lead", "Mic check, green room"],
    ["10:30", "Doors open", "Front of house", "Scan tickets, welcome"],
    ["11:00", "Acknowledgement of Country, opening", "Host", ""],
    ["11:10", "Session one", "Host", ""],
    ["12:30", "Break", "Producer", ""],
    ["1:15", "Session two", "Host", ""],
    ["3:00", "Close and thank yous", "Host", ""],
  ];
  return (
    <div className="tpl-page tpl-a4">
      <header className="tpl-row tpl-between">
        <h1 className="tpl-h1"><E>Run sheet</E></h1>
        <Logo />
      </header>
      <div className="tpl-small"><E>Event name · Date · Venue</E></div>
      <table className="tpl-table">
        <thead><tr><th>Time</th><th>What happens</th><th>Who</th><th>Notes</th></tr></thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={i}>{r.map((c, j) => <td key={j}><E>{c}</E></td>)}</tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function Brief({ title, intro, sections }: { title: string; intro: string; sections: [string, string][] }) {
  return (
    <div className="tpl-page tpl-a4">
      <header className="tpl-row tpl-between">
        <h1 className="tpl-h1"><E>{title}</E></h1>
        <Logo />
      </header>
      <div className="tpl-lead"><E block>{intro}</E></div>
      {sections.map(([h, body]) => (
        <section key={h} style={{ marginTop: 20 }}>
          <h2 className="tpl-h2"><E>{h}</E></h2>
          <E block>{body}</E>
        </section>
      ))}
      <footer className="tpl-foot tpl-small">Questions? {ORG.email}</footer>
    </div>
  );
}

function Signage() {
  return (
    <div className="tpl-page tpl-a3">
      <div className="tpl-sign">
        <Logo h={64} />
        <h1 className="tpl-sign__title"><E block>This way to the auditorium</E></h1>
        <div className="tpl-sign__sub"><E block>Doors open at 10:30</E></div>
        <div className="tpl-sign__arrow" aria-hidden>&rarr;</div>
      </div>
    </div>
  );
}

const BODY: Record<string, () => ReactNode> = {
  letterhead: () => <Letterhead />,
  "name-badges": () => <NameBadges />,
  "run-sheet": () => <RunSheet />,
  "speaker-brief": () => (
    <Brief
      title="Speaker brief"
      intro="Thank you for sharing an idea worth spreading. This is everything you need before you step on stage."
      sections={[
        ["The day", "Arrive at 9:30. Sound check in the auditorium, then the green room. Your slot is at a time we will confirm."],
        ["Your talk", "Stay inside your time. Speak to one idea. Slides are optional and should carry images, not paragraphs."],
        ["On stage", "Lapel mic, clicker and a confidence monitor. Our stage manager will cue you and keep time."],
        ["Afterwards", "We will send the recording and a link to share. Stay for the connection after the show."],
      ]}
    />
  ),
  "volunteer-briefing": () => (
    <Brief
      title="Volunteer briefing"
      intro="Thank you for giving your day. You are the first and last face of the event."
      sections={[
        ["Call time", "Arrive 90 minutes before doors. Sign in with the producer."],
        ["Your role", "Front of house, registration, runners or green room. Your lead will talk you through it."],
        ["What to wear", "Black, comfortable shoes, your lanyard on at all times."],
        ["Who to ask", "Your area lead first, then the producer. In an emergency, go to the nearest crew member."],
      ]}
    />
  ),
  signage: () => <Signage />,
};

export default function TemplateEditor({ slug, title }: { slug: string; title: string }) {
  const render = BODY[slug];
  if (!render) return null;
  return (
    <div className="adm-stack">
      <div className="adm-head tpl-toolbar no-print">
        <div>
          <Link href="/admin/brand?view=templates" className="adm-head__back">
            <Icon name="arrow-left" size={14} /> Brand hub
          </Link>
          <h1 className="adm-head__title" style={{ marginTop: 12 }}>{title}</h1>
          <p className="adm-head__desc">Click any text to edit it, then print or save as PDF. Nothing is stored.</p>
        </div>
        <div className="adm-head__actions">
          <button type="button" className="tx-btn tx-btn--accent" onClick={() => window.print()}>
            Print or save as PDF
          </button>
        </div>
      </div>
      <div className="tpl-stage">{render()}</div>
    </div>
  );
}
