import { NextRequest, NextResponse } from 'next/server';
import { db } from '@omozoku/db';
import { notifications, userNotificationReads } from '@omozoku/db/src/schema';
import { desc, asc, eq, or, isNull, and } from 'drizzle-orm';
import { cookies } from 'next/headers';

export const dynamic = 'force-dynamic';

function getGuestId(): string | null {
  const cookieStore = cookies();
  return cookieStore.get('omo_guest_id')?.value || null;
}

export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    // Phase 1: Pre-auth we use the guest ID
    const userId = getGuestId();
    
    // Fetch notifications:
    // 1. Global broadcasts (userId is NULL)
    // 2. User-specific notifications (userId === current userId)
    let query;
    if (userId) {
      query = db.select()
        .from(notifications)
        .where(
          or(
            isNull(notifications.userId),
            eq(notifications.userId, userId)
          )
        )
        // Priority 0 = normal, 9999 = pinned last. So asc(priority) makes 9999 appear last.
        // desc(createdAt) sorts newest first within each priority bucket.
        .orderBy(asc(notifications.priority), desc(notifications.createdAt));
    } else {
      query = db.select()
        .from(notifications)
        .where(isNull(notifications.userId))
        .orderBy(asc(notifications.priority), desc(notifications.createdAt));
    }

    const allNotifications = await query;

    // For V1 (anonymous), read-state is entirely managed client-side in localStorage.
    // For authenticated users in Phase 2, we would join userNotificationReads here.
    return NextResponse.json({ notifications: allNotifications });

  } catch (error) {
    console.error('Error fetching notifications:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
