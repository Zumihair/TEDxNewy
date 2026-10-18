"use client";

import { createContext, useContext, useEffect, type ReactNode } from "react";

const EditCtx = createContext(true);

/** Whether the signed-in access may change things. Client components read it with `useCanEdit()`. */
export function EditProvider({ canEdit, children }: { canEdit: boolean; children: ReactNode }) {
  return <EditCtx.Provider value={canEdit}>{children}</EditCtx.Provider>;
}

export function useCanEdit(): boolean {
  return useContext(EditCtx);
}

/**
 * For a view-only access: forms that post to a server action get their fields locked and their save
 * button hidden (CSS keys off `data-ro-form`), however deep in the page they are. The server refuses
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
