import { NextResponse } from 'next/server';
import { jikanGetTopAnime, jikanGetCurrentSeason, getCache, CacheKeys, CacheTTL } from '@omozoku/api-clients';
import { transformAnime } from '@omozoku/transformers';

export const runtime = 'nodejs';
export const revalidate = 1800; // 30 min ISR

export async function GET() {
  const cache = getCache();
  const cacheKey = CacheKeys.home();

  // Cache check
  const cached = await cache.get(cacheKey);
  if (cached) {
    return NextResponse.json(cached, {
      headers: { 'X-Cache': 'HIT', 'Cache-Control': 'public, s-maxage=1800' },
    });
  }

  try {
    const [topRes, seasonRes] = await Promise.allSettled([
      jikanGetTopAnime(1, 'bypopularity'),
      jikanGetCurrentSeason(),
    ]);

    const top =
      topRes.status === 'fulfilled'
        ? Array.from(new Map(topRes.value.data.map((a) => [a.mal_id, a])).values()).slice(0, 28).map(transformAnime)
        : [];

    const seasonal =
      seasonRes.status === 'fulfilled'
        ? Array.from(new Map(seasonRes.value.data.map((a) => [a.mal_id, a])).values()).slice(0, 14).map(transformAnime)
        : [];

    const payload = { top, seasonal };

    // Only cache when BOTH datasets have content.
    // Partial results (e.g. top=[] from a 429) must NOT be cached —
    // the next request should retry Jikan rather than serve a stale empty array.
    const hasFullData = top.length > 0 && seasonal.length > 0;
    if (hasFullData) {
      await cache.set(cacheKey, payload, CacheTTL.home);
    }

    return NextResponse.json(payload, {
      headers: {
        'X-Cache': hasFullData ? 'MISS' : 'PARTIAL',
        'Cache-Control': hasFullData ? 'public, s-maxage=1800' : 'no-store',
      },
    });
  } catch (err) {
    console.error('[/api/home]', err);
    return NextResponse.json(
      { error: 'PROVIDER_DOWN', message: 'Failed to fetch home data.' },
      { status: 502 },
    );
  }
}
