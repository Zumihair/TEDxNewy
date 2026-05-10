import type { Metadata } from "next";
import { Bricolage_Grotesque } from "next/font/google";
import "./globals.css";
import Nav from "@/components/Nav";
import Footer from "@/components/Footer";

const display = Bricolage_Grotesque({
  subsets: ["latin"],
  variable: "--font-bricolage",
  display: "swap",
});

export const metadata: Metadata = {
  title: "TEDxNewy — Ideas worth spreading, from Newcastle",
  description:
    "TEDxNewy is an independently licensed TED event on Awabakal and Worimi Country. The 2026 season opens with TEDxNewy Salon: Newcastle 2050 on 30 April at the Q Building, Honeysuckle.",
  metadataBase: new URL("https://tedxnewy.com.au"),
  openGraph: {
    title: "TEDxNewy — Season 2026",
    description:
      "Ideas that refuse to sit still. Four conversations across the year — kicking off with the Salon, Newcastle 2050: What If? on 30 April.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      className={display.variable}
    >
      <body className="min-h-screen font-sans antialiased">
        <Nav />
        <main>{children}</main>
        <Footer />
      </body>
    </html>
  );
}
