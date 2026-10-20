"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Badge, Banner, Button, EmptyState, Field, Icon, Meter, Modal, Segmented, Stat } from "@/components/ds";
import type { DoorCheckin, DoorParty, DoorRoster, DoorState, DoorTicket } from "@/lib/door-types";
import { DEMO_ROSTER } from "./demo-data";
import Scanner from "./Scanner";

const STATE_POLL_MS = 4000;
const ROSTER_POLL_MS = 60_000;
const ROW_LIMIT = 120;

type Filter = "all" | "notin" | "in";

const timeOf = (iso: string) =>
  new Date(iso).toLocaleTimeString("en-AU", { hour: "numeric", minute: "2-digit", timeZone: "Australia/Sydney" });

const digitsOf = (s: string) => s.replace(/\D/g, "");

function haystack(p: DoorParty) {
  return [p.buyer, p.email, p.orderId, ...p.tickets.map((t) => t.name)].join(" ").toLowerCase();
}

export default function DoorApp({ token, demo }: { token: string; demo: boolean }) {
  const base = `/api/door/${encodeURIComponent(token)}`;
  const [roster, setRoster] = useState<DoorRoster | null>(demo ? DEMO_ROSTER : null);
  const [checkins, setCheckins] = useState<Record<string, DoorCheckin>>({});
  const [needsSetup, setNeedsSetup] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [offline, setOffline] = useState(false);
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<Filter>("all");
  const [openId, setOpenId] = useState<string | null>(null);
  const [sel, setSel] = useState<Set<string>>(new Set());
  const [done, setDone] = useState<string[] | null>(null);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [nameDraft, setNameDraft] = useState("");
  const [nameOpen, setNameOpen] = useState(false);
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
  const parties = useMemo(() => roster?.parties ?? [], [roster]);

  const totals = useMemo(() => {
    let total = 0;
    let inCount = 0;
    let partiesNotIn = 0;
    let partiesIn = 0;
    for (const p of parties) {
      const n = p.tickets.filter(isIn).length;
      total += p.tickets.length;
      inCount += n;
      if (n < p.tickets.length) partiesNotIn++;
      if (n > 0) partiesIn++;
    }
    return { total, inCount, out: total - inCount, partiesNotIn, partiesIn };
  }, [parties, isIn]);

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    const words = q.split(/\s+/).filter(Boolean);
    const qd = digitsOf(q);
    return parties.filter((p) => {
      const n = p.tickets.filter(isIn).length;
      if (filter === "notin" && n >= p.tickets.length) return false;
      if (filter === "in" && n === 0) return false;
      if (!words.length) return true;
      const h = haystack(p);
      if (words.every((w) => h.includes(w))) return true;
      return qd.length >= 3 && digitsOf(p.phone).includes(qd);
    });
  }, [parties, query, filter, isIn]);

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
    let hit: { party: DoorParty; ticket: DoorTicket | null } | null = null;
    for (const p of parties) {
      const oid = p.orderId.toLowerCase();
      for (const t of p.tickets) {
        if (t.codes.some((c) => c !== oid && text.includes(c))) {
          hit = { party: p, ticket: t };
          break;
        }
      }
      if (hit) break;
    }
    if (!hit) {
      const p = parties.find((x) => text.includes(x.orderId.toLowerCase()));
      if (p) hit = { party: p, ticket: null };
    }
    if (!hit) {
      setScanMsg(`No guest matches that code (${raw.slice(0, 48)}${raw.length > 48 ? "…" : ""}). Search by name instead.`);
      return;
    }
    setScanMsg(null);
    setScanning(false);
    const { party, ticket } = hit;
    openParty(party, ticket && !isIn(ticket) ? [ticket.id] : undefined);
  };

  // ---------------------------------------------------------------------- render
  const pendingOf = (p: DoorParty) => p.tickets.filter((t) => !isIn(t));
  const selTickets = open ? open.tickets.filter((t) => sel.has(t.id)) : [];
  const handOver = [...new Set(selTickets.flatMap((t) => t.perks))];
  const doneTickets = open ? open.tickets.filter((t) => done?.includes(t.id)) : [];
  const doneHandOver = [...new Set(doneTickets.flatMap((t) => t.perks))];

  const setFirst = (n: number) => {
    if (!open) return;
    setSel(new Set(pendingOf(open).slice(0, n).map((t) => t.id)));
  };

  return (
    <div className="dr voice-product">
      <header className="dr-top">
        <div className="dr-top__row">
          <div className="dr-top__title">
            <strong>Door check-in</strong>
            <span>{roster?.eventName ?? "Loading guest list"}</span>
          </div>
          <div className="dr-top__actions">
            <button type="button" className="dr-chip" onClick={() => { setNameDraft(name); setNameOpen(true); }}>
              <Icon name="user" size={14} /> {name || "Add your name"}
            </button>
            <Button size="sm" variant="secondary" className="tx-btn--auto" icon="refresh-cw" loading={refreshing} onClick={refresh} aria-label="Refresh">
              <span className="dr-hide-sm">Refresh</span>
            </Button>
          </div>
        </div>

        <div className="dr-search">
          <Field
            type="search"
            icon="search"
            placeholder="Name, email or phone"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            autoComplete="off"
            autoCorrect="off"
            spellCheck={false}
            aria-label="Search guests"
          />
          <Button variant="accent" className="tx-btn--auto" icon="ticket" iconPosition="start" onClick={() => { setScanMsg(null); setScanning(true); }}>
            Scan
          </Button>
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

        <section className="dr-stats" aria-label="Totals">
          <Stat compact label="Signed in" value={String(totals.inCount)} />
          <Stat compact label="Still to arrive" value={String(totals.out)} />
          <Stat compact label="Total tickets" value={String(totals.total)} />
        </section>
        <Meter
          label="Arrived"
          value={totals.inCount}
          max={Math.max(totals.total, 1)}
          display={totals.total ? `${Math.round((totals.inCount / totals.total) * 100)}%` : "0%"}
          note={`${totals.partiesIn} of ${parties.length} bookings have someone in`}
        />

        <Segmented
          block
          value={filter}
          onChange={(v) => setFilter(v as Filter)}
          options={[
            { value: "all", label: "Everyone", count: parties.length },
            { value: "notin", label: "Not in", count: totals.partiesNotIn },
            { value: "in", label: "Signed in", count: totals.partiesIn },
          ]}
        />

        {!roster && !loadError && <p className="dr-muted">Loading the guest list…</p>}

        {roster && visible.length === 0 && (
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
            const lead = p.tickets[0]?.name ?? p.buyer;
            const perks = [...new Set(p.tickets.flatMap((t) => t.perks))];
            return (
              <li key={p.orderId}>
                <button type="button" className={`dr-row${all ? " is-done" : ""}`} onClick={() => openParty(p)}>
                  <span className="dr-row__main">
                    <strong>{lead}</strong>
                    <span>
                      {p.tickets.length === 1 ? "1 ticket" : `${p.tickets.length} tickets`}
                      {p.buyer && p.buyer !== lead ? ` · booked by ${p.buyer}` : ""}
                    </span>
                    {perks.length > 0 && (
                      <span className="dr-row__perks">
                        {perks.map((x) => (
                          <Badge key={x} tone="info">{x}</Badge>
                        ))}
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
          <p className="dr-muted">Showing the first {ROW_LIMIT} of {visible.length}. Search to narrow it down.</p>
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
              <Button
                variant="accent"
                icon="check"
                loading={saving}
                disabled={sel.size === 0}
                onClick={signIn}
              >
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
                <Banner tone="success" title={`${done.length} signed in`}>
                  {doneTickets.map((t) => t.name).join(", ")}
                </Banner>
                {doneHandOver.length > 0 && (
                  <div className="dr-hand">
                    <strong>Hand over</strong>
                    <ul>
                      {doneTickets
                        .filter((t) => t.perks.length)
                        .map((t) => (
                          <li key={t.id}>
                            {t.name}: {t.perks.join(", ")}
                          </li>
                        ))}
                    </ul>
                  </div>
                )}
                <Button variant="secondary" className="tx-btn--auto" icon="refresh-cw" iconPosition="start" onClick={async () => { if (await mutate("undo", done)) closeParty(); }}>
                  Undo these sign-ins
                </Button>
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

                {pendingOf(open).length > 1 && (
                  <div className="dr-quick" role="group" aria-label="How many are here">
                    <span>How many are here?</span>
                    <div>
                      {Array.from({ length: Math.min(pendingOf(open).length - 1, 4) }, (_, i) => i + 1).map((n) => (
                        <Button key={n} size="sm" className="tx-btn--auto" variant={sel.size === n ? "primary" : "secondary"} onClick={() => setFirst(n)}>
                          {n}
                        </Button>
                      ))}
                      <Button
                        size="sm"
                        className="tx-btn--auto"
                        variant={sel.size === pendingOf(open).length ? "primary" : "secondary"}
                        onClick={() => setFirst(pendingOf(open).length)}
                      >
                        All {pendingOf(open).length}
                      </Button>
                    </div>
                  </div>
                )}

                {handOver.length > 0 && (
                  <div className="dr-hand">
                    <strong>Hand over when they sign in</strong>
                    <ul>
                      {selTickets
                        .filter((t) => t.perks.length)
                        .map((t) => (
                          <li key={t.id}>
                            {t.name}: {t.perks.join(", ")}
                          </li>
                        ))}
                    </ul>
                  </div>
                )}

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
                          {(t.perks.length > 0 || t.shirt) && (
                            <span className="dr-row__perks">
                              {t.perks.map((x) => (
                                <Badge key={x} tone="info">{x}</Badge>
                              ))}
                            </span>
                          )}
                          {t.answers.map((a) => (
                            <span key={a.q + a.a} className="dr-ans">
                              {a.q}: <b>{a.a}</b>
                            </span>
                          ))}
                          {inNow && (
                            <span className="dr-ans">
                              {c ? `Signed in ${timeOf(c.at)}${c.by ? ` by ${c.by}` : ""}` : "Signed in at Humanitix"}
                            </span>
                          )}
                        </div>
                        {c && (
                          <Button size="sm" variant="secondary" className="tx-btn--auto" onClick={() => mutate("undo", [t.id])}>
                            Undo
                          </Button>
                        )}
                      </li>
                    );
                  })}
                </ul>

                {open.orderAnswers.length > 0 && (
                  <div className="dr-order">
                    <strong>Booking details</strong>
                    {open.orderAnswers.map((a) => (
                      <span key={a.q + a.a} className="dr-ans">
                        {a.q}: <b>{a.a}</b>
                      </span>
                    ))}
                  </div>
                )}
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

      {scanning && <Scanner message={scanMsg} onCode={onScan} onClose={() => setScanning(false)} />}
    </div>
  );
}
