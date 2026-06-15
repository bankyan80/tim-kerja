import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import { queryOne, execute } from "./db";

export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [
    Google({
      clientId: process.env.AUTH_GOOGLE_ID,
      clientSecret: process.env.AUTH_GOOGLE_SECRET,
    }),
  ],
  callbacks: {
    async signIn({ user, account }) {
      if (account?.provider === "google") {
        const existing = await queryOne(
          "SELECT id, role, status FROM users WHERE email = ?",
          [user.email!]
        );
        if (!existing) {
          await execute(
            `INSERT INTO users (email, name, avatar, role, status, created_at)
             VALUES (?, ?, ?, 'staf', 'aktif', datetime('now'))`,
            [user.email!, user.name!, user.image!]
          );
        } else if ((existing.status as string) !== "aktif") {
          return false;
        }
      }
      return true;
    },
    async session({ session, token }) {
      const user = await queryOne(
        "SELECT id, name, email, role, avatar FROM users WHERE email = ?",
        [session.user!.email!]
      );
      if (user) {
        session.user.id = user.id as string;
        session.user.role = user.role as string;
      }
      return session;
    },
    async jwt({ token, account }) {
      if (account) {
        token.accessToken = account.access_token;
      }
      return token;
    },
  },
  pages: {
    signIn: "/login",
  },
});
