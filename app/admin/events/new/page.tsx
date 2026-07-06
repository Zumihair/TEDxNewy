import { requireAdmin } from "@/lib/cms-auth";
import EventForm from "../EventForm";
import { createEvent } from "../actions";

export default async function NewEventPage() {
  await requireAdmin();
  return (
    <EventForm
      mode="new"
      initial={{ kind: "salon", status: "draft", show_in_nav: true }}
      action={createEvent}
    />
  );
}
