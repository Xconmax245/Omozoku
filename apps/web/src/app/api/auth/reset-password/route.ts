import { NextResponse } from 'next/server';
import { db, users, verificationTokens } from '@omozoku/db';
import { eq, and, gt } from 'drizzle-orm';
import { z } from 'zod';
import bcrypt from 'bcryptjs';

const schema = z.object({
  email: z.string().email().max(254),
  token: z.string().min(1),
  password: z.string().min(8),
});

export const dynamic = 'force-dynamic';
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const parsed = schema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid request.' }, { status: 400 });
    }

    const { email, token, password } = parsed.data;
    const normalizedEmail = email.toLowerCase().trim();

    // Find a valid, non-expired token
    const [record] = await db
      .select()
      .from(verificationTokens)
      .where(
        and(
          eq(verificationTokens.identifier, normalizedEmail),
          eq(verificationTokens.token, token),
          gt(verificationTokens.expires, new Date()),
        )
      )
      .limit(1);

    if (!record) {
      return NextResponse.json(
        { error: 'This reset link is invalid or has expired. Please request a new one.' },
        { status: 400 }
      );
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(password, 12);

    // Update the user's password
    await db
      .update(users)
      .set({ password: hashedPassword })
      .where(eq(users.email, normalizedEmail));

    // Delete the used token
    await db
      .delete(verificationTokens)
      .where(
        and(
          eq(verificationTokens.identifier, normalizedEmail),
          eq(verificationTokens.token, token),
        )
      );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[reset-password] Error:', error);
    return NextResponse.json({ error: 'Internal server error.' }, { status: 500 });
  }
}
