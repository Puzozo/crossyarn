export default function PatternsLoading() {
  return (
    <section className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="space-y-2">
          <div className="h-9 w-44 rounded-2xl bg-yarn-sand/40 animate-pulse" />
          <div className="h-4 w-72 rounded-xl bg-yarn-sand/30 animate-pulse" />
        </div>
        <div className="flex gap-3">
          <div className="h-11 w-36 rounded-full bg-yarn-sand/30 animate-pulse" />
          <div className="h-11 w-36 rounded-full bg-yarn-terracotta/20 animate-pulse" />
        </div>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {Array.from({ length: 6 }, (_, i) => (
          <div key={i} className="rounded-2xl bg-white/70 border border-yarn-sand/50 p-6 space-y-3 shadow-warm-sm">
            <div className="flex items-start justify-between gap-4">
              <div className="space-y-2 flex-1">
                <div className="h-5 w-3/4 rounded-lg bg-yarn-sand/40 animate-pulse" />
                <div className="h-4 w-1/3 rounded-lg bg-yarn-sand/30 animate-pulse" />
              </div>
              <div className="h-6 w-16 rounded-full bg-yarn-sage-light/60 animate-pulse" />
            </div>
            <div className="h-4 w-full rounded-lg bg-yarn-sand/20 animate-pulse" />
            <div className="h-px bg-yarn-sand/40 mt-4" />
            <div className="flex gap-4 pt-1">
              <div className="h-4 w-24 rounded-lg bg-yarn-terracotta/20 animate-pulse" />
              <div className="h-4 w-12 rounded-lg bg-yarn-sand/30 animate-pulse" />
              <div className="h-4 w-16 rounded-lg bg-yarn-sand/20 animate-pulse" />
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
