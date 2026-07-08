/* eslint-disable @typescript-eslint/ban-ts-comment */
// @ts-nocheck
import NextAuth from "next-auth";
import { DrizzleAdapter } from "@auth/drizzle-adapter";
import { db, users } from "@omozoku/db";
import Credentials from "next-auth/providers/credentials";
import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs";

const nextAuth = NextAuth({
  secret: process.env.AUTH_SECRET || "fallback-dev-secret-1234567890",
  adapter: DrizzleAdapter(db),
  session: { strategy: "jwt" }, // Required for Credentials provider
  pages: {
    signIn: '/auth/signin',
  },
  providers: [
    Credentials({
      name: "Account",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;
        
        const email = credentials.email as string;
        const password = credentials.password as string;
        
        const [existingUser] = await db.select().from(users).where(eq(users.email, email.toLowerCase())).limit(1);
        
        if (!existingUser || !existingUser.password) {
          return null; // User not found or signed up via OAuth
        }

        const isValid = await bcrypt.compare(password, existingUser.password);
        
        if (!isValid) {
          return null;
        }

        return {
          id: existingUser.id,
          name: existingUser.name,
          email: existingUser.email,
          image: existingUser.image,
        };
      }
    })
  ],
  callbacks: {
    async jwt({ token, user, trigger, session }) {
      if (user) {
        token.id = user.id;
        token.image = user.image;
      }
      if (trigger === "update" && session?.image) {
        token.image = session.image;
      }
      return token;
    },
    async session({ session, token }) {
      if (token && session.user) {
        session.user.id = (token.id || token.sub) as string;
        session.user.image = (token.image as string | null) || null;
      }
      return session;
    }
  }
});
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const handlers: any = nextAuth.handlers;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const auth: any = nextAuth.auth;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const signIn: any = nextAuth.signIn;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const signOut: any = nextAuth.signOut;
