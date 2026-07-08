import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { db, watchlists } from "@omozoku/db";
import { eq, and } from "drizzle-orm";

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { animeId } = await req.json();
    if (!animeId) {
      return NextResponse.json({ error: "animeId is required" }, { status: 400 });
    }

    // Check if already in watchlist
    const existing = await db.query.watchlists.findFirst({
      where: and(
        eq(watchlists.userId, session.user.id),
        eq(watchlists.animeId, animeId)
      )
    });

    if (existing) {
      // Remove it
      await db.delete(watchlists).where(eq(watchlists.id, existing.id));
      return NextResponse.json({ status: "removed" });
    } else {
      // Add it
      await db.insert(watchlists).values({
        userId: session.user.id,
        animeId,
      });
      return NextResponse.json({ status: "added" });
    }
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const items = await db.query.watchlists.findMany({
      where: eq(watchlists.userId, session.user.id)
    });

    return NextResponse.json(items);
  } catch (error) {
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
