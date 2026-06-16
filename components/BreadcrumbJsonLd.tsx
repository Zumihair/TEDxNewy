/**
 * Emits BreadcrumbList structured data (schema.org) for a section page,
 * e.g. Home › Talks. Helps Google understand the site hierarchy and can
 * surface a breadcrumb trail in search results instead of a bare URL.
 *
 * `path` must start with "/" and match the page's canonical path.
 */
const SITE = "https://tedxnewy.com.au";

export default function BreadcrumbJsonLd({
  name,
  path,
}: {
  name: string;
  path: string;
}) {
  const json = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: `${SITE}/` },
      { "@type": "ListItem", position: 2, name, item: `${SITE}${path}` },
    ],
  };
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(json) }}
    />
  );
}
