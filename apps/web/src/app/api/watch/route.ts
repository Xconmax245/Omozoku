import { NextRequest, NextResponse } from 'next/server';
import { getStreamProvider, getCache, CacheKeys, CacheTTL } from '@omozoku/api-clients';
import { SourceUnavailableError, NotFoundError, ProviderDownError } from '@omozoku/api-clients';

export const runtime = 'nodejs';

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const animeId = Number(searchParams.get('animeId'));
  const episode = Number(searchParams.get('episode'));
  const title = searchParams.get('title') || undefined;
  const titleEnglish = searchParams.get('titleEnglish') || undefined;

  if (isNaN(animeId) || isNaN(episode) || episode < 1) {
    return NextResponse.json(
      { error: 'NOT_FOUND', message: 'animeId and episode (≥1) are required.' },
      { status: 400 },
    );
  }

  const cache = getCache();
  const cacheKey = CacheKeys.watch(animeId, episode);

  const cached = await cache.get(cacheKey);
  if (cached) {
    return NextResponse.json(cached, { headers: { 'X-Cache': 'HIT' } });
  }

  try {
    const provider = getStreamProvider();
    const episodeId = await provider.resolveEpisodeId(animeId, episode, title, titleEnglish);
    const watchResponse = await provider.getSources(episodeId);

    // Cache at short TTL — stream URLs expire
    await cache.set(cacheKey, watchResponse, CacheTTL.watch);

    return NextResponse.json(watchResponse, {
      headers: {
        'X-Cache': 'MISS',
        'Cache-Control': 'private, max-age=300',
      },
    });
  } catch (err) {
    if (err instanceof NotFoundError) {
      return NextResponse.json({ error: 'NOT_FOUND', message: err.message }, { status: 404 });
    }
    if (err instanceof SourceUnavailableError) {
      return NextResponse.json({ error: 'SOURCE_UNAVAILABLE', message: err.message }, { status: 503 });
    }
    if (err instanceof ProviderDownError) {
      return NextResponse.json({ error: 'PROVIDER_DOWN', message: err.message }, { status: 502 });
    }
    console.error(`[/api/watch] animeId=${animeId} ep=${episode}`, err);
    return NextResponse.json({ error: 'PROVIDER_DOWN', message: 'Streaming unavailable.' }, { status: 502 });
  }
}
