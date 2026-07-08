import { NextRequest, NextResponse } from 'next/server';
import { db, watchProgress } from '@omozoku/db';
import { eq, and } from 'drizzle-orm';
import { cookies } from 'next/headers';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const animeIdParam = searchParams.get('animeId');
    const episodeParam = searchParams.get('episode');

    if (!animeIdParam || !episodeParam) {
      return NextResponse.json({ error: 'Missing animeId or episode' }, { status: 400 });
    }

    const animeId = parseInt(animeIdParam, 10);
    const episode = parseInt(episodeParam, 10);

    // In the future, grab userId from auth session
    const userId = null; 
    
    // For now, use a guest sessionId cookie
    const cookieStore = cookies();
    const sessionId = cookieStore.get('omozoku_session')?.value;

    if (!userId && !sessionId) {
      return NextResponse.json({ progress: null });
    }

    let progressRecord;
    if (userId) {
      progressRecord = await db.query.watchProgress.findFirst({
        where: and(eq(watchProgress.userId, userId), eq(watchProgress.animeId, animeId), eq(watchProgress.episode, episode)),
      });
    } else if (sessionId) {
      progressRecord = await db.query.watchProgress.findFirst({
        where: and(eq(watchProgress.sessionId, sessionId), eq(watchProgress.animeId, animeId), eq(watchProgress.episode, episode)),
      });
    }

    return NextResponse.json({ progress: progressRecord ?? null });
  } catch (error) {
    console.error('[API Progress GET] Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { animeId, episode, secondsWatched, sessionId: bodySessionId } = body;

    if (typeof animeId !== 'number' || typeof episode !== 'number' || typeof secondsWatched !== 'number') {
      return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });
    }

    // Future: grab from auth
    const userId = null;
    
    // Get session from cookie, or fallback to body
    const cookieStore = cookies();
    let sessionId = cookieStore.get('omozoku_session')?.value;
    
    if (!sessionId && bodySessionId) {
      sessionId = bodySessionId;
      // We don't set the cookie here because Next.js route handlers can't easily set cookies without returning a response
      // but it's fine, the client will set it.
    }

    if (!userId && !sessionId) {
      return NextResponse.json({ error: 'Unauthorized and no session' }, { status: 401 });
    }

    // Upsert the progress
    const now = new Date();

    if (userId) {
      const existing = await db.query.watchProgress.findFirst({
        where: and(eq(watchProgress.userId, userId), eq(watchProgress.animeId, animeId), eq(watchProgress.episode, episode)),
      });

      if (existing) {
        await db.update(watchProgress)
          .set({ secondsWatched, updatedAt: now })
          .where(eq(watchProgress.id, existing.id));
      } else {
        await db.insert(watchProgress).values({
          userId,
          animeId,
          episode,
          secondsWatched,
          updatedAt: now,
        });
      }
    } else if (sessionId) {
      const existing = await db.query.watchProgress.findFirst({
        where: and(eq(watchProgress.sessionId, sessionId), eq(watchProgress.animeId, animeId), eq(watchProgress.episode, episode)),
      });

      if (existing) {
        await db.update(watchProgress)
          .set({ secondsWatched, updatedAt: now })
          .where(eq(watchProgress.id, existing.id));
      } else {
        await db.insert(watchProgress).values({
          sessionId,
          animeId,
          episode,
          secondsWatched,
          updatedAt: now,
        });
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[API Progress POST] Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
