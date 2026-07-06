"use client";

import { useState } from "react";
import { ChevronDown, ChevronUp, Save, Trash2 } from "lucide-react";
import ImageUploadField from "../ImageUploadField";
import { Field, inputCls } from "../ui";
import {
  PendingButton,
  PendingDangerButton,
  PendingIconButton,
} from "../PendingButtons";
import { deleteItem, reorderItem, updateItem } from "./actions";

export type NavItem = {
  id: string;
  group_key: string;
  label: string;
  href: string | null;
  description: string | null;
  badge: string | null;
  image_url: string | null;
  gradient: string | null;
  cta_label: string | null;
  is_active: boolean;
};

export default function NavItemRow({
  item,
  style,
  isFirst,
  isLast,
}: {
  item: NavItem;
  style: "list" | "cards";
  isFirst: boolean;
  isLast: boolean;
}) {
  const [active, setActive] = useState(item.is_active);
  const isCards = style === "cards";

  return (
    <div className="rounded-[var(--radius-md)] border border-[rgba(20,18,16,0.10)] bg-[#f9f5ec] p-4">
      <div className="flex items-start gap-3">
        {/* Reorder */}
        <div className="flex flex-col">
          <form action={reorderItem}>
            <input type="hidden" name="id" value={item.id} />
            <input type="hidden" name="group_key" value={item.group_key} />
            <input type="hidden" name="dir" value="up" />
            <PendingIconButton disabled={isFirst} ariaLabel="Move up" title="Move up">
              <ChevronUp className="h-4 w-4" strokeWidth={2.25} />
            </PendingIconButton>
          </form>
          <form action={reorderItem}>
            <input type="hidden" name="id" value={item.id} />
            <input type="hidden" name="group_key" value={item.group_key} />
            <input type="hidden" name="dir" value="down" />
            <PendingIconButton
              disabled={isLast}
              ariaLabel="Move down"
              title="Move down"
            >
              <ChevronDown className="h-4 w-4" strokeWidth={2.25} />
            </PendingIconButton>
          </form>
        </div>

        {/* Edit form */}
        <form action={updateItem} className="min-w-0 flex-1 space-y-4">
          <input type="hidden" name="id" value={item.id} />
          <input type="hidden" name="is_active" value={active ? "true" : "false"} />

          <div className="grid gap-4 md:grid-cols-2">
            <Field label="Label">
              <input
                name="label"
                defaultValue={item.label}
                className={inputCls}
                placeholder="e.g. Talks"
              />
            </Field>
            <Field
              label="Link"
              hint="Where it goes, e.g. /talks. Leave blank for a Coming soon item."
            >
              <input
                name="href"
                defaultValue={item.href ?? ""}
                className={inputCls}
                placeholder="/talks"
              />
            </Field>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <Field label={isCards ? "Subtitle" : "Description"}>
              <input
                name="description"
                defaultValue={item.description ?? ""}
                className={inputCls}
                placeholder={isCards ? "Watch every TEDxNewy talk" : "Short hint"}
              />
            </Field>
            <Field label="Badge" hint="Optional pill, e.g. Coming soon.">
              <input
                name="badge"
                defaultValue={item.badge ?? ""}
                className={inputCls}
                placeholder="Coming soon"
              />
            </Field>
          </div>

          {isCards ? (
            <>
              <div className="grid gap-4 md:grid-cols-2">
                <Field label="Button label">
                  <input
                    name="cta_label"
                    defaultValue={item.cta_label ?? ""}
                    className={inputCls}
                    placeholder="Learn more"
                  />
                </Field>
                <Field
                  label="Background gradient"
                  hint="A CSS gradient behind the image."
                >
                  <input
                    name="gradient"
                    defaultValue={item.gradient ?? ""}
                    className={`${inputCls} font-mono text-[12px]`}
                    placeholder="linear-gradient(135deg, #2a0604 0%, #b91404 100%)"
                  />
                </Field>
              </div>
              <ImageUploadField
                name="image_url"
                label="Card image"
                defaultValue={item.image_url ?? ""}
                folder="nav"
                baseName={item.label}
                aspect="16/9"
                hint="Shown behind the card. Drag and drop, click to pick, or paste a URL."
              />
            </>
          ) : (
            <>
              {/* Keep hidden card-only fields so they aren't wiped on save. */}
              <input type="hidden" name="image_url" value={item.image_url ?? ""} />
              <input type="hidden" name="gradient" value={item.gradient ?? ""} />
              <input type="hidden" name="cta_label" value={item.cta_label ?? ""} />
            </>
          )}

          <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
            <label className="inline-flex items-center gap-2 text-[13px] font-medium text-[#2a2521]">
              <input
                type="checkbox"
                checked={active}
                onChange={(e) => setActive(e.currentTarget.checked)}
                className="h-4 w-4 rounded border-[rgba(20,18,16,0.3)] text-[#e02214] focus:ring-[#e02214]/30"
              />
              Show this item
            </label>
            <div className="flex items-center gap-2">
              <PendingButton icon={<Save className="h-4 w-4" strokeWidth={2.25} />}>
                Save item
              </PendingButton>
            </div>
          </div>
        </form>

        {/* Delete */}
        <form action={deleteItem}>
          <input type="hidden" name="id" value={item.id} />
          <PendingDangerButton
            icon={<Trash2 className="h-3.5 w-3.5" strokeWidth={2.25} />}
          >
            Delete
          </PendingDangerButton>
        </form>
      </div>
    </div>
  );
}
