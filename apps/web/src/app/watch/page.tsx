import { Metadata } from 'next';
import { Suspense } from 'react';
import { WatchHero, WatchHistoryRail, StatisticsGrid } from '@/components/watch/WatchComponents';
import { SkeletonLoader } from '@/components/ui/SkeletonLoader';

export const metadata: Metadata = {
  title: 'My Watch',
  description: 'Your personal anime dashboard. Continue watching and view your history.',
};

export default function WatchDashboardPage() {
  return (
    <div className="flex flex-col min-h-screen">
      <Suspense fallback={<div className="h-[50vh] w-full skeleton rounded-b-3xl" />}>
        <WatchHero />
      </Suspense>

      <div className="py-8 space-y-12">
        <Suspense fallback={<div className="h-48 w-full max-w-screen-2xl mx-auto px-4"><SkeletonLoader className="w-full h-full" /></div>}>
          <WatchHistoryRail />
        </Suspense>
        
        <Suspense fallback={<div className="h-48 w-full max-w-screen-2xl mx-auto px-4"><SkeletonLoader className="w-full h-full" /></div>}>
          <StatisticsGrid />
        </Suspense>
      </div>
    </div>
  );
}
