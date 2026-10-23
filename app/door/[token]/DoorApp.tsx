"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Badge, Banner, Button, EmptyState, Field, Icon, Modal } from "@/components/ds";
import type { DoorCheckin, DoorParty, DoorRoster, DoorState, DoorTicket } from "@/lib/door-types";
import { DEMO_ROSTER } from "./demo-data";
import Scanner from "./Scanner";

const STATE_POLL_MS = 4000;
const ROSTER_POLL_MS = 60_000;
const ROW_LIMIT = 100;

/** Which list the stat tiles open: people signed in, people still to come, or everyone. */
type View = "in" | "out" | "all";

const timeOf = (iso: string) =>
  new Date(iso).toLocaleTimeString("en-AU", { hour: "numeric", minute: "2-digit", timeZone: "Australia/Sydney" });

const digitsOf = (s: string) => s.replace(/\D/g, "");

function haystack(p: DoorParty) {
  return [p.buyer, p.email, p.orderId, ...p.tickets.map((t) => t.name)].join(" ").toLowerCase();
}

function Chips({ t, supporter }: { t: DoorTicket; supporter: boolean }) {
  if (!supporter && !t.shirt) return null;
  return (
    <span className="dr-chips">
      {supporter && <Badge tone="danger">Supporter</Badge>}
      {t.shirt && <Badge>T-shirt {t.shirt}</Badge>}
    </span>
  );
}

