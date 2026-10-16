"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireFullAdmin } from "@/lib/cms-auth";
import { getServerSupabase } from "@/lib/supabase-server";

const BACK = "/admin/sponsorship";
const STATUSES = ["talking", "committed", "paid", "declined"];
const KINDS = ["cash", "in_kind"];

function fields(formData: FormData) {
  const year = Number(formData.get("year")) || new Date().getFullYear() + 1;
  const status = String(formData.get("status") ?? "talking");
  const kind = String(formData.get("kind") ?? "cash");
  const amount = Number(String(formData.get("amount") ?? "0").replace(/[^0-9.]/g, "")) || 0;
  return {
    year,
    org_name: String(formData.get("org_name") ?? "").trim(),
    contact_name: String(formData.get("contact_name") ?? "").trim() || null,
    email: String(formData.get("email") ?? "").trim() || null,
    status: STATUSES.includes(status) ? status : "talking",
    kind: KINDS.includes(kind) ? kind : "cash",
    amount,
    notes: String(formData.get("notes") ?? "").trim() || null,
    updated_at: new Date().toISOString(),
  };
}

export async function savePledge(formData: FormData): Promise<void> {
  await requireFullAdmin();
  const id = String(formData.get("id") ?? "");
  const row = fields(formData);
  if (!row.org_name) redirect(`${BACK}?year=${row.year}&error=name`);
  const supabase = await getServerSupabase();
  const { error } = id
    ? await supabase.from("sponsorship_pledges").update(row).eq("id", id)
    : await supabase.from("sponsorship_pledges").insert(row);
  if (error) redirect(`${BACK}?year=${row.year}&error=failed`);
  revalidatePath(BACK);
  redirect(`${BACK}?year=${row.year}&saved=1`);
}

export async function deletePledge(formData: FormData): Promise<void> {
  await requireFullAdmin();
  const id = String(formData.get("id") ?? "");
  const year = Number(formData.get("year")) || "";
  const supabase = await getServerSupabase();
  await supabase.from("sponsorship_pledges").delete().eq("id", id);
  revalidatePath(BACK);
  redirect(`${BACK}?year=${year}&deleted=1`);
}

export async function saveGoal(formData: FormData): Promise<void> {
  await requireFullAdmin();
  const year = Number(formData.get("year"));
  const goal = Number(String(formData.get("goal") ?? "0").replace(/[^0-9.]/g, "")) || 0;
  const supabase = await getServerSupabase();
  await supabase.from("sponsorship_goals").upsert({ year, goal });
  revalidatePath(BACK);
  redirect(`${BACK}?year=${year}&saved=1`);
}
