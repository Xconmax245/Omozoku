import { NextRequest, NextResponse } from 'next/server';
import { jikanGetRecommendations } from '@omozoku/api-clients';
import { transformAnime } from '@omozoku/transformers';

export const runtime = 'nodejs';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const animeId = Number(searchParams.get('animeId'));

  if (!animeId || isNaN(animeId)) {
    return NextResponse.json({ error: 'Missing or invalid animeId' }, { status: 400 });
  }

  try {
    const raw = await jikanGetRecommendations(animeId);
    // Transform recommendations
    const data = raw.data.slice(0, 15).map((r) => transformAnime(r.entry as any));
    return NextResponse.json({ data }, {
      headers: {
        'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400',
      },
    });
  } catch (error) {
    console.error(`[API /recommendations] Error fetching for animeId=${animeId}`, error);
    return NextResponse.json({ error: 'Failed to fetch recommendations' }, { status: 500 });
  }
}
