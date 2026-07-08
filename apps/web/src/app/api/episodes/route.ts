import { NextRequest, NextResponse } from 'next/server';
import { jikanGetEpisodes } from '@omozoku/api-clients';

export const runtime = 'nodejs';

export async function GET(req: NextRequest): Promise<NextResponse> {
  const { searchParams } = new URL(req.url);
  const animeId = Number(searchParams.get('animeId'));
  const page = Number(searchParams.get('page')) || 1;

  if (!animeId || isNaN(animeId)) {
    return NextResponse.json({ error: 'Missing or invalid animeId' }, { status: 400 });
  }

  try {
    const data = await jikanGetEpisodes(animeId, page);
    return NextResponse.json(data, {
      headers: {
        'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400',
      },
    });
  } catch (error) {
    console.error(`[API /episodes] Error fetching episodes for animeId=${animeId}`, error);
    return NextResponse.json({ error: 'Failed to fetch episodes' }, { status: 500 });
  }
}
