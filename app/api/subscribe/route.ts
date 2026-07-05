import { type NextRequest, NextResponse } from "next/server";
import { getSupabase, clientMeta } from "@/lib/supabase";
import { checkSubmission } from "@/lib/anti-spam";
import {
  sendConfirmationEmail,
  sendFormNotification,
} from "@/lib/email-notify";
import { confirmSubscribe, notifySubscribe } from "@/lib/email-templates";
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
    // 23505 = unique_violation (already subscribed); treat as success.
    console.error("[subscribe] supabase error", error);
    return NextResponse.redirect(
      new URL("/thanks?status=error&source=subscribe", req.url),
      303,
    );
  }

  // A 23505 means this address is already on the list, so it is not a new
  // subscriber and must not enter the welcome flow again.
  const isNewSubscriber = !error;

  await sendFormNotification("subscribe", notifySubscribe({ email, source }));

  // New subscriber: try the welcome flow (step 1), which replaces the old
  // hardcoded confirmation email. If the flow is unavailable for any reason,
  // for example the service env vars are not set yet, or the step is off or
  // missing, fall back to the legacy confirmation so subscribing never breaks.
  // Returning duplicates keep getting the legacy confirmation, as before.
  if (isNewSubscriber) {
    try {
      const handled = await sendFlowStepToNewSubscriber(email);
      if (!handled) {
        // No active welcome step: use the legacy confirmation instead.
        await sendConfirmationEmail(email, confirmSubscribe());
      }
    } catch (flowErr) {
      console.error("[subscribe] welcome flow failed, falling back", flowErr);
      await sendConfirmationEmail(email, confirmSubscribe());
    }
  } else {
    await sendConfirmationEmail(email, confirmSubscribe());
  }

  return NextResponse.redirect(
    new URL("/thanks?source=subscribe", req.url),
    303,
  );
}
