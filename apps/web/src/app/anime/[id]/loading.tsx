export default function AnimeLoading() {
  return (
    <div className="min-h-dvh">
      {/* Hero Header Skeleton */}
      <div className="relative h-[400px] md:h-[500px] w-full bg-bg-surface overflow-hidden">
        <div className="absolute inset-0 skeleton opacity-20" />
        <div className="absolute inset-0 bg-gradient-to-t from-bg-base via-bg-base/80 to-transparent" />
        
        <div className="relative h-full max-w-screen-2xl mx-auto px-4 md:px-6 lg:px-8 flex flex-col justify-end pb-8">
          <div className="flex flex-col md:flex-row gap-6 md:gap-8 items-end md:items-stretch">
            {/* Poster Skeleton */}
            <div className="shrink-0 relative w-32 md:w-48 aspect-[2/3] rounded-card overflow-hidden border border-border-subtle -mb-16 md:mb-0 z-10 hidden md:block skeleton" />

            {/* Metadata Skeleton */}
            <div className="flex-1 space-y-4 w-full">
              <div className="h-10 md:h-14 w-3/4 max-w-2xl skeleton rounded-pill" />
              
              <div className="flex gap-3">
                <div className="h-6 w-12 skeleton rounded-pill" />
                <div className="h-6 w-16 skeleton rounded-pill" />
                <div className="h-6 w-20 skeleton rounded-pill" />
              </div>

              <div className="flex gap-2">
                <div className="h-7 w-20 skeleton rounded-pill" />
                <div className="h-7 w-24 skeleton rounded-pill" />
              </div>

              <div className="pt-4">
                <div className="h-11 w-36 skeleton rounded-pill" />
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-screen-2xl mx-auto px-4 md:px-6 lg:px-8 py-12 flex flex-col lg:flex-row gap-8">
        <div className="flex-1 space-y-8">
          <section>
            <div className="h-7 w-32 skeleton rounded-pill mb-4" />
            <div className="space-y-3">
              <div className="h-4 w-full max-w-3xl skeleton rounded-pill" />
              <div className="h-4 w-full max-w-2xl skeleton rounded-pill" />
              <div className="h-4 w-full max-w-3xl skeleton rounded-pill" />
              <div className="h-4 w-2/3 max-w-xl skeleton rounded-pill" />
            </div>
          </section>
        </div>
        
        {/* Episodes Skeleton */}
        <aside className="w-full lg:w-80 space-y-6">
          <div className="h-7 w-32 skeleton rounded-pill" />
          <div className="flex flex-col gap-2">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="h-12 w-full skeleton rounded-card" />
            ))}
          </div>
        </aside>
      </div>
    </div>
  );
}
