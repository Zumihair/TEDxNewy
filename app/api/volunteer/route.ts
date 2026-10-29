import { type NextRequest, NextResponse } from "next/server";
import { getSupabase, clientMeta } from "@/lib/supabase";
import { checkSubmission } from "@/lib/anti-spam";
import {
  sendConfirmationEmail,
  sendFormNotification,
} from "@/lib/email-notify";
import { confirmApply, notifyApply } from "@/lib/email-templates";
import { getVolunteerRoles, volunteerRoleFor } from "@/lib/volunteer-roles";
import { DEFAULT_ROLE_QUESTIONS, type RoleAnswer } from "@/lib/volunteer-questions";

/** A link typed without a scheme ("linkedin.com/in/x") gets https:// so it opens. */
const asLink = (v: string) => (v && !/^[a-z][a-z0-9+.-]*:/i.test(v) ? `https://${v}` : v);

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  const data = Object.fromEntries(
    new URLSearchParams(await req.text()),
  ) as Record<string, string>;

  const firstName = String(data.firstName ?? "").trim();
  const lastName = String(data.lastName ?? "").trim();
  const email = String(data.email ?? "").trim().toLowerCase();
  const phone = String(data.phone ?? "").trim() || null;
  // Stored as the title so the admin reads it as-is, even after a role is
  // taken down. An unknown, closed or missing slug files under the general role.
  const applied = volunteerRoleFor(await getVolunteerRoles(), String(data.role ?? "").trim());
  const role = applied.title;

  // The general role posts the fixed fields; a posted role posts its own
  // questions as q_<id>. Each answer is kept with the question's wording at the
  // time, so it still reads correctly after the role's form is edited.
  const location = applied.general ? String(data.location ?? "").trim() || null : null;
  const availability = applied.general ? String(data.availability ?? "").trim() || null : null;
  const note = applied.general ? String(data.note ?? "").trim() || null : null;
  const questions = applied.general
    ? []
    : applied.questions.length
      ? applied.questions
      : DEFAULT_ROLE_QUESTIONS;
  const answers: RoleAnswer[] = [];
  let missing = false;
  for (const q of questions) {
    let a = String(data[`q_${q.id}`] ?? "").trim().slice(0, 5000);
    if (q.type === "link") a = asLink(a);
    if (q.type === "choice" && a && !q.options?.includes(a)) a = "";
    if (!a) {
      if (q.required) missing = true;
      continue;
    }
    answers.push({ question: q.label, answer: a });
  }

  const basicsOk = firstName && lastName && email;
  const formOk = applied.general ? Boolean(availability && note) : !missing;
  if (!basicsOk || !formOk) {
    return NextResponse.redirect(
      new URL("/thanks?status=error&source=apply", req.url),
      303,
    );
  }

  // Bot filter: on a hit, skip the insert + emails and send the visitor to a
  // clear error page. Genuine people caught by mistake get a "try again / email
  // us" prompt (and their address is logged below) rather than silently
  // vanishing; bots just see an error.
  const { spam, reason } = checkSubmission(req, data, {
    textFields: ["firstName", "lastName"],
  });
  if (spam) {
    console.warn("[apply] dropped spam submission", { reason, email });
    return NextResponse.redirect(
      new URL("/thanks?status=error&source=apply", req.url),
      303,
    );
  }

  const supabase = getSupabase();
  const { ua, ip } = clientMeta(req);
  const { error } = await supabase.from("applications").insert({
    first_name: firstName,
    last_name: lastName,
    email,
    phone,
    location,
    availability,
    note,
    role,
    answers: answers.length ? answers : null,
    user_agent: ua,
    ip,
  });

  if (error) {
    console.error("[apply] supabase error", error);
    return NextResponse.redirect(
      new URL("/thanks?status=error&source=apply", req.url),
      303,
    );
  }

  await sendFormNotification(
    "apply",
    notifyApply({ firstName, lastName, email, phone, location, availability, note, role, answers }),
  );
  await sendConfirmationEmail(
    email,
    confirmApply({ firstName, lastName, availability, role }),
  );

  return NextResponse.redirect(new URL("/thanks?source=apply", req.url), 303);
}
