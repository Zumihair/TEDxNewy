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

export function ApplyProvider({ roles, children }: { roles: VolunteerRole[]; children: React.ReactNode }) {
  const [role, setRole] = useState<VolunteerRole | null>(null);
  const open = useCallback((r: VolunteerRole) => setRole(r), []);
  const close = useCallback(() => setRole(null), []);
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
        {role && (
          <div className="flex flex-col gap-5">
            <p className="text-[15px] leading-[1.55] text-[#2a2521]">
              A few minutes, that&rsquo;s all. Someone from the team will be in touch to have a chat.
            </p>
            {/* key remounts the form per role, so a new pick starts clean */}
            <VolunteerForm key={role.slug} role={role} />
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
