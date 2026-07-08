import { Suspense } from 'react';
import { jikanGetTopAnime, jikanGetCurrentSeason } from '@omozoku/api-clients';
import { transformAnime } from '@omozoku/transformers';
import { HorizontalRail } from '@/components/ui/HorizontalRail';
import { PosterCard } from '@/components/PosterCard';
import { RailSkeleton } from '@/components/ui/SkeletonLoader';
import { unstable_cache } from 'next/cache';
import type { Anime } from '@omozoku/types';

// Cached server fetchers for rails
const getTrending = unstable_cache(
  async (): Promise<Anime[]> => {
    const res = await jikanGetTopAnime(1, 'bypopularity');
    return res.data.slice(0, 12).map(transformAnime);
  },
  ['jikan-trending'],
  { revalidate: 3600 } // 1 hour
);

const getCurrentSeason = unstable_cache(
  async (): Promise<Anime[]> => {
    const res = await jikanGetCurrentSeason();
    return res.data.slice(0, 12).map(transformAnime);
  },
  ['jikan-season-now'],
  { revalidate: 3600 }
);

const getHighestRated = unstable_cache(
  async (): Promise<Anime[]> => {
    const res = await jikanGetTopAnime(1, 'favorite');
    return res.data.slice(0, 12).map(transformAnime);
  },
  ['jikan-highest-rated'],
  { revalidate: 3600 * 24 } // 24 hours
);

// The Hidden Gems rail requires a derived query: top score, low popularity
const getHiddenGems = unstable_cache(
  async (): Promise<Anime[]> => {
    // We'll fetch top score.
    const top = await jikanGetTopAnime(1, 'favorite');
    return top.data.filter((a: any) => (a.members || 0) < 200000).slice(0, 12).map(transformAnime);
  },
  ['jikan-hidden-gems'],
  { revalidate: 3600 * 24 * 7 } // 1 week TTL
);

async function TrendingRail() {
  const animes = await getTrending();
  if (animes.length === 0) return null;
  return (
    <HorizontalRail title="🔥 Trending Now">
      {animes.map((anime: Anime, i: number) => (
        <div key={anime.id} className="flex-none w-[140px] md:w-[180px]">
          <PosterCard anime={anime} aosDelay={i * 50} />
        </div>
      ))}
    </HorizontalRail>
  );
}

async function CurrentSeasonRail() {
  const animes = await getCurrentSeason();
  if (animes.length === 0) return null;
  return (
    <HorizontalRail title="🌸 Current Season">
      {animes.map((anime: Anime, i: number) => (
        <div key={anime.id} className="flex-none w-[140px] md:w-[180px]">
          <PosterCard anime={anime} aosDelay={i * 50} />
        </div>
      ))}
    </HorizontalRail>
  );
}

async function HighestRatedRail() {
  const animes = await getHighestRated();
  if (animes.length === 0) return null;
  return (
    <HorizontalRail title="⭐ Highest Rated">
      {animes.map((anime: Anime, i: number) => (
        <div key={anime.id} className="flex-none w-[140px] md:w-[180px]">
          <PosterCard anime={anime} aosDelay={i * 50} />
        </div>
      ))}
    </HorizontalRail>
  );
}

async function HiddenGemsRail() {
  const animes = await getHiddenGems();
  if (animes.length === 0) return null;
  return (
    <HorizontalRail title="💎 Hidden Gems">
      {animes.map((anime: Anime, i: number) => (
        <div key={anime.id} className="flex-none w-[140px] md:w-[180px]">
          <PosterCard anime={anime} aosDelay={i * 50} />
        </div>
      ))}
    </HorizontalRail>
  );
}

export function DiscoveryRails() {
  return (
    <div className="flex flex-col gap-8 w-full overflow-hidden max-w-[100vw]">
      <Suspense fallback={<HorizontalRail title="🔥 Trending Now"><RailSkeleton /></HorizontalRail>}>
        <TrendingRail />
      </Suspense>
      
      <Suspense fallback={<HorizontalRail title="🌸 Current Season"><RailSkeleton /></HorizontalRail>}>
        <CurrentSeasonRail />
      </Suspense>
      
      <Suspense fallback={<HorizontalRail title="⭐ Highest Rated"><RailSkeleton /></HorizontalRail>}>
        <HighestRatedRail />
      </Suspense>

      <Suspense fallback={<HorizontalRail title="💎 Hidden Gems"><RailSkeleton /></HorizontalRail>}>
        <HiddenGemsRail />
      </Suspense>
    </div>
  );
}
