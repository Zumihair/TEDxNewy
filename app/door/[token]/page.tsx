import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { doorTokenOk } from "@/lib/door";
import DoorApp from "./DoorApp";
import "./door.css";

/**
 * Event-day sign-in for volunteers. Reached only by a QR code carrying the
 * secret token (env DOOR_TOKEN); a wrong token is a plain 404. `/door/demo`
 * is the same screen on made-up guests so it can be shown and practised on.
 * Not in the sitemap, disallowed in robots, noindex.
 */
export const metadata: Metadata = {
  title: "Door check-in · TEDxNewy",
  robots: { index: false, follow: false, nocache: true },
  referrer: "no-referrer",
};

export const dynamic = "force-dynamic";

export default async function DoorPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const demo = token === "demo";
  if (!demo && !doorTokenOk(token)) notFound();
  return <DoorApp token={token} demo={demo} />;
}
