import { Newspaper, Plus, Send, Trash2 } from "lucide-react";
import { requireFullAdmin } from "@/lib/cms-auth";
import {
  listMediaContacts,
  signalMediaRelease,
  defaultPitchSubject,
  defaultPitchIntro,
  MEDIA_STATUSES,
  OUTLETS,
} from "@/lib/media";
import { apolloConfigured } from "@/lib/apollo";
import {
  Card,
  DangerButton,
  Field,
  Flash,
  PageHeader,
  PrimaryButton,
  SecondaryButton,
  inputCls,
} from "../ui";
import BuildMediaList from "./BuildMediaList";
import {
  addMediaContact,
  removeMediaContact,
  sendMediaRelease,
  updateMediaContact,
} from "./actions";

export const dynamic = "force-dynamic";
// Sends go out one email at a time (the PDF attachment rules out Resend's
// batch endpoint), so give the send action room for a dozen paced sends.
export const maxDuration = 60;

const ERR_COPY: Record<string, string> = {
  missing: "Name and outlet are required.",
  failed: "Something went wrong. Try again.",
  "email-invalid": "The pitch needs a subject and a body.",
  "no-key": "Email isn't configured on this environment (RESEND_API_KEY).",
  "no-recipients": "No contacts with an email address matched that send.",
};

const dateFmt = new Intl.DateTimeFormat("en-AU", {
  day: "numeric",
  month: "short",
  timeZone: "Australia/Sydney",
});

const STATUS_CHIP: Record<string, string> = {
  prospect: "bg-[#f1ede4] text-[#6b6459]",
  pitched: "bg-[rgba(23,96,122,0.1)] text-[#17607a]",
  responded: "bg-[rgba(200,132,26,0.14)] text-[#8a5a12]",
  covered: "bg-[rgba(47,107,65,0.12)] text-[#2f6b41]",
  declined: "bg-[rgba(224,34,20,0.08)] text-[#b91404]",
};

