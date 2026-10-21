"use client";

import { useEffect, useRef, useState } from "react";
import SqModal, { ghostBtn } from "./SqModal";

/**
 * The number in a hidden Side Quest code's link
 * (https://tedxnewy.com.au/signal/links/side-quest/qr/2 gives 2). The host is
 * ignored on purpose so codes still work on a preview deployment.
 */
function qrNumber(text: string): number | null {
  const m = /\/side-quest\/qr\/(\d{1,2})(?:[/?#]|$)/.exec(text);
  if (!m) return null;
  const n = Number(m[1]);
  return n >= 1 ? n : null;
}

/**
 * "Found it?" scanner: reads a hidden code with the camera (jsQR on a canvas,
 * so it works on iPhones as well as Android) and hands the code number back,
 * so the player opens the puzzle without leaving the quest list.
 */
export default function QrScanModal({
  onClose,
  onFound,
}: {
  onClose: () => void;
  onFound: (n: number) => void;
}) {
  const video = useRef<HTMLVideoElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [wrong, setWrong] = useState(false);
  const onFoundRef = useRef(onFound);
  onFoundRef.current = onFound;

  useEffect(() => {
    let stop = false;
    let stream: MediaStream | null = null;
    let timer = 0;
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d", { willReadFrequently: true });

    (async () => {
      try {
        const { default: jsQR } = await import("jsqr");
        stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: { ideal: "environment" }, width: { ideal: 1280 } },
          audio: false,
        });
        if (stop || !video.current) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }
        video.current.srcObject = stream;
        await video.current.play();
        const tick = () => {
          const v = video.current;
          if (stop || !v || !ctx) return;
          if (v.readyState >= 2 && v.videoWidth > 0) {
            const scale = Math.min(1, 640 / v.videoWidth);
            canvas.width = Math.round(v.videoWidth * scale);
            canvas.height = Math.round(v.videoHeight * scale);
            ctx.drawImage(v, 0, 0, canvas.width, canvas.height);
            const img = ctx.getImageData(0, 0, canvas.width, canvas.height);
            const hit = jsQR(img.data, img.width, img.height, {
              inversionAttempts: "dontInvert",
            });
            if (hit?.data) {
              const n = qrNumber(hit.data);
              if (n !== null) {
                stop = true;
                onFoundRef.current(n);
                return;
              }
              setWrong(true);
            }
          }
          timer = window.setTimeout(tick, 120);
        };
        tick();
      } catch (e) {
        setError(
          e instanceof Error && /denied|permission|notallowed/i.test(`${e.name} ${e.message}`)
            ? "Camera access was blocked. Allow the camera for this page in your browser settings, then try again."
            : "Could not start the camera on this device. You can also scan the code with your phone's camera app.",
        );
      }
    })();

    return () => {
      stop = true;
      window.clearTimeout(timer);
      stream?.getTracks().forEach((t) => t.stop());
    };
  }, []);

  return (
    <SqModal title="Scan the hidden code" onClose={onClose}>
      {error ? (
        <p className="text-[15px] leading-[1.55] text-white/75">{error}</p>
      ) : (
        <>
          <div className="relative overflow-hidden rounded-2xl bg-black">
            <video
              ref={video}
              playsInline
              muted
              className="block aspect-square w-full object-cover"
            />
            <div
              aria-hidden
              className="pointer-events-none absolute inset-[18%] rounded-2xl border-2 border-white/80"
            />
          </div>
          <p
            className={`mt-3 min-h-[22px] text-[14px] ${
              wrong ? "text-[#ffb4aa]" : "text-white/60"
            }`}
            aria-live="polite"
          >
            {wrong
              ? "That is not a Side Quest code. Keep looking."
              : "Hold the code inside the square."}
          </p>
        </>
      )}
      <button type="button" onClick={onClose} className={`${ghostBtn} mt-4`}>
        Back to quests
      </button>
    </SqModal>
  );
}
