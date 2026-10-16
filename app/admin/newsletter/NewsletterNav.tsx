import Link from "next/link";

const ITEMS = [
  { key: "campaigns", label: "Campaigns", href: "/admin/newsletter/campaigns" },
  { key: "subscribers", label: "Subscribers", href: "/admin/subscribers" },
  { key: "flow", label: "Welcome flow", href: "/admin/subscriber-flow" },
];

/** The three areas of the newsletter, as one switcher shown at the top of each. */
export default function NewsletterNav({ active }: { active: "campaigns" | "subscribers" | "flow" }) {
  return (
    <div className="adm-pills" role="tablist" aria-label="Newsletter">
      {ITEMS.map((i) => (
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
