import { NextRequest, NextResponse } from "next/server";
import { query, queryAll, execute, ORDER_SEKOLAH } from "@/lib/db";
import { auth } from "@/lib/auth";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status");
    let sql = `SELECT s.*, 
      COALESCE(NULLIF(s.kepala_sekolah, ''), (SELECT g.nama FROM gtk g WHERE g.sekolah_id = s.id AND g.jenis_gtk = 'Kepala Sekolah' LIMIT 1)) as kepala_sekolah,
      COALESCE(NULLIF(s.nip_kepala_sekolah, ''), (SELECT g.nip FROM gtk g WHERE g.sekolah_id = s.id AND g.jenis_gtk = 'Kepala Sekolah' LIMIT 1)) as nip_kepala_sekolah
      FROM sekolah s WHERE s.deleted_at IS NULL`;
    const args: any[] = [];
    if (status) { sql += " AND s.status_aktif = ?"; args.push(status); }
    sql += " " + ORDER_SEKOLAH;
    const rows = await queryAll(sql, args);
    return NextResponse.json(rows);
  } catch { return NextResponse.json([], { status: 200 }); }
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    const b = await req.json();
    const { npsn, nama, status, alamat, desa, kecamatan, kabupaten, kode_pos, kepala_sekolah, nip_kepala_sekolah, operator, no_wa, email, akreditasi, jumlah_rombel, latitude, longitude, status_aktif } = b;
    await execute(`INSERT INTO sekolah (npsn, nama, status, alamat, desa, kecamatan, kabupaten, kode_pos, kepala_sekolah, nip_kepala_sekolah, operator, no_wa, email, akreditasi, jumlah_rombel, latitude, longitude, status_aktif) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`, [npsn, nama, status||'negeri', alamat||'', desa||'', kecamatan||'Lemahabang', kabupaten||'Kabupaten Cirebon', kode_pos||'', kepala_sekolah||'', nip_kepala_sekolah||'', operator||'', no_wa||'', email||'', akreditasi||'Belum', jumlah_rombel||0, latitude||0, longitude||0, status_aktif||'aktif']);
    return NextResponse.json({ ok: true });
  } catch (e: any) { return NextResponse.json({ error: e.message }, { status: 500 }); }
}

export async function PUT(req: NextRequest) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    const b = await req.json();
    const { id, ...fields } = b;
    if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });
    const setClauses: string[] = []; const args: any[] = [];
    for (const [k, v] of Object.entries(fields)) {
      setClauses.push(`${k} = ?`); args.push(v);
    }
    setClauses.push("updated_at = datetime('now')");
    args.push(id);
    await execute(`UPDATE sekolah SET ${setClauses.join(", ")} WHERE id = ?`, args);
    return NextResponse.json({ ok: true });
  } catch (e: any) { return NextResponse.json({ error: e.message }, { status: 500 }); }
}

export async function DELETE(req: NextRequest) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });
    await execute("UPDATE sekolah SET deleted_at = datetime('now') WHERE id = ?", [id]);
    return NextResponse.json({ ok: true });
  } catch (e: any) { return NextResponse.json({ error: e.message }, { status: 500 }); }
}
