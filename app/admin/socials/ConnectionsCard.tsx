"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, ExternalLink, Loader2, Plug, RefreshCw, XCircle } from "lucide-react";
import { Badge, Card, SectionLabel } from "../ui";
import { refreshConnection, startConnection } from "./actions";
import { CHANNELS, type ChannelId, type SocialConnectionRow } from "./shared";

/**
 * Self-service Composio connect flow: Will completes the OAuth login (we
 * can't do that on his behalf), then Refresh picks up the Active connection
 * and resolves the platform account (IG business id, FB page, LinkedIn org).
 */
export default function ConnectionsCard({
  connections,
}: {
  connections: SocialConnectionRow[];
}) {
  const router = useRouter();
  const [busy, setBusy] = useState<ChannelId | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pendingLink, setPendingLink] = useState<Record<string, string>>({});

  const rowFor = (id: ChannelId): SocialConnectionRow =>
    connections.find((c) => c.channel === id) ?? {
      channel: id,
      connected_account_id: null,
      external_account_id: null,
      external_account_name: null,
      status: "disconnected",
      connected_at: null,
      connected_by: null,
    };

  const handleConnect = async (channel: ChannelId) => {
    setBusy(channel);
    setError(null);
    try {
      const res = await startConnection(channel);
      if (!res.ok) throw new Error(res.error);
      if (res.redirectUrl) {
        setPendingLink((prev) => ({ ...prev, [channel]: res.redirectUrl! }));
        window.open(res.redirectUrl, "_blank", "noreferrer");
      }
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not start the connection.");
    } finally {
      setBusy(null);
    }
  };

  const handleRefresh = async (channel: ChannelId) => {
    setBusy(channel);
    setError(null);
    try {
      const res = await refreshConnection(channel);
      if (!res.ok) throw new Error(res.error);
      if (res.status === "connected") {
        setPendingLink((prev) => {
          const next = { ...prev };
          delete next[channel];
          return next;
        });
      }
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not check the connection.");
    } finally {
      setBusy(null);
    }
  };

  return (
    <Card className="space-y-5 p-6">
      <SectionLabel>Connections</SectionLabel>
      <p className="max-w-[70ch] text-[13px] leading-[1.6] text-[#6b6459]">
        Connect TEDxNewy&rsquo;s own Instagram, Facebook and LinkedIn to publish
        straight from a post&rsquo;s editor. Connecting opens a login for that
        channel in a new tab: sign in as TEDxNewy and approve access, then come
        back and press Refresh.
      </p>

      {error && (
        <p className="text-[12.5px] font-medium text-[#b91404]">{error}</p>
      )}

      <ul className="grid gap-3 sm:grid-cols-3">
        {CHANNELS.map((c) => {
          const row = rowFor(c.id);
          const isBusy = busy === c.id;
          const link = pendingLink[c.id];
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
                ) : row.status === "pending" ? (
                  <Badge tone="draft">Pending</Badge>
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
                  Connection failed. Try connecting again.
                </div>
              ) : null}

              {link && row.status !== "connected" && (
                <a
                  href={link}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1.5 text-[12.5px] font-medium text-[#1e40af] hover:underline"
                >
                  <ExternalLink className="h-3.5 w-3.5" strokeWidth={2.25} />
                  Open the login again
                </a>
              )}

              <div className="mt-1 flex gap-2">
                {row.status === "connected" ? (
                  <button
                    type="button"
                    onClick={() => handleConnect(c.id)}
                    disabled={isBusy}
                    className="inline-flex items-center gap-1.5 rounded-full bg-[rgba(20,18,16,0.06)] px-3.5 py-1.5 text-[12px] font-medium text-[#141210] transition-colors hover:bg-[rgba(20,18,16,0.10)] disabled:cursor-not-allowed disabled:opacity-70"
                  >
                    {isBusy ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" strokeWidth={2.25} />
                    ) : (
                      <Plug className="h-3.5 w-3.5" strokeWidth={2.25} />
                    )}
                    Reconnect
                  </button>
                ) : (
                  <>
                    <button
                      type="button"
                      onClick={() => handleConnect(c.id)}
                      disabled={isBusy}
                      className="inline-flex items-center gap-1.5 rounded-full bg-[#e02214] px-3.5 py-1.5 text-[12px] font-medium text-white transition-colors hover:bg-[#b91404] disabled:cursor-not-allowed disabled:opacity-70"
                    >
                      {isBusy ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" strokeWidth={2.25} />
                      ) : (
                        <Plug className="h-3.5 w-3.5" strokeWidth={2.25} />
                      )}
                      Connect
                    </button>
                    {row.connected_account_id && (
                      <button
                        type="button"
                        onClick={() => handleRefresh(c.id)}
                        disabled={isBusy}
                        className="inline-flex items-center gap-1.5 rounded-full bg-[rgba(20,18,16,0.06)] px-3.5 py-1.5 text-[12px] font-medium text-[#141210] transition-colors hover:bg-[rgba(20,18,16,0.10)] disabled:cursor-not-allowed disabled:opacity-70"
                      >
                        {isBusy ? (
                          <Loader2 className="h-3.5 w-3.5 animate-spin" strokeWidth={2.25} />
                        ) : (
                          <RefreshCw className="h-3.5 w-3.5" strokeWidth={2.25} />
                        )}
                        Refresh
                      </button>
                    )}
                  </>
                )}
              </div>
            </li>
          );
        })}
      </ul>
    </Card>
  );
}
