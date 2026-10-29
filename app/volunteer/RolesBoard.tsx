"use client";

import { useMemo, useRef, useState } from "react";
import { Button } from "@/components/ds";
import type { VolunteerRole } from "@/lib/volunteer-roles";

/**
 * The "Open roles" board on /volunteer. One role renders as a single feature
 * card; two or more become a list beside a detail panel, with a crew filter
 * once there are enough roles to need one. A posted role's Apply goes to its
 * own page and form; the general role's goes to the form on this page.
 */
/** Where a role's Apply button goes. Kept here, not in lib/volunteer-roles.ts,
 *  so this client file only imports types from that server module. */
const applyHref = (r: VolunteerRole) =>
  r.general ? "/volunteer#apply" : `/volunteer/roles/${r.slug}#apply`;

export default function RolesBoard({ roles }: { roles: VolunteerRole[] }) {
  const crews = useMemo(() => Array.from(new Set(roles.map((r) => r.crew))), [roles]);
  const [crew, setCrew] = useState<string>("all");
  const [selected, setSelected] = useState<string>(roles[0]?.slug ?? "");
  const panelRef = useRef<HTMLDivElement>(null);

  // Below lg the panel sits under the list, so bring it into view on a pick.
  const pick = (slug: string) => {
    setSelected(slug);
    if (!window.matchMedia("(min-width: 1024px)").matches) {
      requestAnimationFrame(() => panelRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }));
    }
  };

  const shown = roles.filter((r) => crew === "all" || r.crew === crew);
  const active = shown.find((r) => r.slug === selected) ?? shown[0];

  if (roles.length === 0) return null;
  if (roles.length === 1) return <RolePanel role={roles[0]} wide />;

  return (
    <div className="flex flex-col gap-8">
      {roles.length >= 4 && crews.length > 1 && (
        <div
          role="group"
          aria-label="Filter roles by crew"
          className="flex w-full gap-1 overflow-x-auto rounded-full border border-black/10 p-1 sm:w-auto sm:self-end"
        >
          {["all", ...crews].map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => setCrew(c)}
              aria-pressed={crew === c}
              className={
                "h-10 shrink-0 rounded-full px-4 text-[14.5px] font-medium transition-colors " +
                (crew === c ? "bg-black text-white" : "text-[#2a2521] hover:bg-black/5")
              }
            >
              {c === "all" ? "All" : c}
            </button>
          ))}
        </div>
      )}
      <div className="grid items-start gap-6 lg:grid-cols-2 lg:gap-7">
        <ul className="flex flex-col gap-3">
          {shown.map((r) => {
            const on = r.slug === active?.slug;
            return (
              <li key={r.slug}>
                <button
                  type="button"
                  onClick={() => pick(r.slug)}
                  aria-pressed={on}
                  className={
                    "grid w-full grid-cols-[minmax(0,1fr)_auto] items-center gap-3 rounded-[20px] border bg-white px-6 py-5 text-left transition hover:-translate-y-0.5 hover:shadow-[0_14px_30px_-18px_rgba(0,0,0,0.35)] " +
                    (on ? "border-black shadow-[0_0_0_1px_#000]" : "border-black/10")
                  }
                >
                  <span className="flex flex-col gap-2.5">
                    <span className="font-sans text-[26px] font-medium leading-[1.05] tracking-[-0.02em] text-black">
                      {r.title}
                    </span>
                    <span className="flex flex-wrap gap-1.5">
                      <Pill tone="cream">{r.crew}</Pill>
                      <Pill tone="outline">{r.time}</Pill>
                      <Pill tone="outline">{r.where}</Pill>
                    </span>
                  </span>
                  <span
                    aria-hidden
                    className={
                      "flex h-10 w-10 items-center justify-center rounded-full " +
                      (on ? "bg-[#e62b1e] text-white" : "bg-[#f4efe6] text-black")
                    }
                  >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                      <path d="M5 12h14M13 6l6 6-6 6" />
                    </svg>
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
        <div ref={panelRef} className="scroll-mt-24 lg:sticky lg:top-24">
          {active && <RolePanel role={active} />}
        </div>
      </div>
    </div>
  );
}

function RolePanel({ role, wide = false }: { role: VolunteerRole; wide?: boolean }) {
  return (
    <div
      className={
        "relative overflow-hidden rounded-[28px] bg-[#2a0604] p-7 text-white md:p-10"
      }
    >
      <GhostX className="pointer-events-none absolute -right-16 -top-16 h-[260px] w-[260px] opacity-[0.07]" />
      <div className={"relative grid gap-8 " + (wide ? "md:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)] md:gap-14" : "")}>
        <div className="flex flex-col gap-5">
          <div className="flex flex-wrap gap-1.5">
            <Pill tone="red">{role.crew}</Pill>
            <Pill tone="dark">{role.time}</Pill>
            <Pill tone="dark">{role.where}</Pill>
          </div>
          <h3
            className="font-sans font-medium text-white"
            style={{ fontSize: "clamp(2.25rem, 4vw, 3rem)", lineHeight: 0.98, letterSpacing: "-0.03em", fontVariationSettings: '"opsz" 96' }}
          >
            {role.title}
          </h3>
          <p className="text-[16.5px] leading-[1.6] text-white/85">{role.summary}</p>
        </div>
        <div className="flex flex-col gap-6">
          <div className="flex flex-col gap-3">
            <div className="text-[14px] font-semibold text-[#ff9b8f]">What you could do</div>
            <ul className="flex flex-col gap-2.5">
              {role.does.map((d) => (
                <li key={d} className="flex items-start gap-3 text-[15.5px] leading-[1.5] text-white/90">
                  <span aria-hidden className="mt-[7px] h-2 w-2 shrink-0 rounded-full bg-[#ff9b8f]" />
                  <span>{d}</span>
                </li>
              ))}
            </ul>
          </div>
          {role.helps && role.helps.length > 0 && (
            <div className="flex flex-col gap-3">
              <div className="text-[14px] font-semibold text-[#ff9b8f]">What helps</div>
              <ul className="flex flex-col gap-2.5">
                {role.helps.map((h) => (
                  <li key={h} className="flex items-start gap-3 text-[15.5px] leading-[1.5] text-white/90">
                    <span aria-hidden className="mt-[7px] h-2 w-2 shrink-0 rounded-full border-2 border-[#ff9b8f]" />
                    <span>{h}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
          <div>
            <Button href={applyHref(role)} variant="accent" size="lg">
              {role.general ? "Apply now" : "Apply for this role"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

function Pill({ tone, children }: { tone: "cream" | "outline" | "red" | "dark"; children: React.ReactNode }) {
  const cls = {
    cream: "bg-[#f4efe6] text-black",
    outline: "border border-black/15 bg-white text-black",
    red: "bg-[#e62b1e] text-white",
    dark: "bg-white/10 text-white",
  }[tone];
  return <span className={"inline-flex min-h-7 items-center rounded-full px-3 py-1 text-[12.5px] font-semibold leading-tight " + cls}>{children}</span>;
}

export function GhostX({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 100 100" aria-hidden className={className}>
      <path d="M16 16 84 84M84 16 16 84" stroke="currentColor" strokeWidth="15" strokeLinecap="round" fill="none" />
    </svg>
  );
}
