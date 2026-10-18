"use client";

import { useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { SOCIALS, SOCIAL_BY_KEY, type SocialLink } from "@/lib/social-catalogue";
import { SocialIcon } from "@/components/SocialIcon";

/**
 * Add as many social links as you like, each picked from the catalogue of networks. Posts one hidden
 * field (\`name\`) holding the list as JSON; the server cleans it. The same list drives the public team
 * page and the icons in the email signature.
 */
export default function SocialsEditor({ name = "socials", initial }: { name?: string; initial: SocialLink[] }) {
  const [rows, setRows] = useState<SocialLink[]>(initial);
  const set = (i: number, patch: Partial<SocialLink>) => setRows(rows.map((r, j) => (j === i ? { ...r, ...patch } : r)));
  const used = new Set(rows.map((r) => r.key));
  const nextKey = SOCIALS.find((s) => !used.has(s.key))?.key ?? "website";

  return (
    <div className="adm-socials">
      <input type="hidden" name={name} value={JSON.stringify(rows.filter((r) => r.url.trim()))} />
      {rows.map((r, i) => (
        <div key={i} className="adm-socials__row">
          <span className="adm-socials__icon">
            <SocialIcon name={r.key} size={18} />
          </span>
          <select
            aria-label="Network"
            className="tx-input adm-socials__net"
            value={r.key}
            onChange={(e) => set(i, { key: e.target.value })}
          >
            {SOCIALS.map((s) => (
              <option key={s.key} value={s.key}>{s.label}</option>
            ))}
          </select>
          <input
            aria-label={`${SOCIAL_BY_KEY[r.key]?.label ?? "Social"} link`}
            type="url"
            className="tx-input adm-socials__url"
            value={r.url}
            placeholder={SOCIAL_BY_KEY[r.key]?.placeholder ?? "https://"}
            onChange={(e) => set(i, { url: e.target.value })}
          />
          <button type="button" className="adm-linkbtn" onClick={() => setRows(rows.filter((_, j) => j !== i))}>
            <Trash2 className="h-4 w-4" />
            <span className="sr-only">Remove</span>
          </button>
        </div>
      ))}
      <div>
        <button
          type="button"
          className="tx-btn tx-btn--secondary tx-btn--sm tx-btn--auto"
          onClick={() => setRows([...rows, { key: nextKey, url: "" }])}
        >
          <Plus className="h-4 w-4" strokeWidth={2.25} />
          Add a social
        </button>
      </div>
    </div>
  );
}
