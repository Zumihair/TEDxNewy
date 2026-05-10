import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import RedCircle from "@/components/RedCircle";

export default function NotFound() {
  return (
    <section className="relative flex min-h-[80vh] items-center overflow-hidden bg-[var(--color-cream)] pt-24">
      <div className="mx-auto grid max-w-[1240px] items-center gap-12 px-5 md:grid-cols-[1fr_1fr] md:px-6">
        <div>
          <div
            className="inline-flex items-center gap-2.5 font-mono text-[10.5px] font-bold uppercase text-[#e62b1e]"
            style={{ letterSpacing: "0.22em" }}
          >
            <span className="h-[1.5px] w-5 rounded-full bg-[#e62b1e]" />
            Error · 404
          </div>
          <h1
            className="mt-6 font-sans font-bold leading-[0.95] tracking-[-0.02em]"
            style={{ fontSize: "clamp(2.75rem, 7vw, 5rem)" }}
          >
            That idea isn't{" "}
            <span style={{ color: "#e62b1e", fontStyle: "italic" }}>
              on this stage.
            </span>
          </h1>
          <p className="mt-6 max-w-lg text-[16.5px] leading-[1.65] text-[#3d342e]">
            The page you're after doesn't exist — or has wandered off to the
            green room. Let's get you back to the auditorium.
          </p>
          <div className="mt-10">
            <Link href="/" className="btn-red">
              Back to home
              <ArrowUpRight className="h-4 w-4" strokeWidth={2.5} />
            </Link>
          </div>
        </div>
        <div className="relative flex items-center justify-center">
          <RedCircle size={300} opacity={0.9} />
          <div
            className="absolute font-sans font-black leading-none tracking-tighter text-white"
            style={{ fontSize: "clamp(3rem, 6vw, 6rem)" }}
          >
            404
          </div>
        </div>
      </div>
    </section>
  );
}
