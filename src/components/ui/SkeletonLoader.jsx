function Bone({ className = '' }) {
  return <div className={`bg-[var(--bg-input)] rounded-lg animate-pulse ${className}`} />;
}

export default function SkeletonLoader() {
  return (
    <div className="min-h-screen bg-[var(--bg-root)] text-[var(--text-primary)]">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
        {/* Header */}
        <div className="flex items-center gap-4 mb-10">
          <Bone className="w-14 h-14 rounded-[18px]" />
          <div className="space-y-2">
            <Bone className="h-6 w-48" />
            <Bone className="h-4 w-28" />
          </div>
        </div>

        {/* Stats grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="h-24 rounded-2xl bg-[var(--bg-card)] border border-[var(--border-card)] p-4">
              <Bone className="h-3 w-20 mb-3" />
              <Bone className="h-7 w-12" />
            </div>
          ))}
        </div>

        {/* Search bar */}
        <Bone className="h-12 w-full mb-6 rounded-xl" />

        {/* Period cards */}
        {[1, 2, 3, 4].map(i => (
          <div key={i} className="h-16 rounded-2xl bg-[var(--bg-card)] border border-[var(--border-card)] mb-3 p-4 flex items-center gap-3">
            <Bone className="h-5 w-5 rounded-full" />
            <Bone className="h-4 w-32" />
            <div className="ml-auto flex gap-2">
              <Bone className="h-5 w-16 rounded-full" />
              <Bone className="h-5 w-10 rounded-full" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
