"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { Button, Modal } from "@/components/ds";
import type { VolunteerRole } from "@/lib/volunteer-roles";
import { VolunteerForm } from "./shared";

/**
 * Every "Apply" on /volunteer opens this modal with the chosen role prefilled.
 * One provider wraps the page; `useApply()` / `<ApplyButton>` open it.
 * The form is the same VolunteerForm (POST /api/volunteer), so every
 * application lands in the same admin inbox with the role on it.
 */
const Ctx = createContext<(role: VolunteerRole) => void>(() => {});
export const useApply = () => useContext(Ctx);

type Status = "form" | "sending" | "done" | "error";

/** A burst of brand-coloured confetti on a full-screen canvas. Runs on every device, motion settings ignored on purpose. */
function confetti() {
  const c = document.createElement("canvas");
  c.style.cssText = "position:fixed;inset:0;width:100%;height:100%;pointer-events:none;z-index:99999";
  const dpr = window.devicePixelRatio || 1;
  c.width = innerWidth * dpr;
  c.height = innerHeight * dpr;
  document.body.appendChild(c);
  const g = c.getContext("2d");
  if (!g) return c.remove();
  g.scale(dpr, dpr);
  const colours = ["#e62b1e", "#ff9b8f", "#ffffff", "#2a0604", "#f4efe6", "#ffd166"];
  const burst = (x: number, dir: number) =>
    Array.from({ length: 90 }, () => ({
      x,
      y: innerHeight * 0.75,
      vx: dir * (2 + Math.random() * 9) + (Math.random() - 0.5) * 3,
      vy: -(9 + Math.random() * 12),
      w: 6 + Math.random() * 6,
      h: 4 + Math.random() * 5,
      r: Math.random() * 6.28,
      vr: (Math.random() - 0.5) * 0.4,
      c: colours[Math.floor(Math.random() * colours.length)],
    }));
  const ps = [...burst(innerWidth * 0.15, 1), ...burst(innerWidth * 0.85, -1), ...burst(innerWidth * 0.5, 0)];
  const start = performance.now();
  const tick = (t: number) => {
    const age = t - start;
    g.clearRect(0, 0, innerWidth, innerHeight);
    for (const p of ps) {
      p.vy += 0.32;
      p.vx *= 0.992;
      p.x += p.vx;
      p.y += p.vy;
      p.r += p.vr;
      g.save();
      g.globalAlpha = Math.max(0, Math.min(1, (4200 - age) / 1200));
      g.translate(p.x, p.y);
      g.rotate(p.r);
      g.fillStyle = p.c;
      g.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
      g.restore();
    }
    if (age < 4200) requestAnimationFrame(tick);
    else c.remove();
  };
  requestAnimationFrame(tick);
}

export function ApplyProvider({ roles, children }: { roles: VolunteerRole[]; children: React.ReactNode }) {
  const [role, setRole] = useState<VolunteerRole | null>(null);
  const [status, setStatus] = useState<Status>("form");
  const [first, setFirst] = useState("");
  const open = useCallback((r: VolunteerRole) => {
    setStatus("form");
    setRole(r);
  }, []);
  const close = useCallback(() => setRole(null), []);

  // Posts with fetch so the modal can celebrate instead of navigating away.
  // The route answers with a redirect: /thanks on success, /thanks?status=error on failure.
  const send = useCallback(async (body: URLSearchParams) => {
    setFirst(body.get("firstName") ?? "");
    setStatus("sending");
    try {
      const res = await fetch("/api/volunteer", { method: "POST", body });
      if (res.url.includes("status=error")) throw new Error("rejected");
      setStatus("done");
      confetti();
    } catch {
      setStatus("error");
    }
  }, []);
  const value = useMemo(() => open, [open]);

  // Lock page scroll behind the modal, and let #apply links reach it too.
  useEffect(() => {
    if (!role) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [role]);
  useEffect(() => {
    const fromHash = () => {
      if (window.location.hash === "#apply") {
        setRole(roles[0] ?? null);
        history.replaceState(null, "", window.location.pathname);
      }
    };
    fromHash();
    window.addEventListener("hashchange", fromHash);
    return () => window.removeEventListener("hashchange", fromHash);
  }, [roles]);

  return (
    <Ctx.Provider value={value}>
      {children}
      <Modal open={!!role} title={role ? `Apply: ${role.title}` : "Apply"} onClose={close} wide>
        {role && status === "done" && (
          <div className="flex flex-col items-start gap-5 py-4">
            <h3
              className="font-sans text-[34px] font-medium leading-[1.02] tracking-[-0.03em] text-black md:text-[42px]"
              style={{ fontVariationSettings: '"opsz" 96' }}
            >
              Thank you{first ? `, ${first}` : ""}.
            </h3>
            <p className="text-[17px] leading-[1.6] text-[#2a2521]">
              Your application for <strong>{role.title}</strong> is in. If we feel there&rsquo;s promise in it, we&rsquo;ll
              be in touch to have a chat. We&rsquo;ve also sent a confirmation to your inbox.
            </p>
            <Button variant="secondary" size="lg" block onClick={close}>
              Close
            </Button>
          </div>
        )}
        {role && status !== "done" && (
          <div className="flex flex-col gap-5">
            {status === "error" && (
              <div role="alert" className="rounded-2xl border border-[#e62b1e]/30 bg-[#e62b1e]/10 px-5 py-4 text-[14px] font-medium text-[#b91404]">
                Something went wrong and your application was not sent. Please check your details and try again, or
                email hello@tedxnewy.com.au.
              </div>
            )}
            <p className="text-[15px] leading-[1.55] text-[#2a2521]">
              A few minutes, that&rsquo;s all. Someone from the team will be in touch if we feel there&rsquo;s promise in your application.
            </p>
            {/* key remounts the form per role and per retry, so it starts clean and unlocked */}
            <VolunteerForm key={role.slug + (status === "error" ? "-retry" : "")} role={role} onSend={send} />
          </div>
        )}
      </Modal>
    </Ctx.Provider>
  );
}

/** Opens the modal for a role (the Generalist when none is given). */
export function ApplyButton({
  role,
  roles,
  children,
  variant = "accent",
  onDark,
}: {
  role?: VolunteerRole;
  roles: VolunteerRole[];
  children: React.ReactNode;
  variant?: "accent" | "secondary";
  onDark?: boolean;
}) {
  const apply = useApply();
  return (
    <Button variant={variant} size="lg" onDark={onDark} onClick={() => apply(role ?? roles[0])}>
      {children}
    </Button>
  );
}
