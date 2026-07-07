'use client';

import { PosterCard, PosterCardSkeleton } from '@/components/PosterCard';
import type { Anime } from '@omozoku/types';
import { cn } from '@/lib/utils';

interface AnimeGridProps {
  animes: Pick<Anime, 'id' | 'title' | 'images' | 'score' | 'year' | 'type'>[];
  loading?: boolean;
  skeletonCount?: number;
  className?: string;
  /** If true, the first row of cards loads with higher priority */
  prioritizeFirst?: boolean;
}

/**
 * Responsive anime poster grid.
 * Columns: 2 → 3 → 4 → 5 → 6 → 7 across breakpoints.
 * Stagger: 40ms delay per column index (not per card, to avoid slowness on large grids).
 */
export function AnimeGrid({
  animes,
  loading = false,
  skeletonCount = 18,
  className,
  prioritizeFirst = false,
}: AnimeGridProps) {
  const gridClass = cn(
    'grid gap-4',
    'grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-7',
    className,
  );

  if (loading) {
    return (
      <div className={gridClass}>
        {Array.from({ length: skeletonCount }).map((_, i) => (
          <PosterCardSkeleton key={i} />
        ))}
      </div>
    );
  }

  return (
    <div className={gridClass}>
      {animes.map((anime, i) => {
        const col = i % 7; // stagger by column position, not absolute index
        return (
          <PosterCard
            key={anime.id}
            anime={anime}
            priority={prioritizeFirst && i < 7}
            aosDelay={col * 40}
          />
        );
      })}
    </div>
  );
}
