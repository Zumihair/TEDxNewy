import { type NextRequest, NextResponse } from "next/server";
import { getSupabase, clientMeta } from "@/lib/supabase";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  const data = Object.fromEntries(
    new URLSearchParams(await req.text()),
  ) as Record<string, string>;

  const organisation = String(data.organisation ?? "").trim();
  const contactName = String(data.contactName ?? "").trim();
  const role = String(data.role ?? "").trim() || null;
  const email = String(data.email ?? "").trim().toLowerCase();
  const phone = String(data.phone ?? "").trim() || null;
  const tier = String(data.tier ?? "").trim() || null;
  const message = String(data.message ?? "").trim();

  if (!organisation || !contactName || !email || !message) {
    return NextResponse.redirect(
      new URL("/partner?status=error", req.url),
      303,
    );
  }

  const supabase = getSupabase();
  const { ua, ip } = clientMeta(req);
  const { error } = await supabase.from("partner_enquiries").insert({
    organisation,
    contact_name: contactName,
    role,
    email,
    phone,
    tier,
    message,
    user_agent: ua,
    ip,
  });

  if (error) {
    console.error("[partner] supabase error", error);
    return NextResponse.redirect(
      new URL("/partner?status=error", req.url),
      303,
    );
  }

  return NextResponse.redirect(new URL("/thanks?source=partner", req.url), 303);
}
