"use client";

import { useState } from "react";
import { Loader2, Monitor, RefreshCw, Smartphone } from "lucide-react";

/**
 * Email preview panel shared by the newsletter and flow editors. The parent
 * supplies an async `getHtml` (a server action that runs the real renderer),
 * so what shows here is exactly what sends. Rendered in an iframe srcDoc, the
 * same approach the Quick Compose preview uses.
 */
export default function PreviewPane({
  getHtml,
}: {
  getHtml: () => Promise<string>;
}) {
  const [html, setHtml] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [width, setWidth] = useState<"full" | "mobile">("full");

  const refresh = async () => {
    setLoading(true);
    try {
      setHtml(await getHtml());
    } catch {
      setHtml(
        "<p style='font-family:sans-serif;padding:24px;color:#b91404'>Preview failed to render.</p>",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="rounded-[var(--radius-md)] border border-[rgba(20,18,16,0.10)] bg-white">
      <div className="flex items-center justify-between gap-2 border-b border-[rgba(20,18,16,0.08)] px-3 py-2">
        <button
          type="button"
          onClick={refresh}
          className="inline-flex items-center gap-1.5 rounded-full bg-[rgba(20,18,16,0.06)] px-3 py-1.5 text-[12.5px] font-medium text-[#141210] transition-colors hover:bg-[rgba(20,18,16,0.10)]"
        >
          {loading ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" strokeWidth={2.25} />
          ) : (
            <RefreshCw className="h-3.5 w-3.5" strokeWidth={2.25} />
          )}
          Refresh preview
        </button>
        <div className="flex items-center gap-0.5">
          <WidthBtn
            active={width === "full"}
            onClick={() => setWidth("full")}
            label="Desktop width"
          >
            <Monitor className="h-4 w-4" strokeWidth={2} />
          </WidthBtn>
          <WidthBtn
            active={width === "mobile"}
            onClick={() => setWidth("mobile")}
            label="Mobile width"
          >
            <Smartphone className="h-4 w-4" strokeWidth={2} />
          </WidthBtn>
        </div>
      </div>
      <div className="flex justify-center bg-[#f4efe6] p-3">
        {html === null ? (
          <p className="px-4 py-16 text-center text-[13px] text-[#6b6459]">
            Click Refresh preview to see the email.
          </p>
        ) : (
          <iframe
            title="Email preview"
            srcDoc={html}
            className="h-[70vh] border-0 bg-white transition-all"
            style={{ width: width === "mobile" ? "375px" : "100%" }}
          />
        )}
      </div>
    </div>
  );
}

function WidthBtn({
  active,
  onClick,
  label,
  children,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      title={label}
      aria-label={label}
      onClick={onClick}
      className={
        "inline-flex h-7 w-7 items-center justify-center rounded-[8px] transition-colors " +
        (active
          ? "bg-[rgba(20,18,16,0.10)] text-[#141210]"
          : "text-[#6b6459] hover:bg-[rgba(20,18,16,0.06)]")
      }
    >
      {children}
    </button>
  );
}
