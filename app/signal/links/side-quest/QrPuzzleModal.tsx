"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Check, Loader2, PartyPopper } from "lucide-react";
import type { MeResponse } from "@/lib/side-quest";
import SqModal, { ghostBtn, primaryBtn } from "./SqModal";
import {
  sqFetch,
  type QrAnswerResponse,
  type QrPrompt,
} from "./client";

/** Wait this long after the last keystroke before auto-checking. */
const AUTO_CHECK_MS = 800;
/** Do not auto-check anything shorter than this. */
const MIN_AUTO_LENGTH = 3;

/**
 * The puzzle a scanned QR code opens, shown over the quest list.
 *
 * The answer auto-checks as the player types (after a short pause, once it is
 * a plausible length) and on Enter or the Check button. Every check is a
 * server call: the answer never exists in the browser, and the server
 * rate-limits wrong guesses, so the auto-check cannot be used to brute force.
 */
export default function QrPuzzleModal({
  n,
  onClose,
  onSolved,
}: {
  n: number;
  onClose: () => void;
  onSolved: (me: MeResponse, crossedPrizeLine: boolean) => void;
}) {
  const [prompt, setPrompt] = useState<QrPrompt | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [value, setValue] = useState("");
  const [checking, setChecking] = useState(false);
  const [notQuite, setNotQuite] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [solved, setSolved] = useState<{
    points: number;
    crossed: boolean;
  } | null>(null);
  const lastChecked = useRef("");
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const seq = useRef(0);

  useEffect(() => {
    let live = true;
    sqFetch<QrPrompt>(`/api/side-quest/qr/${n}`).then((r) => {
      if (!live) return;
      if (r.ok) setPrompt(r.data);
      else setLoadError(r.error);
    });
    return () => {
      live = false;
    };
  }, [n]);

  const check = useCallback(
    async (raw: string) => {
      const answer = raw.trim();
      if (!answer || answer === lastChecked.current) return;
      lastChecked.current = answer;
      const mine = ++seq.current;
      setChecking(true);
      setMessage(null);
      const r = await sqFetch<QrAnswerResponse>(
        `/api/side-quest/qr/${n}/answer`,
        { method: "POST", body: JSON.stringify({ answer }) },
      );
      if (mine !== seq.current) return;
      setChecking(false);
      if (!r.ok) {
        // Let the same text be retried after a limit message clears.
        lastChecked.current = "";
        setNotQuite(false);
        setMessage(r.error);
        return;
      }
      if (r.data.correct && r.data.me) {
        setNotQuite(false);
        setSolved({
          points: r.data.points ?? 0,
          crossed: !!r.data.crossedPrizeLine,
        });
        onSolved(r.data.me, !!r.data.crossedPrizeLine);
      } else {
        setNotQuite(true);
      }
    },
    [n, onSolved],
  );

  const onChange = (next: string) => {
    setValue(next);
    setNotQuite(false);
    setMessage(null);
    if (timer.current) clearTimeout(timer.current);
    if (next.trim().length >= MIN_AUTO_LENGTH) {
      timer.current = setTimeout(() => check(next), AUTO_CHECK_MS);
    }
  };

  useEffect(
    () => () => {
      if (timer.current) clearTimeout(timer.current);
    },
    [],
  );

  const title = solved ? "Quest complete" : (prompt?.title ?? "Hidden code");

  return (
    <SqModal title={title} onClose={onClose}>
      {loadError && (
        <>
          <p className="text-[15px] leading-[1.55] text-white/75">
            {loadError}
          </p>
          <button type="button" onClick={onClose} className={`${ghostBtn} mt-6`}>
            Back to quests
          </button>
        </>
      )}

      {!loadError && !prompt && (
        <div className="flex items-center gap-3 py-6 text-white/60">
          <Loader2 className="h-5 w-5 animate-spin" aria-hidden />
          <span className="text-[14px]">Opening the puzzle</span>
        </div>
      )}

      {prompt && prompt.alreadyDone && !solved && (
        <>
          <p className="text-[15px] leading-[1.55] text-white/75">
            You already solved this one. Nice work.
          </p>
          <button type="button" onClick={onClose} className={`${primaryBtn} mt-6`}>
            Back to quests
          </button>
        </>
      )}

      {prompt && solved && (
        <div className="text-center">
          <span className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-[#e62b1e]/20 text-[#ff9b8f]">
            <PartyPopper className="h-8 w-8" strokeWidth={1.7} aria-hidden />
          </span>
          <p className="mt-4 font-sans text-[34px] font-medium leading-none tracking-[-0.03em] text-white">
            +{solved.points}
          </p>
          <p className="mt-2 text-[15px] text-white/70">
            {solved.crossed
              ? "You're in the prize draw."
              : "Points added to your score."}
          </p>
          <button type="button" onClick={onClose} className={`${primaryBtn} mt-7`}>
            Back to quests
          </button>
        </div>
      )}

      {prompt && !prompt.alreadyDone && !solved && (
        <>
          <p className="text-[16px] leading-[1.55] text-white/85">
            {prompt.prompt}
          </p>
          <form
            className="mt-5"
            onSubmit={(e) => {
              e.preventDefault();
              if (timer.current) clearTimeout(timer.current);
              check(value);
            }}
          >
            <label htmlFor="sq-answer" className="sr-only">
              Your answer
            </label>
            <input
              id="sq-answer"
              value={value}
              onChange={(e) => onChange(e.target.value)}
              autoComplete="off"
              autoCapitalize="none"
              autoCorrect="off"
              spellCheck={false}
              enterKeyHint="go"
              maxLength={80}
              placeholder="Type your answer"
              className="block min-h-[56px] w-full rounded-2xl border border-white/20 bg-white/[0.06] px-5 font-sans text-[17px] text-white placeholder:text-white/35 focus:border-[#ff9b8f] focus:outline-none focus:ring-2 focus:ring-[#e62b1e]/40"
            />
            <div className="mt-3 flex min-h-[24px] items-center gap-2 text-[14px]" aria-live="polite">
              {checking && (
                <>
                  <Loader2 className="h-4 w-4 animate-spin text-white/60" aria-hidden />
                  <span className="text-white/60">Checking</span>
                </>
              )}
              {!checking && notQuite && (
                <span className="text-[#ffb4aa]">
                  Not quite. Have another look.
                </span>
              )}
              {!checking && message && (
                <span className="text-[#ffb4aa]">{message}</span>
              )}
            </div>
            <button
              type="submit"
              disabled={checking || value.trim().length === 0}
              className={`${primaryBtn} mt-3`}
            >
              <Check className="h-5 w-5" strokeWidth={2.2} aria-hidden />
              Check answer
            </button>
          </form>
        </>
      )}
    </SqModal>
  );
}
