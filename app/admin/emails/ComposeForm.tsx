"use client";

import { useState } from "react";
import { Send } from "lucide-react";
import type { ComposeTemplate } from "@/lib/email-templates";
import { Field, PrimaryButton, inputCls } from "../ui";
import { sendComposedEmail } from "./actions";

/**
 * The admin Compose box. Recipients can be pasted or arrive pre-filled (e.g.
 * the Talk Night "Email accepted" button passes ?to=…). A template dropdown
 * drops a ready-written subject + body in, all still editable before sending.
 *
 * Sending is unchanged — `sendComposedEmail` gives each recipient their own
 * individual email, so people in the To field never see one another.
 */
export default function ComposeForm({
  templates,
  initialTo = "",
  initialTemplateId,
}: {
  templates: ComposeTemplate[];
  initialTo?: string;
  initialTemplateId?: string;
}) {
  const initialTemplate =
    templates.find((t) => t.id === initialTemplateId) ?? null;

  const [to, setTo] = useState(initialTo);
  const [cc, setCc] = useState("");
  const [templateId, setTemplateId] = useState(initialTemplate?.id ?? "");
  const [subject, setSubject] = useState(initialTemplate?.subject ?? "");
  const [eyebrow, setEyebrow] = useState(initialTemplate?.eyebrow ?? "");
  const [heading, setHeading] = useState(initialTemplate?.heading ?? "");
  const [body, setBody] = useState(initialTemplate?.body ?? "");

  const applyTemplate = (id: string) => {
    setTemplateId(id);
    const t = templates.find((x) => x.id === id);
    if (!t) return; // "Start from scratch" — leave fields as they are
    setSubject(t.subject);
    setEyebrow(t.eyebrow ?? "");
    setHeading(t.heading ?? "");
    setBody(t.body);
  };

  return (
    <form
      action={sendComposedEmail}
      className="grid gap-5 rounded-[var(--radius-md)] border border-[rgba(20,18,16,0.10)] bg-white p-6 md:p-7"
    >
      {templates.length > 0 && (
        <Field
          label="Template"
          htmlFor="template"
          hint="Optional. Drops in a ready-written message you can then edit."
        >
          <select
            id="template"
            value={templateId}
            onChange={(e) => applyTemplate(e.target.value)}
            className={inputCls}
          >
            <option value="">Start from scratch</option>
            {templates.map((t) => (
              <option key={t.id} value={t.id}>
                {t.label}
              </option>
            ))}
          </select>
        </Field>
      )}

      <Field
        label="To"
        htmlFor="to"
        hint="One or more emails, comma or space separated. Each person gets their own separate email — they can't see one another."
      >
        <input
          id="to"
          name="to"
          type="text"
          required
          value={to}
          onChange={(e) => setTo(e.target.value)}
          placeholder="someone@example.com"
          className={inputCls}
        />
      </Field>

      <Field
        label="Cc"
        htmlFor="cc"
        hint="Optional. Cc yourself or a colleague to receive one copy of this message."
      >
        <input
          id="cc"
          name="cc"
          type="text"
          value={cc}
          onChange={(e) => setCc(e.target.value)}
          placeholder="you@tedxnewy.com.au"
          className={inputCls}
        />
      </Field>

      <div className="grid gap-5 md:grid-cols-2">
        <Field label="Subject" htmlFor="subject">
          <input
            id="subject"
            name="subject"
            type="text"
            required
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            placeholder="A note from TEDxNewy"
            className={inputCls}
          />
        </Field>
        <Field
          label="Eyebrow"
          htmlFor="eyebrow"
          hint="Small label above the heading (optional)."
        >
          <input
            id="eyebrow"
            name="eyebrow"
            type="text"
            value={eyebrow}
            onChange={(e) => setEyebrow(e.target.value)}
            placeholder="A note from TEDxNewy"
            className={inputCls}
          />
        </Field>
      </div>

      <Field
        label="Heading"
        htmlFor="heading"
        hint="Large headline in the email (optional — defaults to the subject)."
      >
        <input
          id="heading"
          name="heading"
          type="text"
          value={heading}
          onChange={(e) => setHeading(e.target.value)}
          placeholder="Thanks for being part of it"
          className={inputCls}
        />
      </Field>

      <Field label="Message" htmlFor="body">
        <textarea
          id="body"
          name="body"
          required
          rows={12}
          value={body}
          onChange={(e) => setBody(e.target.value)}
          placeholder={
            "Hi there,\n\nWrite your message here. Blank lines start new paragraphs.\n\nThanks,\nTEDxNewy"
          }
          className={inputCls}
        />
      </Field>

      <div>
        <PrimaryButton type="submit">
          <Send className="h-4 w-4" strokeWidth={2.25} />
          Send email
        </PrimaryButton>
      </div>
    </form>
  );
}
