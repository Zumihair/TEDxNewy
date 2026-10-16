"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Icon } from "@/components/ds";
import type { NavGroup } from "./nav-config";

/**
 * Jump to any admin page from the keyboard: Cmd or Ctrl + K, type a few letters,
 * Enter. It lists only the pages this sign-in can reach, because it is built from
 * the same filtered workspaces as the rail.
 */
export default function CommandPalette({
  groups,
  open,
  onClose,
}: {
  groups: NavGroup[];
  open: boolean;
  onClose: () => void;
}) {
  const router = useRouter();
  const [q, setQ] = useState("");
  const [cursor, setCursor] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  const all = useMemo(
    () =>
      groups.flatMap((g) => [
        ...(g.overview || g.items.length === 0
          ? [{ label: g.heading, hint: "Workspace", href: g.href, group: g.heading }]
          : []),
        ...g.items.map((i) => ({ label: i.label, hint: g.heading, href: i.href, group: g.heading })),
      ]),
    [groups],
  );
  const results = useMemo(() => {
    const n = q.trim().toLowerCase();
    return n ? all.filter((r) => `${r.label} ${r.hint}`.toLowerCase().includes(n)) : all;
  }, [all, q]);

  useEffect(() => {
    if (open) {
      setQ("");
      setCursor(0);
      setTimeout(() => inputRef.current?.focus(), 20);
    }
  }, [open]);
  useEffect(() => setCursor(0), [q]);

  if (!open) return null;
  const go = (href: string) => {
    onClose();
    router.push(href);
  };

  return (
    <div className="adm-palette" role="dialog" aria-modal="true" aria-label="Jump to a page" onClick={onClose}>
      <div className="adm-palette__box" onClick={(e) => e.stopPropagation()}>
        <div className="adm-palette__input">
          <Icon name="search" size={18} />
          <input
            ref={inputRef}
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Jump to a page"
            onKeyDown={(e) => {
              if (e.key === "Escape") onClose();
              if (e.key === "ArrowDown") {
                e.preventDefault();
                setCursor((c) => Math.min(c + 1, results.length - 1));
              }
              if (e.key === "ArrowUp") {
                e.preventDefault();
                setCursor((c) => Math.max(c - 1, 0));
              }
              if (e.key === "Enter" && results[cursor]) go(results[cursor].href);
            }}
          />
        </div>
        <ul className="adm-palette__list">
          {results.length === 0 && <li className="adm-palette__empty">Nothing matches that.</li>}
          {results.map((r, i) => (
            <li key={`${r.href}-${r.label}`}>
              <button
                type="button"
                className={"adm-palette__row" + (i === cursor ? " is-on" : "")}
                onMouseEnter={() => setCursor(i)}
                onClick={() => go(r.href)}
              >
                <span>{r.label}</span>
                <span className="adm-palette__hint">{r.hint}</span>
              </button>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
