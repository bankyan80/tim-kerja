import { NextRequest, NextResponse } from "next/server";
import { queryAll, execute } from "@/lib/db";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const sekolah_id = searchParams.get("sekolah_id");
    const jenis = searchParams.get("jenis");
    let sql = "SELECT s.*, sk.nama as sekolah_nama FROM sarpras s LEFT JOIN sekolah sk ON sk.id = s.sekolah_id WHERE s.deleted_at IS NULL";
    const args: any[] = [];
    if (sekolah_id) { sql += " AND s.sekolah_id = ?"; args.push(sekolah_id); }
    if (jenis) { sql += " AND s.jenis = ?"; args.push(jenis); }
    sql += " ORDER BY s.jenis, s.nama";
    const rows = await queryAll(sql, args);
    return NextResponse.json(rows);
  } catch { return NextResponse.json([], { status: 200 }); }
}

export async function POST(req: NextRequest) {
  try {
    const b = await req.json();
    const { sekolah_id, jenis, nama, jumlah, kondisi_baik, kondisi_sedang, kondisi_rusak, foto, usulan_perbaikan } = b;
    await execute(`INSERT INTO sarpras (sekolah_id, jenis, nama, jumlah, kondisi_baik, kondisi_sedang, kondisi_rusak, foto, usulan_perbaikan) VALUES (?,?,?,?,?,?,?,?,?)`, [sekolah_id, jenis, nama, jumlah||0, kondisi_baik||0, kondisi_sedang||0, kondisi_rusak||0, foto||'', usulan_perbaikan||'']);
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
    await execute(`UPDATE sarpras SET ${setClauses.join(", ")} WHERE id = ?`, args);
    return NextResponse.json({ ok: true });
  } catch (e: any) { return NextResponse.json({ error: e.message }, { status: 500 }); }
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });
    await execute("UPDATE sarpras SET deleted_at = datetime('now') WHERE id = ?", [id]);
    return NextResponse.json({ ok: true });
  } catch (e: any) { return NextResponse.json({ error: e.message }, { status: 500 }); }
}
