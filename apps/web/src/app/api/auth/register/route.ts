import { NextResponse } from 'next/server';
import { db, users } from '@omozoku/db';
import { eq } from 'drizzle-orm';
import { z } from 'zod';
import bcrypt from 'bcryptjs';

const registerSchema = z.object({
  name: z.string().min(2).max(30),
  username: z.string().min(3).max(20).regex(/^[a-z0-9_]+$/),
  email: z.string().email().max(254),
  password: z.string().min(8),
});

export const dynamic = 'force-dynamic';
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const parsed = registerSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid input data', details: parsed.error.issues }, { status: 400 });
    }

    const { name, username, email, password } = parsed.data;

    // Check if email already exists
    const existingEmail = await db.query.users.findFirst({
      where: eq(users.email, email.toLowerCase().trim()),
    });

    if (existingEmail) {
      return NextResponse.json({ error: 'Email already exists.' }, { status: 409 });
    }

    // Check if username already exists
    const existingUsername = await db.query.users.findFirst({
      where: eq(users.username, username.toLowerCase().trim()),
    });

    if (existingUsername) {
      return NextResponse.json({ error: 'Username already taken.' }, { status: 409 });
    }

    // Hash the password securely
    const hashedPassword = await bcrypt.hash(password, 12);

    // Create user
    await db.insert(users).values({
      name: name.trim(),
      username: username.toLowerCase().trim(),
      email: email.toLowerCase().trim(),
      password: hashedPassword,
    });

    return NextResponse.json({ success: true, message: 'User created successfully.' });
  } catch (error) {
    console.error('Registration error:', error);
    return NextResponse.json({ error: 'Internal server error.' }, { status: 500 });
  }
}
