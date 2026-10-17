"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { requireFullAdmin } from "@/lib/cms-auth";
import { getServerSupabase } from "@/lib/supabase-server";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PATH = "/admin/media";

function back(params: string): never {
  revalidatePath(PATH);
  redirect(`${PATH}?${params}`);
}

export async function addMediaContact(formData: FormData): Promise<void> {
  await requireFullAdmin();
  const fullName = String(formData.get("full_name") ?? "").trim();
  const outlet = String(formData.get("outlet") ?? "").trim();
  if (!fullName || !outlet) back("error=missing");
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const supabase = await getServerSupabase();
  const { error } = await supabase.from("cms_media_contacts").insert({
    full_name: fullName,
    outlet,
    title: String(formData.get("title") ?? "").trim() || null,
    email: email && EMAIL_RE.test(email) ? email : null,
    source: "manual",
  });
  back(error ? "error=failed" : "saved=1");
}

export async function updateMediaContact(formData: FormData): Promise<void> {
  await requireFullAdmin();
  const id = String(formData.get("id") ?? "");
  if (!id) return;
  const fullName = String(formData.get("full_name") ?? "").trim();
  const outlet = String(formData.get("outlet") ?? "").trim();
  if (!fullName || !outlet) back("error=missing");
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const supabase = await getServerSupabase();
  const { error } = await supabase
    .from("cms_media_contacts")
    .update({
      full_name: fullName,
      outlet,
      title: String(formData.get("title") ?? "").trim() || null,
      email: email && EMAIL_RE.test(email) ? email : null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id);
  back(error ? "error=failed" : "saved=1");
}

export async function removeMediaContact(formData: FormData): Promise<void> {
  await requireFullAdmin();
  const id = String(formData.get("id") ?? "");
  if (!id) return;
  const supabase = await getServerSupabase();
  await supabase.from("cms_media_contacts").delete().eq("id", id);
  back("saved=1");
}
