"use client";

// Word documents for the brand templates. Generated in the browser with the `docx` package, so there is
// nothing to host: a click downloads a real .docx the team can edit and send. Arial stands in for
// Helvetica, which the brand guide treats as equivalent to Inter and every machine has.

import {
  AlignmentType,
  BorderStyle,
  Document,
  Footer,
  Header,
  ImageRun,
  Packer,
  PageOrientation,
  Paragraph,
  Table,
  TableCell,
  TableRow,
  TextRun,
  WidthType,
  type ParagraphChild,
} from "docx";

const FONT = "Arial";
const RED = "E62B1E";
const INK = "000000";
const STONE = "6B6459";
const LINE = "D8D2C8";
const ORG = {
  legalName: "Newcastle Ideas Network Limited",
  acn: "694 346 319",
  url: "tedxnewy.com.au",
  licence: "This independent TEDx event is operated under licence from TED.",
};

async function bytes(path: string): Promise<Uint8Array> {
  const r = await fetch(path);
  return new Uint8Array(await r.arrayBuffer());
}

async function logo(colour: "black" | "white" | "mono", width: number) {
  const data = await bytes(`/brand/lockups/TEDxNewy-Standard-${colour}.png`);
  const height = Math.round(width * (400 / 1557));
  return new ImageRun({ type: "png", data, transformation: { width, height } });
}

const run = (text: string, o: { size?: number; bold?: boolean; color?: string } = {}) =>
  new TextRun({ text, font: FONT, size: (o.size ?? 11) * 2, bold: o.bold, color: o.color ?? INK });

const para = (children: ParagraphChild[] | string, o: { after?: number; before?: number; align?: (typeof AlignmentType)[keyof typeof AlignmentType] } = {}) =>
  new Paragraph({
    children: typeof children === "string" ? [run(children)] : children,
    spacing: { after: o.after ?? 120, before: o.before ?? 0 },
    alignment: o.align,
  });

const none = { style: BorderStyle.NONE, size: 0, color: "FFFFFF" };
const hair = { style: BorderStyle.SINGLE, size: 4, color: LINE };

function cell(text: string, o: { bold?: boolean; head?: boolean; width?: number } = {}) {
  return new TableCell({
    width: o.width ? { size: o.width, type: WidthType.PERCENTAGE } : undefined,
    margins: { top: 90, bottom: 90, left: 80, right: 80 },
    borders: { top: none, left: none, right: none, bottom: o.head ? { style: BorderStyle.SINGLE, size: 12, color: INK } : hair },
    children: [para([run(text, { size: o.head ? 10 : 10.5, bold: o.bold || o.head, color: o.head ? STONE : INK })], { after: 0 })],
  });
}

function grid(head: [string, number][], rows: string[][]) {
  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows: [
      new TableRow({ tableHeader: true, children: head.map(([h, w]) => cell(h, { head: true, width: w })) }),
      ...rows.map((r) => new TableRow({ children: r.map((c, i) => cell(c, { width: head[i][1] })) })),
    ],
  });
}

function metaTable(rows: [string, string][]) {
  const pairs: [string, string][][] = [];
  for (let i = 0; i < rows.length; i += 2) pairs.push(rows.slice(i, i + 2));
  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows: pairs.map(
      (p) =>
        new TableRow({
          children: [0, 1].map((k) => {
            const item = p[k];
            return new TableCell({
              width: { size: 50, type: WidthType.PERCENTAGE },
              margins: { top: 60, bottom: 60, left: 0, right: 120 },
              borders: { top: none, left: none, right: none, bottom: none },
              children: item
                ? [para([run(item[0], { size: 9, color: STONE })], { after: 0 }), para([run(item[1], { size: 11 })], { after: 80 })]
                : [para("")],
            });
          }),
        }),
    ),
  });
}

async function header(title?: string) {
  const l = await logo("black", 150);
  return new Header({
    children: [
      new Paragraph({
        children: [l],
        spacing: { after: title ? 240 : 120 },
      }),
    ],
  });
}

