import type { Metadata } from "next";
import BrandPortal from "@/components/team-brand/BrandPortal";

// Hidden, team-only portal: kept out of search, nav, footer, and the sitemap.
export const metadata: Metadata = {
  title: "Team brand portal · TEDxNewy",
  description: "Internal brand portal: colours, statements, logos, and on-brand asset generators.",
  robots: { index: false, follow: false },
};

export default function TeamBrandPage() {
  return (
    <div className="min-h-screen bg-cream">
      <div className="mx-auto max-w-6xl px-5 py-14 sm:py-20">
        <header className="mb-10">
          <div className="mb-2 text-[12px] font-bold uppercase tracking-[0.2em] text-red">
            Team only · not listed publicly
          </div>
          <h1 className="text-4xl font-extrabold tracking-tight text-ink sm:text-5xl">Team brand portal</h1>
          <p className="mt-3 max-w-2xl text-[15px] leading-relaxed text-ink-3">
            Grab colour codes, copy approved statements, download any logo, and make on-brand
            virtual backgrounds, banners, slides, and email signatures. Everything here follows
            the TEDx brand guidelines.
          </p>
        </header>
        <BrandPortal />
      </div>
    </div>
  );
}
