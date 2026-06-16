import { NextRequest, NextResponse } from "next/server";
import { queryAll, execute } from "@/lib/db";
import { getSekolahFilter } from "@/lib/auth-utils";

export async function GET() {
  try {
    const { forcedSekolah } = await getSekolahFilter();
    let sql = "SELECT id, name, email, role, status, sekolah_id FROM users WHERE status = 'aktif'";
    const args: string[] = [];
    if (forcedSekolah) { sql += " AND (sekolah_id = ? OR role = 'ketua')"; args.push(forcedSekolah); }
    sql += " ORDER BY name";
    const rows = await queryAll(sql, args.length ? args : undefined);
    return NextResponse.json(rows);
  } catch {
    return NextResponse.json([], { status: 200 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();
    if (body.action === "update_user") {
      let sql = "UPDATE users SET role = ?, status = ?, updated_at = datetime('now')";
      const args: any[] = [body.role, body.status];
      if (body.sekolah_id !== undefined) {
        sql += ", sekolah_id = ?";
        args.push(body.sekolah_id || null);
      }
      sql += " WHERE id = ?";
      args.push(body.id);
      await execute(sql, args);
      return NextResponse.json({ ok: true });
    }
    if (body.action === "add_user") {
      await execute("INSERT OR IGNORE INTO users (email, name, role, status, sekolah_id) VALUES (?, ?, ?, 'aktif', ?)", [body.email, body.name || body.email.split("@")[0], body.role || "staf", body.sekolah_id || null]);
      return NextResponse.json({ ok: true });
    }
    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch {
    return NextResponse.json({ error: "Failed to update user" }, { status: 500 });
  }
}
