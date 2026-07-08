import { NextRequest, NextResponse } from 'next/server';
import { db } from '@omozoku/db';
import { userNotificationReads } from '@omozoku/db/src/schema';
import { auth } from '@/auth';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
): Promise<NextResponse> {
  try {
    const session = await auth();
    const userId = session?.user?.id;

    if (!userId) {
      // For anonymous users, read-state is managed purely client-side via localStorage.
      return NextResponse.json({ error: 'Unauthorized. Guests track reads locally.' }, { status: 401 });
    }

    const notificationId = params.id;
    if (!notificationId) {
      return NextResponse.json({ error: 'Notification ID is required' }, { status: 400 });
    }

    // Upsert into userNotificationReads
    await db.insert(userNotificationReads)
      .values({
        userId,
        notificationId,
      })
      .onConflictDoNothing();

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error(`Error marking notification ${params.id} as read:`, error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
