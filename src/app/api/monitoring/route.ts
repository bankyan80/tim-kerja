import { NextRequest, NextResponse } from "next/server";
import { queryAll, execute } from "@/lib/db";
import { getSekolahFilter } from "@/lib/auth-utils";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const { forcedSekolah } = await getSekolahFilter();
    const sekolah_id = forcedSekolah || searchParams.get("sekolah_id");
    const status = searchParams.get("status");
    let sql = "SELECT m.*, s.nama as sekolah_nama FROM monitoring m LEFT JOIN sekolah s ON s.id = m.sekolah_id WHERE m.deleted_at IS NULL";
    const args: any[] = [];
    if (sekolah_id) { sql += " AND m.sekolah_id = ?"; args.push(sekolah_id); }
    if (status) { sql += " AND m.status = ?"; args.push(status); }
    sql += " ORDER BY m.tanggal DESC";
    const rows = await queryAll(sql, args);
    return NextResponse.json(rows);
  } catch { return NextResponse.json([], { status: 200 }); }
}

export async function POST(req: NextRequest) {
  try {
    const b = await req.json();
    const { sekolah_id, tanggal, petugas, jenis_monitoring, instrumen, temuan, rekomendasi, tindak_lanjut, batas_waktu, bukti_foto, status } = b;
    await execute(`INSERT INTO monitoring (sekolah_id, tanggal, petugas, jenis_monitoring, instrumen, temuan, rekomendasi, tindak_lanjut, batas_waktu, bukti_foto, status) VALUES (?,?,?,?,?,?,?,?,?,?,?)`, [sekolah_id, tanggal||'', petugas, jenis_monitoring, instrumen||'', temuan||'', rekomendasi||'', tindak_lanjut||'', batas_waktu||'', bukti_foto||'', status||'tertunda']);
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
    await execute(`UPDATE monitoring SET ${setClauses.join(", ")} WHERE id = ?`, args);
    return NextResponse.json({ ok: true });
  } catch (e: any) { return NextResponse.json({ error: e.message }, { status: 500 }); }
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });
    await execute("UPDATE monitoring SET deleted_at = datetime('now') WHERE id = ?", [id]);
    return NextResponse.json({ ok: true });
  } catch (e: any) { return NextResponse.json({ error: e.message }, { status: 500 }); }
}
