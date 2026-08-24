import Link from "next/link";
import { Plus, Trash2 } from "lucide-react";
import { requireFullAdmin } from "@/lib/cms-auth";
import {
  listMediaContacts,
  defaultPitchSubject,
  defaultPitchIntro,
  signalMediaRelease,
  MEDIA_STATUSES,
  MEDIA_SENDERS,
  OUTLETS,
  type MediaSender,
} from "@/lib/media";
import { apolloConfigured } from "@/lib/apollo";
import {
  Card,
  DangerButton,
  Flash,
  PageHeader,
  PrimaryButton,
  SecondaryButton,
  TabBar,
  inputCls,
} from "../ui";
import BuildMediaList from "./BuildMediaList";
import ReleaseComposer from "./ReleaseComposer";
import { addMediaContact, removeMediaContact, updateMediaContact } from "./actions";

export const dynamic = "force-dynamic";
// Sends go out one email at a time (an attachment rules out Resend's batch
// endpoint), so give the send action room for a dozen paced sends.
export const maxDuration = 60;

const ERR_COPY: Record<string, string> = {
  missing: "Name and outlet are required.",
  failed: "Something went wrong. Try again.",
  "email-invalid": "The pitch needs a subject and a body.",
  "no-key": "Email isn't configured on this environment (RESEND_API_KEY).",
  "no-recipients": "No contacts with an email address matched that send.",
};

type Tab = "release" | "contacts";
const TABS: { key: Tab; label: string }[] = [
  { key: "release", label: "New release" },
  { key: "contacts", label: "Contacts" },
];

export default async function MediaPage({
  searchParams,
}: {
  searchParams: Promise<{
    saved?: string;
    sent?: string;
    error?: string;
    tab?: string;
    sender?: string;
  }>;
}) {
  await requireFullAdmin();
  const { saved, sent, error, tab: tabParam, sender: senderParam } = await searchParams;
  const tab: Tab = tabParam === "contacts" ? "contacts" : "release";
  const sender: MediaSender = senderParam === "will" ? "will" : "jake";

  const contacts = await listMediaContacts();
  const prospects = contacts.filter((c) => c.status === "prospect" && c.email);
  const covered = OUTLETS.filter((o) =>
    contacts.some((c) => c.outlet.toLowerCase() === o.name.toLowerCase()),
  ).length;

  const pitchBody = defaultPitchIntro(null, sender) + signalMediaRelease(sender);

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Media"
        title="The media room"
        description="Newcastle and Hunter journalists, sourced by Apollo, and the Signal media release ready to send. Sends are logged to email history like everything else."
      />

      {saved && <Flash tone="ok">Saved.</Flash>}
      {sent && (
        <Flash tone="ok">
          Release sent to {sent} contact{sent === "1" ? "" : "s"} and logged.
        </Flash>
      )}
      {error && <Flash tone="error">{ERR_COPY[error] ?? "Something went wrong."}</Flash>}

      <TabBar tabs={TABS} active={tab} hrefFor={(key) => `/admin/media?tab=${key}`} />

      {tab === "release" ? (
        <>
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-mono text-[10px] font-semibold uppercase tracking-[0.16em] text-[#8a8278]">
              Sign as
            </span>
            {(Object.keys(MEDIA_SENDERS) as MediaSender[]).map((id) => (
              <Link
                key={id}
                href={`/admin/media?tab=release&sender=${id}`}
                className={
                  "rounded-full px-3 py-1 font-mono text-[10.5px] font-semibold uppercase transition-colors " +
                  (sender === id
                    ? "bg-[#141210] text-[#f4efe6]"
                    : "border border-[rgba(20,18,16,0.12)] bg-white text-[#6b6459] hover:text-[#141210]")
                }
                style={{ letterSpacing: "0.14em" }}
              >
                {MEDIA_SENDERS[id].name}
              </Link>
            ))}
            <span className="text-[11.5px] text-[#8a8278]">
              Switching starts a fresh draft with that signature — check Preview before sending.
            </span>
          </div>

          <ReleaseComposer
            key={sender}
            subject={defaultPitchSubject()}
            body={pitchBody}
            prospectsCount={prospects.length}
            contacts={contacts}
          />
        </>
      ) : (
        <>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="text-[12.5px] text-[#6b6459]">
              {covered}/{OUTLETS.length} target outlets covered
            </div>
            {apolloConfigured() && <BuildMediaList />}
          </div>

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

          <Card className="p-6">
            <div className="font-sans text-[15px] font-medium text-[#141210]">
              All contacts
            </div>
            {contacts.length === 0 ? (
              <p className="mt-4 py-8 text-center text-[13.5px] text-[#8a8278]">
                No contacts yet. Use “Build media list (Apollo)” above, or add
                one manually.
              </p>
            ) : (
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
            )}
          </Card>
        </>
      )}
    </div>
  );
}
