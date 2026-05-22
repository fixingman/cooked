export default function HomeLoading() {
  return (
    <div className="px-4 py-6 md:px-8 max-w-5xl mx-auto space-y-8">
      {/* Greeting skeleton */}
      <div className="space-y-2">
        <div className="h-3 w-40 rounded-full skeleton" />
        <div className="h-12 w-64 rounded-xl skeleton" />
      </div>

      {/* Featured hero skeleton */}
      <div className="w-full aspect-[16/9] max-h-[420px] rounded-card skeleton" />

      {/* Meal section skeleton */}
      <div className="space-y-3">
        <div className="h-3 w-24 rounded-full skeleton" />
        <div className="flex gap-3">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="shrink-0 w-[160px] space-y-2">
              <div className="aspect-[3/4] rounded-xl skeleton" />
              <div className="h-3 w-full rounded-full skeleton" />
              <div className="h-2.5 w-16 rounded-full skeleton" />
            </div>
          ))}
        </div>
      </div>

      {/* Recently cooked skeleton */}
      <div className="space-y-2.5">
        <div className="h-3 w-32 rounded-full skeleton" />
        {[...Array(3)].map((_, i) => (
          <div key={i} className="flex items-center gap-3.5 p-3 bg-parchment-200 border border-parchment-300 rounded-card">
            <div className="w-14 h-14 rounded-xl skeleton shrink-0" />
            <div className="flex-1 space-y-2">
              <div className="h-3 w-3/4 rounded-full skeleton" />
              <div className="h-2.5 w-1/3 rounded-full skeleton" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
