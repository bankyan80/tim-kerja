import { NextRequest, NextResponse } from "next/server";
import { queryAll, execute } from "@/lib/db";
import { getSekolahFilter } from "@/lib/auth-utils";
import { auth } from "@/lib/auth";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const { forcedSekolah } = await getSekolahFilter();
    const sekolah_id = forcedSekolah || searchParams.get("sekolah_id");
    const jenis = searchParams.get("jenis_gtk");
    let sql = "SELECT g.*, s.nama as sekolah_nama FROM gtk g LEFT JOIN sekolah s ON s.id = g.sekolah_id WHERE g.deleted_at IS NULL";
    const args: any[] = [];
    if (sekolah_id) { sql += " AND g.sekolah_id = ?"; args.push(sekolah_id); }
    if (jenis) { sql += " AND g.jenis_gtk = ?"; args.push(jenis); }
    sql += " ORDER BY g.nama";
    const rows = await queryAll(sql, args);
    return NextResponse.json(rows);
  } catch { return NextResponse.json([], { status: 200 }); }
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    const b = await req.json();
    const { nik, nip, nuptk, nama, jenis_kelamin, tempat_lahir, tanggal_lahir, status_pegawai, jabatan, jenis_gtk, sekolah_id, pangkat_golongan, pendidikan_terakhir, sertifikasi, nrg, masa_kerja, tmt, nomor_sk, bup, kontak, status_aktif } = b;
    await execute(`INSERT INTO gtk (nik, nip, nuptk, nama, jenis_kelamin, tempat_lahir, tanggal_lahir, status_pegawai, jabatan, jenis_gtk, sekolah_id, pangkat_golongan, pendidikan_terakhir, sertifikasi, nrg, masa_kerja, tmt, nomor_sk, bup, kontak, status_aktif) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`, [nik||'', nip||'', nuptk||'', nama, jenis_kelamin||'L', tempat_lahir||'', tanggal_lahir||'', status_pegawai||'honorer', jabatan||'', jenis_gtk||'Guru', sekolah_id, pangkat_golongan||'', pendidikan_terakhir||'', sertifikasi?1:0, nrg||'', masa_kerja||0, tmt||'', nomor_sk||'', bup||'', kontak||'', status_aktif||'aktif']);
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
    for (const [k, v] of Object.entries(fields)) { setClauses.push(`${k} = ?`); args.push(v); }
    setClauses.push("updated_at = datetime('now')");
    args.push(id);
    await execute(`UPDATE gtk SET ${setClauses.join(", ")} WHERE id = ?`, args);
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
    await execute("UPDATE gtk SET deleted_at = datetime('now') WHERE id = ?", [id]);
    return NextResponse.json({ ok: true });
  } catch (e: any) { return NextResponse.json({ error: e.message }, { status: 500 }); }
}
