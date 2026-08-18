"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireFullAdmin } from "@/lib/cms-auth";
import { getServerSupabase } from "@/lib/supabase-server";

const DOCUMENTS_BUCKET = "documents";

/**
 * Record a document that the browser has already uploaded to the
 * `documents` storage bucket (see DocumentUploader.tsx). The upload itself
 * runs client-side under the admin's own session, the same way image
 * uploads do, so this action only writes the row.
 */
export async function addDocument(formData: FormData): Promise<void> {
  const { email } = await requireFullAdmin();

  const title = String(formData.get("title") ?? "").trim();
  const description =
    String(formData.get("description") ?? "").trim() || null;
  const category =
    String(formData.get("category") ?? "").trim() || "General";
  const file_url = String(formData.get("file_url") ?? "").trim();
  const storage_path =
    String(formData.get("storage_path") ?? "").trim() || null;
  const file_name = String(formData.get("file_name") ?? "").trim() || null;
  const mime_type = String(formData.get("mime_type") ?? "").trim() || null;
  const sizeRaw = Number(formData.get("size_bytes") ?? 0);
  const size_bytes = Number.isFinite(sizeRaw) && sizeRaw > 0 ? sizeRaw : null;

  if (!title || !file_url) {
    redirect("/admin/documents?error=missing");
  }

  const supabase = await getServerSupabase();
  const { error } = await supabase.from("cms_documents").insert({
    title,
    description,
    category,
    file_url,
    storage_path,
    file_name,
    mime_type,
    size_bytes,
    created_by: email,
  });

  if (error) {
    console.error("[admin/documents] insert error", error);
    redirect("/admin/documents?error=failed");
  }
  revalidatePath("/admin/documents");
  redirect("/admin/documents?added=1");
}

/**
 * Delete a document row and, when we uploaded it ourselves, the file behind
 * it. Rows that point at an external URL (no storage_path) just lose the row.
 */
export async function removeDocument(formData: FormData): Promise<void> {
  await requireFullAdmin();
  const id = String(formData.get("id") ?? "").trim();
  if (!id) return;

  const supabase = await getServerSupabase();
  const { data: row } = await supabase
    .from("cms_documents")
    .select("id, storage_path")
    .eq("id", id)
    .maybeSingle();

  if (row?.storage_path) {
    const { error: storageError } = await supabase.storage
      .from(DOCUMENTS_BUCKET)
      .remove([row.storage_path]);
    if (storageError) {
      // Not fatal: the row still goes, and an orphaned file is harmless.
      console.warn("[admin/documents] storage remove failed", storageError);
    }
  }

  const { error } = await supabase.from("cms_documents").delete().eq("id", id);
  if (error) {
    console.error("[admin/documents] delete error", error);
    redirect("/admin/documents?error=failed");
  }
  revalidatePath("/admin/documents");
  redirect("/admin/documents?removed=1");
}
