"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import {
  Bold,
  Italic,
  Link2,
  List,
  ListOrdered,
  RemoveFormatting,
  Underline,
} from "lucide-react";

/**
 * Small WYSIWYG editor for the Compose body. A contentEditable surface plus a
 * toolbar (bold, italic, underline, link, bullet + numbered lists, clear
 * formatting). Its HTML is mirrored into a hidden input so it posts with the
 * form, and pushed up via onChange so the parent can render the live preview.
 *
 * Uses document.execCommand — deprecated but still supported everywhere and
 * more than enough for an internal tool. Paste is forced to plain text so
 * junk markup from Word/Docs never ends up in the email. Seed content (from a
 * template) is applied on mount; the parent remounts via `key` to reseed.
 */
export default function RichTextEditor({
  name,
  initialHtml = "",
  placeholder,
  onChange,
}: {
  name: string;
  initialHtml?: string;
  placeholder?: string;
  onChange?: (html: string) => void;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [html, setHtml] = useState(initialHtml);

  // Seed the editable surface once on mount. React must not manage its
  // children (it can't, for contentEditable), so we set innerHTML directly.
  useEffect(() => {
    if (ref.current) ref.current.innerHTML = initialHtml;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const sync = () => {
    const v = ref.current?.innerHTML ?? "";
    setHtml(v);
    onChange?.(v);
  };

  const exec = (command: string, value?: string) => {
    ref.current?.focus();
    document.execCommand(command, false, value);
    sync();
  };

  const addLink = () => {
    const url = window.prompt("Link address", "https://");
    if (url) exec("createLink", url);
  };

  const onPaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const text = e.clipboardData.getData("text/plain");
    document.execCommand("insertText", false, text);
    sync();
  };

  const isEmpty =
    html.replace(/<[^>]*>/g, "").replace(/&nbsp;/gi, "").trim() === "";

  return (
    <div className="overflow-hidden rounded-[var(--radius-md)] border border-[rgba(20,18,16,0.15)] bg-white focus-within:border-[#e02214]/40 focus-within:ring-2 focus-within:ring-[#e02214]/20">
      <div className="flex flex-wrap items-center gap-0.5 border-b border-[rgba(20,18,16,0.10)] bg-[rgba(20,18,16,0.02)] px-2 py-1.5">
        <Btn label="Bold" onClick={() => exec("bold")}>
          <Bold className="h-4 w-4" strokeWidth={2.5} />
        </Btn>
        <Btn label="Italic" onClick={() => exec("italic")}>
          <Italic className="h-4 w-4" strokeWidth={2.5} />
        </Btn>
        <Btn label="Underline" onClick={() => exec("underline")}>
          <Underline className="h-4 w-4" strokeWidth={2.5} />
        </Btn>
        <Divider />
        <Btn label="Add link" onClick={addLink}>
          <Link2 className="h-4 w-4" strokeWidth={2.25} />
        </Btn>
        <Btn label="Bulleted list" onClick={() => exec("insertUnorderedList")}>
          <List className="h-4 w-4" strokeWidth={2.25} />
        </Btn>
        <Btn label="Numbered list" onClick={() => exec("insertOrderedList")}>
          <ListOrdered className="h-4 w-4" strokeWidth={2.25} />
        </Btn>
        <Divider />
        <Btn label="Clear formatting" onClick={() => exec("removeFormat")}>
          <RemoveFormatting className="h-4 w-4" strokeWidth={2.25} />
        </Btn>
      </div>

      <div className="relative">
        <div
          ref={ref}
          contentEditable
          suppressContentEditableWarning
          role="textbox"
          aria-multiline="true"
          aria-label="Message"
          onInput={sync}
          onBlur={sync}
          onPaste={onPaste}
          className="min-h-[220px] w-full px-4 py-3 text-[14.5px] leading-[1.6] text-[#141210] focus:outline-none [&_a]:text-[#e02214] [&_a]:underline [&_ol]:list-decimal [&_ol]:pl-6 [&_ul]:list-disc [&_ul]:pl-6"
        />
        {isEmpty && placeholder && (
          <div className="pointer-events-none absolute left-4 top-3 text-[14.5px] text-[#8a7e74]/60">
            {placeholder}
          </div>
        )}
      </div>

      <input type="hidden" name={name} value={html} />
    </div>
  );
}

function Btn({
  label,
  onClick,
  children,
}: {
  label: string;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      title={label}
      aria-label={label}
      onMouseDown={(e) => e.preventDefault()} // keep the editor selection
      onClick={onClick}
      className="inline-flex h-8 w-8 items-center justify-center rounded-[8px] text-[#3a352f] transition-colors hover:bg-[rgba(20,18,16,0.08)] hover:text-[#141210]"
    >
      {children}
    </button>
  );
}

function Divider() {
  return <span className="mx-1 h-5 w-px bg-[rgba(20,18,16,0.12)]" />;
}
