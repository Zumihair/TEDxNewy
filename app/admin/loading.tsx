/**
 * Route-level skeleton for the admin content area. Shown while a page's server
 * data resolves, inside the persistent AdminShell. Bars use the admin ink at
 * low opacity on the #f4efe6 background; cards match the white primitives.
 */
export default function AdminLoading() {
  return (
    <div className="animate-pulse space-y-8">
      {/* PageHeader shape: eyebrow, title, description */}
      <div className="space-y-4">
        <div className="h-3 w-[120px] rounded-full bg-[rgba(20,18,16,0.06)]" />
        <div className="h-9 w-2/5 rounded-[var(--radius-md)] bg-[rgba(20,18,16,0.06)]" />
        <div className="h-4 w-3/5 rounded-full bg-[rgba(20,18,16,0.06)]" />
      </div>

      {/* Card placeholders */}
      <div className="space-y-4">
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className="rounded-[var(--radius-md)] border border-[rgba(20,18,16,0.10)] bg-white p-5"
          >
            <div className="space-y-3">
              <div className="h-4 w-1/3 rounded-full bg-[rgba(20,18,16,0.06)]" />
              <div className="h-3 w-1/2 rounded-full bg-[rgba(20,18,16,0.06)]" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
