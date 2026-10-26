"use client";

import { useEffect, useRef, useState } from "react";
import { Button, Icon } from "@/components/ds";

/**
 * Camera QR reader (jsQR on a canvas, so it works on iPhones as well as
 * Android). Calls onCode for each distinct code, at most once every 2 seconds
 * for the same text, and leaves closing to the caller.
 */
export default function Scanner({
  onCode,
  onClose,
  message,
}: {
  onCode: (text: string) => void;
  onClose: () => void;
  message: string | null;
}) {
  const video = useRef<HTMLVideoElement>(null);
  const [error, setError] = useState<string | null>(null);
  const onCodeRef = useRef(onCode);
  onCodeRef.current = onCode;

  useEffect(() => {
    let stop = false;
    let stream: MediaStream | null = null;
    let raf = 0;
    const last = { text: "", at: 0 };
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d", { willReadFrequently: true });

    (async () => {
      try {
        const { default: jsQR } = await import("jsqr");
        stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: { ideal: "environment" }, width: { ideal: 1280 } },
          audio: false,
        });
        if (stop || !video.current) return;
        video.current.srcObject = stream;
        await video.current.play();
        const tick = () => {
          const v = video.current;
          if (stop || !v || !ctx) return;
          if (v.readyState >= 2 && v.videoWidth > 0) {
            // A smaller frame decodes faster and is plenty for a ticket QR.
            const scale = Math.min(1, 640 / v.videoWidth);
            canvas.width = Math.round(v.videoWidth * scale);
            canvas.height = Math.round(v.videoHeight * scale);
            ctx.drawImage(v, 0, 0, canvas.width, canvas.height);
            const img = ctx.getImageData(0, 0, canvas.width, canvas.height);
            const hit = jsQR(img.data, img.width, img.height, { inversionAttempts: "dontInvert" });
            const now = Date.now();
            if (hit?.data && (hit.data !== last.text || now - last.at > 2000)) {
              last.text = hit.data;
              last.at = now;
              onCodeRef.current(hit.data);
            }
          }
          raf = window.setTimeout(tick, 120);
        };
        tick();
      } catch (e) {
        setError(
          e instanceof Error && /denied|permission|notallowed/i.test(`${e.name} ${e.message}`)
            ? "Camera access was blocked. Allow the camera for this page in your browser settings, then try again."
            : "Could not start the camera on this device.",
        );
      }
    })();

    return () => {
      stop = true;
      window.clearTimeout(raf);
      stream?.getTracks().forEach((t) => t.stop());
    };
  }, []);

  return (
    <div className="dr-scan" role="dialog" aria-label="Scan a ticket">
      <video ref={video} className="dr-scan__video" playsInline muted />
      <div className="dr-scan__frame" aria-hidden />
      <div className="dr-scan__bar">
        <p className="dr-scan__msg" aria-live="polite">
          {error ?? message ?? "Hold the ticket QR code inside the square."}
        </p>
        <Button variant="primary" className="tx-btn--auto" onDark icon="x" onClick={onClose}>
          Close scanner
        </Button>
      </div>
      {!error && !message && (
        <span className="dr-scan__hint">
          <Icon name="ticket" size={16} /> Scanning
        </span>
      )}
    </div>
  );
}
