import { Search as SearchIcon } from 'lucide-react';

export default function SearchLoading() {
  return (
    <div className="px-4 md:px-6 lg:px-8 py-6 max-w-screen-2xl mx-auto space-y-8">
      {/* Search Input Skeleton */}
      <div className="max-w-2xl mx-auto pt-8">
        <div className="relative">
          <div className="absolute inset-y-0 left-0 flex items-center pl-4 text-text-secondary/50">
            <SearchIcon size={24} />
          </div>
          <div className="w-full h-14 rounded-card bg-bg-surface border border-border-subtle skeleton" />
        </div>
      </div>
      
      {/* Grid Skeleton */}
      <div>
        <div className="h-7 w-48 skeleton rounded-pill mb-4" />
        <div className="grid gap-4 grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-7">
          {Array.from({ length: 14 }).map((_, i) => (
            <div key={i} className="space-y-2">
              <div className="aspect-[2/3] skeleton rounded-card" />
              <div className="space-y-1.5 px-0.5">
                <div className="h-3.5 skeleton rounded-pill w-3/4" />
                <div className="h-3 skeleton rounded-pill w-1/3" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
