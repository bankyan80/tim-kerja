import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import { getClient } from "./db";

export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [
    Google({
      clientId: process.env.AUTH_GOOGLE_ID || "",
      clientSecret: process.env.AUTH_GOOGLE_SECRET || "",
    }),
  ],
  callbacks: {
    async signIn({ user, account }) {
      if (account?.provider === "google") {
        const db = getClient();
        if (!db) return true;
        try {
          const existing = await db.execute({
            sql: "SELECT id, role, status FROM users WHERE email = ?",
            args: [user.email!],
          });
          if (!existing.rows.length) {
            await db.execute({
              sql: `INSERT INTO users (email, name, avatar, role, status, created_at)
                   VALUES (?, ?, ?, 'staf', 'aktif', datetime('now'))`,
              args: [user.email!, user.name!, user.image!],
            });
          } else if ((existing.rows[0].status as string) !== "aktif") {
            return false;
          }
        } catch (e) {
          console.error("Auth DB error:", e);
        }
      }
      return true;
    },
    async session({ session }) {
      const db = getClient();
      if (db) {
        try {
          const result = await db.execute({
            sql: "SELECT id, name, email, role, avatar FROM users WHERE email = ?",
            args: [session.user!.email!],
          });
          if (result.rows.length) {
            session.user.id = result.rows[0].id as string;
            session.user.role = result.rows[0].role as string;
          }
        } catch (e) {
          console.error("Session DB error:", e);
        }
      }
      return session;
    },
  },
  pages: {
    signIn: "/login",
  },
});
