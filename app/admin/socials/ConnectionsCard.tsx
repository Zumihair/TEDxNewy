"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { AlertTriangle, CheckCircle2, Info, Loader2, RefreshCw, XCircle } from "lucide-react";
import { Badge, Card, SectionLabel } from "../ui";
import { pickConnectionAccount, syncChannels } from "./actions";
import { CHANNELS, type ChannelId, type SocialConnectionRow } from "./shared";

/** The Buffer key is a 1-year personal API key generated 10 August 2026 —
 * see CLAUDE.md and README.md for the regeneration steps. Keep this in sync
 * if the key is ever rotated on a different date. */
const BUFFER_KEY_EXPIRES = "2027-08-10";

function daysUntil(isoDate: string): number {
  const ms = new Date(`${isoDate}T00:00:00`).getTime() - Date.now();
  return Math.ceil(ms / (1000 * 60 * 60 * 24));
}

/**
 * Channels are connected inside Buffer's own dashboard (buffer.com), not
 * here — Buffer is an official API partner for Instagram Business, Facebook
 * Pages and LinkedIn Company Pages, so no OAuth app or developer review of
 * ours is needed. Sync just reads Buffer's already-connected channel list
 * back and matches each to a channel here.
 */
export default function ConnectionsCard({
  connections,
}: {
  connections: SocialConnectionRow[];
}) {
  const router = useRouter();
  const [syncing, setSyncing] = useState(false);
  const [pickBusy, setPickBusy] = useState<ChannelId | null>(null);
  const [error, setError] = useState<string | null>(null);

  const rowFor = (id: ChannelId): SocialConnectionRow =>
    connections.find((c) => c.channel === id) ?? {
      channel: id,
      connected_account_id: null,
      external_account_id: null,
      external_account_name: null,
      status: "disconnected",
      connected_at: null,
      connected_by: null,
      pending_candidates: null,
    };

  const handleSync = async () => {
    setSyncing(true);
    setError(null);
    try {
      const res = await syncChannels();
      if (!res.ok) throw new Error(res.error);
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not sync from Buffer.");
    } finally {
      setSyncing(false);
    }
  };

  const handlePick = async (channel: ChannelId, accountId: string) => {
    setPickBusy(channel);
    setError(null);
    try {
      const res = await pickConnectionAccount(channel, accountId);
      if (!res.ok) throw new Error(res.error);
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not save that choice.");
    } finally {
      setPickBusy(null);
    }
  };

  const daysLeft = daysUntil(BUFFER_KEY_EXPIRES);
  const expired = daysLeft <= 0;
  const expiringSoon = !expired && daysLeft <= 30;
  const expiryDate = new Date(`${BUFFER_KEY_EXPIRES}T00:00:00`).toLocaleDateString("en-AU", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  return (
    <Card className="space-y-5 p-6">
      <div className="flex items-start justify-between gap-3">
        <SectionLabel>Connections</SectionLabel>
        <span
          title="Buffer's free plan: 3 social channels, 10 queued posts per channel, 3,000 API requests per 30 days. TEDxNewy uses exactly the 3 channels below; posting here goes out immediately rather than sitting in Buffer's queue."
          className="inline-flex shrink-0 cursor-help items-center gap-1 text-[11px] font-medium text-[#6b6459]"
        >
          <Info className="h-3.5 w-3.5" strokeWidth={2.25} />
          Buffer free-plan limits
        </span>
      </div>

      <div
        className={`flex items-center gap-2 rounded-[10px] px-3.5 py-2.5 text-[12.5px] font-medium ${
          expired
            ? "bg-[#e02214]/10 text-[#b91404]"
            : expiringSoon
              ? "bg-[#f59e0b]/15 text-[#a16207]"
              : "bg-[rgba(20,18,16,0.04)] text-[#6b6459]"
        }`}
      >
        {expired || expiringSoon ? (
          <AlertTriangle className="h-4 w-4 shrink-0" strokeWidth={2.25} />
        ) : (
          <Info className="h-4 w-4 shrink-0" strokeWidth={2.25} />
        )}
        <span>
          {expired
            ? `Buffer API key expired ${expiryDate}.`
            : `Buffer API key expires ${expiryDate}${expiringSoon ? ` (${daysLeft} day${daysLeft === 1 ? "" : "s"} left)` : ""}.`}{" "}
          Regenerate at{" "}
          <a
            href="https://publish.buffer.com/settings/api"
            target="_blank"
            rel="noreferrer"
            className="underline"
          >
            publish.buffer.com/settings/api
          </a>{" "}
          and update <code className="font-mono">BUFFER_API_KEY</code>.
        </span>
      </div>

      <p className="max-w-[70ch] text-[13px] leading-[1.6] text-[#6b6459]">
        Connect TEDxNewy&rsquo;s own Instagram, Facebook and LinkedIn inside{" "}
        <a
          href="https://publish.buffer.com/all-channels"
          target="_blank"
          rel="noreferrer"
          className="font-medium text-[#1e40af] hover:underline"
        >
          Buffer&rsquo;s own dashboard
        </a>
        , then press Sync below to bring them into this admin. If Buffer has
        more than one channel for the same platform, you&rsquo;ll get asked
        which one is TEDxNewy&rsquo;s.
      </p>

      {error && (
        <p className="text-[12.5px] font-medium text-[#b91404]">{error}</p>
      )}

      <button
        type="button"
        onClick={handleSync}
        disabled={syncing}
        className="inline-flex items-center gap-2 rounded-full bg-[#e02214] px-5 py-2.5 text-[13.5px] font-medium text-white transition-colors hover:bg-[#b91404] disabled:cursor-not-allowed disabled:opacity-70"
      >
        {syncing ? (
          <Loader2 className="h-4 w-4 animate-spin" strokeWidth={2.25} />
        ) : (
          <RefreshCw className="h-4 w-4" strokeWidth={2.25} />
        )}
        {syncing ? "Syncing…" : "Sync from Buffer"}
      </button>

      <ul className="grid gap-3 sm:grid-cols-3">
        {CHANNELS.map((c) => {
          const row = rowFor(c.id);
          const isPickBusy = pickBusy === c.id;
          return (
            <li
              key={c.id}
              className="flex flex-col gap-2.5 rounded-[10px] border border-[rgba(20,18,16,0.10)] bg-white px-4 py-3.5"
            >
              <div className="flex items-center justify-between gap-2">
                <span className="text-[13.5px] font-medium text-[#141210]">
                  {c.label}
                </span>
                {row.status === "connected" ? (
                  <Badge tone="live">Connected</Badge>
                ) : row.status === "needs_pick" ? (
                  <Badge tone="draft">Pick a page</Badge>
                ) : row.status === "failed" ? (
                  <Badge tone="red">Failed</Badge>
                ) : (
                  <Badge tone="neutral">Not connected</Badge>
                )}
              </div>

              {row.status === "connected" ? (
                <div className="flex items-center gap-1.5 text-[12.5px] text-[#6b6459]">
                  <CheckCircle2 className="h-3.5 w-3.5 text-[#15803d]" strokeWidth={2.25} />
                  {row.external_account_name ?? "Connected"}
                </div>
              ) : row.status === "failed" ? (
                <div className="flex items-center gap-1.5 text-[12.5px] text-[#b91404]">
                  <XCircle className="h-3.5 w-3.5" strokeWidth={2.25} />
                  Could not sync. Try again.
                </div>
              ) : row.status === "needs_pick" ? (
                <div className="space-y-1.5">
                  <p className="text-[12px] text-[#6b6459]">
                    Buffer has more than one — which is TEDxNewy&rsquo;s?
                  </p>
                  {(row.pending_candidates ?? []).map((candidate) => (
                    <button
                      key={candidate.id}
                      type="button"
                      disabled={isPickBusy}
                      onClick={() => handlePick(c.id, candidate.id)}
                      className="block w-full rounded-[8px] border border-[rgba(20,18,16,0.10)] bg-[rgba(20,18,16,0.03)] px-3 py-1.5 text-left text-[12.5px] font-medium text-[#141210] transition-colors hover:bg-[rgba(20,18,16,0.08)] disabled:cursor-not-allowed disabled:opacity-70"
                    >
                      {candidate.name ?? candidate.id}
                    </button>
                  ))}
                </div>
              ) : (
                <p className="text-[12px] text-[#6b6459]">
                  Not connected in Buffer yet, or not synced here.
                </p>
              )}
            </li>
          );
        })}
      </ul>
    </Card>
  );
}
