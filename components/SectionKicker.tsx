export default function SectionKicker({
  label,
  accent = "red",
  inverted = false,
}: {
  label: string;
  accent?: "red" | "amber" | "coast" | "white";
  inverted?: boolean;
}) {
  const accentColor =
    accent === "red"
      ? "#e62b1e"
      : accent === "amber"
      ? "#d89645"
      : accent === "coast"
      ? "#1f4a5c"
      : "rgba(255,255,255,0.6)";

  return (
    <div
      className="inline-flex items-center gap-2.5"
      style={{
        color: inverted ? "rgba(255,255,255,0.85)" : accentColor,
      }}
    >
      <span
        className="inline-block h-[2px] w-10 rounded-full"
        style={{
          background: inverted ? "rgba(255,255,255,0.6)" : accentColor,
        }}
      />
      <span
        className="font-mono text-[10.5px] font-semibold uppercase"
        style={{ letterSpacing: "0.22em" }}
      >
        {label}
      </span>
    </div>
  );
}