export default function DoorApp({ token, demo }: { token: string; demo: boolean }) {
  const base = `/api/door/${encodeURIComponent(token)}`;
  const [roster, setRoster] = useState<DoorRoster | null>(demo ? DEMO_ROSTER : null);
  const [checkins, setCheckins] = useState<Record<string, DoorCheckin>>({});
  const [noSupp, setNoSupp] = useState<Set<string>>(new Set());
  const [needsSetup, setNeedsSetup] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [offline, setOffline] = useState(false);
  const [query, setQuery] = useState("");
  const [view, setView] = useState<View | null>(null);
  const [openId, setOpenId] = useState<string | null>(null);
  const [sel, setSel] = useState<Set<string>>(new Set());
  const [done, setDone] = useState<string[] | null>(null);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [nameDraft, setNameDraft] = useState("");
  const [nameOpen, setNameOpen] = useState(false);
  const [adminPw, setAdminPw] = useState<string | null>(null);
  const [adminOpen, setAdminOpen] = useState(false);
  const [adminDraft, setAdminDraft] = useState("");
  const [adminError, setAdminError] = useState<string | null>(null);
  const [scanning, setScanning] = useState(false);
  const [scanMsg, setScanMsg] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const busy = useRef(0);

  // ------------------------------------------------------------------ volunteer
  useEffect(() => {
    try {
      const saved = localStorage.getItem("door-name") ?? "";
      setName(saved);
      if (!saved) setNameOpen(true);
      setAdminPw(sessionStorage.getItem("door-admin"));
    } catch {
      setNameOpen(true);
    }
  }, []);

  const saveName = () => {
    const n = nameDraft.trim().slice(0, 40);
    if (!n) return;
    setName(n);
    setNameOpen(false);
    try {
      localStorage.setItem("door-name", n);
    } catch {
      /* private mode: the name just won't be remembered */
    }
  };

  // ----------------------------------------------------------------------- data
  const loadRoster = useCallback(
    async (fresh = false) => {
      if (demo) return;
      try {
        const res = await fetch(`${base}/roster${fresh ? "?fresh=1" : ""}`, { cache: "no-store" });
        const json = await res.json().catch(() => null);
        if (!res.ok) throw new Error(json?.error ?? "Could not load the guest list.");
        setRoster(json as DoorRoster);
        setLoadError(null);
      } catch (e) {
        setLoadError(e instanceof Error ? e.message : "Could not load the guest list.");
      }
    },
    [base, demo],
  );

  const applyState = (s: DoorState) => {
    setCheckins(s.checkins);
    setNoSupp(new Set(s.noSupporter ?? []));
    setNeedsSetup(!!s.needsSetup);
  };

  const loadState = useCallback(async () => {
    if (demo || busy.current > 0) return;
    try {
      const res = await fetch(`${base}/state`, { cache: "no-store" });
      if (!res.ok) throw new Error();
      const s = (await res.json()) as DoorState;
      if (busy.current === 0) applyState(s);
      setOffline(false);
    } catch {
      setOffline(true);
    }
  }, [base, demo]);

  useEffect(() => {
    loadRoster();
    loadState();
    const a = window.setInterval(() => !document.hidden && loadState(), STATE_POLL_MS);
    const b = window.setInterval(() => !document.hidden && loadRoster(), ROSTER_POLL_MS);
    const onVisible = () => !document.hidden && loadState();
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      window.clearInterval(a);
      window.clearInterval(b);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [loadRoster, loadState]);

  const refresh = async () => {
    setRefreshing(true);
    await Promise.all([loadRoster(true), loadState()]);
    setRefreshing(false);
  };

  // --------------------------------------------------------------------- derived
  const isIn = useCallback((t: DoorTicket) => !!checkins[t.id] || t.hxChecked, [checkins]);
  const isSupporter = useCallback((t: DoorTicket) => t.supporter && !noSupp.has(t.id), [noSupp]);
  const parties = useMemo(() => roster?.parties ?? [], [roster]);

  const totals = useMemo(() => {
    let total = 0;
    let inCount = 0;
    for (const p of parties) {
      total += p.tickets.length;
      inCount += p.tickets.filter(isIn).length;
    }
    return { total, inCount, out: total - inCount };
  }, [parties, isIn]);

  const searching = query.trim().length > 0;
  const qWords = query.trim().toLowerCase().split(/\s+/).filter(Boolean);
  const panelOpen = searching || view !== null;

  const visible = useMemo(() => {
    if (!panelOpen) return [];
    const q = query.trim().toLowerCase();
    const words = q.split(/\s+/).filter(Boolean);
    const qd = digitsOf(q);
    return parties.filter((p) => {
      const n = p.tickets.filter(isIn).length;
      if (view === "out" && n >= p.tickets.length) return false;
      if (view === "in" && n === 0) return false;
      if (!words.length) return true;
      if (words.every((w) => haystack(p).includes(w))) return true;
      return qd.length >= 3 && digitsOf(p.phone).includes(qd);
    });
  }, [parties, query, view, isIn, panelOpen]);

  const open = parties.find((p) => p.orderId === openId) ?? null;

  // ------------------------------------------------------------------- mutations
  const mutate = async (action: "in" | "undo", ids: string[]) => {
    if (!ids.length) return false;
    setSaving(true);
    setSaveError(null);
    busy.current++;
    const prev = checkins;
    const stamp = new Date().toISOString();
    setCheckins((c) => {
      const next = { ...c };
      for (const id of ids) {
        if (action === "in") next[id] = next[id] ?? { at: stamp, by: name || null };
        else delete next[id];
      }
      return next;
    });
    try {
      if (!demo) {
        const res = await fetch(`${base}/checkin`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action, ticketIds: ids, by: name }),
        });
        const json = await res.json().catch(() => null);
        if (!res.ok) throw new Error(json?.error ?? "Could not save that.");
        applyState(json as DoorState);
      }
      return true;
    } catch (e) {
      setCheckins(prev);
      setSaveError(e instanceof Error ? e.message : "Could not save that. Try again.");
      return false;
    } finally {
      busy.current--;
      setSaving(false);
    }
  };

  const toggleSupporter = async (t: DoorTicket) => {
    const removed = !noSupp.has(t.id);
    setSaveError(null);
    const prev = noSupp;
    setNoSupp((s) => {
      const next = new Set(s);
      if (removed) next.add(t.id);
      else next.delete(t.id);
      return next;
    });
    if (demo) return;
    busy.current++;
    try {
      const res = await fetch(`${base}/admin`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password: adminPw, ticketId: t.id, removed }),
      });
      const json = await res.json().catch(() => null);
      if (!res.ok) throw new Error(json?.error ?? "Could not save that.");
      applyState(json as DoorState);
    } catch (e) {
      setNoSupp(prev);
      setSaveError(e instanceof Error ? e.message : "Could not save that.");
    } finally {
      busy.current--;
    }
  };

  const unlockAdmin = async () => {
    const pw = adminDraft;
    if (!pw) return;
    setAdminError(null);
    try {
      if (!demo) {
        const res = await fetch(`${base}/admin`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ password: pw }),
        });
        if (!res.ok) throw new Error("That password isn't right.");
      }
      setAdminPw(pw);
      setAdminOpen(false);
      setAdminDraft("");
      try {
        sessionStorage.setItem("door-admin", pw);
      } catch {
        /* fine, they'll sign in again next load */
      }
    } catch (e) {
      setAdminError(e instanceof Error ? e.message : "Could not check that.");
    }
  };

  const exitAdmin = () => {
    setAdminPw(null);
    try {
      sessionStorage.removeItem("door-admin");
    } catch {
      /* nothing stored */
    }
  };

  const openParty = (p: DoorParty, pick?: string[]) => {
    const pending = p.tickets.filter((t) => !isIn(t)).map((t) => t.id);
    setSel(new Set(pick?.length ? pick : pending));
    setDone(null);
    setSaveError(null);
    setOpenId(p.orderId);
  };

  const closeParty = () => {
    setOpenId(null);
    setDone(null);
  };

  const signIn = async () => {
    const ids = [...sel];
    if (await mutate("in", ids)) setDone(ids);
  };

  // --------------------------------------------------------------------- scanning
  const onScan = (raw: string) => {
    const text = raw.trim().toLowerCase();
    let hit: { party: DoorParty } | null = null;
    for (const p of parties) {
      const oid = p.orderId.toLowerCase();
      for (const t of p.tickets) {
        if (t.codes.some((c) => c !== oid && text.includes(c))) {
          hit = { party: p };
          break;
        }
      }
      if (hit) break;
    }
    if (!hit) {
      const p = parties.find((x) => text.includes(x.orderId.toLowerCase()));
      if (p) hit = { party: p };
    }
    if (!hit) {
      setScanMsg(`No guest matches that code (${raw.slice(0, 48)}${raw.length > 48 ? "…" : ""}). Search by name instead.`);
      return;
    }
    setScanMsg(null);
    setScanning(false);
    // Everyone on the booking starts ticked, whether it was found by name or by scan.
    openParty(hit.party);
  };

  const startScan = () => {
    setScanMsg(null);
    setScanning(true);
  };

  // ---------------------------------------------------------------------- render
  const doneTickets = open ? open.tickets.filter((t) => done?.includes(t.id)) : [];
  const panelTitle =
    view === "in" ? "Signed in" : view === "out" ? "Still to arrive" : view === "all" ? "Everyone" : "Results";
  const pct = totals.total ? Math.round((totals.inCount / totals.total) * 100) : 0;

  return (
    <div className="dr voice-product">
      <header className="dr-top">
        <img src="/brand/lockups/TEDxNewy-Standard-mono.svg" alt="TEDxNewy" className="dr-logo" />
        <div className="dr-top__actions">
          <button type="button" className="dr-pill" onClick={() => { setNameDraft(name); setNameOpen(true); }}>
            <Icon name="user" size={14} /> {name || "Add your name"}
          </button>
          <button type="button" className="dr-pill" onClick={refresh} aria-label="Refresh the guest list">
            <Icon name="refresh-cw" size={14} className={refreshing ? "tx-spin" : undefined} /> Refresh
          </button>
        </div>
      </header>

      <main className="dr-main">
        {demo && (
          <Banner tone="info" title="Demo">
            Sample guests only. Nothing here is real and nothing is saved.
          </Banner>
        )}
        {needsSetup && (
          <Banner tone="warning" title="Sign-ins can't be shared yet">
            The door_checkins table has not been created. Run supabase/migrations/20261021_door_checkins.sql in the Supabase SQL editor.
          </Banner>
        )}
        {loadError && (
          <Banner tone="danger" title="Couldn't load the guest list">
            {loadError}
          </Banner>
        )}
        {offline && !loadError && (
          <Banner tone="warning" title="Connection lost">
            Retrying. Sign-ins you make now will not save until you're back online.
          </Banner>
        )}

        <div className="dr-search">
          <Field
            type="search"
            icon="search"
            placeholder="Search name, email or phone"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            autoComplete="off"
            autoCorrect="off"
            spellCheck={false}
            aria-label="Search guests"
          />
          {panelOpen && (
            <Button variant="primary" onDark className="tx-btn--auto dr-search__scan" icon="ticket" onClick={startScan} aria-label="Scan a ticket" />
          )}
        </div>

        {!panelOpen && (
          <>
            <section className="dr-stats" aria-label="Totals">
              <button type="button" className="dr-stat" onClick={() => setView("in")}>
                <b>{totals.inCount}</b>
                <span>Signed in</span>
              </button>
              <button type="button" className="dr-stat" onClick={() => setView("out")}>
                <b>{totals.out}</b>
                <span>Still to arrive</span>
              </button>
              <button type="button" className="dr-stat" onClick={() => setView("all")}>
                <b>{totals.total}</b>
                <span>Total tickets</span>
              </button>
            </section>
            <div className="dr-bar" role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100} aria-label="Arrived">
              <span style={{ width: `${pct}%` }} />
            </div>
            <p className="dr-bar__label">{pct}% have arrived</p>
            {!roster && !loadError && <p className="dr-bar__label">Loading the guest list…</p>}
            <Button variant="primary" onDark size="lg" block icon="ticket" iconPosition="start" onClick={startScan}>
              Scan a ticket
            </Button>
          </>
        )}

        {panelOpen && (
          <section className="dr-panel" aria-label={panelTitle}>
            <div className="dr-panel__head">
              <strong>
                {panelTitle} <span>{visible.length}</span>
              </strong>
              <button type="button" className="dr-panel__close" onClick={() => { setQuery(""); setView(null); }}>
                <Icon name="x" size={16} /> Close
              </button>
            </div>

            {visible.length === 0 && (
              <EmptyState icon="search" title={parties.length ? "No one matches" : "No tickets yet"}>
                {parties.length
                  ? "Try fewer letters, or the last four digits of a phone number."
                  : "Tickets will appear here as soon as Humanitix has them."}
              </EmptyState>
            )}

            <ul className="dr-list">
              {visible.slice(0, ROW_LIMIT).map((p) => {
                const n = p.tickets.filter(isIn).length;
                const all = n === p.tickets.length;
                // Searching a guest name leads the row with that guest, not the booker.
                const hit = qWords.length
                  ? p.tickets.find((t) => qWords.every((w) => t.name.toLowerCase().includes(w)))
                  : undefined;
                const lead = hit?.name ?? p.tickets[0]?.name ?? p.buyer;
                const sup = p.tickets.some(isSupporter);
                const shirts = p.tickets.map((t) => t.shirt).filter(Boolean);
                return (
                  <li key={p.orderId}>
                    <button type="button" className={`dr-row${all ? " is-done" : ""}`} onClick={() => openParty(p)}>
                      <span className="dr-row__main">
                        <strong>{lead}</strong>
                        <span>
                          {p.tickets.length === 1 ? "1 ticket" : `${p.tickets.length} tickets`}
                          {p.buyer && p.buyer !== lead ? ` · booked by ${p.buyer}` : ""}
                        </span>
                        {(sup || shirts.length > 0) && (
                          <span className="dr-chips">
                            {sup && <Badge tone="danger">Supporter</Badge>}
                            {shirts.length > 0 && <Badge>T-shirt {shirts.join(", ")}</Badge>}
                          </span>
                        )}
                      </span>
                      <span className="dr-row__side">
                        {all ? (
                          <Badge tone="success" dot>Signed in</Badge>
                        ) : n > 0 ? (
                          <Badge tone="warning" dot>{n} of {p.tickets.length} in</Badge>
                        ) : (
                          <Badge>Not in</Badge>
                        )}
                        <Icon name="chevron-right" size={16} />
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
            {visible.length > ROW_LIMIT && (
              <p className="dr-panel__more">Showing the first {ROW_LIMIT} of {visible.length}. Search to narrow it down.</p>
            )}
          </section>
        )}

        <footer className="dr-foot">
          {adminPw ? (
            <button type="button" className="dr-link" onClick={exitAdmin}>Admin on. Exit admin</button>
          ) : (
            <button type="button" className="dr-link" onClick={() => { setAdminError(null); setAdminOpen(true); }}>Admin</button>
          )}
          {roster && !demo && (
            <details className="dr-diag">
              <summary>Data check</summary>
              <p>Guest list fetched {timeOf(roster.fetchedAt)}.</p>
              {roster.diag.map((d) => (
                <p key={d}>{d}</p>
              ))}
            </details>
          )}
        </footer>
      </main>

      {/* ---------------------------------------------------------------- booking */}
      <Modal
        open={!!open}
        wide
        title={open?.buyer || "Booking"}
        onClose={closeParty}
        footer={
          open && !done ? (
            <>
              <Button variant="secondary" onClick={closeParty}>Cancel</Button>
              <Button variant="accent" icon="check" loading={saving} disabled={sel.size === 0} onClick={signIn}>
                {sel.size ? `Sign in ${sel.size}` : "Nothing to sign in"}
              </Button>
            </>
          ) : (
            <Button variant="primary" onClick={closeParty}>Done</Button>
          )
        }
      >
        {open && (
          <div className="dr-detail">
            {done ? (
              <div className="dr-done">
                <Banner tone="success" title={done.length === 1 ? "Signed in" : `${done.length} signed in`} />
                <ul className="dr-tickets">
                  {doneTickets.map((t) => (
                    <li key={t.id} className="is-in">
                      <span className="dr-tick dr-tick--in"><Icon name="check" size={16} strokeWidth={3} /></span>
                      <div className="dr-tickets__body">
                        <strong>{t.name}</strong>
                        <Chips t={t} supporter={isSupporter(t)} />
                      </div>
                    </li>
                  ))}
                </ul>
                <div className="dr-done__undo">
                  <Button
                    variant="secondary"
                    className="tx-btn--auto"
                    icon="refresh-cw"
                    iconPosition="start"
                    onClick={async () => {
                      if (await mutate("undo", done)) closeParty();
                    }}
                  >
                    Undo sign-in
                  </Button>
                </div>
              </div>
            ) : (
              <>
                <div className="dr-contact">
                  {open.phone ? (
                    <a href={`tel:${digitsOf(open.phone)}`} className="dr-contact__link">
                      <span className="dr-muted">Call</span> <b>{open.phone}</b>
                    </a>
                  ) : (
                    <span className="dr-muted">No phone on this booking</span>
                  )}
                  {open.email ? (
                    <a href={`mailto:${open.email}`} className="dr-contact__link">
                      <span className="dr-muted">Email</span> <b>{open.email}</b>
                    </a>
                  ) : (
                    <span className="dr-muted">No email on this booking</span>
                  )}
                </div>

                <ul className="dr-tickets">
                  {open.tickets.map((t) => {
                    const c = checkins[t.id];
                    const inNow = !!c || t.hxChecked;
                    return (
                      <li key={t.id} className={inNow ? "is-in" : ""}>
                        {inNow ? (
                          <span className="dr-tick dr-tick--in"><Icon name="check" size={16} strokeWidth={3} /></span>
                        ) : (
                          <input
                            type="checkbox"
                            className="dr-check"
                            aria-label={`Sign in ${t.name}`}
                            checked={sel.has(t.id)}
                            onChange={(e) =>
                              setSel((s) => {
                                const next = new Set(s);
                                if (e.target.checked) next.add(t.id);
                                else next.delete(t.id);
                                return next;
                              })
                            }
                          />
                        )}
                        <div className="dr-tickets__body">
                          <strong>{t.name}</strong>
                          <span>{t.ticketType}</span>
                          <Chips t={t} supporter={isSupporter(t)} />
                          {inNow && (
                            <span className="dr-ans">
                              {c ? `Signed in ${timeOf(c.at)}${c.by ? ` by ${c.by}` : ""}` : "Signed in at Humanitix"}
                            </span>
                          )}
                        </div>
                        {c ? (
                          <Button size="sm" variant="secondary" className="tx-btn--auto" onClick={() => mutate("undo", [t.id])}>
                            Undo
                          </Button>
                        ) : (
                          adminPw &&
                          t.supporter && (
                            <Button size="sm" variant="secondary" className="tx-btn--auto" onClick={() => toggleSupporter(t)}>
                              {noSupp.has(t.id) ? "Make supporter" : "Not a supporter"}
                            </Button>
                          )
                        )}
                      </li>
                    );
                  })}
                </ul>
              </>
            )}
            {saveError && (
              <Banner tone="danger" title="Not saved">
                {saveError}
              </Banner>
            )}
          </div>
        )}
      </Modal>

      {/* -------------------------------------------------------------- your name */}
      <Modal
        open={nameOpen}
        title="Who's on the door?"
        onClose={name ? () => setNameOpen(false) : undefined}
        footer={
          <Button variant="accent" disabled={!nameDraft.trim()} onClick={saveName}>
            Start
          </Button>
        }
      >
        <Field
          label="Your first name"
          hint="Shown next to each guest you sign in, so we can sort out mix-ups."
          value={nameDraft}
          onChange={(e) => setNameDraft(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && saveName()}
          autoFocus
        />
      </Modal>

      {/* ------------------------------------------------------------------ admin */}
      <Modal
        open={adminOpen}
        title="Admin"
        onClose={() => setAdminOpen(false)}
        footer={
          <Button variant="accent" disabled={!adminDraft} onClick={unlockAdmin}>
            Unlock
          </Button>
        }
      >
        <Field
          label="Password"
          hint="Lets you take the supporter tag off a ticket."
          type="password"
          value={adminDraft}
          error={adminError ?? undefined}
          onChange={(e) => setAdminDraft(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && unlockAdmin()}
          autoFocus
        />
      </Modal>

      {scanning && <Scanner message={scanMsg} onCode={onScan} onClose={() => setScanning(false)} />}
    </div>
  );
}
