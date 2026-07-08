import { NextResponse } from 'next/server';
import { db, users, verificationTokens } from '@omozoku/db';
import { eq } from 'drizzle-orm';
import { z } from 'zod';
import crypto from 'crypto';

const schema = z.object({
  email: z.string().email().max(254),
});

export const dynamic = 'force-dynamic';
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const parsed = schema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid email address.' }, { status: 400 });
    }

    const email = parsed.data.email.toLowerCase().trim();

    // Find the user — always return 200 to prevent email enumeration
    const user = await db.query.users.findFirst({ where: eq(users.email, email) });

    if (user) {
      // Generate a secure 32-byte token
      const token = crypto.randomBytes(32).toString('hex');
      const expires = new Date(Date.now() + 1000 * 60 * 60); // 1 hour

      // Upsert into verificationTokens (identifier = email)
      await db
        .insert(verificationTokens)
        .values({ identifier: email, token, expires })
        .onConflictDoUpdate({
          target: [verificationTokens.identifier, verificationTokens.token],
          set: { token, expires },
        })
        .catch(async () => {
          // If conflict on composite PK, delete old and insert fresh
          await db.delete(verificationTokens).where(eq(verificationTokens.identifier, email));
          await db.insert(verificationTokens).values({ identifier: email, token, expires });
        });

      const resetUrl = `${process.env.NEXTAUTH_URL || 'http://localhost:3001'}/auth/reset-password?token=${token}&email=${encodeURIComponent(email)}`;

      // --- Send email ---
      // Check if Resend API key is configured
      const resendKey = process.env.RESEND_API_KEY;
      if (resendKey) {
        try {
          await fetch('https://api.resend.com/emails', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${resendKey}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              from: process.env.EMAIL_FROM || 'OmoZoku <noreply@omozoku.app>',
              to: [email],
              subject: 'Reset your OmoZoku password',
              html: `
                <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto; background: #0a0a0c; color: #fff; padding: 40px; border-radius: 16px;">
                  <h2 style="color: #FF2D55; margin-bottom: 16px;">Password Reset</h2>
                  <p style="color: #a0a0b0; margin-bottom: 24px;">Click the button below to reset your password. This link expires in 1 hour.</p>
                  <a href="${resetUrl}" style="display: inline-block; background: #FF2D55; color: white; padding: 14px 28px; border-radius: 8px; text-decoration: none; font-weight: bold;">Reset Password</a>
                  <p style="color: #666; margin-top: 24px; font-size: 13px;">If you didn't request this, you can safely ignore this email.</p>
                </div>
              `,
            }),
          });
        } catch (emailErr) {
          console.error('[forgot-password] Email send failed:', emailErr);
          // Don't fail the request — token is stored, user can try again
        }
      } else {
        // Dev mode: log the reset URL clearly so developers can test locally
        console.log('\n🔑 [DEV] Password reset link (no email provider configured):');
        console.log(resetUrl);
        console.log('\n');
      }
    }

    // Always return 200 so we don't reveal whether an account exists
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[forgot-password] Error:', error);
    return NextResponse.json({ error: 'Internal server error.' }, { status: 500 });
  }
}
