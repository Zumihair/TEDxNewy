"use server";

import { revalidatePath, revalidateTag } from "next/cache";
import { requireAdmin } from "@/lib/cms-auth";
import { getServerSupabase } from "@/lib/supabase-server";

const PATH = "/admin/navigation";

// Bust the cached nav config and re-render every page (the header lives in the
// root layout, so revalidate the whole layout tree).
function revalidateNav() {
  revalidateTag("nav", "max");
  revalidatePath("/", "layout");
  revalidatePath(PATH);
}

export async function updateGroup(formData: FormData): Promise<void> {
  await requireAdmin();
  const key = String(formData.get("key") ?? "");
  if (!key) return;
  const supabase = await getServerSupabase();
  await supabase
    .from("cms_nav_groups")
    .update({
      label: String(formData.get("label") ?? "").trim() || key,
      kicker: String(formData.get("kicker") ?? "").trim() || null,
      heading: String(formData.get("heading") ?? "").trim() || null,
      blurb: String(formData.get("blurb") ?? "").trim() || null,
    })
    .eq("key", key);
  revalidateNav();
}

export async function addItem(formData: FormData): Promise<void> {
  await requireAdmin();
  const groupKey = String(formData.get("group_key") ?? "");
  if (!groupKey) return;
  const supabase = await getServerSupabase();
  const { data: last } = await supabase
    .from("cms_nav_items")
    .select("display_order")
    .eq("group_key", groupKey)
    .order("display_order", { ascending: false })
    .limit(1)
    .maybeSingle();
  const nextOrder = (last?.display_order ?? 0) + 10;
  await supabase.from("cms_nav_items").insert({
    group_key: groupKey,
    label: "New item",
    display_order: nextOrder,
    is_active: true,
  });
  revalidateNav();
}

export async function updateItem(formData: FormData): Promise<void> {
  await requireAdmin();
  const id = String(formData.get("id") ?? "");
  if (!id) return;
  const supabase = await getServerSupabase();
  await supabase
    .from("cms_nav_items")
    .update({
      label: String(formData.get("label") ?? "").trim() || "Untitled",
      href: String(formData.get("href") ?? "").trim() || null,
      description: String(formData.get("description") ?? "").trim() || null,
      badge: String(formData.get("badge") ?? "").trim() || null,
      image_url: String(formData.get("image_url") ?? "").trim() || null,
      gradient: String(formData.get("gradient") ?? "").trim() || null,
      cta_label: String(formData.get("cta_label") ?? "").trim() || null,
      is_active: String(formData.get("is_active") ?? "") === "true",
    })
    .eq("id", id);
  revalidateNav();
}

export async function deleteItem(formData: FormData): Promise<void> {
  await requireAdmin();
  const id = String(formData.get("id") ?? "");
  if (!id) return;
  const supabase = await getServerSupabase();
  await supabase.from("cms_nav_items").delete().eq("id", id);
  revalidateNav();
}

export async function reorderItem(formData: FormData): Promise<void> {
  await requireAdmin();
  const id = String(formData.get("id") ?? "");
  const groupKey = String(formData.get("group_key") ?? "");
  const dir = String(formData.get("dir") ?? "");
  if (!id || !groupKey || (dir !== "up" && dir !== "down")) return;

  const supabase = await getServerSupabase();
  const { data: items } = await supabase
    .from("cms_nav_items")
    .select("id, display_order")
    .eq("group_key", groupKey)
    .order("display_order", { ascending: true });

  const list = items ?? [];
  const i = list.findIndex((it) => it.id === id);
  if (i < 0) return;
  const j = dir === "up" ? i - 1 : i + 1;
  if (j < 0 || j >= list.length) return;

  const a = list[i];
  const b = list[j];
  await supabase
    .from("cms_nav_items")
    .update({ display_order: b.display_order })
    .eq("id", a.id);
  await supabase
    .from("cms_nav_items")
    .update({ display_order: a.display_order })
    .eq("id", b.id);
  revalidateNav();
}
