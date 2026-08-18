import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowUpRight,
  FileText,
  Mail,
  MessageSquare,
  Send,
  StickyNote,
  Trash2,
} from "lucide-react";
import { requireFullAdmin } from "@/lib/cms-auth";
import {
  getPartner,
  listPartnerEvents,
  STATUSES,
  type PartnerEvent,
} from "@/lib/partners";
import {
  Card,
  DangerButton,
  Field,
  Flash,
  PageHeader,
  PrimaryButton,
  SectionLabel,
  inputCls,
} from "../../ui";
import {
  addPartnerNote,
  defaultOutreach,
  removePartner,
  sendPartnerEmail,
  setPartnerStatus,
  updatePartner,
} from "../actions";
import GenerateProspectus from "./GenerateProspectus";
import FindContacts from "./FindContacts";
import { apolloConfigured } from "@/lib/apollo";

const ERR_COPY: Record<string, string> = {
  missing: "The organisation name is required.",
  failed: "Something went wrong. Try again.",
  "email-invalid":
    "The email needs a valid address, a subject and a message body.",
  "no-key": "Email isn't configured on this environment (RESEND_API_KEY).",
  "send-failed": "The email could not be sent. Check the address and try again.",
};

const dateFmt = new Intl.DateTimeFormat("en-AU", {
  day: "numeric",
  month: "short",
  year: "numeric",
  hour: "numeric",
  minute: "2-digit",
  hour12: true,
  timeZone: "Australia/Sydney",
});

const EVENT_ICON: Record<PartnerEvent["kind"], typeof Mail> = {
  email: Mail,
  status: ArrowUpRight,
  note: StickyNote,
  prospectus: FileText,
};

