"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  ArrowLeft,
  Camera,
  Check,
  Handshake,
  Loader2,
  QrCode,
  Sparkles,
} from "lucide-react";
import type { MeResponse, PublicChallenge } from "@/lib/side-quest";
import QrPuzzleModal from "./QrPuzzleModal";
import PhotoCapture from "./PhotoCapture";
import { primaryBtn } from "./SqModal";
import {
  PHOTO_NOTICE,
  SIDE_QUEST_HOME,
  saveToken,
  sqFetch,
  type CompleteResponse,
} from "./client";

/** Mirrors PRIZE_THRESHOLD in lib/side-quest.ts (server-only, so not imported). */
const PRIZE_THRESHOLD = 10;

type Phase =
  | { kind: "loading" }
  | { kind: "intro" }
  | { kind: "not-ready" }
  | { kind: "error"; message: string }
  | { kind: "ready"; me: MeResponse };

const SECTIONS: { key: PublicChallenge["category"]; label: string; blurb: string }[] =
  [
    { key: "connect", label: "Connect", blurb: "Talk to people. Tap when it is done." },
    { key: "capture", label: "Capture", blurb: "Take a photo. It may land on the wall." },
    { key: "discover", label: "Discover", blurb: "Find the hidden codes around the venue." },
  ];

/**
 * Signal Side Quest: the intermission game. One client component for the whole
 * flow (intro, quest list, the two modals) because the player moves between
 * them constantly and a page load would cost them signal and place.
 *
 * `qr` is set when the player arrived by scanning a hidden QR code. The code
 * opens the puzzle in a modal over the quest list. If they have no session
 * yet, they are asked for a first name first, then dropped straight into the
 * puzzle they scanned.
 */