export default async function MediaPage({
  searchParams,
}: {
  searchParams: Promise<{ saved?: string; sent?: string; error?: string }>;
}) {
  await requireFullAdmin();
  const { saved, sent, error } = await searchParams;
  const contacts = await listMediaContacts();
  const prospects = contacts.filter((c) => c.status === "prospect" && c.email);
  const covered = OUTLETS.filter((o) =>
    contacts.some((c) => c.outlet.toLowerCase() === o.name.toLowerCase()),
  ).length;

  const release = signalMediaRelease();
  const pitchBody = defaultPitchIntro(null) + release;

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Media"
        title="The media room"
        description="Newcastle and Hunter journalists, sourced by Apollo, and the Signal media release ready to send. Sends are logged to email history like everything else."
        actions={apolloConfigured() ? <BuildMediaList /> : undefined}
      />

      {saved && <Flash tone="ok">Saved.</Flash>}
      {sent && (
        <Flash tone="ok">
          Release sent to {sent} contact{sent === "1" ? "" : "s"} and logged.
        </Flash>
      )}
      {error && <Flash tone="error">{ERR_COPY[error] ?? "Something went wrong."}</Flash>}

      {/* Composer: one form; per-row Send buttons and the send-all button all
          submit THIS form's subject/body, so edits apply to every send. */}
      <form action={sendMediaRelease}>
        <Card className="p-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <span className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-[rgba(224,34,20,0.08)] text-[#b91404]">
                <Newspaper className="h-4 w-4" strokeWidth={2} />
              </span>
              <div>
                <div className="font-sans text-[17px] font-medium text-[#141210]">
                  The Signal release
                </div>
                <div className="text-[12.5px] text-[#6b6459]">
                  Edit anything below, then send per contact or to all prospects at
                  once. The{" "}
                  <a
                    href="https://gurlrjlesdbiqxhavwil.supabase.co/storage/v1/object/public/documents/media/signal-2026-media-release.pdf"
                    target="_blank"
                    rel="noreferrer"
                    className="underline decoration-[rgba(20,18,16,0.3)] underline-offset-2 hover:text-[#141210]"
                  >
                    branded PDF release
                  </a>{" "}
                  is attached to every send.
                </div>
              </div>
            </div>
            <PrimaryButton type="submit" name="all" value="1">
              <Send className="h-3.5 w-3.5" strokeWidth={2.25} />
              Send to all prospects ({prospects.length})
            </PrimaryButton>
          </div>

          <div className="mt-5 space-y-4">
            <Field label="Subject">
              <input name="subject" defaultValue={defaultPitchSubject()} className={inputCls} />
            </Field>
            <Field label="Pitch + release">
              <textarea
                name="body"
                rows={18}
                defaultValue={pitchBody}
                className={`${inputCls} font-mono text-[13px] leading-[1.6]`}
              />
            </Field>
          </div>

          {/* Contacts: rows submit the same form with their contactId. */}
          <div className="mt-6 border-t border-[rgba(20,18,16,0.08)] pt-4">
            <div className="mb-2 flex items-baseline justify-between">
              <div className="font-sans text-[15px] font-medium text-[#141210]">
                Contacts · {contacts.length}
              </div>
              <div className="text-[12px] text-[#8a8278]">
                {covered}/{OUTLETS.length} target outlets covered
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-[13.5px]">
                <thead>
                  <tr className="border-b border-[rgba(20,18,16,0.1)] font-mono text-[10px] font-semibold uppercase tracking-[0.14em] text-[#8a8278]">
                    <th className="py-2 pr-4 font-semibold">Contact</th>
                    <th className="py-2 pr-4 font-semibold">Outlet</th>
                    <th className="py-2 pr-4 font-semibold">Email</th>
                    <th className="py-2 pr-4 font-semibold">Status</th>
                    <th className="py-2 font-semibold"></th>
                  </tr>
                </thead>
                <tbody>
                  {contacts.length === 0 && (
                    <tr>
                      <td colSpan={5} className="py-8 text-center text-[#8a8278]">
                        No contacts yet. Use “Build media list (Apollo)” above, or add
                        one manually below.
                      </td>
                    </tr>
                  )}
                  {contacts.map((c) => (
                    <tr
                      key={c.id}
                      className="border-b border-[rgba(20,18,16,0.06)] last:border-0"
                    >
                      <td className="py-2.5 pr-4">
                        <div className="font-medium text-[#141210]">{c.fullName}</div>
                        {c.title && (
                          <div className="text-[12px] text-[#8a8278]">{c.title}</div>
                        )}
                      </td>
                      <td className="py-2.5 pr-4 text-[#2a2521]">{c.outlet}</td>
                      <td className="py-2.5 pr-4 text-[#2a2521]">
                        {c.email ?? <span className="text-[#8a8278]">no email yet</span>}
                      </td>
                      <td className="py-2.5 pr-4">
                        <span
                          className={`rounded-full px-2.5 py-1 font-mono text-[10px] font-semibold uppercase tracking-[0.12em] ${STATUS_CHIP[c.status]}`}
                        >
                          {MEDIA_STATUSES.find((s) => s.id === c.status)?.label ?? c.status}
                        </span>
                        {c.lastContactedAt && (
                          <span className="ml-2 text-[11.5px] text-[#8a8278]">
                            {dateFmt.format(new Date(c.lastContactedAt))}
                          </span>
                        )}
                      </td>
                      <td className="py-2.5 text-right">
                        {c.email && (
                          <SecondaryButton type="submit" name="contactId" value={c.id}>
                            <Send className="h-3 w-3" strokeWidth={2.25} />
                            Send
                          </SecondaryButton>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </Card>
      </form>

      {/* Row-level management, outside the composer form (nested forms are
          invalid HTML, so status/remove live in their own small forms). */}
      {contacts.length > 0 && (
        <Card className="p-6">
          <div className="font-sans text-[15px] font-medium text-[#141210]">
            Update a contact
          </div>
          <div className="mt-3 space-y-2">
            {contacts.map((c) => (
              <div key={c.id} className="flex flex-wrap items-center gap-2">
                <span className="w-56 truncate text-[13px] text-[#2a2521]">
                  {c.fullName} · {c.outlet}
                </span>
                <form action={updateMediaContact} className="flex items-center gap-2">
                  <input type="hidden" name="id" value={c.id} />
                  <select name="status" defaultValue={c.status} className={`${inputCls} w-40 py-2`}>
                    {MEDIA_STATUSES.map((s) => (
                      <option key={s.id} value={s.id}>{s.label}</option>
                    ))}
                  </select>
                  <input
                    name="email"
                    defaultValue={c.email ?? ""}
                    placeholder="email"
                    className={`${inputCls} w-64 py-2`}
                  />
                  <SecondaryButton type="submit">Save</SecondaryButton>
                </form>
                <form action={removeMediaContact}>
                  <input type="hidden" name="id" value={c.id} />
                  <DangerButton type="submit">
                    <Trash2 className="h-3 w-3" strokeWidth={2.25} />
                  </DangerButton>
                </form>
              </div>
            ))}
          </div>
        </Card>
      )}

      <Card className="p-6">
        <div className="font-sans text-[15px] font-medium text-[#141210]">
          Add a contact manually
        </div>
        <form action={addMediaContact} className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          <input name="full_name" placeholder="Full name" className={inputCls} required />
          <input name="outlet" placeholder="Outlet" className={inputCls} required />
          <input name="title" placeholder="Role (optional)" className={inputCls} />
          <input name="email" type="email" placeholder="Email (optional)" className={inputCls} />
          <PrimaryButton type="submit">
            <Plus className="h-3.5 w-3.5" strokeWidth={2.25} />
            Add
          </PrimaryButton>
        </form>
      </Card>
    </div>
  );
}
