import PhotoFill from "@/components/PhotoFill";
import { GhostX } from "@/app/volunteer/RolesBoard";
import { display } from "@/app/volunteer/shared";

/**
 * Hero for the Participate pages (/speak, /partner), in the same look as
 * /volunteer: black, a faint ghost X, a big headline with one word in a red
 * box (`<Hl>`), the intro, and one rounded photo. Listed in Nav's heroIsDark.
 */
export default function ParticipateHero({
  title,
  intro,
  body,
  image,
  imageAlt,
  position = "center",
  portrait = false,
  priority = true,
}: {
  /** Pass `<Hl>` around one word, e.g. `Nominate a <Hl>speaker</Hl>.` */
  title: React.ReactNode;
  intro?: React.ReactNode;
  body?: React.ReactNode;
  image: string;
  imageAlt: string;
  /** Where the crop sits on the photo (CSS object-position). */
  position?: string;
  /** A portrait photo gets a taller frame. */
  portrait?: boolean;
  priority?: boolean;
}) {
  return (
    <section className="relative overflow-hidden bg-black text-white">
      <GhostX className="pointer-events-none absolute -bottom-56 -left-44 h-[760px] w-[760px] text-white opacity-[0.06]" />
      <div className="relative mx-auto grid max-w-[1240px] items-center gap-12 px-5 pb-20 pt-32 md:px-12 md:pb-24 md:pt-40 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] lg:gap-14">
        <div className="flex flex-col gap-7">
          <h1
            className="isolate font-sans font-medium balance"
            style={{ ...display, fontSize: "clamp(3rem, 7vw, 6.5rem)", lineHeight: 0.9, letterSpacing: "-0.045em" }}
          >
            {title}
          </h1>
          {intro && <p className="max-w-[540px] text-[18px] leading-[1.6] text-white/85 md:text-[19px]">{intro}</p>}
          {body && <p className="max-w-[540px] text-[18px] leading-[1.6] text-white/85 md:text-[19px]">{body}</p>}
        </div>
        <div
          className={
            "relative overflow-hidden rounded-[28px] " +
            (portrait ? "aspect-[4/5] lg:mx-auto lg:w-[82%]" : "aspect-[4/3]")
          }
        >
          <PhotoFill
            src={image}
            alt={imageAlt}
            sizes="(max-width: 1024px) 90vw, 45vw"
            priority={priority}
            hoverZoom={false}
            objectPosition={position}
          />
        </div>
      </div>
    </section>
  );
}
