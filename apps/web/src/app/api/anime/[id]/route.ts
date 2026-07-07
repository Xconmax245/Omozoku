import { NextRequest, NextResponse } from 'next/server';
import { jikanGetAnime, jikanGetCharacters, getCache, CacheKeys, CacheTTL } from '@omozoku/api-clients';
import { transformAnime, transformCharacters } from '@omozoku/transformers';

export const runtime = 'nodejs';

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const id = Number(params.id);
  if (isNaN(id)) {
    return NextResponse.json({ error: 'NOT_FOUND', message: 'Invalid anime ID.' }, { status: 404 });
  }

  const cache = getCache();
  const cacheKey = CacheKeys.anime(id);

  const cached = await cache.get(cacheKey);
  if (cached) {
    return NextResponse.json(cached, { headers: { 'X-Cache': 'HIT' } });
  }

  try {
    const [animeRaw, charsRaw] = await Promise.allSettled([
      jikanGetAnime(id),
      jikanGetCharacters(id),
    ]);

    if (animeRaw.status === 'rejected') {
      return NextResponse.json(
        { error: 'NOT_FOUND', message: `Anime ${id} not found.` },
        { status: 404 },
      );
    }

    const anime = transformAnime(animeRaw.value);
    const characters =
      charsRaw.status === 'fulfilled' ? transformCharacters(charsRaw.value) : [];

    const payload = { anime, characters };
    
    // Only cache if characters also succeeded. Do not permanently cache a rate-limit failure.
    const hasFullData = charsRaw.status === 'fulfilled';
    if (hasFullData) {
      await cache.set(cacheKey, payload, CacheTTL.anime);
    }
    
    return NextResponse.json(payload, { 
      headers: { 
        'X-Cache': hasFullData ? 'MISS' : 'PARTIAL',
        'Cache-Control': hasFullData ? 'public, s-maxage=3600' : 'no-store'
      } 
    });
  } catch (err) {
    console.error(`[/api/anime/${id}]`, err);
    return NextResponse.json(
      { error: 'PROVIDER_DOWN', message: 'Failed to fetch anime.' },
      { status: 502 },
    );
  }
}
