import {
  jikanSearchAnime,
  jikanGetTopAnime,
  getCache,
  CacheKeys,
  CacheTTL,
} from '@omozoku/api-clients';
import { transformAnime } from '@omozoku/transformers';
import { AnimeGrid } from '@/components/AnimeGrid';
import { hashString } from '@/lib/utils';
import type { Anime } from '@omozoku/types';
import { SearchInput } from '@/components/SearchInput';
import { Flame } from 'lucide-react';

export const runtime = 'nodejs';

async function fetchSearchResults(q: string): Promise<Anime[] | null> {
  const cache = getCache();

  if (!q) {
    const topCacheKey = CacheKeys.top();
    const cachedTop = await cache.get(topCacheKey);
    if (cachedTop) return (cachedTop as { results: Anime[] }).results;

    try {
      const res = await jikanGetTopAnime(1, 'bypopularity');
      const results = res.data.map(transformAnime);
      await cache.set(topCacheKey, { results }, CacheTTL.top);
      return results;
    } catch (err) {
      console.error('Failed to fetch top anime', err);
      return null;
    }
  }

  const cacheKey = CacheKeys.search(hashString(`${q}:1:`));
  const cached = await cache.get(cacheKey);
  if (cached) {
    console.log(
      '[fetchSearchResults] Cache HIT for',
      q,
      'Returning:',
      (cached as { results: Anime[] }).results.length,
      'results'
    );
    return (cached as { results: Anime[] }).results;
  }

  try {
    console.log('[fetchSearchResults] Fetching from Jikan for:', q);
    const res = await jikanSearchAnime(q, 1);
    console.log('[fetchSearchResults] Jikan returned', res.data?.length, 'items');

    const results = res.data.map(transformAnime);
    console.log('[fetchSearchResults] Transformed', results.length, 'items');

    const payload = {
      results,
      pagination: {
        currentPage: res.pagination.current_page,
        lastPage: res.pagination.last_visible_page,
        hasNext: res.pagination.has_next_page,
        total: res.pagination.items.total,
      },
    };
    await cache.set(cacheKey, payload, CacheTTL.search);
    return results;
  } catch (err) {
    console.error('[fetchSearchResults] Failed to search', err);
    return null;
  }
}

export default async function SearchPage({ searchParams }: { searchParams: { q?: string } }) {
  const query = searchParams.q?.trim() ?? '';
  const results = await fetchSearchResults(query);

  return (
    <div className="mx-auto max-w-screen-2xl space-y-12 px-4 py-6 pb-20 md:px-6 lg:px-8">
      <div className="mx-auto max-w-2xl pt-8">
        <SearchInput />
      </div>

      <div>
        <div className="mb-6 flex items-center gap-2" data-aos="fade-up">
          {query ? (
            <h2 className="font-display text-text-primary text-2xl font-extrabold">
              Results for <span className="text-accent">&quot;{query}&quot;</span>
            </h2>
          ) : (
            <>
              <Flame className="text-accent" size={28} />
              <h2 className="font-display text-text-primary text-2xl font-extrabold">
                Trending Searches
              </h2>
            </>
          )}
        </div>

        {results === null ? (
          <div
            className="bg-bg-surface/30 flex flex-col items-center rounded-3xl border border-white/5 py-20 text-center"
            data-aos="fade-up"
          >
            <Flame className="text-score-red mb-4 animate-pulse opacity-80" size={48} />
            <h2 className="font-display mb-2 text-2xl font-bold text-white">Service Unavailable</h2>
            <p className="text-text-secondary max-w-md">
              We couldn't fetch search results right now because the upstream anime provider
              (MyAnimeList) is experiencing downtime. Please try again later.
            </p>
          </div>
        ) : results.length > 0 ? (
          <AnimeGrid animes={results} />
        ) : (
          <p className="text-text-secondary font-body py-12 text-center text-lg" data-aos="fade-up">
            No anime found matching your query. Try a different term.
          </p>
        )}
      </div>
    </div>
  );
}
