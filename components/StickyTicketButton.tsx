"use client";

import { useEffect, useState } from "react";
import { ArrowUpRight } from "lucide-react";

/**
 * Floating "Get tickets" pill, shown once the visitor scrolls past the hero
 * (which already has its own ticket button) and hidden again near the
 * bottom of the page (the final CTA section already has one too, no need
 * to stack a second on top of it). A quick bounce every 4s (see .cta-jump
 * in globals.css) draws the eye without being a constant distraction.
 */
export default function StickyTicketButton({ href }: { href: string }) {
  const [show, setShow] = useState(false);

  useEffect(() => {
    function onScroll() {
      const scrollY = window.scrollY;
      const viewport = window.innerHeight;
      const docHeight = document.documentElement.scrollHeight;
      const pastHero = scrollY > viewport * 0.9;
      const nearBottom = scrollY + viewport > docHeight - 700;
      setShow(pastHero && !nearBottom);
    }
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, []);

  return (
    <div
      aria-hidden={!show}
      className={`fixed bottom-5 right-5 z-40 transition-all duration-300 ${
        show
          ? "translate-y-0 opacity-100"
          : "pointer-events-none translate-y-4 opacity-0"
      }`}
    >
      <a
        href={href}
        tabIndex={show ? 0 : -1}
        className="cta-jump inline-flex items-center gap-2 rounded-full bg-[#e02214] px-6 py-3.5 font-sans text-[14.5px] font-medium text-white shadow-[0_16px_40px_-12px_rgba(224,34,20,0.7)] transition-colors hover:bg-[#b91404]"
      >
        Get tickets
        <ArrowUpRight className="h-4 w-4" strokeWidth={2} />
      </a>
    </div>
  );
}
