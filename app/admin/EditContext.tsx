"use client";

import { createContext, useContext, useEffect, type ReactNode } from "react";
import { usePathname } from "next/navigation";
import { canWriteAt, type AccessInfo } from "./access";

const EditCtx = createContext<AccessInfo>({ admin: true, canEdit: true, modules: {} });

/** The signed-in access. Client components read what it may do on the current page with `useCanEdit()`. */
export function EditProvider({ access, children }: { access: AccessInfo; children: ReactNode }) {
  return <EditCtx.Provider value={access}>{children}</EditCtx.Provider>;
}

/** Whether the signed-in access may change things in the module of the page it is on. */
export function useCanEdit(): boolean {
  const access = useContext(EditCtx);
  const path = usePathname() ?? "";
  return canWriteAt(path, access);
}

/**
 * Where the access can only read: forms that post to a server action get their fields locked and their
 * save button hidden (CSS keys off `data-ro-form`), however deep in the page they are. The server refuses
 * the write regardless; this just keeps the screen honest.
 */
export function ReadOnlyGuard() {
  const canEdit = useCanEdit();
  useEffect(() => {
    if (canEdit) return;
    // On the root so modals and popovers, which render outside the page frame, are covered too.
    document.documentElement.dataset.ro = "1";
    const lock = () => {
      document.querySelectorAll<HTMLFormElement>("form").forEach((f) => {
        if (f.dataset.roForm || f.dataset.keep || f.closest(".tx-nav")) return;
        const action = f.getAttribute("action") ?? "";
        if (!action.startsWith("javascript:")) return;
        f.dataset.roForm = "1";
        f.querySelectorAll<HTMLElement>("input:not([type=hidden]), textarea, select").forEach((el) => {
          (el as HTMLInputElement).disabled = true;
        });
      });
    };
    lock();
    const mo = new MutationObserver(lock);
    mo.observe(document.body, { childList: true, subtree: true });
    return () => {
      mo.disconnect();
      delete document.documentElement.dataset.ro;
    };
  }, [canEdit]);
  return null;
}
