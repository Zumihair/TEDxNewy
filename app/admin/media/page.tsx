import Link from "next/link";
import { Mail, Pencil, Plus, Trash2 } from "lucide-react";
import { requireFullAdmin } from "@/lib/cms-auth";
import {
  listMediaContacts,
  defaultPitchSubject,
  defaultPitchIntro,
  signalMediaRelease,
  MEDIA_STATUSES,
  MEDIA_SENDERS,
  OUTLETS,
  type MediaContact,
  type MediaSender,
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
  TabBar,
  inputCls,
} from "../ui";
import { Modal } from "../Modal";
import BuildMediaList from "./BuildMediaList";
import ReleaseComposer from "./ReleaseComposer";
import { addMediaContact, removeMediaContact, updateMediaContact } from "./actions";

const STATUS_CHIP: Record<string, string> = {
  prospect: "bg-[#f1ede4] text-[#6b6459]",
  pitched: "bg-[rgba(23,96,122,0.1)] text-[#17607a]",
  responded: "bg-[rgba(200,132,26,0.14)] text-[#8a5a12]",
  covered: "bg-[rgba(47,107,65,0.12)] text-[#2f6b41]",
  declined: "bg-[rgba(224,34,20,0.08)] text-[#b91404]",
};

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
              {contacts.length} contact{contacts.length === 1 ? "" : "s"} · {covered}/{OUTLETS.length} target outlets covered
            </div>
            <div className="flex items-center gap-2">
              {apolloConfigured() && <BuildMediaList />}
              <Modal
                title="Add a contact"
                trigger={
                  <PrimaryButton type="button">
                    <Plus className="h-3.5 w-3.5" strokeWidth={2.25} />
                    Add a contact
                  </PrimaryButton>
                }
              >
                <form action={addMediaContact} className="space-y-4">
                  <Field label="Full name">
                    <input name="full_name" required className={inputCls} />
                  </Field>
                  <Field label="Outlet">
                    <input name="outlet" required className={inputCls} />
                  </Field>
                  <Field label="Role" hint="Optional">
                    <input name="title" className={inputCls} />
                  </Field>
                  <Field label="Email" hint="Optional">
                    <input name="email" type="email" className={inputCls} />
                  </Field>
                  <div className="flex">
                    <PrimaryButton type="submit">
                      <Plus className="h-3.5 w-3.5" strokeWidth={2.25} />
                      Add contact
                    </PrimaryButton>
                  </div>
                </form>
              </Modal>
            </div>
          </div>

          <Card>
            {contacts.length === 0 ? (
              <p className="px-5 py-14 text-center text-[13.5px] text-[#8a8278]">
                No contacts yet. Use “Build media list (Apollo)” above, or add
                one manually.
              </p>
            ) : (
              <ul className="divide-y divide-[rgba(20,18,16,0.08)]">
                {contacts.map((c) => (
                  <li
                    key={c.id}
                    className="flex flex-wrap items-center gap-3 px-4 py-3.5 md:px-5"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-[13.5px] font-medium text-[#141210]">
                        {c.fullName}
                      </div>
                      <div className="truncate text-[12px] text-[#6b6459]">
                        {c.outlet}
                        {c.title ? ` · ${c.title}` : ""}
                      </div>
                    </div>
                    <span
                      className={`shrink-0 rounded-full px-2.5 py-1 font-mono text-[10px] font-semibold uppercase tracking-[0.12em] ${STATUS_CHIP[c.status]}`}
                    >
                      {MEDIA_STATUSES.find((s) => s.id === c.status)?.label ?? c.status}
                    </span>
                    <span className="hidden w-52 shrink-0 items-center gap-1.5 truncate text-[12.5px] text-[#6b6459] sm:flex">
                      {c.email ? (
                        <>
                          <Mail className="h-3.5 w-3.5 shrink-0" strokeWidth={2} />
                          {c.email}
                        </>
                      ) : (
                        "no email yet"
                      )}
                    </span>
                    <div className="flex shrink-0 items-center gap-1.5">
                      <Modal
                        title={`Edit ${c.fullName}`}
                        trigger={
                          <SecondaryButton type="button">
                            <Pencil className="h-3.5 w-3.5" strokeWidth={2.25} />
                            Edit
                          </SecondaryButton>
                        }
                      >
                        <EditContactForm contact={c} />
                      </Modal>
                      <form action={removeMediaContact}>
                        <input type="hidden" name="id" value={c.id} />
                        <DangerButton type="submit">
                          <Trash2 className="h-3 w-3" strokeWidth={2.25} />
                        </DangerButton>
                      </form>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </>
      )}
    </div>
  );
}

function EditContactForm({ contact: c }: { contact: MediaContact }) {
  return (
    <form action={updateMediaContact} className="space-y-4">
      <input type="hidden" name="id" value={c.id} />
      <Field label="Status">
        <select name="status" defaultValue={c.status} className={inputCls}>
          {MEDIA_STATUSES.map((s) => (
            <option key={s.id} value={s.id}>{s.label}</option>
          ))}
        </select>
      </Field>
      <Field label="Email">
        <input name="email" type="email" defaultValue={c.email ?? ""} className={inputCls} />
      </Field>
      <div className="flex">
        <PrimaryButton type="submit">Save</PrimaryButton>
      </div>
    </form>
  );
}
