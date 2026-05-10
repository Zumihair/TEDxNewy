import { type NextRequest, NextResponse } from "next/server";
import { getSupabase, clientMeta } from "@/lib/supabase";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  const data = Object.fromEntries(
    new URLSearchParams(await req.text()),
  ) as Record<string, string>;

  const email = String(data.email ?? "").trim().toLowerCase();
  const source = String(data.source ?? "home");

  if (!email || !email.includes("@")) {
    return NextResponse.redirect(new URL("/?subscribe=error", req.url), 303);
  }

  const supabase = getSupabase();
  const { ua, ip } = clientMeta(req);
  const { error } = await supabase
    .from("subscribers")
    .insert({ email, source, user_agent: ua, ip });

  if (error && error.code !== "23505") {
    // 23505 = unique_violation (already subscribed); treat as success.
    console.error("[subscribe] supabase error", error);
    return NextResponse.redirect(new URL("/?subscribe=error", req.url), 303);
  }

  return NextResponse.redirect(
    new URL("/thanks?source=subscribe", req.url),
    303,
  );
}
