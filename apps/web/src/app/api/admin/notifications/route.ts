import { NextRequest, NextResponse } from 'next/server';
import { db } from '@omozoku/db';
import { notifications } from '@omozoku/db/src/schema';

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const authHeader = request.headers.get('Authorization');
    const secret = process.env.ADMIN_NOTIFICATION_SECRET;

    if (!secret || authHeader !== `Bearer ${secret}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { type, title, body: notificationBody, linkUrl, icon, isDismissible, priority } = body;

    if (!type || !title || !notificationBody) {
      return NextResponse.json({ error: 'Missing required fields (type, title, body)' }, { status: 400 });
    }

    const [inserted] = await db.insert(notifications).values({
      userId: null, // Broadcast
      type,
      title,
      body: notificationBody,
      linkUrl: linkUrl || null,
      icon: icon || null,
      isDismissible: isDismissible ?? true,
      priority: priority ?? 0,
    }).returning();

    return NextResponse.json({ success: true, notification: inserted });
  } catch (error) {
    console.error('Error creating admin notification:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
