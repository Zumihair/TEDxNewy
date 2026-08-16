/** Skeleton for the four week calendar while its data resolves. */
export default function CalendarLoading() {
  return (
    <div className="animate-pulse space-y-6">
      <div className="space-y-4">
        <div className="h-3 w-[140px] rounded-full bg-[rgba(20,18,16,0.06)]" />
        <div className="h-9 w-1/4 rounded-[var(--radius-md)] bg-[rgba(20,18,16,0.06)]" />
        <div className="h-4 w-3/5 rounded-full bg-[rgba(20,18,16,0.06)]" />
      </div>

      {/* quick links */}
      <div className="flex gap-2">
        {[0, 1, 2].map((i) => (
          <div key={i} className="h-8 w-28 rounded-full bg-[rgba(20,18,16,0.06)]" />
        ))}
      </div>

      {/* grid */}
      <div className="overflow-hidden rounded-[var(--radius-md)] border border-[rgba(20,18,16,0.08)] bg-white">
        <div className="grid grid-cols-7 border-b border-[rgba(20,18,16,0.08)] bg-[#f9f5ec]">
          {[0, 1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="px-2 py-2.5">
              <div className="h-2.5 w-8 rounded-full bg-[rgba(20,18,16,0.08)]" />
            </div>
          ))}
        </div>
        {[0, 1, 2, 3].map((w) => (
          <div
            key={w}
            className="grid grid-cols-7 border-b border-[rgba(20,18,16,0.08)] last:border-b-0"
          >
            {[0, 1, 2, 3, 4, 5, 6].map((d) => (
              <div
                key={d}
                className="min-h-[118px] space-y-1.5 border-r border-[rgba(20,18,16,0.06)] p-2 last:border-r-0"
              >
                <div className="h-4 w-4 rounded-full bg-[rgba(20,18,16,0.06)]" />
                {(w + d) % 3 === 0 && (
                  <div className="h-4 w-full rounded bg-[rgba(20,18,16,0.06)]" />
                )}
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
