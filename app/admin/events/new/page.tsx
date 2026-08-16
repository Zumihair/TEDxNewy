import { requireFullAdmin } from "@/lib/cms-auth";
import EventForm from "../EventForm";
import { createEvent } from "../actions";

export default async function NewEventPage() {
  await requireFullAdmin();
  return (
    <EventForm
      mode="new"
      initial={{ kind: "salon", status: "draft", show_in_nav: true }}
      action={createEvent}
    />
  );
}