const footer = () =>
  new Footer({
    children: [
      new Paragraph({
        border: { top: { style: BorderStyle.SINGLE, size: 4, color: LINE, space: 6 } },
        children: [run(`${ORG.legalName}  |  ACN ${ORG.acn}  |  ${ORG.url}`, { size: 8.5, color: STONE })],
      }),
    ],
  });

const page = { margin: { top: 1300, bottom: 1100, left: 1200, right: 1200 } };

export async function letterheadDoc(): Promise<Blob> {
  const doc = new Document({
    creator: "TEDxNewy",
    title: "TEDxNewy letterhead",
    styles: { default: { document: { run: { font: FONT, size: 22 } } } },
    sections: [
      {
        properties: { page },
        headers: { default: await header() },
        footers: {
          default: new Footer({
            children: [
              new Paragraph({
                border: { top: { style: BorderStyle.SINGLE, size: 4, color: LINE, space: 6 } },
                children: [run(`${ORG.legalName}  |  ACN ${ORG.acn}  |  ${ORG.url}`, { size: 8.5, color: STONE })],
              }),
              new Paragraph({ children: [run(ORG.licence, { size: 8.5, color: STONE })] }),
            ],
          }),
        },
        children: [
          para("Date", { after: 360, before: 240 }),
          para("Recipient name", { after: 0 }),
          para("Organisation", { after: 0 }),
          para("Address", { after: 360 }),
          para("Dear Name,", { after: 240 }),
          para("Write your letter here.", { after: 360 }),
          para("Warm regards,", { after: 480 }),
          para("Name", { after: 0 }),
          para([run("Role, TEDxNewy", { color: STONE })]),
        ],
      },
    ],
  });
  return Packer.toBlob(doc);
}

export async function minutesDoc(): Promise<Blob> {
  const items = [
    ["1", "Welcome and apologies", "", ""],
    ["2", "Minutes of the last meeting", "", "Accepted or amended"],
    ["3", "Item", "", ""],
    ["4", "Item", "", ""],
    ["5", "Other business", "", ""],
  ];
  const doc = new Document({
    creator: "TEDxNewy",
    title: "Meeting minutes",
    styles: { default: { document: { run: { font: FONT, size: 22 } } } },
    sections: [
      {
        properties: { page },
        headers: { default: await header() },
        footers: { default: footer() },
        children: [
          para([run("Meeting minutes", { size: 24, bold: true })], { after: 200 }),
          metaTable([
            ["Meeting", "Board meeting"],
            ["Date and time", "Date, start to finish"],
            ["Location", "Venue or link"],
            ["Chair", "Name"],
            ["Minutes by", "Name"],
            ["Present", "Names"],
            ["Apologies", "Names"],
          ]),
          para("", { after: 120 }),
          grid(
            [
              ["No.", 6],
              ["Item", 24],
              ["Discussion", 46],
              ["Decision", 24],
            ],
            items,
          ),
          para([run("Actions", { size: 13, bold: true })], { before: 360, after: 120 }),
          grid(
            [
              ["Action", 60],
              ["Owner", 22],
              ["Due", 18],
            ],
            [["Action", "Owner", "Due"], ["Action", "Owner", "Due"], ["Action", "Owner", "Due"]],
          ),
          para([run("Next meeting", { size: 9, color: STONE })], { before: 300, after: 0 }),
          para("Date, time and place"),
        ],
      },
    ],
  });
  return Packer.toBlob(doc);
}

