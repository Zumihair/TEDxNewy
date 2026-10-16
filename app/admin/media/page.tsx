import Link from "next/link";
import { Mail, Pencil, Plus, Send, Trash2 } from "lucide-react";
import { requireFullAdmin } from "@/lib/cms-auth";
import { listMediaContacts, MEDIA_STATUSES, OUTLETS, type MediaContact } from "@/lib/media";
import { apolloConfigured } from "@/lib/apollo";
import { DangerButton, Field, PageHeader, PrimaryButton, SecondaryButton, inputCls } from "../ui";
import { Modal } from "../Modal";
import BuildMediaList from "./BuildMediaList";
import { addMediaContact, removeMediaContact, updateMediaContact } from "./actions";
import FlashToast from "../FlashToast";

export const dynamic = "force-dynamic";

const ERR_COPY: Record<string, string> = {
  missing: "Name and outlet are required.",
  failed: "Something went wrong. Try again.",
};

export default async function MediaPage({
  searchParams,
}: {
  searchParams: Promise<{ saved?: string; error?: string }>;
}) {
  await requireFullAdmin();
  const { saved, error } = await searchParams;

  const contacts = await listMediaContacts();
  const withEmail = contacts.filter((c) => c.email);
  const covered = OUTLETS.filter((o) =>
    contacts.some((c) => c.outlet.toLowerCase() === o.name.toLowerCase()),
  ).length;
  // Quick email takes its recipients from ?to=, so the whole list is one click away.
  const sendAll = `/admin/emails?to=${encodeURIComponent(withEmail.map((c) => c.email).join(", "))}`;

  return (
    <div className="adm-stack">
      <PageHeader
        title="Media list"
        description="Newcastle and Hunter journalists to pitch. Send an email to everyone with an address in one click."
        actions={
          <>
            {apolloConfigured() && <BuildMediaList />}
            <Modal
              title="Add a contact"
              trigger={
                <SecondaryButton type="button">
                  <Plus className="h-3.5 w-3.5" strokeWidth={2.25} />
                  Add a contact
                </SecondaryButton>
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
                <PrimaryButton type="submit">Add contact</PrimaryButton>
              </form>
            </Modal>
            {withEmail.length > 0 && (
              <Link href={sendAll} className="tx-btn tx-btn--accent">
                <Send className="h-4 w-4" strokeWidth={2.25} />
                Send an email ({withEmail.length})
              </Link>
            )}
          </>
        }
      />

      {saved && <FlashToast clear="saved">Saved.</FlashToast>}
      {error && (
        <FlashToast tone="error" clear="error">
          {ERR_COPY[error] ?? "Something went wrong."}
        </FlashToast>
      )}

      <p className="adm-card__text">
        {contacts.length} contact{contacts.length === 1 ? "" : "s"} · {covered} of {OUTLETS.length} target outlets covered
      </p>

      {contacts.length === 0 ? (
        <p className="adm-card__text">No contacts yet. Add one, or build the list from Apollo.</p>
      ) : (
        <ul className="adm-eventlist">
          {contacts.map((c) => (
            <li key={c.id} className="adm-contact">
              <div className="adm-contact__main">
                <span className="adm-card__title">{c.fullName}</span>
                <span className="adm-card__text">
                  {c.outlet}
                  {c.title ? ` · ${c.title}` : ""}
                </span>
              </div>
              <span className="adm-contact__email">
                {c.email ? (
                  <>
                    <Mail className="h-3.5 w-3.5 shrink-0" strokeWidth={2} />
                    {c.email}
                  </>
                ) : (
                  <span className="adm-card__text">No email yet</span>
                )}
              </span>
              <span className="adm-card__text adm-contact__status">
                {MEDIA_STATUSES.find((s) => s.id === c.status)?.label ?? c.status}
              </span>
              <div className="adm-contact__actions">
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
                    <Trash2 className="h-3.5 w-3.5" strokeWidth={2.25} />
                  </DangerButton>
                </form>
              </div>
            </li>
          ))}
        </ul>
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
            <option key={s.id} value={s.id}>
              {s.label}
            </option>
          ))}
        </select>
      </Field>
      <Field label="Email">
        <input name="email" type="email" defaultValue={c.email ?? ""} className={inputCls} />
      </Field>
      <PrimaryButton type="submit">Save</PrimaryButton>
    </form>
  );
}
