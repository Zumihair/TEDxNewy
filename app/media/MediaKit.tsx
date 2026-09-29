"use client";

import { useRef, useState } from "react";
import { Copy, Download } from "lucide-react";

const BASE = "/brand/media/TEDxNewy-";

function copyText(text: string): Promise<void> {
  if (navigator.clipboard?.writeText) {
    return navigator.clipboard.writeText(text).catch(() => fallback(text));
  }
  fallback(text);
  return Promise.resolve();
}

function fallback(text: string) {
  const t = document.createElement("textarea");
  t.value = text;
  document.body.appendChild(t);
  t.select();
  try {
    document.execCommand("copy");
  } catch {
    /* nothing more we can do */
  }
  t.remove();
}

/** A button that copies `text` and flashes "Copied" beside itself. */
export function CopyButton({
  text,
  label,
  className,
  children,
}: {
  text: string;
  label: string;
  className?: string;
  children?: React.ReactNode;
}) {
  const [copied, setCopied] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  async function onClick() {
    await copyText(text);
    setCopied(true);
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => setCopied(false), 2200);
  }
  return (
    <>
      <button type="button" onClick={onClick} className={className}>
        {children ?? (
          <>
            <Copy className="h-4 w-4" strokeWidth={2} />
            {label}
          </>
        )}
      </button>
      <span role="status" className="self-center text-[13px] text-[#6b6459]">
        {copied ? "Copied" : ""}
      </span>
    </>
  );
}

export function Swatch({
  name,
  hex,
  fill,
}: {
  name: string;
  hex: string;
  fill: string;
}) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      type="button"
      onClick={async () => {
        await copyText(hex);
        setCopied(true);
        setTimeout(() => setCopied(false), 2200);
      }}
      className="flex items-center gap-3 rounded-full border border-[rgba(0,0,0,0.13)] bg-white py-1.5 pl-1.5 pr-[18px] font-sans text-[14px] font-medium text-[#000000] transition-colors hover:border-[#000000]"
      aria-label={`Copy ${name} ${hex}`}
    >
      <i
        className="block h-8 w-8 flex-none rounded-full border border-[rgba(0,0,0,0.15)]"
        style={{ background: fill }}
      />
      {name}
      <small className="ml-0.5 text-[12px] font-medium tabular-nums text-[#6b6459]">
        {copied ? "Copied" : hex}
      </small>
    </button>
  );
}

const LOGOS = [
  {
    key: "Standard",
    title: "TEDxNewy logo",
    sub: "Main logo · PNG and SVG",
    alt: "TEDxNewy logo",
    wide: true,
    stage: "w-[min(340px,100%)]",
    fixedH: false,
  },
  {
    key: "Tagline-Horizontal",
    title: "Tagline, horizontal",
    sub: "PNG and SVG",
    alt: "Ideas change everything, horizontal",
    wide: false,
    stage: "w-[min(420px,100%)]",
    fixedH: false,
  },
  {
    key: "Tagline-Vertical",
    title: "Tagline, stacked",
    sub: "PNG and SVG",
    alt: "Ideas change everything, stacked",
    wide: false,
    stage: "h-[110px] w-auto",
    fixedH: true,
  },
];

export function LogoCards() {
  return (
    <div className="mt-8 grid grid-cols-1 gap-5 md:grid-cols-2 md:gap-7">
      {LOGOS.map(({ key, ...l }) => (
        <LogoCard key={key} name={key} {...l} />
      ))}
    </div>
  );
}

function LogoCard({
  name,
  title,
  sub,
  alt,
  wide,
  stage,
  fixedH,
}: {
  name: string;
  title: string;
  sub: string;
  alt: string;
  wide: boolean;
  stage: string;
  fixedH: boolean;
}) {
  const [bg, setBg] = useState<"light" | "dark">("light");
  const colour = bg === "dark" ? "white" : "black";
  const src = `${BASE}${name}-${colour}`;
  return (
    <div
      className={`flex min-w-0 flex-col overflow-hidden rounded-[12px] border border-[rgba(0,0,0,0.13)] bg-white ${
        wide ? "md:col-span-2" : ""
      }`}
    >
      <div
        className="flex h-[180px] items-center justify-center px-8 py-6 transition-colors duration-300"
        style={{ background: bg === "dark" ? "#000000" : "#f4efe6" }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={`${src}.png`} alt={alt} className={`block max-w-full ${fixedH ? "" : "h-auto"} ${stage}`} />
      </div>
      <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-3 px-5 py-4">
        <div>
          <div className="text-[14px] font-medium text-[#000000]">{title}</div>
          <div className="text-[12px] text-[#6b6459]">{sub}</div>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <div className="inline-flex rounded-full border border-[rgba(0,0,0,0.13)] p-0.5">
            {(["light", "dark"] as const).map((v) => (
              <button
                key={v}
                type="button"
                aria-pressed={bg === v}
                onClick={() => setBg(v)}
                className={`rounded-full px-3 py-[5px] font-sans text-[12px] font-medium capitalize ${
                  bg === v ? "bg-[#000000] text-white" : "text-[#6b6459]"
                }`}
              >
                {v}
              </button>
            ))}
          </div>
          <div className="flex flex-wrap gap-2">
            {(["png", "svg"] as const).map((ext) => (
              <a
                key={ext}
                href={`${src}.${ext}`}
                download={`TEDxNewy-${name}-${colour}.${ext}`}
                className="inline-flex items-center gap-1.5 rounded-full border border-[rgba(0,0,0,0.13)] bg-white px-3.5 py-[7px] font-sans text-[13px] font-medium uppercase text-[#000000] transition-colors hover:border-[#000000] hover:bg-[#000000] hover:text-white"
              >
                <Download className="h-3.5 w-3.5" strokeWidth={2} />
                {ext}
              </a>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
