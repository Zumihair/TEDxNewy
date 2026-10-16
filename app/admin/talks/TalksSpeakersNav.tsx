import Link from "next/link";

/** Talks and speakers are two lists of one archive, so they share one tab and this switcher. */
export default function TalksSpeakersNav({ active }: { active: "talks" | "speakers" }) {
  return (
    <div className="adm-pills" role="tablist" aria-label="Archive">
      {[
        { key: "talks", label: "Talks", href: "/admin/talks" },
        { key: "speakers", label: "Speakers", href: "/admin/speakers" },
      ].map((i) => (
        <Link
          key={i.key}
          href={i.href}
          role="tab"
          aria-selected={i.key === active}
          className={"adm-pill" + (i.key === active ? " is-active" : "")}
        >
          {i.label}
        </Link>
      ))}
    </div>
  );
}
