import { NextResponse } from 'next/server';
import { db, users } from '@omozoku/db';
import { eq } from 'drizzle-orm';

export const dynamic = 'force-dynamic';
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const username = searchParams.get('username');

    if (!username) {
      return NextResponse.json({ available: false, error: 'Username is required.' }, { status: 400 });
    }

    // Basic regex check before hitting DB
    if (!/^[a-z0-9_]{3,20}$/.test(username)) {
      return NextResponse.json({ available: false, error: 'Invalid username format.' });
    }

    const existingUser = await db.query.users.findFirst({
      where: eq(users.username, username.toLowerCase()),
      columns: { id: true },
    });

    return NextResponse.json({ available: !existingUser });
  } catch (error) {
    console.error('Check username error:', error);
    return NextResponse.json({ available: false, error: 'Internal server error.' }, { status: 500 });
  }
}
