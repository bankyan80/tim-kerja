import { NextRequest, NextResponse } from "next/server";
import { queryAll, execute } from "@/lib/db";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const jenis = searchParams.get("jenis_dokumen");
    const sekolah_id = searchParams.get("sekolah_id");
    let sql = "SELECT a.*, s.nama as sekolah_nama FROM arsip a LEFT JOIN sekolah s ON s.id = a.sekolah_id WHERE a.deleted_at IS NULL";
    const args: any[] = [];
    if (jenis) { sql += " AND a.jenis_dokumen = ?"; args.push(jenis); }
    if (sekolah_id) { sql += " AND a.sekolah_id = ?"; args.push(sekolah_id); }
    sql += " ORDER BY a.created_at DESC";
    const rows = await queryAll(sql, args);
    return NextResponse.json(rows);
  } catch { return NextResponse.json([], { status: 200 }); }
}

export async function POST(req: NextRequest) {
  try {
    const b = await req.json();
    const { jenis_dokumen, sekolah_id, bulan, tahun, pemilik, file, versi, file_name } = b;
    await execute(`INSERT INTO arsip (jenis_dokumen, sekolah_id, bulan, tahun, pemilik, file, versi, file_name) VALUES (?,?,?,?,?,?,?,?)`, [jenis_dokumen, sekolah_id||null, bulan||null, tahun, pemilik, file||'', versi||1, file_name||'']);
    return NextResponse.json({ ok: true });
  } catch (e: any) { return NextResponse.json({ error: e.message }, { status: 500 }); }
}

export async function PUT(req: NextRequest) {
  try {
    const b = await req.json();
    const { id, ...fields } = b;
    if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });
    const setClauses: string[] = []; const args: any[] = [];
    for (const [k, v] of Object.entries(fields)) { setClauses.push(`${k} = ?`); args.push(v); }
    setClauses.push("updated_at = datetime('now')");
    args.push(id);
    await execute(`UPDATE arsip SET ${setClauses.join(", ")} WHERE id = ?`, args);
    return NextResponse.json({ ok: true });
  } catch (e: any) { return NextResponse.json({ error: e.message }, { status: 500 }); }
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });
    await execute("UPDATE arsip SET deleted_at = datetime('now') WHERE id = ?", [id]);
    return NextResponse.json({ ok: true });
  } catch (e: any) { return NextResponse.json({ error: e.message }, { status: 500 }); }
}
