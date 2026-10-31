export default function MasterClassesLoading() {
  return (
    <section className="space-y-8">
      <div className="space-y-2">
        <div className="h-9 w-56 rounded-2xl bg-yarn-sand/40 animate-pulse" />
        <div className="h-4 w-96 rounded-xl bg-yarn-sand/30 animate-pulse" />
      </div>
      <div className="space-y-3">
        <div className="h-7 w-full max-w-md rounded-full bg-yarn-sand/30 animate-pulse" />
        <div className="h-7 w-full max-w-xs rounded-full bg-yarn-sand/20 animate-pulse" />
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }, (_, i) => (
          <div key={i} className="rounded-2xl bg-white/70 border border-yarn-sand/50 overflow-hidden shadow-warm-sm">
            <div className="aspect-[4/3] bg-yarn-sand/30 animate-pulse" />
            <div className="p-4 space-y-2">
              <div className="h-4 w-3/4 rounded-lg bg-yarn-sand/40 animate-pulse" />
              <div className="h-3 w-1/3 rounded-lg bg-yarn-sand/20 animate-pulse" />
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
