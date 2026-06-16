import { NextRequest, NextResponse } from "next/server";
import { queryAll, execute } from "@/lib/db";
import { getSekolahFilter } from "@/lib/auth-utils";
import { auth } from "@/lib/auth";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const { forcedSekolah } = await getSekolahFilter();
    const sekolah_id = forcedSekolah || searchParams.get("sekolah_id");
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
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    const b = await req.json();
    const { sekolah_id, tahun_pelajaran, daya_tampung, pendaftar, diterima, jalur_domisili, jalur_afirmasi, jalur_mutasi, jenis_kelamin } = b;
    await execute(`INSERT INTO spmb (sekolah_id, tahun_pelajaran, daya_tampung, pendaftar, diterima, jalur_domisili, jalur_afirmasi, jalur_mutasi, jenis_kelamin) VALUES (?,?,?,?,?,?,?,?,?)`, [sekolah_id, tahun_pelajaran, daya_tampung||0, pendaftar||0, diterima||0, jalur_domisili||0, jalur_afirmasi||0, jalur_mutasi||0, jenis_kelamin||null]);
    return NextResponse.json({ ok: true });
  } catch { return NextResponse.json({ error: "Gagal menyimpan data" }, { status: 500 }); }
}

export async function PUT(req: NextRequest) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    const b = await req.json();
    const { id, ...fields } = b;
    if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });
    const setClauses: string[] = []; const args: any[] = [];
    for (const [k, v] of Object.entries(fields)) { setClauses.push(`${k} = ?`); args.push(v); }
    setClauses.push("updated_at = datetime('now')");
    args.push(id);
    await execute(`UPDATE spmb SET ${setClauses.join(", ")} WHERE id = ?`, args);
    return NextResponse.json({ ok: true });
  } catch { return NextResponse.json({ error: "Gagal mengupdate data" }, { status: 500 }); }
}

export async function DELETE(req: NextRequest) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });
    await execute("DELETE FROM spmb WHERE id = ?", [id]);
    return NextResponse.json({ ok: true });
  } catch { return NextResponse.json({ error: "Gagal menghapus data" }, { status: 500 }); }
}
