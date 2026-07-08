'use client';

import { useEffect, useRef } from 'react';
import { useInfiniteQuery } from '@tanstack/react-query';
import { PosterCard, PosterCardSkeleton } from '@/components/PosterCard';
import { useQueryState } from 'nuqs';
import type { Anime } from '@omozoku/types';
import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

export function InfiniteAnimeGrid() {
  const [sort] = useQueryState('sort', { defaultValue: 'bypopularity' });
  const [status] = useQueryState('status');
  const [type] = useQueryState('type');
  const [genre] = useQueryState('genre');
  
  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    status: queryStatus,
  } = useInfiniteQuery({
    queryKey: ['anime', 'infinite', { sort, status, type, genre }],
    queryFn: async ({ pageParam = 1 }) => {
      const searchParams = new URLSearchParams({
        page: pageParam.toString(),
        limit: '24',
      });
      
      // Map sort values to Jikan's order_by parameter
      const orderByMap: Record<string, string> = {
        bypopularity: 'members',
        score: 'score',
        favorite: 'favorites',
        start_date: 'start_date',
      };
      const orderBy = orderByMap[sort ?? 'bypopularity'] ?? 'members';
      searchParams.append('order_by', orderBy);
      searchParams.append('sort', 'desc');

      if (status) searchParams.append('status', status);
      if (type) searchParams.append('type', type);
      if (genre) searchParams.append('genres', genre);

      const res = await fetch(`/api/browse?${searchParams.toString()}`);
      if (!res.ok) {
        throw new Error('Failed to fetch anime');
      }
      return res.json() as Promise<{ data: Anime[]; pagination: { has_next_page: boolean } }>;
    },
    initialPageParam: 1,
    getNextPageParam: (lastPage, allPages) => {
      return lastPage.pagination.has_next_page ? allPages.length + 1 : undefined;
    },
    staleTime: 60 * 1000 * 5, // 5 minutes
  });

  const loadMoreRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasNextPage && !isFetchingNextPage) {
          fetchNextPage();
        }
      },
      { rootMargin: '400px' }
    );

    if (loadMoreRef.current) {
      observer.observe(loadMoreRef.current);
    }

    return () => observer.disconnect();
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  const allAnime = data?.pages.flatMap((page) => page.data) ?? [];

  if (queryStatus === 'pending') {
    return (
      <div className="grid gap-4 grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-7 px-4 md:px-6 lg:px-8 py-8 max-w-screen-2xl mx-auto">
        {Array.from({ length: 21 }).map((_, i) => (
          <PosterCardSkeleton key={i} />
        ))}
      </div>
    );
  }

  if (queryStatus === 'error') {
    return (
      <div className="py-20 text-center text-red-500 font-body">
        Failed to load anime. Please try again.
      </div>
    );
  }

  if (allAnime.length === 0) {
    return (
      <div className="py-32 flex flex-col items-center justify-center text-center px-4">
        <h3 className="text-2xl font-display font-bold text-white mb-2">No anime found</h3>
        <p className="text-text-secondary font-body max-w-md">
          Try adjusting your filters to find what you&apos;re looking for.
        </p>
      </div>
    );
  }

  return (
    <div className="px-4 md:px-6 lg:px-8 py-8 max-w-screen-2xl mx-auto">
      <div className="grid gap-4 grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-7">
        {allAnime.map((anime, i) => {
          const col = i % 7;
          return (
            <PosterCard
              key={`${anime.id}-${i}`}
              anime={anime}
              aosDelay={col * 40}
            />
          );
        })}
      </div>

      {/* Infinite Scroll Trigger */}
      <div 
        ref={loadMoreRef} 
        className={cn(
          "w-full py-12 flex justify-center",
          !hasNextPage && "invisible"
        )}
      >
        {isFetchingNextPage ? (
          <div className="flex items-center gap-2 text-text-secondary">
            <Loader2 className="animate-spin" size={20} />
            <span className="text-sm font-medium">Loading more...</span>
          </div>
        ) : (
          <div className="h-8" />
        )}
      </div>
      
      {!hasNextPage && allAnime.length > 0 && (
        <div className="py-12 text-center text-text-secondary text-sm font-medium">
          You&apos;ve reached the end of the line.
        </div>
      )}
    </div>
  );
}
