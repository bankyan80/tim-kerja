import { NextRequest, NextResponse } from "next/server";
import { getSekolahFilter } from "@/lib/auth-utils";

export async function GET() {
  try {
    const { forcedSekolah } = await getSekolahFilter();
    const { createClient } = await import("@libsql/client");
    const client = createClient({
      url: process.env.TURSO_DATABASE_URL!,
      authToken: process.env.TURSO_AUTH_TOKEN,
    });
    let sql = "SELECT id, name, email, role, status, sekolah_id FROM users WHERE status = 'aktif'";
    const args: string[] = [];
    if (forcedSekolah) { sql += " AND (sekolah_id = ? OR role = 'ketua')"; args.push(forcedSekolah); }
    sql += " ORDER BY name";
    const { rows } = await client.execute(sql, args.length ? args : undefined);
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
      let sql = "UPDATE users SET role = ?, status = ?, updated_at = datetime('now')";
      const args: any[] = [body.role, body.status];
      if (body.sekolah_id !== undefined) {
        sql += ", sekolah_id = ?";
        args.push(body.sekolah_id || null);
      }
      sql += " WHERE id = ?";
      args.push(body.id);
      await client.execute({ sql, args });
      return NextResponse.json({ ok: true });
    }
    if (body.action === "add_user") {
      await client.execute({
        sql: "INSERT OR IGNORE INTO users (email, name, role, status, sekolah_id) VALUES (?, ?, ?, 'aktif', ?)",
        args: [body.email, body.name || body.email.split("@")[0], body.role || "staf", body.sekolah_id || null],
      });
      return NextResponse.json({ ok: true });
    }
    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch {
    return NextResponse.json({ error: "Failed to update user" }, { status: 500 });
  }
}
