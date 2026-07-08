import { NextResponse } from "next/server";
import { db, notifications } from "@omozoku/db";
import { jikanGetAnime } from "@omozoku/api-clients";

export const maxDuration = 300; // Allow Vercel to run this for up to 5 minutes
export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  try {
    // Verify a cron secret here in a real production environment
    const authHeader = req.headers.get('authorization');
    if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 1. Get all watchlisted items
    const allItems = await db.query.watchlists.findMany();
    if (!allItems.length) {
      return NextResponse.json({ message: "No watchlisted items to sync" });
    }

    // 2. Group by animeId to minimize API calls
    const userMap = new Map<number, string[]>(); // animeId -> userId[]
    for (const item of allItems) {
      const users = userMap.get(item.animeId) || [];
      users.push(item.userId);
      userMap.set(item.animeId, users);
    }

    let notificationsCreated = 0;

    // 3. Sync with Jikan
    for (const [animeId, userIds] of userMap.entries()) {
      try {
        const res = await jikanGetAnime(animeId);
        const anime = res;

        // If it's currently airing, let's simulate a "New Episode" notification for demo purposes
        // In a real system, you'd track the last aired episode number in the DB and compare it.
        if (anime.status === 'Currently Airing' || anime.status === 'Not yet aired') {
          
          const title = anime.status === 'Currently Airing' 
            ? 'New Episode Available' 
            : 'New Season Upcoming';
          const type = anime.status === 'Currently Airing' ? 'new_episode' : 'new_season';
          const body = `${anime.title_english || anime.title} just got an update!`;

          const inserts = userIds.map(userId => ({
            userId,
            type,
            title,
            body,
            metaData: {
              animeId,
              imageUrl: anime.images?.jpg?.large_image_url || anime.images?.jpg?.image_url
            }
          }));

          await db.insert(notifications).values(inserts);
          notificationsCreated += inserts.length;
        }
        
        // Wait 350ms to respect Jikan rate limits (3 requests / second)
        await new Promise(resolve => setTimeout(resolve, 350));
      } catch (err) {
        console.error(`Failed to sync anime ${animeId}`, err);
      }
    }

    return NextResponse.json({ 
      success: true, 
      syncedAnimes: userMap.size,
      notificationsCreated 
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
