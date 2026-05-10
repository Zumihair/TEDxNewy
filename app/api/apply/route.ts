import { type NextRequest, NextResponse } from "next/server";
import { getSupabase, clientMeta } from "@/lib/supabase";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  const data = Object.fromEntries(
    new URLSearchParams(await req.text()),
  ) as Record<string, string>;

  const firstName = String(data.firstName ?? "").trim();
  const lastName = String(data.lastName ?? "").trim();
  const email = String(data.email ?? "").trim().toLowerCase();
  const phone = String(data.phone ?? "").trim() || null;
  const crew = String(data.crew ?? "").trim();
  const note = String(data.note ?? "").trim() || null;

  if (!firstName || !lastName || !email || !crew) {
    return NextResponse.redirect(new URL("/apply?status=error", req.url), 303);
  }

  const supabase = getSupabase();
  const { ua, ip } = clientMeta(req);
  const { error } = await supabase.from("applications").insert({
    first_name: firstName,
    last_name: lastName,
    email,
    phone,
    crew,
    note,
    user_agent: ua,
    ip,
  });

  if (error) {
    console.error("[apply] supabase error", error);
    return NextResponse.redirect(new URL("/apply?status=error", req.url), 303);
  }

  return NextResponse.redirect(new URL("/thanks?source=apply", req.url), 303);
}