export async function agendaDoc(): Promise<Blob> {
  const rows = [
    ["6:00", "Welcome and apologies", "Chair", ""],
    ["6:05", "Minutes of the last meeting", "Chair", ""],
    ["6:10", "Item", "Name", ""],
    ["6:30", "Item", "Name", ""],
    ["6:50", "Other business", "All", ""],
    ["7:00", "Close", "Chair", ""],
  ];
  const doc = new Document({
    creator: "TEDxNewy",
    title: "Agenda",
    styles: { default: { document: { run: { font: FONT, size: 22 } } } },
    sections: [
      {
        properties: { page },
        headers: { default: await header() },
        footers: { default: footer() },
        children: [
          para([run("Agenda", { size: 24, bold: true })], { after: 200 }),
          metaTable([
            ["Meeting", "Board meeting"],
            ["Date and time", "Date, start to finish"],
            ["Location", "Venue or link"],
            ["Chair", "Name"],
          ]),
          para("", { after: 120 }),
          grid(
            [
              ["Time", 12],
              ["Item", 46],
              ["Lead", 20],
              ["Notes", 22],
            ],
            rows,
          ),
          para([run("Please bring or read beforehand", { size: 9, color: STONE })], { before: 300, after: 0 }),
          para("List any papers or reports."),
        ],
      },
    ],
  });
  return Packer.toBlob(doc);
}

export type SignArrow = "right" | "left" | "up";
export type SignStyle = "white" | "red" | "black";

/** The arrow as a PNG, so the sign looks the same in Word, Pages and print. */
function arrowPng(arrow: SignArrow, colour: string): Promise<Uint8Array> {
  const c = document.createElement("canvas");
  c.width = c.height = 600;
  const ctx = c.getContext("2d")!;
  ctx.translate(300, 300);
  ctx.rotate(({ right: 0, left: Math.PI, up: -Math.PI / 2 } as const)[arrow]);
  ctx.strokeStyle = colour;
  ctx.lineWidth = 46;
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  ctx.beginPath();
  ctx.moveTo(-210, 0);
  ctx.lineTo(210, 0);
  ctx.moveTo(60, -150);
  ctx.lineTo(210, 0);
  ctx.lineTo(60, 150);
  ctx.stroke();
  return new Promise((res) =>
    c.toBlob(async (b) => res(new Uint8Array(await b!.arrayBuffer())), "image/png"),
  );
}

export async function signageDoc(o: { title: string; sub: string; arrow: SignArrow; style: SignStyle }): Promise<Blob> {
  const bg = o.style === "white" ? "FFFFFF" : o.style === "red" ? RED : "000000";
  const fg = o.style === "white" ? INK : "FFFFFF";
  const sub = o.style === "white" ? STONE : "F3E3E1";
  const arrowColour = o.style === "white" ? "#E62B1E" : "#FFFFFF";
  const l = await logo(o.style === "white" ? "black" : o.style === "red" ? "mono" : "white", 420);
  const arrow = new ImageRun({ type: "png", data: await arrowPng(o.arrow, arrowColour), transformation: { width: 300, height: 300 } });
  const doc = new Document({
    creator: "TEDxNewy",
    title: "TEDxNewy sign",
    background: { color: bg },
    styles: { default: { document: { run: { font: FONT } } } },
    sections: [
      {
        properties: {
          page: {
            size: { width: 16838, height: 23811, orientation: PageOrientation.LANDSCAPE },
            margin: { top: 1200, bottom: 1200, left: 1400, right: 1400 },
          },
        },
        children: [
          new Paragraph({ alignment: AlignmentType.CENTER, spacing: { before: 600, after: 600 }, children: [l] }),
          new Paragraph({
            alignment: AlignmentType.CENTER,
            spacing: { after: 360 },
            children: [new TextRun({ text: o.title, font: FONT, size: 200, bold: true, color: fg })],
          }),
          new Paragraph({
            alignment: AlignmentType.CENTER,
            spacing: { after: 600 },
            children: [new TextRun({ text: o.sub, font: FONT, size: 64, color: sub })],
          }),
          new Paragraph({ alignment: AlignmentType.CENTER, children: [arrow] }),
        ],
      },
    ],
  });
  return Packer.toBlob(doc);
}

export function downloadBlob(blob: Blob, name: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 4000);
}
