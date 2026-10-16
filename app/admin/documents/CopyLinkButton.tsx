"use client";

import { useState } from "react";
import { Check, Link as LinkIcon } from "lucide-react";

/** Copies a document's public link, so it can be pasted straight into an email or a post. */
export default function CopyLinkButton({ url }: { url: string }) {
  const [done, setDone] = useState(false);
  return (
    <button
      type="button"
      className="tx-btn tx-btn--secondary tx-btn--sm tx-btn--auto"
      onClick={() => {
        navigator.clipboard.writeText(url).then(() => {
          setDone(true);
          window.setTimeout(() => setDone(false), 1800);
        });
      }}
    >
      {done ? <Check className="h-3.5 w-3.5" strokeWidth={2.25} /> : <LinkIcon className="h-3.5 w-3.5" strokeWidth={2.25} />}
      {done ? "Copied" : "Copy link"}
    </button>
  );
}
