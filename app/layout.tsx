import type { Metadata } from "next";
import { Bricolage_Grotesque } from "next/font/google";
import "./globals.css";
import Nav from "@/components/Nav";
import Footer from "@/components/Footer";
// Site-wide promo pop-up. Currently OFF. To run a promo again, uncomment this
// import and the <TalkNightBanner /> mount below (see components/TalkNightBanner.tsx
// for the copy, link, and event date to update).
// import TalkNightBanner from "@/components/TalkNightBanner";
import SeasonAnnouncePopup from "@/components/SeasonAnnouncePopup";
import { getNavConfig } from "@/lib/cms-content";

const display = Bricolage_Grotesque({
  subsets: ["latin"],
  variable: "--font-bricolage",
  display: "swap",
});

export const metadata: Metadata = {
  title: "TEDxNewy · Ideas worth spreading, from Newcastle",
  description:
    "TEDxNewy is an independently licensed TED event on Awabakal and Worimi Country. The 2026 season opens with TEDxNewy Salon: Newcastle 2050 on 30 April at the Q Building, Honeysuckle.",
  metadataBase: new URL("https://tedxnewy.com.au"),
  openGraph: {
    title: "TEDxNewy · Season 2026",
    description:
      "Ideas that refuse to sit still. Four conversations across the year, kicking off with the Salon, Newcastle 2050: What If? on 30 April.",
    type: "website",
  },
};

// Schema.org JSON-LD. Two graphs combined: Organization (brand identity,
// social profiles, founding) and WebSite (publisher reference). Helps
// Google/Bing cluster brand queries and unlocks sitelinks eligibility.
const ORG_JSON_LD = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Organization",
      "@id": "https://tedxnewy.com.au/#organization",
      name: "TEDxNewy",
      alternateName: ["TEDx Newy", "TEDx Newcastle"],
      legalName: "Newcastle Ideas Network Limited",
      url: "https://tedxnewy.com.au",
      logo: {
        "@type": "ImageObject",
        url: "https://tedxnewy.com.au/brand/tedxnewy-black.png",
      },
      email: "hello@tedxnewy.com.au",
      description:
        "TEDxNewy is an independently licensed TED event on Awabakal and Worimi Country in Newcastle, Australia. Ideas worth spreading, from the Hunter.",
      sameAs: [
        "https://instagram.com/tedxnewy",
        "https://www.linkedin.com/company/tedxnewy",
        "https://www.facebook.com/tedxnewy",
        "https://tiktok.com/@tedxnewy",
      ],
      areaServed: {
        "@type": "Place",
        name: "Newcastle, NSW, Australia",
      },
    },
    {
      "@type": "WebSite",
      "@id": "https://tedxnewy.com.au/#website",
      name: "TEDxNewy",
      url: "https://tedxnewy.com.au",
      publisher: { "@id": "https://tedxnewy.com.au/#organization" },
      inLanguage: "en-AU",
    },
  ],
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const nav = await getNavConfig();
  return (
    <html
      lang="en"
      className={display.variable}
    >
      <body className="min-h-screen font-sans antialiased">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(ORG_JSON_LD) }}
        />
        <Nav nav={nav} />
        <main>{children}</main>
        <Footer />
        {/* Promo pop-up disabled. Uncomment to re-enable (see import note above). */}
        {/* <TalkNightBanner /> */}
        <SeasonAnnouncePopup />
      </body>
    </html>
  );
}
