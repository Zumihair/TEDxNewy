import type { ReactNode } from "react";

/**
 * Plain dark backdrop for the Side Quest screens. Deliberately NOT the hub's
 * artwork-and-grain backdrop: the grain overlay uses mix-blend-mode, which
 * forces repaints that stutter on phones (see LinksExperience.tsx), and these
 * screens are scrolled and tapped constantly. A flat gradient is free.
 */
export default function SideQuestShell({ children }: { children: ReactNode }) {
  return (
    <div
      className="relative min-h-[100dvh] w-full bg-[#0d0503] font-sans text-white"
      style={{
        backgroundImage:
          "radial-gradient(120% 60% at 50% 0%, rgba(230,43,30,0.22) 0%, rgba(13,5,3,0) 60%)",
      }}
    >
      {children}
    </div>
  );
}
