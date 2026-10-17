"use client";

import { useState } from "react";
import { Check, Download, ExternalLink, Link as LinkIcon } from "lucide-react";

/** One photo in the grid. Hover (or tap on a phone) shows Open, Download and Copy link over it. */
export default function ImageTile({ url, thumb, label }: { url: string; thumb: string; label: string }) {
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  return (
    <div
      className={"adm-tile" + (open ? " is-open" : "")}
      onClick={() => setOpen((v) => !v)}
      title={label}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={thumb} alt="" loading="lazy" />
      <div className="adm-tile__over" onClick={(e) => e.stopPropagation()}>
        <a href={url} target="_blank" rel="noreferrer" aria-label="Open full size" title="Open full size">
          <ExternalLink className="h-4 w-4" strokeWidth={2.25} />
        </a>
        <a href={url} download aria-label="Download" title="Download">
          <Download className="h-4 w-4" strokeWidth={2.25} />
        </a>
        <button
          type="button"
          aria-label="Copy link"
          title="Copy link"
          onClick={() => {
            navigator.clipboard.writeText(url).then(() => {
              setCopied(true);
              window.setTimeout(() => setCopied(false), 1500);
            });
          }}
        >
          {copied ? <Check className="h-4 w-4" strokeWidth={2.5} /> : <LinkIcon className="h-4 w-4" strokeWidth={2.25} />}
        </button>
      </div>
    </div>
  );
}
