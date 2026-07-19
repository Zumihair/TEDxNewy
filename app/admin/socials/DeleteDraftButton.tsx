"use client";

import { useTransition } from "react";
import { Loader2, Trash2 } from "lucide-react";
import { useConfirm } from "../ConfirmDialog";
import { deletePost } from "./actions";

/** Per-row delete on the drafts list, with the shared confirm dialog. */
export default function DeleteDraftButton({
  id,
  title,
}: {
  id: string;
  title: string;
}) {
  const { confirm, dialogs } = useConfirm();
  const [pending, startTransition] = useTransition();

  const handleDelete = async () => {
    const ok = await confirm({
      title: "Delete this draft?",
      body: `"${title}", its caption and its image list are removed. This cannot be undone.`,
      confirmLabel: "Delete draft",
      tone: "danger",
    });
    if (!ok) return;
    const fd = new FormData();
    fd.set("id", id);
    startTransition(async () => {
      await deletePost(fd);
    });
  };

  return (
    <>
      {dialogs}
      <button
        type="button"
        disabled={pending}
        onClick={handleDelete}
        title="Delete draft"
        aria-label={`Delete draft ${title}`}
        className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-[#6b6459] transition-colors hover:bg-[rgba(224,34,20,0.10)] hover:text-[#b91404] disabled:cursor-not-allowed disabled:opacity-50"
      >
        {pending ? (
          <Loader2 className="h-4 w-4 animate-spin" strokeWidth={2.25} />
        ) : (
          <Trash2 className="h-4 w-4" strokeWidth={2.25} />
        )}
      </button>
    </>
  );
}
