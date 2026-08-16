import { notFound } from "next/navigation";
import { requireFullAdmin } from "@/lib/cms-auth";
import { getServerSupabase } from "@/lib/supabase-server";
import EventForm from "../EventForm";
import { updateEvent } from "../actions";

export default async function EditEventPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireFullAdmin();
  const { id } = await params;
  const supabase = await getServerSupabase();
  const { data: event } = await supabase
    .from("cms_events")
    .select("*")
    .eq("id", decodeURIComponent(id))
    .single();
  if (!event) notFound();

  return (
    <EventForm
      mode="edit"
      initial={{
        id: event.id,
        slug: event.slug,
        title: event.title,
        tagline: event.tagline,
        blurb: event.blurb,
        kind: event.kind,
        status: event.status,
        starts_at: event.starts_at,
        date_label: event.date_label,
        short_date: event.short_date,
        venue: event.venue,
        hero_image_url: event.hero_image_url,
        link_url: event.link_url,
        link_label: event.link_label,
        ticket_url: event.ticket_url,
        show_in_nav: event.show_in_nav,
        display_order: event.display_order,
      }}
      action={updateEvent}
    />
  );
}
