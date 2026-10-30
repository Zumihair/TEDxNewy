"use client";

import { useTransition } from "react";
import { Trash2 } from "lucide-react";
import { IconButton } from "../../ui";
import { useConfirm } from "../../ConfirmDialog";

/**
 * A delete button that asks first. A letter or file may be a signed document
 * somebody sent us, so a stray click must not remove it. `action` is the
 * server action (it redirects with a toast); it gets the id as FormData.
 */
export default function DeleteRecord({
  action,
  id,
  title,
  body,
}: {
  action: (formData: FormData) => Promise<void>;
  id: string;
  title: string;
  body: string;
}) {
  const { confirm, dialogs } = useConfirm();
  const [pending, start] = useTransition();

  return (
    <>
      <IconButton
        tone="danger"
        ariaLabel={title}
        title="Delete"
        disabled={pending}
        onClick={async () => {
          const ok = await confirm({ title, body, confirmLabel: "Delete", tone: "danger" });
          if (!ok) return;
          const fd = new FormData();
          fd.set("id", id);
          start(async () => {
            await action(fd);
          });
        }}
      >
        <Trash2 className="h-4 w-4" strokeWidth={2.25} />
      </IconButton>
      {dialogs}
    </>
  );
}
