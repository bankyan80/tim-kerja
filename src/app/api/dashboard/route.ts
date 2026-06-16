import { NextRequest, NextResponse } from "next/server";
import { queryAll } from "@/lib/db";
import { getSekolahFilter } from "@/lib/auth-utils";

export async function GET(req: NextRequest) {
  try {
    const { forcedSekolah } = await getSekolahFilter();
    const sid = forcedSekolah;

    let sql: string;
    let args: string[] | undefined;

    if (sid) {
      sql = `SELECT
        (SELECT COUNT(*) FROM sekolah WHERE id = ? AND deleted_at IS NULL) as sekolah_total,
        1 as sekolah_aktif,
        (SELECT COUNT(*) FROM sekolah WHERE id = ? AND status = 'negeri' AND deleted_at IS NULL) as sekolah_negeri,
        (SELECT COUNT(*) FROM sekolah WHERE id = ? AND status = 'swasta' AND deleted_at IS NULL) as sekolah_swasta,
        (SELECT COUNT(*) FROM siswa WHERE sekolah_id = ? AND deleted_at IS NULL) as siswa_total,
        (SELECT COUNT(*) FROM siswa WHERE sekolah_id = ? AND jenis_kelamin = 'L' AND deleted_at IS NULL) as siswa_laki,
        (SELECT COUNT(*) FROM siswa WHERE sekolah_id = ? AND jenis_kelamin = 'P' AND deleted_at IS NULL) as siswa_perempuan,
        (SELECT COUNT(*) FROM gtk WHERE sekolah_id = ? AND deleted_at IS NULL) as gtk_total,
        (SELECT COUNT(*) FROM gtk WHERE sekolah_id = ? AND status_pegawai = 'PNS' AND deleted_at IS NULL) as gtk_pns,
        (SELECT COUNT(*) FROM surat WHERE deleted_at IS NULL AND (status = 'draft' OR status = 'dikirim' OR status = 'diproses')) as surat_belum_diproses,
        (SELECT COUNT(*) FROM laporan_bulanan WHERE sekolah_id = ? AND deleted_at IS NULL) as laporan_total,
        (SELECT COUNT(*) FROM laporan_bulanan WHERE sekolah_id = ? AND status = 'terverifikasi' AND deleted_at IS NULL) as laporan_selesai,
        (SELECT COUNT(*) FROM sarpras WHERE sekolah_id = ? AND deleted_at IS NULL) as sarpras_total,
        (SELECT COUNT(*) FROM spmb WHERE sekolah_id = ?) as spmb_total,
        (SELECT COUNT(*) FROM kegiatan WHERE deleted_at IS NULL) as kegiatan_total,
        (SELECT COUNT(*) FROM arsip WHERE sekolah_id = ? AND deleted_at IS NULL) as arsip_total`;
      args = [sid, sid, sid, sid, sid, sid, sid, sid, sid, sid, sid, sid, sid];
    } else {
      sql = `SELECT
        (SELECT COUNT(*) FROM sekolah WHERE deleted_at IS NULL) as sekolah_total,
        (SELECT COUNT(*) FROM sekolah WHERE status_aktif = 'aktif' AND deleted_at IS NULL) as sekolah_aktif,
        (SELECT COUNT(*) FROM sekolah WHERE status = 'negeri' AND deleted_at IS NULL) as sekolah_negeri,
        (SELECT COUNT(*) FROM sekolah WHERE status = 'swasta' AND deleted_at IS NULL) as sekolah_swasta,
        (SELECT COUNT(*) FROM siswa WHERE deleted_at IS NULL) as siswa_total,
        (SELECT COUNT(*) FROM siswa WHERE jenis_kelamin = 'L' AND deleted_at IS NULL) as siswa_laki,
        (SELECT COUNT(*) FROM siswa WHERE jenis_kelamin = 'P' AND deleted_at IS NULL) as siswa_perempuan,
        (SELECT COUNT(*) FROM gtk WHERE deleted_at IS NULL) as gtk_total,
        (SELECT COUNT(*) FROM gtk WHERE status_pegawai = 'PNS' AND deleted_at IS NULL) as gtk_pns,
        (SELECT COUNT(*) FROM surat WHERE deleted_at IS NULL AND (status = 'draft' OR status = 'dikirim' OR status = 'diproses')) as surat_belum_diproses,
        (SELECT COUNT(*) FROM laporan_bulanan WHERE deleted_at IS NULL) as laporan_total,
        (SELECT COUNT(*) FROM laporan_bulanan WHERE status = 'terverifikasi' AND deleted_at IS NULL) as laporan_selesai,
        (SELECT COUNT(*) FROM sarpras WHERE deleted_at IS NULL) as sarpras_total,
        (SELECT COUNT(*) FROM spmb) as spmb_total,
        (SELECT COUNT(*) FROM kegiatan WHERE deleted_at IS NULL) as kegiatan_total,
        (SELECT COUNT(*) FROM arsip WHERE deleted_at IS NULL) as arsip_total`;
      args = undefined;
    }

    const [rows] = await queryAll(sql, args);
    const r = rows || {};

    function n(v: unknown) { return Number(v) || 0; }

    return NextResponse.json({
      sekolah: { total: n(r.sekolah_total), aktif: n(r.sekolah_aktif), negeri: n(r.sekolah_negeri), swasta: n(r.sekolah_swasta) },
      siswa: { total: n(r.siswa_total), laki: n(r.siswa_laki), perempuan: n(r.siswa_perempuan) },
      gtk: { total: n(r.gtk_total), pns: n(r.gtk_pns) },
      surat: { total: 0, belum_diproses: n(r.surat_belum_diproses) },
      laporan: { total: n(r.laporan_total), selesai: n(r.laporan_selesai) },
      sarpras: { total: n(r.sarpras_total) },
      spmb: { total: n(r.spmb_total) },
      kegiatan: { total: n(r.kegiatan_total) },
      arsip: { total: n(r.arsip_total) },
    });
  } catch {
    return NextResponse.json({
      sekolah: { total: 0, aktif: 0, negeri: 0, swasta: 0 },
      siswa: { total: 0, laki: 0, perempuan: 0 },
      gtk: { total: 0, pns: 0 },
      surat: { total: 0, belum_diproses: 0 },
      laporan: { total: 0, selesai: 0 },
      sarpras: { total: 0 },
      spmb: { total: 0 },
      kegiatan: { total: 0 },
      arsip: { total: 0 },
    }, { status: 200 });
  }
}
