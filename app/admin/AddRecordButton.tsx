"use client";

import type { ReactNode } from "react";
import { Plus } from "lucide-react";
import { Modal } from "./Modal";
import { PrimaryButton } from "./ui";

/**
 * The "Add X" pill that opens a Modal with a Form component inside, in
 * "new" mode. Replaces four near-identical AddSpeakerButton/AddSponsorButton/
 * AddTalkButton/AddTeamMemberButton files (2026-09-06) that differed only in
 * label and which Form/props they rendered. The Form itself, already
 * configured for its own record type, is just passed as `children`.
 */
export default function AddRecordButton({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <Modal
      title={label}
      size="xl"
      trigger={
        <PrimaryButton type="button">
          <Plus className="h-4 w-4" strokeWidth={2.25} />
          {label}
        </PrimaryButton>
      }
    >
      {children}
    </Modal>
  );
}
