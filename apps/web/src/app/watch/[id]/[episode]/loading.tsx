import { ArrowLeft } from 'lucide-react';

export default function WatchLoading() {
  return (
    <div className="max-w-screen-2xl mx-auto px-4 md:px-6 lg:px-8 py-6 space-y-6">
      {/* Back to details skeleton */}
      <div className="inline-flex items-center gap-2 text-sm text-text-secondary w-fit">
        <ArrowLeft size={16} />
        <div className="h-4 w-32 skeleton rounded-pill" />
      </div>

      {/* Video Player Area skeleton */}
      <div className="w-full aspect-video skeleton rounded-card border border-border-subtle" />

      {/* Metadata skeleton */}
      <div className="flex flex-col md:flex-row gap-6 justify-between items-start">
        <div className="space-y-3 w-full max-w-md">
          <div className="h-8 w-48 skeleton rounded-pill" />
          <div className="h-6 w-full skeleton rounded-pill" />
        </div>
        
        {/* Next/Prev Navigation skeleton */}
        <div className="flex items-center gap-3">
          <div className="h-10 w-24 skeleton rounded-pill" />
          <div className="h-10 w-32 skeleton rounded-pill" />
        </div>
      </div>
    </div>
  );
}
