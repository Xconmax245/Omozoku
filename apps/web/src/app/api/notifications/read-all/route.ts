import { NextRequest, NextResponse } from 'next/server';
import { db } from '@omozoku/db';
import { notifications, userNotificationReads } from '@omozoku/db/src/schema';
import { eq, or, isNull } from 'drizzle-orm';
import { auth } from '@/auth';

export async function POST(_request: NextRequest): Promise<NextResponse> {
  try {
    const session = await auth();
    const userId = session?.user?.id;

    if (!userId) {
      // For anonymous users, read-state is managed purely client-side via localStorage.
      return NextResponse.json({ error: 'Unauthorized. Guests track reads locally.' }, { status: 401 });
    }

    // Phase 2 (Auth): Mark all currently accessible notifications as read for this user.
    // Fetch all global and user-specific notifications
    const userNotifications = await db.select({ id: notifications.id })
      .from(notifications)
      .where(
        or(
          isNull(notifications.userId),
          eq(notifications.userId, userId)
        )
      );

    const notificationIds = userNotifications.map(n => n.id);

    if (notificationIds.length > 0) {
      // Upsert into userNotificationReads using standard ON CONFLICT DO NOTHING (if supported)
      // Drizzle Postgres upsert:
      await db.insert(userNotificationReads)
        .values(
          notificationIds.map(id => ({
            userId,
            notificationId: id,
          }))
        )
        .onConflictDoNothing();
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error in read-all notifications:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
