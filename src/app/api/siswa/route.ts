import { NextRequest, NextResponse } from "next/server";
import { queryAll, execute } from "@/lib/db";
import { getSekolahFilter } from "@/lib/auth-utils";
import { auth } from "@/lib/auth";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const { forcedSekolah } = await getSekolahFilter();
    const sekolah_id = forcedSekolah || searchParams.get("sekolah_id");
    const kelas = searchParams.get("kelas");
    const tahun = searchParams.get("tahun_pelajaran");
    const nik = searchParams.get("nik");

    // Lookup by NIK — search across ALL records (including deleted) for auto-fill
    if (nik) {
      const rows = await queryAll(
        "SELECT s.*, se.nama as sekolah_nama FROM siswa s LEFT JOIN sekolah se ON se.id = s.sekolah_id WHERE s.nik = ? AND s.deleted_at IS NULL LIMIT 1",
        [nik]
      );
      if (rows.length > 0) {
        return NextResponse.json(rows[0]);
      }
      // If no active record, check soft-deleted (alumni/lulus)
      const deletedRows = await queryAll(
        "SELECT s.*, se.nama as sekolah_nama FROM siswa s LEFT JOIN sekolah se ON se.id = s.sekolah_id WHERE s.nik = ? AND s.deleted_at IS NOT NULL LIMIT 1",
        [nik]
      );
      if (deletedRows.length > 0) {
        return NextResponse.json(deletedRows[0]);
      }
      return NextResponse.json(null, { status: 200 });
    }

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
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    const b = await req.json();
    const { nik, nisn, nama_lengkap, jenis_kelamin, tempat_lahir, tanggal_lahir, agama, alamat, nama_ayah, nama_ibu, nomor_kk, kelas, rombel, sekolah_id, tahun_pelajaran, status_siswa, tanggal_masuk, asal_sekolah, kebutuhan_khusus, kontak_orang_tua, matched_siswa_id } = b;

    // If this is a TK/KB → SD transition, mark old record as lulus
    if (matched_siswa_id) {
      await execute("UPDATE siswa SET status_siswa = 'lulus', deleted_at = datetime('now'), updated_at = datetime('now') WHERE id = ? AND deleted_at IS NULL", [matched_siswa_id]);
    }

    await execute(`INSERT INTO siswa (nik, nisn, nama_lengkap, jenis_kelamin, tempat_lahir, tanggal_lahir, agama, alamat, nama_ayah, nama_ibu, nomor_kk, kelas, rombel, sekolah_id, tahun_pelajaran, status_siswa, tanggal_masuk, asal_sekolah, kebutuhan_khusus, kontak_orang_tua) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`, [nik||'', nisn||'', nama_lengkap, jenis_kelamin||'L', tempat_lahir||'', tanggal_lahir||'', agama||'Islam', alamat||'', nama_ayah||'', nama_ibu||'', nomor_kk||'', kelas, rombel||'', sekolah_id, tahun_pelajaran, status_siswa||'aktif', tanggal_masuk||'', asal_sekolah||'', kebutuhan_khusus||'', kontak_orang_tua||'']);
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
    await execute(`UPDATE siswa SET ${setClauses.join(", ")} WHERE id = ?`, args);
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
    await execute("UPDATE siswa SET deleted_at = datetime('now') WHERE id = ?", [id]);
    return NextResponse.json({ ok: true });
  } catch (e: any) { return NextResponse.json({ error: e.message }, { status: 500 }); }
}
