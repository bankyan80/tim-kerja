import { NextRequest, NextResponse } from "next/server";
import { queryAll, execute } from "@/lib/db";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const sekolah_id = searchParams.get("sekolah_id");
    const kelas = searchParams.get("kelas");
    const tahun = searchParams.get("tahun_pelajaran");
    let sql = "SELECT s.*, se.nama as sekolah_nama FROM siswa s LEFT JOIN sekolah se ON se.id = s.sekolah_id WHERE s.deleted_at IS NULL";
    const args: any[] = [];
    if (sekolah_id) { sql += " AND s.sekolah_id = ?"; args.push(sekolah_id); }
    if (kelas) { sql += " AND s.kelas = ?"; args.push(kelas); }
    if (tahun) { sql += " AND s.tahun_pelajaran = ?"; args.push(tahun); }
    sql += " ORDER BY s.nama_lengkap";
    const rows = await queryAll(sql, args);
    return NextResponse.json(rows);
  } catch { return NextResponse.json([], { status: 200 }); }
}

export async function POST(req: NextRequest) {
  try {
    const b = await req.json();
    const { nik, nisn, nama_lengkap, jenis_kelamin, tempat_lahir, tanggal_lahir, agama, alamat, nama_ayah, nama_ibu, nomor_kk, kelas, rombel, sekolah_id, tahun_pelajaran, status_siswa, tanggal_masuk, asal_sekolah, kebutuhan_khusus, kontak_orang_tua } = b;
    await execute(`INSERT INTO siswa (nik, nisn, nama_lengkap, jenis_kelamin, tempat_lahir, tanggal_lahir, agama, alamat, nama_ayah, nama_ibu, nomor_kk, kelas, rombel, sekolah_id, tahun_pelajaran, status_siswa, tanggal_masuk, asal_sekolah, kebutuhan_khusus, kontak_orang_tua) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`, [nik||'', nisn||'', nama_lengkap, jenis_kelamin||'L', tempat_lahir||'', tanggal_lahir||'', agama||'Islam', alamat||'', nama_ayah||'', nama_ibu||'', nomor_kk||'', kelas, rombel||'', sekolah_id, tahun_pelajaran, status_siswa||'aktif', tanggal_masuk||'', asal_sekolah||'', kebutuhan_khusus||'', kontak_orang_tua||'']);
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
    await execute(`UPDATE siswa SET ${setClauses.join(", ")} WHERE id = ?`, args);
    return NextResponse.json({ ok: true });
  } catch (e: any) { return NextResponse.json({ error: e.message }, { status: 500 }); }
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });
    await execute("UPDATE siswa SET deleted_at = datetime('now') WHERE id = ?", [id]);
    return NextResponse.json({ ok: true });
  } catch (e: any) { return NextResponse.json({ error: e.message }, { status: 500 }); }
}
