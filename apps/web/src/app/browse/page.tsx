import { Metadata } from 'next';
import { BrowseHero } from '@/components/browse/BrowseHero';
import { StickyFilterBar } from '@/components/browse/StickyFilterBar';
import { DiscoveryRails } from '@/components/browse/DiscoveryRails';
import { InfiniteAnimeGrid } from '@/components/browse/InfiniteAnimeGrid';

export const metadata: Metadata = {
  title: 'Discover',
  description: 'Explore and discover thousands of anime by season, studio, or genre.',
};

export default function BrowsePage() {
  return (
    <div className="flex flex-col min-h-screen">
      <BrowseHero />
      
      <div className="relative">
        <StickyFilterBar />
        
        <div className="py-8 space-y-8">
          <DiscoveryRails />
          <InfiniteAnimeGrid />
        </div>
      </div>
    </div>
  );
}
