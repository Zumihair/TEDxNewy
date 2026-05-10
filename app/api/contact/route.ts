import { type NextRequest, NextResponse } from "next/server";
import { getSupabase, clientMeta } from "@/lib/supabase";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  const data = Object.fromEntries(
    new URLSearchParams(await req.text()),
  ) as Record<string, string>;

  const firstName = String(data.firstName ?? "").trim();
  const lastName = String(data.lastName ?? "").trim() || null;
  const email = String(data.email ?? "").trim().toLowerCase();
  const phone = String(data.phone ?? "").trim() || null;
  const message = String(data.message ?? "").trim();

  if (!firstName || !email || !message) {
    return NextResponse.redirect(
      new URL("/contact?status=error", req.url),
      303,
    );
  }

  const supabase = getSupabase();
  const { ua, ip } = clientMeta(req);
  const { error } = await supabase.from("contact_messages").insert({
    first_name: firstName,
    last_name: lastName,
    email,
    phone,
    message,
    user_agent: ua,
    ip,
  });

  if (error) {
    console.error("[contact] supabase error", error);
    return NextResponse.redirect(
      new URL("/contact?status=error", req.url),
      303,
    );
  }

  return NextResponse.redirect(new URL("/thanks?source=contact", req.url), 303);
}
