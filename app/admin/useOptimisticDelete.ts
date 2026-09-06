"use client";

import { useOptimistic, useTransition } from "react";
import { useConfirm } from "./ConfirmDialog";

/**
 * The confirm-then-optimistically-remove-then-call-the-server-action delete
 * flow shared by every admin list table (Events, Talks, Speakers, Team,
 * Sponsors), extracted 2026-09-06 when all five were touched in one pass
 * to swap their Delete button for an icon (see the "Modal-first admin CRUD"
 * CLAUDE.md gotcha) and turned out to be hand-rolling the identical ~15
 * lines each. `fieldName` is "id" for Events/Talks/Sponsors and "slug" for
 * Speakers/Team, matching whatever the delete server action's `FormData`
 * expects.
 */
export function useOptimisticDelete<T>({
  items,
  getKey,
  fieldName,
  confirmTitle,
  confirmBody,
  deleteAction,
}: {
  items: T[];
  getKey: (item: T) => string;
  fieldName: string;
  confirmTitle: (item: T) => string;
  confirmBody: (item: T) => string;
  deleteAction: (formData: FormData) => Promise<void>;
}) {
  const { confirm, dialogs } = useConfirm();
  const [, startTransition] = useTransition();
  const [optimisticItems, removeOne] = useOptimistic(items, (state, key: string) =>
    state.filter((item) => getKey(item) !== key),
  );

  const onDelete = async (item: T) => {
    const ok = await confirm({
      title: confirmTitle(item),
      body: confirmBody(item),
      confirmLabel: "Delete",
      tone: "danger",
    });
    if (!ok) return;
    const key = getKey(item);
    startTransition(async () => {
      removeOne(key);
      const fd = new FormData();
      fd.set(fieldName, key);
      await deleteAction(fd);
    });
  };

  return { items: optimisticItems, onDelete, dialogs };
}
