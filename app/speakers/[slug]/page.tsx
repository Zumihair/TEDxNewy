import { redirect } from "next/navigation";

/**
 * Speaker detail pages are now presented as a popup on /speakers, so a direct
 * hit on /speakers/<slug> redirects into that popup view (?speaker=<slug>).
 */
export default async function SpeakerSlugRedirect({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  redirect(`/speakers?speaker=${encodeURIComponent(slug)}`);
}
