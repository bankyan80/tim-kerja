import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";

export async function GET() {
  const session = await auth();
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  try {
    const { createClient } = await import("@libsql/client");
    const client = createClient({
      url: process.env.TURSO_DATABASE_URL!,
      authToken: process.env.TURSO_AUTH_TOKEN,
    });
    const { rows } = await client.execute({
      sql: `SELECT p.foto FROM user_profiles p JOIN users u ON u.id = p.user_id WHERE u.email = ?`,
      args: [session.user.email],
    });
    return NextResponse.json({ foto: (rows[0] as any)?.foto || null });
  } catch {
    return NextResponse.json({ foto: null });
  }
}

export async function PUT(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  try {
    const body = await req.json();
    const { createClient } = await import("@libsql/client");
    const client = createClient({
      url: process.env.TURSO_DATABASE_URL!,
      authToken: process.env.TURSO_AUTH_TOKEN,
    });
    const { rows } = await client.execute({
      sql: "SELECT id FROM users WHERE email = ?",
      args: [session.user.email],
    });
    if (rows.length === 0) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }
    const userId = (rows[0] as any).id;
    if (body.foto !== undefined) {
      await client.execute({
        sql: "INSERT INTO user_profiles (user_id, foto, updated_at) VALUES (?, ?, datetime('now')) ON CONFLICT(user_id) DO UPDATE SET foto = excluded.foto, updated_at = datetime('now')",
        args: [userId, body.foto],
      });
    }
    if (body.name) {
      await client.execute({
        sql: "UPDATE users SET name = ?, updated_at = datetime('now') WHERE id = ?",
        args: [body.name, userId],
      });
    }
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Failed to save profile" }, { status: 500 });
  }
}
