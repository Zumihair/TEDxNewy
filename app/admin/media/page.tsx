import Link from "next/link";
import { Mail, Pencil, Plus, Send, Trash2 } from "lucide-react";
import { requireFullAdmin } from "@/lib/cms-auth";
import { listMediaContacts, type MediaContact } from "@/lib/media";
import { DangerButton, Field, PageHeader, PrimaryButton, SecondaryButton, inputCls } from "../ui";
import { Modal } from "../Modal";
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
  // Quick email takes its recipients from ?to=, so the whole list is one click away.
  const sendAll = `/admin/emails?to=${encodeURIComponent(withEmail.map((c) => c.email).join(", "))}`;

  return (
    <div className="adm-stack">
      <PageHeader
        title="Media list"
        description="Newcastle and Hunter journalists to pitch."
        actions={
          <>
            <Modal
              title="Add a contact"
              trigger={
                <SecondaryButton write type="button">
                  <Plus className="h-3.5 w-3.5" strokeWidth={2.25} />
                  Add a contact
                </SecondaryButton>
              }
            >
              <ContactForm action={addMediaContact} submitLabel="Add contact" />
            </Modal>
            {withEmail.length > 0 && (
              <Link href={sendAll} className="tx-btn tx-btn--accent adm-write">
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

      {contacts.length === 0 ? (
        <p className="adm-empty">No contacts yet. Use Add a contact to start the list.</p>
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
              <div className="adm-contact__actions">
                <Modal
                  title={`Edit ${c.fullName}`}
                  trigger={
                    <SecondaryButton write type="button">
                      <Pencil className="h-3.5 w-3.5" strokeWidth={2.25} />
                      Edit
                    </SecondaryButton>
                  }
                >
                  <ContactForm action={updateMediaContact} submitLabel="Save" contact={c} />
                </Modal>
                <form action={removeMediaContact}>
                  <input type="hidden" name="id" value={c.id} />
                  <DangerButton type="submit" aria-label={`Remove ${c.fullName}`}>
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

function ContactForm({
  action,
  submitLabel,
  contact: c,
}: {
  action: (formData: FormData) => Promise<void>;
  submitLabel: string;
  contact?: MediaContact;
}) {
  return (
    <form action={action} className="space-y-4">
      {c && <input type="hidden" name="id" value={c.id} />}
      <Field label="Full name">
        <input name="full_name" required defaultValue={c?.fullName ?? ""} className={inputCls} />
      </Field>
      <Field label="Outlet">
        <input name="outlet" required defaultValue={c?.outlet ?? ""} className={inputCls} />
      </Field>
      <Field label="Role" hint="Optional">
        <input name="title" defaultValue={c?.title ?? ""} className={inputCls} />
      </Field>
      <Field label="Email" hint="Optional">
        <input name="email" type="email" defaultValue={c?.email ?? ""} className={inputCls} />
      </Field>
      <PrimaryButton type="submit">{submitLabel}</PrimaryButton>
    </form>
  );
}
