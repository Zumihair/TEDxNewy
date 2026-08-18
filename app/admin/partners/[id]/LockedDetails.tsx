"use client";

import { useState } from "react";
import { PenSquare } from "lucide-react";
import type { Partner } from "@/lib/partners";
import { TIER_LABELS } from "@/lib/prospectus-render";
import { Card, Field, PrimaryButton, SecondaryButton, inputCls } from "../../ui";
import { updatePartner } from "../actions";

function ReadRow({ label, value }: { label: string; value: string | null }) {
  if (!value) return null;
  return (
    <div>
      <div
        className="font-mono text-[9.5px] font-semibold uppercase text-[#8a8278]"
        style={{ letterSpacing: "0.18em" }}
      >
        {label}
      </div>
      <div className="mt-0.5 text-[13.5px] leading-[1.5] text-[#141210]">{value}</div>
    </div>
  );
}

/**
 * A confirmed partner's details, read-only by default with an Edit button.
 * Once a deal's signed there's no reason the org name, contact or tier
 * should be one accidental keystroke away from changing — Edit is a
 * deliberate switch into the same form the un-confirmed stages use live.
 */
export default function LockedDetails({ partner }: { partner: Partner }) {
  const [editing, setEditing] = useState(false);

  if (editing) {
    return (
      <Card className="mt-3 p-5">
        <form action={updatePartner} className="space-y-4">
          <input type="hidden" name="id" value={partner.id} />
          <Field label="Organisation">
            <input name="org_name" required defaultValue={partner.orgName} className={inputCls} />
          </Field>
          <Field label="Contact name">
            <input name="contact_name" defaultValue={partner.contactName ?? ""} className={inputCls} />
          </Field>
          <Field label="Email">
            <input name="email" type="email" defaultValue={partner.email ?? ""} className={inputCls} />
          </Field>
          <Field label="Phone">
            <input name="phone" defaultValue={partner.phone ?? ""} className={inputCls} />
          </Field>
          <Field label="Website">
            <input name="website" defaultValue={partner.website ?? ""} className={inputCls} />
          </Field>
          <Field label="Category">
            <input name="category" defaultValue={partner.category ?? ""} className={inputCls} />
          </Field>
          <Field label="Tier">
            <select name="target_tier" className={inputCls} defaultValue={partner.targetTier ?? ""}>
              <option value="">Not sure yet</option>
              <option value="presenting">Presenting · $10k</option>
              <option value="platinum">Platinum · $5k</option>
              <option value="gold">Gold · $2.5k</option>
              <option value="community">Community · $1k</option>
              <option value="in_kind">In-kind</option>
            </select>
          </Field>
          <Field label="Notes">
            <textarea name="notes" rows={3} defaultValue={partner.notes ?? ""} className={inputCls} />
          </Field>
          <div className="flex items-center gap-2">
            <PrimaryButton type="submit">Save details</PrimaryButton>
            <SecondaryButton type="button" onClick={() => setEditing(false)}>
              Cancel
            </SecondaryButton>
          </div>
        </form>
      </Card>
    );
  }

  return (
    <Card className="mt-3 space-y-4 p-5">
      <div className="space-y-3">
        <ReadRow label="Organisation" value={partner.orgName} />
        <ReadRow label="Contact" value={partner.contactName} />
        <ReadRow label="Email" value={partner.email} />
        <ReadRow label="Phone" value={partner.phone} />
        <ReadRow label="Website" value={partner.website} />
        <ReadRow label="Category" value={partner.category} />
        <ReadRow
          label="Tier"
          value={partner.targetTier ? TIER_LABELS[partner.targetTier] : null}
        />
        <ReadRow label="Notes" value={partner.notes} />
      </div>
      <button
        type="button"
        onClick={() => setEditing(true)}
        className="inline-flex items-center gap-1.5 rounded-full bg-[rgba(20,18,16,0.06)] px-3.5 py-1.5 text-[12px] font-medium text-[#141210] transition-colors hover:bg-[rgba(20,18,16,0.10)]"
      >
        <PenSquare className="h-3.5 w-3.5" strokeWidth={2.25} />
        Edit details
      </button>
    </Card>
  );
}
