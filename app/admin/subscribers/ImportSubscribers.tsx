"use client";

import { useMemo, useRef, useState, useTransition } from "react";
import { Loader2, Upload, X } from "lucide-react";
import { importSubscribers } from "../submissions-actions";
import { Card, Field, PrimaryButton, SecondaryButton, inputCls } from "../ui";
import { useToast } from "../Toaster";

// Grab every email-looking token, so a raw Mailchimp CSV or a plain list both
// work without asking which column holds the address.
const EMAIL_RE = /[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}/g;

// Cap the amount of text we accept and scan. A real subscriber list is tiny;
// anything larger is a mistake and would just make the regex janky.
const MAX_BYTES = 2 * 1024 * 1024;

function extractEmails(text: string): string[] {
  const scan = text.length > MAX_BYTES ? text.slice(0, MAX_BYTES) : text;
  const found = scan.match(EMAIL_RE) ?? [];
  return Array.from(new Set(found.map((e) => e.toLowerCase())));
}

export default function ImportSubscribers() {
  const [open, setOpen] = useState(false);
  const [text, setText] = useState("");
  const [pending, startTransition] = useTransition();
  const fileRef = useRef<HTMLInputElement>(null);
  const toast = useToast();

  // Only re-scan when the text actually changes, not on every render.
  const emails = useMemo(() => extractEmails(text), [text]);

  const onFile = async (file: File | undefined) => {
    if (!file) return;
    if (file.size > MAX_BYTES) {
      toast.error(
        "That file is over 2MB. Please upload a smaller CSV, or paste the emails instead.",
      );
      if (fileRef.current) fileRef.current.value = "";
      return;
    }
    const content = await file.text();
    setText((prev) => (prev ? `${prev}\n${content}` : content));
  };

  const onImport = () => {
    if (emails.length === 0) {
      toast.warning("No email addresses found in what you pasted or uploaded.");
      return;
    }
    startTransition(async () => {
      try {
        const res = await importSubscribers(emails);
        setText("");
        if (fileRef.current) fileRef.current.value = "";
        toast.success(
          `Added ${res.added} new. ${res.existing} already on the list.`,
        );
      } catch {
        toast.error("Import failed. Please try again.");
      }
    });
  };

  if (!open) {
    return (
      <SecondaryButton type="button" onClick={() => setOpen(true)}>
        <Upload className="h-4 w-4" strokeWidth={2.25} />
        Import list
      </SecondaryButton>
    );
  }

  return (
    <Card className="space-y-4 p-5">
      <div className="flex items-center justify-between">
        <h2 className="font-sans text-[16px] font-semibold text-[#141210]">
          Import subscribers
        </h2>
        <button
          type="button"
          onClick={() => setOpen(false)}
          aria-label="Close import"
          className="inline-flex h-8 w-8 items-center justify-center rounded-full text-[#6b6459] transition-colors hover:bg-[rgba(20,18,16,0.06)] hover:text-[#141210]"
        >
          <X className="h-4 w-4" strokeWidth={2.25} />
        </button>
      </div>
      <p className="text-[13px] leading-[1.55] text-[#6b6459]">
        Upload your Mailchimp export (CSV) or paste a list of emails. We add any
        new addresses and leave existing ones as they are, so anyone who
        unsubscribed stays unsubscribed.
      </p>

      <Field label="Upload a CSV">
        <input
          ref={fileRef}
          type="file"
          accept=".csv,text/csv,text/plain"
          onChange={(e) => onFile(e.target.files?.[0])}
          className="block w-full text-[13px] text-[#6b6459] file:mr-3 file:rounded-full file:border-0 file:bg-[rgba(20,18,16,0.06)] file:px-4 file:py-2 file:text-[12.5px] file:font-medium file:text-[#141210] hover:file:bg-[rgba(20,18,16,0.10)]"
        />
      </Field>

      <Field label="Or paste emails" hint="Any format. We pull out the email addresses.">
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          rows={5}
          placeholder="one@example.com, two@example.com&#10;three@example.com"
          className={`${inputCls} font-mono text-[13px]`}
        />
      </Field>

      <div className="flex flex-wrap items-center gap-3">
        <span onClick={pending ? undefined : onImport} className="contents">
          <PrimaryButton type="button" disabled={pending || emails.length === 0}>
            {pending ? (
              <Loader2 className="h-4 w-4 animate-spin" strokeWidth={2.25} />
            ) : (
              <Upload className="h-4 w-4" strokeWidth={2.25} />
            )}
            Import {emails.length > 0 ? `${emails.length} ` : ""}
            {emails.length === 1 ? "email" : "emails"}
          </PrimaryButton>
        </span>
      </div>
    </Card>
  );
}
