/**
 * Skeleton for Quick Compose while its server data resolves. Header plus one
 * large form-card placeholder, matching the admin palette.
 */
export default function EmailsLoading() {
  return (
    <div className="animate-pulse space-y-10">
      {/* PageHeader shape */}
      <div className="space-y-4">
        <div className="h-3 w-[120px] rounded-full bg-[rgba(20,18,16,0.06)]" />
        <div className="h-9 w-2/5 rounded-[var(--radius-md)] bg-[rgba(20,18,16,0.06)]" />
        <div className="h-4 w-3/5 rounded-full bg-[rgba(20,18,16,0.06)]" />
      </div>

      {/* Form card placeholder */}
      <div className="rounded-[var(--radius-md)] border border-[rgba(20,18,16,0.10)] bg-white p-6 md:p-7">
        <div className="space-y-5">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="space-y-2">
              <div className="h-3 w-24 rounded-full bg-[rgba(20,18,16,0.06)]" />
              <div className="h-11 w-full rounded-[var(--radius-md)] bg-[rgba(20,18,16,0.06)]" />
            </div>
          ))}
          <div className="h-10 w-40 rounded-full bg-[rgba(20,18,16,0.06)]" />
        </div>
      </div>
    </div>
  );
}
