import type { Tile } from "@/lib/system-caps-types";
import type { Untracked } from "@/lib/system-caps-config";

const STATE_WORD = { ok: "healthy", watch: "to watch", close: "close to a cap" } as const;

/** One line summing up the live tiles. Manual tiles are excluded: a stale
 *  reading should not turn the page amber. */
export function overall(tiles: Tile[]): { tone: "ok" | "watch" | "close"; text: string } {
  const live = tiles.filter((t) => t.kind === "live");
  const close = live.filter((t) => t.status === "close").length;
  const watch = live.filter((t) => t.status === "watch").length;
  if (close > 0) return { tone: "close", text: `${close} close to a cap${watch ? `, ${watch} to watch` : ""}` };
  if (watch > 0) return { tone: "watch", text: `${watch} to watch` };
  return { tone: "ok", text: "All healthy" };
}

export function CapTiles({ tiles, untracked }: { tiles: Tile[]; untracked: Untracked[] }) {
  const o = overall(tiles);
  return (
    <div className="adm-stack">
      <p className={`adm-capsum is-${o.tone}`}>
        <span className="adm-dot" aria-hidden />
        {o.text}
      </p>

      <div className="adm-ctiles">
        {tiles.map((t) => (
          <div
            key={t.key}
            className={`adm-ctile is-${t.kind === "live" ? t.status : "off"}`}
            title={t.hint}
            aria-label={`${t.label}: ${t.value}, ${t.sub}${t.kind === "live" ? `, ${STATE_WORD[t.status]}` : ""}`}
          >
            <div className="adm-ctile__top">
              <span className="adm-ctile__label">{t.label}</span>
              <span className="adm-dot" aria-hidden />
            </div>
            <div className="adm-ctile__value">{t.value}</div>
            {t.pct !== null && (
              <span className="adm-ctile__bar" aria-hidden>
                <i style={{ width: `${t.pct}%` }} />
              </span>
            )}
            <div className="adm-ctile__sub">{t.sub}</div>
          </div>
        ))}
      </div>

      <div className="adm-minis">
        {untracked.map((u) => (
          <a key={u.label} className="adm-mini2" href={u.href} target="_blank" rel="noreferrer">
            <span>{u.label}</span>
            <span>{u.cap}</span>
          </a>
        ))}
      </div>
    </div>
  );
}
