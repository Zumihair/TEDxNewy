import Image from "next/image";
import PhotoFill from "@/components/PhotoFill";
import Link from "next/link";
import { ArrowUpRight, Calendar, Mic, Sparkles } from "lucide-react";
import { ORG } from "@/lib/data";
import SubmitLockForm from "@/components/SubmitLockForm";

export const metadata = {
  alternates: { canonical: "/subscribe" },
  title: "Get the next idea first · TEDxNewy",
  description:
    "Subscribe to TEDxNewy. Be first to know when each new talk drops, when tickets go live, and when new events are announced.",
  openGraph: {
    title: "Get the next idea first · TEDxNewy",
    description:
      "Be first to know when each new TEDxNewy talk goes live and when new events are announced.",
  },
};

export default function SubscribePage() {
  return (
    <main className="min-h-[100vh] bg-white text-[#000000]">
      <div className="mx-auto grid min-h-[100vh] max-w-[1240px] gap-10 px-5 py-8 md:grid-cols-[1.05fr_1fr] md:gap-14 md:px-10 md:py-10 lg:gap-20">
        {/* Words */}
        <div className="flex flex-col">
          <Link
            href="/"
            aria-label="TEDxNewy home"
            className="inline-flex w-fit items-center self-start"
          >
            <Image
              src="/brand/tedxnewy-black.png"
              alt="TEDxNewy"
              width={680}
              height={170}
              priority
              className="h-7 w-auto md:h-8"
            />
          </Link>

          {/* On a phone the photo comes next, as a 3:1 strip, then the words. */}
          <div className="relative mt-6 aspect-[3/1] overflow-hidden rounded-[var(--radius-lg,20px)] bg-[#1a0604] md:hidden">
            <PhotoFill
              src="https://ob67nrhuhoyfvgao.public.blob.vercel-storage.com/event-photos/60-second-talk-night/60-second-talk-night_004.webp"
              alt=""
              sizes="100vw"
              priority
              quality={90}
              hoverZoom={false}
              objectPosition="42% 45%"
            />
          </div>

          <div className="flex flex-1 flex-col justify-center py-10 md:py-16">
            <h1
              className="font-sans tracking-[-0.03em] text-[#000000] balance"
              style={{
                fontSize: "clamp(2.5rem, 6vw, 4.5rem)",
                lineHeight: 0.98,
                fontWeight: 500,
                fontVariationSettings: '"opsz" 144',
              }}
            >
              Get the next idea first.
            </h1>

            <p className="mt-6 max-w-[46ch] text-[16.5px] leading-[1.65] text-[#2a2521] md:text-[17.5px]">
              Subscribe and we&rsquo;ll email you the moment each talk lands and
              each new event is announced. No spam, no sponsor blasts.
            </p>

            <ul className="mt-8 space-y-4">
              <Promise
                icon={<Mic className="h-4 w-4" strokeWidth={2.25} />}
                text="New talks the moment they hit YouTube"
              />
              <Promise
                icon={<Calendar className="h-4 w-4" strokeWidth={2.25} />}
                text="First access when new events are announced"
              />
              <Promise
                icon={<Sparkles className="h-4 w-4" strokeWidth={2.25} />}
                text="Occasional behind-the-scenes from the crew"
              />
            </ul>

            <SubmitLockForm
              action="/api/subscribe"
              method="post"
              className="mt-10 flex max-w-[460px] flex-col gap-3"
            >
              <label htmlFor="subscribe-email" className="sr-only">
                Email
              </label>
              <input
                id="subscribe-email"
                type="email"
                name="email"
                required
                placeholder="you@example.com"
                autoComplete="email"
                className="w-full rounded-2xl border border-[rgba(0,0,0,0.15)] bg-white px-5 py-4 text-[16px] text-[#000000] placeholder:text-[#8a8278] focus:border-[#e62b1e] focus:outline-none focus:ring-[3px] focus:ring-[#fbe5e3]"
              />
              <button type="submit" className="btn-red w-full">
                Sign me up
                <ArrowUpRight className="h-4 w-4" strokeWidth={2.5} />
              </button>
              <p className="text-[12.5px] text-[#6b6459]">
                One-tap unsubscribe in every email.
              </p>
            </SubmitLockForm>
          </div>

          <footer className="flex flex-col items-start justify-between gap-4 border-t border-[rgba(0,0,0,0.12)] pt-6 text-[12.5px] text-[#6b6459] sm:flex-row sm:items-center">
            <Link href="/" className="font-ui transition-colors hover:text-[#000000]">
              ← Back to tedxnewy.com.au
            </Link>
            <div className="flex flex-wrap items-center gap-4">
              <a
                href={`https://instagram.com/${ORG.handles.instagram.replace(/^@/, "")}`}
                target="_blank"
                rel="noreferrer"
                className="transition-colors hover:text-[#000000]"
              >
                Instagram
              </a>
              <a
                href={`mailto:${ORG.email}`}
                className="transition-colors hover:text-[#000000]"
              >
                {ORG.email}
              </a>
            </div>
          </footer>
        </div>

        {/* Photo: tall, desktop only */}
        <div className="relative hidden overflow-hidden rounded-[var(--radius-lg,20px)] bg-[#1a0604] md:block md:min-h-[600px]">
          <PhotoFill
            src="https://ob67nrhuhoyfvgao.public.blob.vercel-storage.com/event-photos/60-second-talk-night/60-second-talk-night_004.webp"
            alt="A TEDxNewy cube at the 60-Second Talk Night"
            sizes="(min-width: 768px) 45vw, 100vw"
            priority
            quality={90}
            hoverZoom={false}
            objectPosition="40% 50%"
          />
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0"
            style={{ background: "linear-gradient(180deg, rgba(230,43,30,0.06) 0%, rgba(42,6,4,0) 45%, rgba(42,6,4,0.32) 100%)" }}
          />
        </div>
      </div>
    </main>
  );
}

function Promise({
  icon,
  text,
}: {
  icon: React.ReactNode;
  text: string;
}) {
  return (
    <li className="flex items-center gap-3 text-[15px] text-[#2a2521]">
      <span
        className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-[#fbe5e3] text-[#e62b1e]"
        aria-hidden
      >
        {icon}
      </span>
      <span>{text}</span>
    </li>
  );
}
