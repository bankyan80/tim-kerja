import { NextRequest, NextResponse } from "next/server";

export async function GET() {
  try {
    const { createClient } = await import("@libsql/client");
    const client = createClient({
      url: process.env.TURSO_DATABASE_URL!,
      authToken: process.env.TURSO_AUTH_TOKEN,
    });
    const { rows } = await client.execute("SELECT id, name, email, role, status FROM users WHERE status = 'aktif' ORDER BY name");
    return NextResponse.json(rows);
  } catch {
    return NextResponse.json([], { status: 200 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();
    const { createClient } = await import("@libsql/client");
    const client = createClient({
      url: process.env.TURSO_DATABASE_URL!,
      authToken: process.env.TURSO_AUTH_TOKEN,
    });
    if (body.action === "update_user") {
      await client.execute({
        sql: "UPDATE users SET role = ?, status = ?, updated_at = datetime('now') WHERE id = ?",
        args: [body.role, body.status, body.id],
      });
      return NextResponse.json({ ok: true });
    }
    if (body.action === "add_user") {
      await client.execute({
        sql: "INSERT OR IGNORE INTO users (email, name, role, status) VALUES (?, ?, ?, 'aktif')",
        args: [body.email, body.name || body.email.split("@")[0], body.role || "staf"],
      });
      return NextResponse.json({ ok: true });
    }
    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch {
    return NextResponse.json({ error: "Failed to update user" }, { status: 500 });
  }
}
