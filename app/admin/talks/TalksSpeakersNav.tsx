import Link from "next/link";

/** Talks and speakers are two lists of one archive, so they share one tab and this switcher. */
export default function TalksSpeakersNav({
  active,
  counts,
}: {
  active: "talks" | "speakers";
  counts?: { talks: number; speakers: number };
}) {
  return (
    <div className="adm-pills" role="tablist" aria-label="Archive">
      {[
        { key: "talks", label: "Talks", href: "/admin/talks", n: counts?.talks },
        { key: "speakers", label: "Speakers", href: "/admin/speakers", n: counts?.speakers },
      ].map((i) => (
        <Link
          key={i.key}
          href={i.href}
          role="tab"
          aria-selected={i.key === active}
          className={"adm-pill" + (i.key === active ? " is-active" : "")}
        >
          {i.label}
          {typeof i.n === "number" && <span className="adm-pill__n">{i.n}</span>}
        </Link>
      ))}
    </div>
  );
}
