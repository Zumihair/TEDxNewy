import {
  CalendarClock,
  GalleryHorizontal,
  ImageUp,
  PenLine,
} from "lucide-react";
import { requireAdmin } from "@/lib/cms-auth";
import { Badge, Card, PageHeader, SectionLabel } from "../ui";

export const metadata = {
  title: "Socials · Admin · TEDxNewy",
};

const STEPS = [
  {
    icon: <ImageUp className="h-5 w-5" strokeWidth={2} />,
    title: "Upload media",
    blurb:
      "Drop in a photo or video for a single post, ready to schedule out to your channels.",
  },
  {
    icon: <GalleryHorizontal className="h-5 w-5" strokeWidth={2} />,
    title: "Build a carousel",
    blurb:
      "Add several images or clips to one post and set their order for a swipeable carousel.",
  },
  {
    icon: <PenLine className="h-5 w-5" strokeWidth={2} />,
    title: "Write the caption",
    blurb:
      "Write the caption once, with hashtags and a call to action, tuned per channel.",
  },
  {
    icon: <CalendarClock className="h-5 w-5" strokeWidth={2} />,
    title: "Schedule to your channels",
    blurb:
      "Pick a date and time and publish to Instagram, Facebook and LinkedIn together.",
  },
];

export default async function AdminSocialsPage() {
  await requireAdmin();

  return (
    <div className="space-y-10">
      <PageHeader
        eyebrow="Community · Socials"
        title="Socials"
        description="A scheduler for your Instagram, Facebook and LinkedIn posts. Upload media, write the caption once, and schedule it to every channel from one place."
        actions={<Badge tone="soon">Coming soon</Badge>}
      />

      <section className="space-y-5">
        <SectionLabel>What this will do</SectionLabel>
        <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {STEPS.map((s) => (
            <li key={s.title}>
              <Card className="h-full p-5">
                <span
                  className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-[#141210] text-white"
                  aria-hidden
                >
                  {s.icon}
                </span>
                <div className="mt-5 font-sans text-[17px] font-medium leading-tight tracking-[-0.01em] text-[#141210]">
                  {s.title}
                </div>
                <p className="mt-1.5 text-[13px] leading-[1.5] text-[#6b6459]">
                  {s.blurb}
                </p>
              </Card>
            </li>
          ))}
        </ul>
        <p className="max-w-[62ch] text-[13.5px] leading-[1.6] text-[#6b6459]">
          Nothing here is live yet. This page is a placeholder for the socials
          scheduling tool, which will land in a later update.
        </p>
      </section>
    </div>
  );
}
