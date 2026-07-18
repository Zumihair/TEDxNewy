import { type NextRequest, NextResponse } from "next/server";
import { getSupabase, clientMeta } from "@/lib/supabase";
import { getAdminSupabase } from "@/lib/supabase-admin";
import { checkSubmission } from "@/lib/anti-spam";
import {
  sendConfirmationEmail,
  sendFormNotification,
} from "@/lib/email-notify";
import { confirmSubscribe, notifySubscribe } from "@/lib/email-templates";
import { upsertMember } from "@/lib/mailchimp";
import { sendFlowStepToNewSubscriber } from "@/lib/subscriber-flow-send";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  const data = Object.fromEntries(
    new URLSearchParams(await req.text()),
  ) as Record<string, string>;

  const email = String(data.email ?? "").trim().toLowerCase();
  const source = String(data.source ?? "home");

  if (!email || !email.includes("@")) {
    return NextResponse.redirect(
      new URL("/thanks?status=error&source=subscribe", req.url),
      303,
    );
  }

  // Bot filter: on a hit, skip the insert + emails and send the visitor to a
  // clear error page. Genuine people caught by mistake get a "try again / email
  // us" prompt (and their address is logged below) rather than silently
  // vanishing; bots just see an error.
  const { spam, reason } = checkSubmission(req, data);
  if (spam) {
    console.warn("[subscribe] dropped spam submission", { reason, email });
    return NextResponse.redirect(
      new URL("/thanks?status=error&source=subscribe", req.url),
      303,
    );
  }

  const supabase = getSupabase();
  const { ua, ip } = clientMeta(req);
  const { error } = await supabase
    .from("subscribers")
    .insert({ email, source, user_agent: ua, ip });

  if (error && error.code !== "23505") {
    // 23505 = unique_violation (already on the list); handled below.
    console.error("[subscribe] supabase error", error);
    return NextResponse.redirect(
      new URL("/thanks?status=error&source=subscribe", req.url),
      303,
    );
  }

  const isNewSubscriber = !error;

  if (isNewSubscriber) {
    // Brand-new signup: add to the Mailchimp audience, notify the team, and
    // run the welcome flow (step 1), falling back to the legacy confirmation
    // if the flow is unavailable. These first-time emails are wanted.
    await upsertMember(email).catch((err) =>
      console.error("[subscribe] mailchimp sync failed", err),
    );
    await sendFormNotification("subscribe", notifySubscribe({ email, source }));
    try {
      const handled = await sendFlowStepToNewSubscriber(email);
      if (!handled) {
        await sendConfirmationEmail(email, confirmSubscribe());
      }
    } catch (flowErr) {
      console.error("[subscribe] welcome flow failed, falling back", flowErr);
      await sendConfirmationEmail(email, confirmSubscribe());
    }
    return NextResponse.redirect(
      new URL("/thanks?source=subscribe", req.url),
      303,
    );
  }

  // Already on the list. If they had previously unsubscribed, reactivate them
  // (clear unsubscribed_at) and re-add to Mailchimp; if they're already active,
  // do nothing. Either way send NO email: an active subscriber must not get a
  // duplicate "you're subscribed", and a reactivation is confirmed on the
  // /thanks page. The service client is needed here because the anon key is
  // insert-only on this table (it cannot read or update it).
  try {
    const admin = getAdminSupabase();
    const { data: existing } = await admin
      .from("subscribers")
      .select("id, unsubscribed_at")
      .eq("email", email)
      .maybeSingle();
    if (existing?.unsubscribed_at) {
      await admin
        .from("subscribers")
        .update({ unsubscribed_at: null })
        .eq("id", existing.id);

      // A returning subscriber has already been welcomed, so suppress the
      // welcome flow: record a "sent" ledger row for every current flow step
      // so neither the instant step nor the cron drips can fire for them again.
      try {
        const { data: steps } = await admin
          .from("subscriber_flow_steps")
          .select("id");
        if (steps && steps.length > 0) {
          await admin.from("subscriber_flow_sends").upsert(
            steps.map((s) => ({
              subscriber_id: existing.id,
              step_id: s.id as string,
            })),
            { onConflict: "subscriber_id,step_id", ignoreDuplicates: true },
          );
        }
      } catch (flowErr) {
        console.error(
          "[subscribe] flow suppression on reactivation failed",
          flowErr,
        );
      }

      await upsertMember(email).catch((err) =>
        console.error("[subscribe] mailchimp reactivate failed", err),
      );
      await sendFormNotification(
        "subscribe",
        notifySubscribe({ email, source: `${source} (reactivated)` }),
      );
    }
  } catch (err) {
    console.error("[subscribe] reactivation check failed", err);
  }

  return NextResponse.redirect(
    new URL("/thanks?source=subscribe", req.url),
    303,
  );
}