export default function SideQuestApp({ qr }: { qr?: number }) {
  const router = useRouter();
  const [phase, setPhase] = useState<Phase>({ kind: "loading" });
  const [qrOpen, setQrOpen] = useState<number | null>(qr ?? null);
  const [photoFor, setPhotoFor] = useState<PublicChallenge | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  const load = useCallback(async () => {
    const r = await sqFetch<MeResponse>("/api/side-quest/me");
    if (r.ok) {
      setPhase({ kind: "ready", me: r.data });
    } else if (r.status === 401) {
      setPhase({ kind: "intro" });
    } else if (r.status === 503) {
      setPhase({ kind: "not-ready" });
    } else {
      setPhase({ kind: "error", message: r.error });
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const flash = useCallback((message: string) => {
    setToast(message);
    window.setTimeout(() => setToast(null), 3200);
  }, []);

  const applyMe = useCallback(
    (me: MeResponse, crossed: boolean) => {
      setPhase({ kind: "ready", me });
      if (crossed) flash("You're in the prize draw.");
    },
    [flash],
  );

  const closeQr = useCallback(() => {
    setQrOpen(null);
    // A scan lands on /qr/N. Once the puzzle is closed, the URL becomes the
    // plain quest list so a refresh does not reopen the puzzle.
    if (qr !== undefined) router.replace(SIDE_QUEST_HOME);
  }, [qr, router]);

  return (
    <div>
      {phase.kind === "ready" && <ScoreBar me={phase.me} />}
      <div
        className="mx-auto w-full max-w-[520px] px-5 pt-6"
        style={{ paddingBottom: "calc(4rem + env(safe-area-inset-bottom))" }}
      >
      <Link
        href="/signal/links"
        className="mb-6 inline-flex min-h-[44px] items-center gap-1.5 font-mono text-[10.5px] font-semibold uppercase text-white/55 transition-colors hover:text-white"
        style={{ letterSpacing: "0.18em" }}
      >
        <ArrowLeft className="h-3.5 w-3.5" strokeWidth={2.4} aria-hidden />
        Event guide
      </Link>

      {phase.kind === "loading" && (
        <div className="flex items-center gap-3 py-20 text-white/60">
          <Loader2 className="h-5 w-5 animate-spin" aria-hidden />
          <span className="text-[14px]">Loading your quests</span>
        </div>
      )}

      {phase.kind === "not-ready" && (
        <Message
          title="Side Quest opens soon"
          body="Check back at the intermission on Saturday 24 October."
        />
      )}

      {phase.kind === "error" && (
        <div>
          <Message title="Something went wrong" body={phase.message} />
          <button
            type="button"
            onClick={() => {
              setPhase({ kind: "loading" });
              load();
            }}
            className={`${primaryBtn} mt-6`}
          >
            Try again
          </button>
        </div>
      )}

      {phase.kind === "intro" && (
        <Intro
          scanned={qr !== undefined}
          onStarted={async () => {
            await load();
          }}
        />
      )}

      {phase.kind === "ready" && (
        <QuestList
          me={phase.me}
          onSocial={async (c) => {
            const r = await sqFetch<CompleteResponse>(
              "/api/side-quest/complete",
              { method: "POST", body: JSON.stringify({ challengeId: c.id }) },
            );
            if (r.ok) applyMe(r.data.me, r.data.crossedPrizeLine);
            else flash(r.error);
          }}
          onPhoto={(c) => setPhotoFor(c)}
        />
      )}

      {phase.kind === "ready" && qrOpen !== null && (
        <QrPuzzleModal n={qrOpen} onClose={closeQr} onSolved={applyMe} />
      )}

      {phase.kind === "ready" && photoFor && (
        <PhotoCapture
          challengeId={photoFor.id}
          title={photoFor.title}
          points={photoFor.points}
          noticeAcknowledged={phase.me.photoNoticeAck}
          onNoticeAcknowledged={() =>
            setPhase((p) =>
              p.kind === "ready"
                ? { kind: "ready", me: { ...p.me, photoNoticeAck: true } }
                : p,
            )
          }
          onDone={applyMe}
          onClose={() => setPhotoFor(null)}
        />
      )}

      </div>

      {toast && (
        <div
          role="status"
          style={{ bottom: "max(1.5rem, env(safe-area-inset-bottom))" }}
          className="fixed inset-x-5 z-[80] mx-auto max-w-[420px] rounded-full bg-white px-5 py-3.5 text-center font-sans text-[14.5px] font-medium text-[#0d0503] shadow-[0_8px_32px_rgba(0,0,0,0.5)]"
        >
          {toast}
        </div>
      )}
    </div>
  );
}

/**
 * The sticky score bar. Shows the score and the distance to the prize draw
 * line (6 / 10 points, 4 to go), then once past the line a "You're in the
 * prize draw" state with the total out of the maximum. It is a plain opaque
 * bar (no backdrop blur, which iOS Safari composites unreliably over a
 * scrim) pinned to the top of the page, padded for the notch. The modal
 * layer sits above it, so a scrim dims it evenly with everything else.
 * When points arrive the number pops, the bar glows and a "+N" chip floats.
 */
function ScoreBar({ me }: { me: MeResponse }) {
  const prev = useRef(me.score);
  const [bump, setBump] = useState(0);
  const [gain, setGain] = useState(0);

  useEffect(() => {
    if (me.score > prev.current) {
      setGain(me.score - prev.current);
      setBump((n) => n + 1);
      const t = window.setTimeout(() => setGain(0), 1800);
      prev.current = me.score;
      return () => window.clearTimeout(t);
    }
    prev.current = me.score;
  }, [me.score]);

  const inDraw = me.prizeEligible;
  const toGo = Math.max(0, PRIZE_THRESHOLD - me.score);
  const target = inDraw ? Math.max(me.maxScore, PRIZE_THRESHOLD) : PRIZE_THRESHOLD;
  const pct = Math.max(3, Math.min(100, (me.score / target) * 100));
  const markPct = (PRIZE_THRESHOLD / target) * 100;

  return (
    <div
      className="sticky top-0 z-40 border-b border-white/10 bg-[#120604]"
      style={{ paddingTop: "env(safe-area-inset-top)" }}
    >
      <div className="mx-auto w-full max-w-[520px] px-5 pb-3 pt-3">
        <div className="flex items-center justify-between gap-3">
          <div className="relative flex items-baseline gap-1.5">
            <span
              key={bump}
              className={`font-sans text-[30px] font-medium leading-none tracking-[-0.03em] text-white tabular-nums ${
                bump > 0 ? "sq-pop" : ""
              }`}
            >
              {me.score}
            </span>
            <span className="text-[14px] font-medium text-white/55">
              / {inDraw ? me.maxScore : PRIZE_THRESHOLD} points
            </span>
            {gain > 0 && (
              <span
                key={`g${bump}`}
                aria-hidden
                className="sq-float absolute -top-1 left-[calc(100%+10px)] rounded-full bg-[#e62b1e] px-2 py-0.5 font-mono text-[11px] font-semibold text-white"
              >
                +{gain}
              </span>
            )}
          </div>
          {inDraw ? (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-[#e62b1e] px-3 py-1.5 font-sans text-[12.5px] font-medium text-white">
              <Sparkles className="h-3.5 w-3.5" strokeWidth={2.2} aria-hidden />
              You&rsquo;re in the prize draw
            </span>
          ) : (
            <span className="text-[13px] font-medium text-white/70">
              {toGo} to go
            </span>
          )}
        </div>
        <div
          className="relative mt-2.5 h-2 overflow-hidden rounded-full bg-white/10"
          role="progressbar"
          aria-valuemin={0}
          aria-valuemax={target}
          aria-valuenow={me.score}
          aria-label={
            inDraw
              ? `${me.score} of ${me.maxScore} points`
              : `${me.score} of ${PRIZE_THRESHOLD} points for the prize draw`
          }
        >
          <div
            className={`h-full rounded-full bg-[#e62b1e] transition-[width] duration-700 ease-out ${
              bump > 0 ? "sq-glow" : ""
            }`}
            style={{ width: `${pct}%` }}
          />
          {inDraw && markPct < 100 && (
            <span
              aria-hidden
              className="absolute top-0 h-full w-[2px] bg-white/60"
              style={{ left: `${markPct}%` }}
            />
          )}
        </div>
      </div>
      <style>{`
        @keyframes sq-pop { 0% { transform: scale(1); } 35% { transform: scale(1.28); } 100% { transform: scale(1); } }
        @keyframes sq-float { 0% { opacity: 0; transform: translateY(6px); } 20% { opacity: 1; } 100% { opacity: 0; transform: translateY(-10px); } }
        @keyframes sq-glow { 0% { box-shadow: 0 0 0 0 rgba(255,155,143,0.9); } 100% { box-shadow: 0 0 0 10px rgba(255,155,143,0); } }
        .sq-pop { display: inline-block; animation: sq-pop 520ms ease-out; }
        .sq-float { animation: sq-float 1600ms ease-out forwards; }
        .sq-glow { animation: sq-glow 800ms ease-out; }
        @media (prefers-reduced-motion: reduce) {
          .sq-pop, .sq-glow { animation: none; }
          .sq-float { animation: none; opacity: 1; }
        }
      `}</style>
    </div>
  );
}

function Message({ title, body }: { title: string; body: string }) {
  return (
    <div className="py-10">
      <h1 className="font-sans text-[30px] font-medium leading-[1.1] tracking-[-0.03em] text-white">
        {title}
      </h1>
      <p className="mt-3 text-[15.5px] leading-[1.6] text-white/70">{body}</p>
    </div>
  );
}

function Intro({
  scanned,
  onStarted,
}: {
  scanned: boolean;
  onStarted: () => Promise<void>;
}) {
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const start = async (e: React.FormEvent) => {
    e.preventDefault();
    if (busy) return;
    setBusy(true);
    setError(null);
    const r = await sqFetch<{ token: string }>("/api/side-quest/start", {
      method: "POST",
      body: JSON.stringify({ firstName: name }),
    });
    if (!r.ok) {
      setBusy(false);
      setError(r.error);
      return;
    }
    saveToken(r.data.token);
    await onStarted();
    setBusy(false);
  };

  return (
    <div>
      <p
        className="font-mono text-[10.5px] font-semibold uppercase text-[#ff9b8f]"
        style={{ letterSpacing: "0.22em" }}
      >
        Signal · Intermission
      </p>
      <h1 className="mt-3 font-sans text-[44px] font-medium leading-[1.02] tracking-[-0.035em] text-white">
        Signal Side Quest
      </h1>
      <p className="mt-4 text-[16px] leading-[1.6] text-white/75">
        {scanned
          ? "You found a hidden code. Add your first name and the puzzle opens straight away."
          : "Nine quests to play in the break. Meet people, take photos and find hidden codes. Score 10 points and you are in the prize draw."}
      </p>

      <form onSubmit={start} className="mt-8">
        <label
          htmlFor="sq-name"
          className="font-mono text-[10.5px] font-semibold uppercase text-white/60"
          style={{ letterSpacing: "0.18em" }}
        >
          Your first name
        </label>
        <input
          id="sq-name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          autoComplete="given-name"
          enterKeyHint="go"
          maxLength={24}
          placeholder="First name"
          className="mt-2 block min-h-[56px] w-full rounded-2xl border border-white/20 bg-white/[0.06] px-5 font-sans text-[17px] text-white placeholder:text-white/35 focus:border-[#ff9b8f] focus:outline-none focus:ring-2 focus:ring-[#e62b1e]/40"
        />
        {error && (
          <p className="mt-3 text-[14px] text-[#ffb4aa]" role="alert">
            {error}
          </p>
        )}
        <button
          type="submit"
          disabled={busy || name.trim().length === 0}
          className={`${primaryBtn} mt-5`}
        >
          {busy && <Loader2 className="h-5 w-5 animate-spin" aria-hidden />}
          {scanned ? "Start and open the puzzle" : "Start Side Quest"}
        </button>
      </form>

      <p className="mt-6 text-[12.5px] leading-[1.6] text-white/50">
        {PHOTO_NOTICE}
      </p>
    </div>
  );
}

function QuestList({
  me,
  onSocial,
  onPhoto,
}: {
  me: MeResponse;
  onSocial: (c: PublicChallenge) => Promise<void>;
  onPhoto: (c: PublicChallenge) => void;
}) {
  const doneCount = me.challenges.filter((c) => c.done).length;
  const total = me.challenges.length;

  return (
    <div>
      <p className="font-sans text-[15px] text-white/65">
        Hi {me.firstName}.
      </p>

      <p className="mt-1 text-[13.5px] text-white/55">
        {doneCount} of {total} quests done
        {me.prizeEligible && doneCount < total
          ? ". Still got time? There are more quests to find."
          : "."}
      </p>

      {SECTIONS.map((s) => {
        const items = me.challenges.filter((c) => c.category === s.key);
        if (items.length === 0) return null;
        return (
          <section key={s.key} className="mt-9">
            <h2
              className="font-mono text-[11px] font-semibold uppercase text-[#ff9b8f]"
              style={{ letterSpacing: "0.22em" }}
            >
              {s.label}
            </h2>
            <p className="mt-1 text-[13px] text-white/50">{s.blurb}</p>
            <ul className="mt-3 space-y-3">
              {items.map((c) => (
                <li key={c.id}>
                  <QuestCard
                    c={c}
                    onSocial={onSocial}
                    onPhoto={onPhoto}
                  />
                </li>
              ))}
            </ul>
          </section>
        );
      })}
    </div>
  );
}

function QuestCard({
  c,
  onSocial,
  onPhoto,
}: {
  c: PublicChallenge;
  onSocial: (c: PublicChallenge) => Promise<void>;
  onPhoto: (c: PublicChallenge) => void;
}) {
  const [busy, setBusy] = useState(false);
  const Icon =
    c.type === "social" ? Handshake : c.type === "photo" ? Camera : QrCode;

  return (
    <div
      className={`rounded-2xl border p-4 transition-colors ${
        c.done
          ? "border-white/10 bg-white/[0.03]"
          : "border-white/15 bg-white/[0.07]"
      }`}
    >
      <div className="flex items-start gap-3.5">
        <span
          className={`mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${
            c.done ? "bg-[#e62b1e] text-white" : "bg-white/10 text-white/80"
          }`}
          aria-hidden
        >
          {c.done ? (
            <Check className="h-5 w-5" strokeWidth={2.6} />
          ) : (
            <Icon className="h-5 w-5" strokeWidth={1.9} />
          )}
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-3">
            <h3
              className={`font-sans text-[16.5px] font-medium leading-snug tracking-[-0.01em] ${
                c.done ? "text-white/55" : "text-white"
              }`}
            >
              {c.title}
            </h3>
            <span
              className={`shrink-0 rounded-full px-2.5 py-0.5 font-mono text-[11px] font-semibold ${
                c.done
                  ? "bg-white/10 text-white/50"
                  : "bg-[#e62b1e]/25 text-[#ffb4aa]"
              }`}
            >
              +{c.points}
            </span>
          </div>
          <p
            className={`mt-1 text-[14px] leading-[1.5] ${
              c.done ? "text-white/40" : "text-white/65"
            }`}
          >
            {c.description}
          </p>

          {!c.done && c.type === "social" && (
            <button
              type="button"
              disabled={busy}
              onClick={async () => {
                setBusy(true);
                await onSocial(c);
                setBusy(false);
              }}
              className="mt-3 inline-flex min-h-[48px] items-center justify-center gap-2 rounded-full bg-white px-6 font-sans text-[14.5px] font-medium text-[#0d0503] transition-all active:scale-[0.97] disabled:opacity-60"
            >
              {busy && <Loader2 className="h-4 w-4 animate-spin" aria-hidden />}
              I did it
            </button>
          )}
          {!c.done && c.type === "photo" && (
            <button
              type="button"
              onClick={() => onPhoto(c)}
              className="mt-3 inline-flex min-h-[48px] items-center justify-center gap-2 rounded-full bg-white px-6 font-sans text-[14.5px] font-medium text-[#0d0503] transition-all active:scale-[0.97]"
            >
              <Camera className="h-4 w-4" strokeWidth={2.2} aria-hidden />
              Add a photo
            </button>
          )}
          {!c.done && c.type === "qr" && (
            <p className="mt-3 text-[13px] font-medium text-white/55">
              Scan the hidden code to open this one.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
