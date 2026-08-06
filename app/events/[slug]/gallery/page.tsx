import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import PhotoGallery from "@/components/PhotoGallery";
import { getEventBySlug, getPhotosForEvent } from "@/lib/cms-content";

export const revalidate = 60;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const event = await getEventBySlug(slug);
  if (!event) return { title: "Gallery · TEDxNewy" };
  return {
    title: `Photo gallery · ${event.title} · TEDxNewy`,
    description: `Browse and download photos from ${event.title}.`,
    alternates: { canonical: `/events/${event.slug}/gallery` },
    robots: { index: false },
  };
}

export default async function EventGalleryPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const event = await getEventBySlug(slug);
  if (!event) notFound();

  const photos = await getPhotosForEvent(event.id);
  if (photos.length === 0) notFound();

  return (
    <div className="bg-[var(--color-cream)] pb-20 pt-32 md:pt-40">
      <div className="mx-auto max-w-[1240px] px-5 md:px-6">
        <Link
          href={`/events/${event.slug}`}
          className="inline-flex items-center gap-1.5 text-[13.5px] font-medium text-[#6b6459] transition-colors hover:text-[#141210]"
        >
          <ArrowLeft className="h-3.5 w-3.5" strokeWidth={2.25} />
          Back to {event.title}
        </Link>

        <div
          className="mt-6 font-mono text-[10.5px] font-semibold uppercase text-[#b91404]"
          style={{ letterSpacing: "0.24em" }}
        >
          Photo gallery
        </div>
        <h1
          className="mt-4 font-sans tracking-[-0.025em] text-[#141210] balance"
          style={{
            fontSize: "clamp(2rem, 4.5vw, 3.25rem)",
            lineHeight: 1.03,
            fontWeight: 500,
            fontVariationSettings: '"opsz" 144',
          }}
        >
          {event.title}
        </h1>
        <p className="mt-4 text-[15px] text-[#6b6459]">
          {photos.length} photo{photos.length === 1 ? "" : "s"}. Tap any
          photo to view it full size and download it.
        </p>

        <div className="mt-10">
          <PhotoGallery photos={photos} eventTitle={event.title} />
        </div>
      </div>
    </div>
  );
}
