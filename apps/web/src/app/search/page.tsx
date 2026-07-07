import { jikanSearchAnime, jikanGetTopAnime, getCache, CacheKeys, CacheTTL } from '@omozoku/api-clients';
import { transformAnime } from '@omozoku/transformers';
import { AnimeGrid } from '@/components/AnimeGrid';
import { hashString } from '@/lib/utils';
import type { Anime } from '@omozoku/types';
import { SearchInput } from '@/components/SearchInput';
import { Flame } from 'lucide-react';

export const runtime = 'nodejs';

async function fetchSearchResults(q: string): Promise<Anime[]> {
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
      return [];
    }
  }

  const cacheKey = CacheKeys.search(hashString(`${q}:1:`));
  const cached = await cache.get(cacheKey);
  if (cached) return (cached as { results: Anime[] }).results;
  
  try {
    const res = await jikanSearchAnime(q, 1);
    const results = res.data.map(transformAnime);
    const payload = {
      results,
      pagination: {
        currentPage: res.pagination.current_page,
        lastPage: res.pagination.last_visible_page,
        hasNext: res.pagination.has_next_page,
        total: res.pagination.items.total,
      }
    };
    await cache.set(cacheKey, payload, CacheTTL.search);
    return results;
  } catch (err) {
    console.error('Failed to search', err);
    return [];
  }
}

export default async function SearchPage({
  searchParams,
}: {
  searchParams: { q?: string };
}) {
  const query = searchParams.q?.trim() ?? '';
  const results = await fetchSearchResults(query);

  return (
    <div className="px-4 md:px-6 lg:px-8 py-6 max-w-screen-2xl mx-auto space-y-12 pb-20">
      <div className="max-w-2xl mx-auto pt-8">
        <SearchInput />
      </div>
      
      <div>
        <div className="flex items-center gap-2 mb-6" data-aos="fade-up">
          {query ? (
            <h2 className="text-2xl font-display font-extrabold text-text-primary">
              Results for <span className="text-accent">"{query}"</span>
            </h2>
          ) : (
            <>
              <Flame className="text-accent" size={28} />
              <h2 className="text-2xl font-display font-extrabold text-text-primary">
                Trending Searches
              </h2>
            </>
          )}
        </div>

        {results.length > 0 ? (
          <AnimeGrid animes={results} />
        ) : (
          <p className="text-text-secondary font-body text-lg text-center py-12" data-aos="fade-up">
            No anime found matching your query. Try a different term.
          </p>
        )}
      </div>
    </div>
  );
}
