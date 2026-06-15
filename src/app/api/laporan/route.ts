import { NextRequest, NextResponse } from "next/server";
import { queryAll, execute } from "@/lib/db";
import { getSekolahFilter } from "@/lib/auth-utils";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const { forcedSekolah } = await getSekolahFilter();
    const sekolah_id = forcedSekolah || searchParams.get("sekolah_id");
    const bulan = searchParams.get("bulan");
    const tahun = searchParams.get("tahun");
    let sql = "SELECT l.*, s.nama as sekolah_nama FROM laporan_bulanan l LEFT JOIN sekolah s ON s.id = l.sekolah_id WHERE l.deleted_at IS NULL";
    const args: any[] = [];
    if (sekolah_id) { sql += " AND l.sekolah_id = ?"; args.push(sekolah_id); }
    if (bulan) { sql += " AND l.bulan = ?"; args.push(parseInt(bulan)); }
    if (tahun) { sql += " AND l.tahun = ?"; args.push(tahun); }
    sql += " ORDER BY l.tahun DESC, l.bulan DESC";
    const rows = await queryAll(sql, args);
    return NextResponse.json(rows);
  } catch { return NextResponse.json([], { status: 200 }); }
}

export async function POST(req: NextRequest) {
  try {
    const b = await req.json();
    const { sekolah_id, bulan, tahun, tahun_pelajaran, data, status, catatan, lampiran } = b;
    await execute(`INSERT INTO laporan_bulanan (sekolah_id, bulan, tahun, tahun_pelajaran, data, status, catatan, lampiran) VALUES (?,?,?,?,?,?,?,?)`, [sekolah_id, bulan, tahun, tahun_pelajaran, JSON.stringify(data||{}), status||'draft', catatan||'', lampiran||'']);
    return NextResponse.json({ ok: true });
  } catch (e: any) { return NextResponse.json({ error: e.message }, { status: 500 }); }
}

export async function PUT(req: NextRequest) {
  try {
    const b = await req.json();
    const { id, ...fields } = b;
    if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });
    const setClauses: string[] = []; const args: any[] = [];
    for (const [k, v] of Object.entries(fields)) { setClauses.push(k === 'data' ? `${k} = ?` : `${k} = ?`); args.push(typeof v === 'object' ? JSON.stringify(v) : v); }
    setClauses.push("updated_at = datetime('now')");
    args.push(id);
    await execute(`UPDATE laporan_bulanan SET ${setClauses.join(", ")} WHERE id = ?`, args);
    return NextResponse.json({ ok: true });
  } catch (e: any) { return NextResponse.json({ error: e.message }, { status: 500 }); }
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });
    await execute("UPDATE laporan_bulanan SET deleted_at = datetime('now') WHERE id = ?", [id]);
    return NextResponse.json({ ok: true });
  } catch (e: any) { return NextResponse.json({ error: e.message }, { status: 500 }); }
}
