"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/cms-auth";
import {
  batchSubscribe,
  listAudienceMembers,
  mailchimpConfigured,
} from "@/lib/mailchimp";
import { getAdminSupabase } from "@/lib/supabase-admin";
import { getServerSupabase } from "@/lib/supabase-server";

export type SyncResult =
  | {
      ok: true;
      pushed: number;
      imported: number;
      resubscribed: number;
      unsubscribed: number;
    }
  | { ok: false; error: string };

/**
 * Two-way sync between the local subscribers table and the Mailchimp
 * audience, so /admin/subscribers mirrors what campaigns actually send to:
 *
 *  1. PUSH: local active subscribers missing from Mailchimp are added there.
 *  2. IMPORT: Mailchimp subscribed members missing locally are inserted,
 *     with their original Mailchimp opt-in date as created_at. That date
 *     matters: the welcome-flow drips select recent signups by created_at,
 *     so importing 800 old contacts as "new today" would drip-email them.
 *  3. ALIGN: where both sides know the address, Mailchimp's status wins
 *     (matching the webhook semantics): unsubscribed/cleaned there marks
 *     the local row unsubscribed, subscribed there clears a local
 *     unsubscribe.
 *
 * Uses the service client for the import/align writes (the anon key is
 * insert-only and admin RLS has no insert policy on subscribers).
 */
export async function syncWithMailchimp(): Promise<SyncResult> {
  await requireAdmin();
  if (!mailchimpConfigured()) {
    return {
      ok: false,
      error:
        "Mailchimp is not connected yet. The env vars need to be set first.",
    };
  }

  let admin;
  try {
    admin = getAdminSupabase();
  } catch {
    return {
      ok: false,
      error:
        "The database service key is not set, so the import cannot write.",
    };
  }

  try {
    // Both full pictures, in parallel.
    const supabase = await getServerSupabase();
    const [members, localRes] = await Promise.all([
      listAudienceMembers(),
      supabase.from("subscribers").select("email, unsubscribed_at"),
    ]);
    if (localRes.error) return { ok: false, error: localRes.error.message };

    const local = new Map<string, { unsubscribedAt: string | null }>();
    for (const r of localRes.data ?? []) {
      const email = String(r.email ?? "").trim().toLowerCase();
      if (email) {
        local.set(email, {
          unsubscribedAt: (r.unsubscribed_at as string | null) ?? null,
        });
      }
    }
    const mcByEmail = new Map(members.map((m) => [m.email, m]));

    // 1. PUSH local active subscribers Mailchimp does not know.
    const toPush: string[] = [];
    for (const [email, row] of local) {
      if (!row.unsubscribedAt && !mcByEmail.has(email)) toPush.push(email);
    }
    if (toPush.length > 0) await batchSubscribe(toPush);

    // 2. IMPORT Mailchimp subscribed members missing locally, keeping their
    //    original opt-in date. These rows are left OUT of the welcome flow
    //    on purpose (flow_started_at stays null): they are an existing
    //    list, not new signups, and enrolling them would send everyone
    //    every step they are already past. Enrol a specific person by
    //    setting flow_started_at on their row.
    const toImport = members.filter(
      (m) => m.status === "subscribed" && !local.has(m.email),
    );
    // Plain inserts: the rows are already filtered against everything local,
    // and the table's unique email index may not exist yet, which makes an
    // ON CONFLICT upsert error.
    const CHUNK = 500;
    for (let i = 0; i < toImport.length; i += CHUNK) {
      const slice = toImport.slice(i, i + CHUNK);
      const { error } = await admin.from("subscribers").insert(
        slice.map((m) => ({
          email: m.email,
          source: "mailchimp",
          created_at: m.optedInAt ?? new Date().toISOString(),
        })),
      );
      if (error) return { ok: false, error: error.message };
    }

    // 3. ALIGN statuses where both sides know the address.
    const toUnsubscribe: string[] = [];
    const toResubscribe: string[] = [];
    for (const m of members) {
      const row = local.get(m.email);
      if (!row) continue;
      const mcUnsubscribed = m.status === "unsubscribed" || m.status === "cleaned";
      if (mcUnsubscribed && !row.unsubscribedAt) toUnsubscribe.push(m.email);
      if (m.status === "subscribed" && row.unsubscribedAt) {
        toResubscribe.push(m.email);
      }
    }
    for (let i = 0; i < toUnsubscribe.length; i += CHUNK) {
      const slice = toUnsubscribe.slice(i, i + CHUNK);
      const { error } = await admin
        .from("subscribers")
        .update({ unsubscribed_at: new Date().toISOString() })
        .in("email", slice);
      if (error) return { ok: false, error: error.message };
    }
    for (let i = 0; i < toResubscribe.length; i += CHUNK) {
      const slice = toResubscribe.slice(i, i + CHUNK);
      const { error } = await admin
        .from("subscribers")
        .update({ unsubscribed_at: null })
        .in("email", slice);
      if (error) return { ok: false, error: error.message };
    }

    revalidatePath("/admin/subscribers");
    return {
      ok: true,
      pushed: toPush.length,
      imported: toImport.length,
      resubscribed: toResubscribe.length,
      unsubscribed: toUnsubscribe.length,
    };
  } catch (err) {
    return { ok: false, error: String(err).slice(0, 300) };
  }
}
