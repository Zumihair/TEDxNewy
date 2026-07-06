"use client";

import PreviewModal from "../_blocks/PreviewModal";
import { previewNewsletter } from "./actions";

/**
 * Preview button for a single row on the newsletter list. Passes the row's
 * content to the shared preview pop-up, so a draft can be previewed without
 * opening the editor.
 */
export default function RowPreviewButton({
  subject,
  preheader,
  blocks,
  scheduledAt,
}: {
  subject: string;
  preheader: string;
  blocks: unknown;
  scheduledAt: string | null;
}) {
  return (
    <PreviewModal
      getHtml={() =>
        previewNewsletter({
          subject,
          preheader,
          blocks,
          scheduled_at: scheduledAt,
        })
      }
    />
  );
}
