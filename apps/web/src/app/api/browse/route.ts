import { NextRequest, NextResponse } from 'next/server';
import { apiFetch } from '@omozoku/api-clients';
import { transformAnime } from '@omozoku/transformers';

export const runtime = 'nodejs';

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const raw = await apiFetch<{ data: any[]; pagination: any }>(
      `https://api.jikan.moe/v4/anime?${searchParams.toString()}`,
      { provider: 'jikan' }
    );

    // Transform raw Jikan → internal Anime type so InfiniteAnimeGrid gets the right shape
    const payload = {
      data: raw.data.map(transformAnime),
      pagination: raw.pagination,
    };

    return NextResponse.json(payload);
  } catch (err) {
    console.error('[/api/browse]', err);
    return NextResponse.json(
      { error: 'PROVIDER_DOWN', message: 'Browse failed.' },
      { status: 502 },
    );
  }
}
