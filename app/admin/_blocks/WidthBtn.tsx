import type { ReactNode } from "react";

export default function WidthBtn({
  active,
  onClick,
  label,
  children,
  size = "md",
}: {
  active: boolean;
  onClick: () => void;
  label: string;
  children: ReactNode;
  size?: "sm" | "md";
}) {
  const box = size === "sm" ? "h-7 w-7" : "h-8 w-8";
  return (
    <button
      type="button"
      title={label}
      aria-label={label}
      onClick={onClick}
      className={
        `inline-flex ${box} items-center justify-center rounded-[8px] transition-colors ` +
        (active
          ? "bg-[rgba(20,18,16,0.10)] text-[#141210]"
          : "text-[#6b6459] hover:bg-[rgba(20,18,16,0.06)]")
      }
    >
      {children}
    </button>
  );
}
