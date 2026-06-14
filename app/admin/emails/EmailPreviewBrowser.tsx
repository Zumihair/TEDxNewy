"use client";

import { useState } from "react";

export type PreviewItem = {
  id: string;
  label: string;
  kind: "confirmation" | "notification";
  to: string;
  subject: string;
  html: string;
};

/**
 * One large preview pane with a dropdown to switch between every automated
 * email, instead of rendering them all at once.
 */
export default function EmailPreviewBrowser({
  previews,
}: {
  previews: PreviewItem[];
}) {
  const [id, setId] = useState(previews[0]?.id ?? "");
  const current = previews.find((p) => p.id === id) ?? previews[0];
  const confirmations = previews.filter((p) => p.kind === "confirmation");
  const notifications = previews.filter((p) => p.kind === "notification");

  return (
    <section className="space-y-5">
      <div className="border-b border-[rgba(20,18,16,0.12)] pb-3">
        <h2 className="font-sans text-[18px] font-semibold tracking-[-0.01em] text-[#141210]">
          Email previews
        </h2>
        <p className="mt-0.5 text-[13px] text-[#6b6459]">
          Pick an email to see it rendered in its branded shell. Confirmations
          go to the person who submitted; notifications go to the admin team.
        </p>
      </div>

      <div className="flex flex-col gap-2">
        <label
          htmlFor="email-pick"
          className="font-mono text-[10.5px] font-semibold uppercase text-[#6b6459]"
          style={{ letterSpacing: "0.24em" }}
        >
          Email
        </label>
        <select
          id="email-pick"
          value={id}
          onChange={(e) => setId(e.target.value)}
          className="block w-full max-w-[460px] rounded-[var(--radius-md)] border border-[rgba(20,18,16,0.15)] bg-white px-4 py-3 text-[14.5px] font-medium text-[#141210] focus:border-[#e02214]/40 focus:outline-none focus:ring-2 focus:ring-[#e02214]/20"
        >
          <optgroup label="Confirmations (to the submitter)">
            {confirmations.map((p) => (
              <option key={p.id} value={p.id}>
                {p.label}
              </option>
            ))}
          </optgroup>
          <optgroup label="Notifications (to the admin team)">
            {notifications.map((p) => (
              <option key={p.id} value={p.id}>
                {p.label}
              </option>
            ))}
          </optgroup>
        </select>
      </div>

      {current && (
        <article className="overflow-hidden rounded-[var(--radius-md)] border border-[rgba(20,18,16,0.12)] bg-white">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[rgba(20,18,16,0.10)] px-5 py-3.5">
            <div className="min-w-0">
              <div className="text-[14px] font-semibold text-[#141210]">
                {current.label}
              </div>
              <div className="mt-0.5 text-[12px] text-[#6b6459]">
                To: {current.to}
              </div>
            </div>
            <div className="min-w-0 text-right">
              <div
                className="font-mono text-[9.5px] font-semibold uppercase text-[#6b6459]"
                style={{ letterSpacing: "0.2em" }}
              >
                Subject
              </div>
              <div className="text-[12.5px] text-[#141210]">
                {current.subject}
              </div>
            </div>
          </div>
          <iframe
            title={current.label}
            srcDoc={current.html}
            className="block h-[700px] w-full border-0 bg-white"
          />
        </article>
      )}
    </section>
  );
}
