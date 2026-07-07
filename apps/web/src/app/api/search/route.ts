import { NextRequest, NextResponse } from 'next/server';
import { jikanSearchAnime, getCache, CacheKeys, CacheTTL } from '@omozoku/api-clients';
import { transformAnime } from '@omozoku/transformers';
import { hashString } from '@/lib/utils';

export const runtime = 'nodejs';

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const q = searchParams.get('q')?.trim() ?? '';
  const page = Math.max(1, Number(searchParams.get('page') ?? 1));
  const genres = searchParams.get('genres')?.split(',').map(Number).filter(Boolean) ?? [];

  if (!q) {
    return NextResponse.json({ error: 'MISSING_QUERY', message: 'q is required.' }, { status: 400 });
  }

  const cache = getCache();
  const cacheKey = CacheKeys.search(hashString(`${q}:${page}:${genres.join(',')}`));

  const cached = await cache.get(cacheKey);
  if (cached) {
    return NextResponse.json(cached, { headers: { 'X-Cache': 'HIT' } });
  }

  try {
    const res = await jikanSearchAnime(q, page, genres.length ? genres : undefined);
    const payload = {
      results: res.data.map(transformAnime),
      pagination: {
        currentPage: res.pagination.current_page,
        lastPage: res.pagination.last_visible_page,
        hasNext: res.pagination.has_next_page,
        total: res.pagination.items.total,
      },
    };

    await cache.set(cacheKey, payload, CacheTTL.search);
    return NextResponse.json(payload, { headers: { 'X-Cache': 'MISS' } });
  } catch (err) {
    console.error('[/api/search]', err);
    return NextResponse.json(
      { error: 'PROVIDER_DOWN', message: 'Search failed.' },
      { status: 502 },
    );
  }
}
