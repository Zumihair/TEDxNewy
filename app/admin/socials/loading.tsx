/** Skeleton for the socials drafts list while its data resolves. */
export default function SocialsLoading() {
  return (
    <div className="animate-pulse space-y-8">
      <div className="space-y-4">
        <div className="h-3 w-[140px] rounded-full bg-[rgba(20,18,16,0.06)]" />
        <div className="h-9 w-1/4 rounded-[var(--radius-md)] bg-[rgba(20,18,16,0.06)]" />
        <div className="h-4 w-3/5 rounded-full bg-[rgba(20,18,16,0.06)]" />
      </div>

      {/* filter chips */}
      <div className="flex gap-2">
        {[0, 1, 2, 3, 4].map((i) => (
          <div key={i} className="h-8 w-24 rounded-full bg-[rgba(20,18,16,0.06)]" />
        ))}
      </div>

      {/* post rows: thumbnail + lines */}
      <div className="space-y-3">
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className="flex items-center gap-5 rounded-[var(--radius-md)] border border-[rgba(20,18,16,0.10)] bg-white p-4"
          >
            <div className="h-20 w-20 rounded-[10px] bg-[rgba(20,18,16,0.06)]" />
            <div className="flex-1 space-y-3">
              <div className="h-4 w-1/3 rounded-full bg-[rgba(20,18,16,0.06)]" />
              <div className="h-3 w-1/2 rounded-full bg-[rgba(20,18,16,0.06)]" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
