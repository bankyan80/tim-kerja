import { NextResponse } from "next/server";
import { queryAll } from "@/lib/db";

export async function GET() {
  try {
    const [sekolah, siswa, gtk, surat, laporan, sarpras, spmb, kegiatan, monitoring, arsip] = await Promise.all([
      queryAll("SELECT COUNT(*) as total, SUM(CASE WHEN status_aktif='aktif' THEN 1 ELSE 0 END) as aktif, SUM(CASE WHEN status='negeri' THEN 1 ELSE 0 END) as negeri, SUM(CASE WHEN status='swasta' THEN 1 ELSE 0 END) as swasta FROM sekolah WHERE deleted_at IS NULL"),
      queryAll("SELECT COUNT(*) as total, SUM(CASE WHEN jenis_kelamin='L' THEN 1 ELSE 0 END) as laki, SUM(CASE WHEN jenis_kelamin='P' THEN 1 ELSE 0 END) as perempuan FROM siswa WHERE deleted_at IS NULL"),
      queryAll("SELECT COUNT(*) as total, SUM(CASE WHEN status_pegawai='PNS' THEN 1 ELSE 0 END) as pns FROM gtk WHERE deleted_at IS NULL"),
      queryAll("SELECT COUNT(*) as total, SUM(CASE WHEN status='draft' OR status='dikirim' OR status='diproses' THEN 1 ELSE 0 END) as belum_diproses FROM surat WHERE deleted_at IS NULL"),
      queryAll("SELECT COUNT(*) as total, SUM(CASE WHEN status='terverifikasi' THEN 1 ELSE 0 END) as selesai FROM laporan_bulanan WHERE deleted_at IS NULL"),
      queryAll("SELECT COUNT(*) as total FROM sarpras WHERE deleted_at IS NULL"),
      queryAll("SELECT COUNT(*) as total FROM spmb"),
      queryAll("SELECT COUNT(*) as total FROM kegiatan WHERE deleted_at IS NULL"),
      queryAll("SELECT COUNT(*) as total FROM monitoring WHERE deleted_at IS NULL"),
      queryAll("SELECT COUNT(*) as total FROM arsip WHERE deleted_at IS NULL"),
    ]);

    return NextResponse.json({
      sekolah: sekolah[0] || { total: 0, aktif: 0, negeri: 0, swasta: 0 },
      siswa: siswa[0] || { total: 0, laki: 0, perempuan: 0 },
      gtk: gtk[0] || { total: 0, pns: 0 },
      surat: surat[0] || { total: 0, belum_diproses: 0 },
      laporan: laporan[0] || { total: 0, selesai: 0 },
      sarpras: sarpras[0] || { total: 0 },
      spmb: spmb[0] || { total: 0 },
      kegiatan: kegiatan[0] || { total: 0 },
      monitoring: monitoring[0] || { total: 0 },
      arsip: arsip[0] || { total: 0 },
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
      monitoring: { total: 0 },
      arsip: { total: 0 },
    }, { status: 200 });
  }
}
