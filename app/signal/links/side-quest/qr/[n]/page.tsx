import type { Metadata } from "next";
import { notFound } from "next/navigation";
import SideQuestApp from "../../SideQuestApp";
import SideQuestShell from "../../SideQuestShell";

/**
 * What a hidden QR code opens: the Side Quest with that code's puzzle in a
 * modal over the quest list. The number is only a route key. Whether the code
 * is active, and what its puzzle says, is decided server side by the API.
 */
export const metadata: Metadata = {
  title: "Signal Side Quest",
  robots: { index: false, follow: false },
};

export default async function SideQuestQrPage({
  params,
}: {
  params: Promise<{ n: string }>;
}) {
  const { n } = await params;
  const num = Number(n);
  if (!Number.isInteger(num) || num < 1 || num > 99) notFound();
  return (
    <SideQuestShell>
      <SideQuestApp qr={num} />
    </SideQuestShell>
  );
}
