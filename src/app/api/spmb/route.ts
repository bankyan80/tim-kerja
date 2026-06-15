import { NextRequest, NextResponse } from "next/server";
import { queryAll, execute } from "@/lib/db";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const sekolah_id = searchParams.get("sekolah_id");
    const tahun = searchParams.get("tahun_pelajaran");
    let sql = "SELECT s.*, sk.nama as sekolah_nama FROM spmb s LEFT JOIN sekolah sk ON sk.id = s.sekolah_id";
    const args: any[] = [];
    if (sekolah_id) { sql += " WHERE s.sekolah_id = ?"; args.push(sekolah_id); }
    if (tahun) { sql += (sekolah_id ? " AND" : " WHERE") + " s.tahun_pelajaran = ?"; args.push(tahun); }
    sql += " ORDER BY sk.nama";
    const rows = await queryAll(sql, args);
    return NextResponse.json(rows);
  } catch { return NextResponse.json([], { status: 200 }); }
}

export async function POST(req: NextRequest) {
  try {
    const b = await req.json();
    const { sekolah_id, tahun_pelajaran, daya_tampung, pendaftar, diterima, jalur_domisili, jalur_afirmasi, jalur_mutasi } = b;
    await execute(`INSERT INTO spmb (sekolah_id, tahun_pelajaran, daya_tampung, pendaftar, diterima, jalur_domisili, jalur_afirmasi, jalur_mutasi) VALUES (?,?,?,?,?,?,?,?)`, [sekolah_id, tahun_pelajaran, daya_tampung||0, pendaftar||0, diterima||0, jalur_domisili||0, jalur_afirmasi||0, jalur_mutasi||0]);
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
    args.push(id);
    await execute(`UPDATE spmb SET ${setClauses.join(", ")} WHERE id = ?`, args);
    return NextResponse.json({ ok: true });
  } catch (e: any) { return NextResponse.json({ error: e.message }, { status: 500 }); }
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });
    await execute("DELETE FROM spmb WHERE id = ?", [id]);
    return NextResponse.json({ ok: true });
  } catch (e: any) { return NextResponse.json({ error: e.message }, { status: 500 }); }
}