export default async function PartnerDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ saved?: string; sent?: string; error?: string }>;
}) {
  await requireFullAdmin();
  const [{ id }, { saved, sent, error }] = await Promise.all([
    params,
    searchParams,
  ]);
  const partner = await getPartner(id);
  if (!partner) notFound();
  const [events, outreach] = await Promise.all([
    listPartnerEvents(id),
    defaultOutreach(id),
  ]);

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Partnerships"
        title={partner.orgName}
        backHref="/admin/partners"
        description={
          partner.category
            ? `${partner.category}${partner.website ? ` · ${partner.website}` : ""}`
            : partner.website ?? undefined
        }
        actions={
          <form action={removePartner}>
            <input type="hidden" name="id" value={partner.id} />
            <DangerButton type="submit">
              <Trash2 className="h-3.5 w-3.5" strokeWidth={2.25} />
              Remove
            </DangerButton>
          </form>
        }
      />

      {saved && <Flash tone="ok">Saved.</Flash>}
      {sent && <Flash tone="ok">Email sent and logged.</Flash>}
      {error && <Flash tone="error">{ERR_COPY[error] ?? "Something went wrong."}</Flash>}

      {/* Pipeline status control */}
      <div className="flex flex-wrap items-center gap-2">
        {STATUSES.map((s) => {
          const active = s.id === partner.status;
          return (
            <form key={s.id} action={setPartnerStatus}>
              <input type="hidden" name="id" value={partner.id} />
              <input type="hidden" name="status" value={s.id} />
              <button
                type="submit"
                disabled={active}
                title={s.hint}
                className={
                  "rounded-full px-3.5 py-1.5 font-mono text-[10.5px] font-semibold uppercase transition-colors " +
                  (active
                    ? "cursor-default bg-[#141210] text-[#f4efe6]"
                    : "border border-[rgba(20,18,16,0.12)] bg-white text-[#6b6459] hover:text-[#141210]")
                }
                style={{ letterSpacing: "0.16em" }}
              >
                {s.label}
              </button>
            </form>
          );
        })}
      </div>

      <div className="grid gap-8 lg:grid-cols-[1fr_380px]">
        <div className="space-y-8">
          {/* Email composer */}
          <section>
            <SectionLabel>Email {partner.contactName ?? "them"}</SectionLabel>
            <Card className="mt-3 p-5">
              <form action={sendPartnerEmail} className="space-y-4">
                <input type="hidden" name="id" value={partner.id} />
                <Field label="To">
                  <input
                    name="to"
                    type="email"
                    defaultValue={partner.email ?? ""}
                    placeholder="their@email.com"
                    className={inputCls}
                  />
                </Field>
                <Field label="Subject">
                  <input
                    name="subject"
                    defaultValue={outreach.subject}
                    className={inputCls}
                  />
                </Field>
                <Field
                  label="Message"
                  hint="Plain text; a blank line starts a new paragraph. Sent with the house email styling."
                >
                  <textarea
                    name="body"
                    rows={12}
                    defaultValue={outreach.body}
                    className={`${inputCls} font-sans leading-relaxed`}
                  />
                </Field>
                <label className="flex items-center gap-2 text-[13px] text-[#2a2521]">
                  <input
                    type="checkbox"
                    name="attach_prospectus"
                    defaultChecked={!!partner.prospectusUrl}
                    disabled={!partner.prospectusUrl}
                    className="accent-[#e02214]"
                  />
                  Include a button linking their prospectus PDF
                  {!partner.prospectusUrl && (
                    <span className="text-[#8a8278]">(generate one first)</span>
                  )}
                </label>
                <div className="flex">
                  <PrimaryButton type="submit">
                    <Send className="h-4 w-4" strokeWidth={2.25} />
                    Send email
                  </PrimaryButton>
                </div>
              </form>
            </Card>
          </section>

          {/* Details */}
          <section>
            <SectionLabel>Details</SectionLabel>
            <Card className="mt-3 p-5">
              <form action={updatePartner} className="space-y-4">
                <input type="hidden" name="id" value={partner.id} />
                <div className="grid gap-4 sm:grid-cols-2">
                  <Field label="Organisation">
                    <input name="org_name" required defaultValue={partner.orgName} className={inputCls} />
                  </Field>
                  <Field label="Contact name">
                    <input name="contact_name" defaultValue={partner.contactName ?? ""} className={inputCls} />
                  </Field>
                  <Field label="Email">
                    <input name="email" type="email" defaultValue={partner.email ?? ""} className={inputCls} />
                  </Field>
                  <Field label="Phone">
                    <input name="phone" defaultValue={partner.phone ?? ""} className={inputCls} />
                  </Field>
                  <Field label="Website">
                    <input name="website" defaultValue={partner.website ?? ""} className={inputCls} />
                  </Field>
                  <Field label="Category">
                    <input name="category" defaultValue={partner.category ?? ""} className={inputCls} />
                  </Field>
                </div>
                <Field
                  label="Suggested tier"
                  hint="Highlighted in their generated prospectus and folded into the default email."
                >
                  <select name="target_tier" className={inputCls} defaultValue={partner.targetTier ?? ""}>
                    <option value="">Not sure yet</option>
                    <option value="presenting">Presenting · $10k</option>
                    <option value="platinum">Platinum · $5k</option>
                    <option value="gold">Gold · $2.5k</option>
                    <option value="community">Community · $1k / in kind</option>
                  </select>
                </Field>
                <Field label="Notes">
                  <textarea name="notes" rows={3} defaultValue={partner.notes ?? ""} className={inputCls} />
                </Field>
                <div className="flex">
                  <PrimaryButton type="submit">Save details</PrimaryButton>
                </div>
              </form>
            </Card>
          </section>
        </div>

        <aside className="space-y-8">
          {/* Apollo contact discovery */}
          {apolloConfigured() && (
            <section>
              <SectionLabel>Find the right person</SectionLabel>
              <Card className="mt-3 space-y-3 p-5">
                <p className="text-[13px] leading-[1.55] text-[#4a453d]">
                  Search Apollo for likely sponsorship decision-makers at{" "}
                  {partner.orgName}, then pick one to fill the contact fields.
                </p>
                <FindContacts partnerId={partner.id} />
              </Card>
            </section>
          )}

          {/* Prospectus */}
          <section>
            <SectionLabel>Personalised prospectus</SectionLabel>
            <Card className="mt-3 space-y-3 p-5">
              <p className="text-[13px] leading-[1.55] text-[#4a453d]">
                Eight pages, A4: the year&rsquo;s impact, Signal, packages with{" "}
                {partner.orgName}&rsquo;s suggested tier highlighted, and their
                name on the cover.
              </p>
              <GenerateProspectus
                partnerId={partner.id}
                hasProspectus={!!partner.prospectusUrl}
              />
              {partner.prospectusUrl && (
                <p className="text-[12px] leading-[1.5] text-[#6b6459]">
                  <a
                    href={partner.prospectusUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-medium text-[#b91404] hover:underline"
                  >
                    Download the current PDF
                  </a>
                  {partner.prospectusGeneratedAt &&
                    ` · generated ${dateFmt.format(new Date(partner.prospectusGeneratedAt))}`}
                </p>
              )}
            </Card>
          </section>

          {/* Timeline */}
          <section>
            <SectionLabel>Activity</SectionLabel>
            <Card className="mt-3 p-5">
              <form action={addPartnerNote} className="mb-4 flex gap-2">
                <input type="hidden" name="id" value={partner.id} />
                <input
                  name="note"
                  placeholder="Add a note… (call summary, next step)"
                  className={inputCls}
                />
                <PrimaryButton type="submit">
                  <MessageSquare className="h-4 w-4" strokeWidth={2.25} />
                </PrimaryButton>
              </form>
              <ul className="space-y-3">
                {events.map((e) => {
                  const Icon = EVENT_ICON[e.kind];
                  return (
                    <li key={e.id} className="grid grid-cols-[28px_1fr] gap-2.5">
                      <span className="mt-0.5 inline-flex h-7 w-7 items-center justify-center rounded-full bg-[#f4efe6] text-[#b91404]">
                        <Icon className="h-3.5 w-3.5" strokeWidth={2.25} />
                      </span>
                      <div className="min-w-0">
                        <div className="text-[13px] leading-[1.45] text-[#141210]">
                          {e.kind === "prospectus" && e.detail ? (
                            <>
                              {e.summary}{" "}
                              <a
                                href={e.detail}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-[#b91404] hover:underline"
                              >
                                (open)
                              </a>
                            </>
                          ) : (
                            e.summary
                          )}
                        </div>
                        <div className="mt-0.5 text-[11px] text-[#8a8278]">
                          {e.createdAt && dateFmt.format(new Date(e.createdAt))}
                          {e.createdBy ? ` · ${e.createdBy}` : ""}
                        </div>
                      </div>
                    </li>
                  );
                })}
                {events.length === 0 && (
                  <li className="py-4 text-center text-[12.5px] text-[#6b6459]">
                    Nothing logged yet. Emails, status changes and prospectus
                    generations land here automatically.
                  </li>
                )}
              </ul>
            </Card>
          </section>

          <p className="text-[11.5px] leading-[1.5] text-[#8a8278]">
            Sent emails also appear in{" "}
            <Link href="/admin/emails/history" className="underline">
              Email history
            </Link>
            .
          </p>
        </aside>
      </div>
    </div>
  );
}
