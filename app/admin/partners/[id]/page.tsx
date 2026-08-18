import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowUpRight,
  ChevronDown,
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
import ImageUploadField from "../../ImageUploadField";
import LockedDetails from "./LockedDetails";
import {
  addPartnerNote,
  defaultOutreach,
  removePartner,
  sendPartnerEmail,
  setPartnerStatus,
  updatePartner,
  updatePartnerLogos,
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

/** The happy path, in order, plus the two parked outcomes. */
const PIPELINE = STATUSES.filter((s) =>
  ["prospect", "contacted", "in_discussion", "confirmed"].includes(s.id),
);
const ASIDES = STATUSES.filter((s) => ["declined", "dormant"].includes(s.id));

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

      {/* Stage stepper: the happy path as connected steps, with declined and
          dormant as quiet asides. Clicking a step moves the partner there. */}
      <Card className="px-5 py-4 md:px-6">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <ol className="flex flex-1 flex-wrap items-center gap-0">
            {PIPELINE.map((s, i) => {
              const activeIdx = PIPELINE.findIndex((x) => x.id === partner.status);
              const state =
                partner.status === s.id
                  ? "current"
                  : activeIdx > i
                    ? "done"
                    : "todo";
              return (
                <li key={s.id} className="flex items-center">
                  {i > 0 && (
                    <span
                      aria-hidden
                      className={
                        "mx-2 hidden h-px w-6 sm:block md:w-9 " +
                        (state === "todo" ? "bg-[rgba(20,18,16,0.15)]" : "bg-[#e02214]")
                      }
                    />
                  )}
                  <form action={setPartnerStatus}>
                    <input type="hidden" name="id" value={partner.id} />
                    <input type="hidden" name="status" value={s.id} />
                    <button
                      type="submit"
                      disabled={state === "current"}
                      title={s.hint}
                      className={
                        "inline-flex items-center gap-2 rounded-full py-1.5 pl-1.5 pr-3.5 font-mono text-[10px] font-semibold uppercase transition-all " +
                        (state === "current"
                          ? "cursor-default bg-[#e02214] text-white"
                          : state === "done"
                            ? "text-[#b91404] hover:bg-[rgba(224,34,20,0.06)]"
                            : "text-[#6b6459] hover:-translate-y-0.5 hover:text-[#141210]")
                      }
                      style={{ letterSpacing: "0.14em" }}
                    >
                      <span
                        aria-hidden
                        className={
                          "inline-flex h-5 w-5 items-center justify-center rounded-full text-[10px] " +
                          (state === "current"
                            ? "bg-white/20 text-white"
                            : state === "done"
                              ? "bg-[#e02214] text-white"
                              : "bg-[rgba(20,18,16,0.08)] text-[#6b6459]")
                        }
                      >
                        {state === "done" ? "✓" : i + 1}
                      </span>
                      {s.label}
                    </button>
                  </form>
                </li>
              );
            })}
          </ol>
          <div className="flex items-center gap-1.5 md:border-l md:border-[rgba(20,18,16,0.10)] md:pl-4">
            {ASIDES.map((s) => {
              const active = partner.status === s.id;
              return (
                <form key={s.id} action={setPartnerStatus}>
                  <input type="hidden" name="id" value={partner.id} />
                  <input type="hidden" name="status" value={s.id} />
                  <button
                    type="submit"
                    disabled={active}
                    title={s.hint}
                    className={
                      "rounded-full px-3 py-1.5 font-mono text-[9.5px] font-semibold uppercase transition-colors " +
                      (active
                        ? s.id === "declined"
                          ? "cursor-default bg-[rgba(224,34,20,0.10)] text-[#b91404]"
                          : "cursor-default bg-[#f1ede4] text-[#8a8278]"
                        : "text-[#8a8278] hover:bg-[rgba(20,18,16,0.05)] hover:text-[#141210]")
                    }
                    style={{ letterSpacing: "0.16em" }}
                  >
                    {s.label}
                  </button>
                </form>
              );
            })}
          </div>
        </div>
      </Card>

      <div className="grid gap-8 lg:grid-cols-[1fr_380px]">
        <div className="space-y-8">
          {/* Email composer — collapsed by default. Most visits to a
              partner aren't "send an email right now", so this shouldn't
              be the first big form on the page; open it deliberately. */}
          <details className="group">
            <summary className="flex cursor-pointer list-none items-center justify-between gap-2 [&::-webkit-details-marker]:hidden [&::marker]:hidden">
              <SectionLabel>Email {partner.contactName ?? "them"}</SectionLabel>
              <ChevronDown
                className="h-4 w-4 text-[#8a8278] transition-transform group-open:rotate-180"
                strokeWidth={2.25}
              />
            </summary>
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
                    defaultChecked
                    className="accent-[#e02214]"
                  />
                  Include the prospectus PDF
                  <span className="text-[#8a8278]">
                    {partner.prospectusUrl
                      ? "(their personalised version)"
                      : "(the general version; generate a personalised one below)"}
                  </span>
                </label>
                <div className="flex">
                  <PrimaryButton type="submit">
                    <Send className="h-4 w-4" strokeWidth={2.25} />
                    Send email
                  </PrimaryButton>
                </div>
              </form>
            </Card>
          </details>

          {partner.status === "confirmed" ? (
            /* Locked in: this is the wide column now, since collecting
               brand assets is the actual remaining job. Partnership
               details move to the narrow side, locked. */
            <section>
              <SectionLabel>Brand assets</SectionLabel>
              <Card className="mt-3 space-y-5 p-5">
                <p className="text-[13px] leading-[1.55] text-[#4a453d]">
                  {partner.orgName} is confirmed — grab their logo in both
                  versions so it&rsquo;s ready for the site and the stage
                  screen. Transparent PNG works best.
                </p>
                <form action={updatePartnerLogos} className="space-y-5">
                  <input type="hidden" name="id" value={partner.id} />
                  <div className="grid gap-5 sm:grid-cols-2">
                    <ImageUploadField
                      name="logo_light_url"
                      label="Logo — for light backgrounds"
                      defaultValue={partner.logoLightUrl ?? ""}
                      folder="partners"
                      baseName={`${partner.orgName}-light`}
                      aspect="1/1"
                      hint="The everyday version, for use on white/cream."
                    />
                    <ImageUploadField
                      name="logo_dark_url"
                      label="Logo — for dark backgrounds"
                      defaultValue={partner.logoDarkUrl ?? ""}
                      folder="partners"
                      baseName={`${partner.orgName}-dark`}
                      aspect="1/1"
                      hint="A white/mono version, for the Signal stage screen and dark pages. Leave blank if they don't have one."
                    />
                  </div>
                  <div className="flex">
                    <PrimaryButton type="submit">Save logos</PrimaryButton>
                  </div>
                </form>
              </Card>
            </section>
          ) : (
            /* Details */
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
                      <option value="community">Community · $1k</option>
                      <option value="in_kind">In-kind</option>
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
          )}
        </div>

        <aside className="space-y-8">
          {partner.status === "confirmed" ? (
            /* Narrow side now holds the locked reference details. */
            <section>
              <SectionLabel>Details</SectionLabel>
              <LockedDetails partner={partner} />
            </section>
          ) : (
            <>
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
            </>
          )}

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
              {/* Vertical rail connecting the event dots, like the site's
                  agenda treatments. The rail is a border on a spacer column
                  so it needs no absolute positioning. */}
              <ul>
                {events.map((e, i) => {
                  const Icon = EVENT_ICON[e.kind];
                  const last = i === events.length - 1;
                  return (
                    <li key={e.id} className="grid grid-cols-[28px_1fr] gap-x-2.5">
                      <div className="flex flex-col items-center">
                        <span className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#f4efe6] text-[#b91404]">
                          <Icon className="h-3.5 w-3.5" strokeWidth={2.25} />
                        </span>
                        {!last && (
                          <span
                            aria-hidden
                            className="w-px flex-1 bg-[rgba(20,18,16,0.12)]"
                          />
                        )}
                      </div>
                      <div className={"min-w-0 " + (last ? "" : "pb-4")}>
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
                        <div className="mt-0.5 font-mono text-[9.5px] font-semibold uppercase tracking-[0.16em] text-[#8a8278]">
                          {e.createdAt && dateFmt.format(new Date(e.createdAt))}
                          {e.createdBy ? ` · ${e.createdBy.split("@")[0]}` : ""}
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
