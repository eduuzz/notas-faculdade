function Bone({ className = '' }) {
  return <div className={`bg-[var(--bg-input)] rounded-md animate-pulse ${className}`} />;
}

export default function SkeletonLoader() {
  return (
    <div className="min-h-screen bg-[var(--bg-root)] text-[var(--text-primary)]">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
        <div className="flex items-center gap-3 mb-8">
          <Bone className="w-10 h-10 rounded-lg" />
          <div className="space-y-2">
            <Bone className="h-5 w-40" />
            <Bone className="h-3 w-24" />
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-5">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="h-20 rounded-lg bg-[var(--bg-card)] border border-[var(--border-card)] p-3">
              <Bone className="h-3 w-16 mb-2" />
              <Bone className="h-6 w-10" />
            </div>
          ))}
        </div>

        <Bone className="h-10 w-full mb-5 rounded-md" />

        {[1, 2, 3, 4].map(i => (
          <div key={i} className="h-14 rounded-lg bg-[var(--bg-card)] border border-[var(--border-card)] mb-2 p-3 flex items-center gap-3">
            <Bone className="h-4 w-4 rounded" />
            <Bone className="h-3 w-28" />
            <div className="ml-auto flex gap-2">
              <Bone className="h-4 w-14 rounded" />
              <Bone className="h-4 w-8 rounded" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
