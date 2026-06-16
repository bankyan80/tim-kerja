import { NextResponse } from "next/server";
import { queryAll } from "@/lib/db";
import { getSekolahFilter } from "@/lib/auth-utils";

export async function GET() {
  try {
    const { forcedSekolah } = await getSekolahFilter();
    const sid = forcedSekolah;

    const wh = sid ? " WHERE sekolah_id = ? AND deleted_at IS NULL" : " WHERE deleted_at IS NULL";
    const args = sid ? [sid] : [];

    const [sekolah, siswaKelas, siswaGender, siswaPerSekolah, gtkTotals, gtkPerSekolah, mapPegawai,
      laporanStats, sarprasTotals, sarprasJenis, spmbTotals, spmbSekolah, suratTotals,
      suratBulan, progresData] = await Promise.all([
      // Sekolah
      sid
        ? queryAll("SELECT COUNT(*) as total, 1 as aktif, SUM(CASE WHEN status='negeri' THEN 1 ELSE 0 END) as negeri, SUM(CASE WHEN status='swasta' THEN 1 ELSE 0 END) as swasta, 0 as nonaktif, 0 as akreditasi_a, 0 as akreditasi_b, 0 as belum_akreditasi FROM sekolah WHERE id = ? AND deleted_at IS NULL", [sid])
        : queryAll(`SELECT
          COUNT(*) as total,
          SUM(CASE WHEN status_aktif='aktif' THEN 1 ELSE 0 END) as aktif,
          SUM(CASE WHEN status='negeri' THEN 1 ELSE 0 END) as negeri,
          SUM(CASE WHEN status='swasta' THEN 1 ELSE 0 END) as swasta,
          SUM(CASE WHEN status_aktif='nonaktif' THEN 1 ELSE 0 END) as nonaktif,
          SUM(CASE WHEN akreditasi='A' THEN 1 ELSE 0 END) as akreditasi_a,
          SUM(CASE WHEN akreditasi='B' THEN 1 ELSE 0 END) as akreditasi_b,
          SUM(CASE WHEN akreditasi='Belum' OR akreditasi='' THEN 1 ELSE 0 END) as belum_akreditasi
        FROM sekolah WHERE deleted_at IS NULL`),

      // Siswa per kelas
      queryAll("SELECT kelas, COUNT(*) as jumlah FROM siswa" + wh + " GROUP BY kelas ORDER BY kelas", args),

      // Siswa gender
      queryAll("SELECT COUNT(*) as total, SUM(CASE WHEN jenis_kelamin='L' THEN 1 ELSE 0 END) as laki, SUM(CASE WHEN jenis_kelamin='P' THEN 1 ELSE 0 END) as perempuan FROM siswa" + wh, args),

      // Siswa per sekolah (with class & gender breakdown)
      sid
        ? queryAll(`SELECT s.nama as sekolah, COUNT(*) as total,
            SUM(CASE WHEN siswa.jenis_kelamin='L' THEN 1 ELSE 0 END) as laki,
            SUM(CASE WHEN siswa.jenis_kelamin='P' THEN 1 ELSE 0 END) as perempuan,
            SUM(CASE WHEN siswa.kelas='I' THEN 1 ELSE 0 END) as kelas_i,
            SUM(CASE WHEN siswa.kelas='II' THEN 1 ELSE 0 END) as kelas_ii,
            SUM(CASE WHEN siswa.kelas='III' THEN 1 ELSE 0 END) as kelas_iii,
            SUM(CASE WHEN siswa.kelas='IV' THEN 1 ELSE 0 END) as kelas_iv,
            SUM(CASE WHEN siswa.kelas='V' THEN 1 ELSE 0 END) as kelas_v,
            SUM(CASE WHEN siswa.kelas='VI' THEN 1 ELSE 0 END) as kelas_vi
          FROM siswa JOIN sekolah s ON s.id = siswa.sekolah_id
          WHERE siswa.sekolah_id=? AND siswa.deleted_at IS NULL
          GROUP BY s.nama ORDER BY s.nama`, [sid])
        : queryAll(`SELECT s.nama as sekolah, COUNT(*) as total,
            SUM(CASE WHEN siswa.jenis_kelamin='L' THEN 1 ELSE 0 END) as laki,
            SUM(CASE WHEN siswa.jenis_kelamin='P' THEN 1 ELSE 0 END) as perempuan,
            SUM(CASE WHEN siswa.kelas='I' THEN 1 ELSE 0 END) as kelas_i,
            SUM(CASE WHEN siswa.kelas='II' THEN 1 ELSE 0 END) as kelas_ii,
            SUM(CASE WHEN siswa.kelas='III' THEN 1 ELSE 0 END) as kelas_iii,
            SUM(CASE WHEN siswa.kelas='IV' THEN 1 ELSE 0 END) as kelas_iv,
            SUM(CASE WHEN siswa.kelas='V' THEN 1 ELSE 0 END) as kelas_v,
            SUM(CASE WHEN siswa.kelas='VI' THEN 1 ELSE 0 END) as kelas_vi
          FROM siswa JOIN sekolah s ON s.id = siswa.sekolah_id
          WHERE siswa.deleted_at IS NULL
          GROUP BY s.nama ORDER BY s.nama`),

      // GTK totals
      queryAll(`SELECT COUNT(*) as total,
        SUM(CASE WHEN LOWER(status_pegawai)='pns' THEN 1 ELSE 0 END) as pns,
        SUM(CASE WHEN LOWER(status_pegawai)='pppk' OR LOWER(status_pegawai)='honorer' THEN 1 ELSE 0 END) as non_pns,
        SUM(CASE WHEN LOWER(status_pegawai)='honorer' THEN 1 ELSE 0 END) as honorer
      FROM gtk` + wh, args),

      // GTK per sekolah
      sid
        ? queryAll(`SELECT s.nama as sekolah, COUNT(*) as total,
          SUM(CASE WHEN LOWER(g.status_pegawai)='pns' THEN 1 ELSE 0 END) as pns,
          SUM(CASE WHEN LOWER(g.status_pegawai)='pppk' OR LOWER(g.status_pegawai)='honorer' THEN 1 ELSE 0 END) as non_pns,
          SUM(CASE WHEN LOWER(g.status_pegawai)='honorer' THEN 1 ELSE 0 END) as honorer
        FROM gtk g JOIN sekolah s ON g.sekolah_id=s.id WHERE g.sekolah_id=? AND g.deleted_at IS NULL GROUP BY s.nama`, [sid])
        : queryAll(`SELECT s.nama as sekolah, COUNT(*) as total,
          SUM(CASE WHEN LOWER(g.status_pegawai)='pns' THEN 1 ELSE 0 END) as pns,
          SUM(CASE WHEN LOWER(g.status_pegawai)='pppk' OR LOWER(g.status_pegawai)='honorer' THEN 1 ELSE 0 END) as non_pns,
          SUM(CASE WHEN LOWER(g.status_pegawai)='honorer' THEN 1 ELSE 0 END) as honorer
        FROM gtk g JOIN sekolah s ON g.sekolah_id=s.id WHERE g.deleted_at IS NULL GROUP BY s.nama ORDER BY s.nama`),

      // Mapping pegawai
      sid
        ? queryAll(`SELECT s.nama as sekolah,
          COALESCE((SELECT nama FROM gtk WHERE sekolah_id=s.id AND jenis_gtk='Kepala Sekolah' AND deleted_at IS NULL LIMIT 1), '') as kepala_sekolah,
          (SELECT COUNT(*) FROM gtk WHERE sekolah_id=s.id AND jenis_gtk='Guru' AND deleted_at IS NULL) as guru,
          (SELECT COUNT(*) FROM gtk WHERE sekolah_id=s.id AND jenis_gtk='Tenaga Kependidikan' AND deleted_at IS NULL) as staf
        FROM sekolah s WHERE s.id=? AND s.deleted_at IS NULL`, [sid])
        : queryAll(`SELECT s.nama as sekolah,
          COALESCE((SELECT nama FROM gtk WHERE sekolah_id=s.id AND jenis_gtk='Kepala Sekolah' AND deleted_at IS NULL LIMIT 1), '') as kepala_sekolah,
          (SELECT COUNT(*) FROM gtk WHERE sekolah_id=s.id AND jenis_gtk='Guru' AND deleted_at IS NULL) as guru,
          (SELECT COUNT(*) FROM gtk WHERE sekolah_id=s.id AND jenis_gtk='Tenaga Kependidikan' AND deleted_at IS NULL) as staf
        FROM sekolah s WHERE s.deleted_at IS NULL ORDER BY s.nama`),

      // Laporan bulanan stats
      queryAll(`SELECT
        COUNT(*) as total,
        SUM(CASE WHEN status='terverifikasi' THEN 1 ELSE 0 END) as selesai,
        SUM(CASE WHEN status='draft' THEN 1 ELSE 0 END) as draft,
        SUM(CASE WHEN status='dikirim' THEN 1 ELSE 0 END) as dikirim,
        SUM(CASE WHEN status='perlu_perbaikan' THEN 1 ELSE 0 END) as perlu_perbaikan
      FROM laporan_bulanan` + (sid ? " WHERE sekolah_id = ? AND deleted_at IS NULL" : " WHERE deleted_at IS NULL"), args),

      // Sarpras totals
      queryAll("SELECT COUNT(*) as total, SUM(jumlah) as total_unit, SUM(kondisi_baik) as kondisi_baik, SUM(kondisi_sedang) as kondisi_sedang, SUM(kondisi_rusak) as kondisi_rusak FROM sarpras" + (sid ? " WHERE sekolah_id = ? AND deleted_at IS NULL" : " WHERE deleted_at IS NULL"), args),

      // Sarpras per jenis
      queryAll("SELECT jenis, SUM(jumlah) as jumlah, SUM(kondisi_baik) as baik, SUM(kondisi_sedang) as sedang, SUM(kondisi_rusak) as rusak FROM sarpras" + (sid ? " WHERE sekolah_id = ? AND deleted_at IS NULL" : " WHERE deleted_at IS NULL") + " GROUP BY jenis ORDER BY jenis", args),

      // SPMB totals
      queryAll("SELECT COUNT(*) as total_pendaftar, SUM(pendaftar) as pendaftar, SUM(diterima) as diterima FROM spmb" + (sid ? " WHERE sekolah_id = ?" : ""), sid ? [sid] : []),

      // SPMB per sekolah
      sid
        ? queryAll("SELECT s.nama as sekolah, sp.pendaftar, sp.diterima FROM spmb sp JOIN sekolah s ON sp.sekolah_id=s.id WHERE sp.sekolah_id=?", [sid])
        : queryAll("SELECT s.nama as sekolah, sp.pendaftar, sp.diterima FROM spmb sp JOIN sekolah s ON sp.sekolah_id=s.id ORDER BY s.nama"),

      // Surat totals
      queryAll("SELECT COUNT(*) as total, SUM(CASE WHEN jenis='masuk' THEN 1 ELSE 0 END) as masuk, SUM(CASE WHEN jenis='keluar' THEN 1 ELSE 0 END) as keluar FROM surat WHERE deleted_at IS NULL"),

      // Surat per bulan
      queryAll(`SELECT
        CASE CAST(strftime('%m', tanggal_surat) AS INTEGER)
          WHEN 1 THEN 'Januari' WHEN 2 THEN 'Februari' WHEN 3 THEN 'Maret'
          WHEN 4 THEN 'April' WHEN 5 THEN 'Mei' WHEN 6 THEN 'Juni'
          WHEN 7 THEN 'Juli' WHEN 8 THEN 'Agustus' WHEN 9 THEN 'September'
          WHEN 10 THEN 'Oktober' WHEN 11 THEN 'November' WHEN 12 THEN 'Desember'
        END as bulan,
        SUM(CASE WHEN jenis='masuk' THEN 1 ELSE 0 END) as masuk,
        SUM(CASE WHEN jenis='keluar' THEN 1 ELSE 0 END) as keluar
      FROM surat WHERE deleted_at IS NULL AND tanggal_surat IS NOT NULL
      GROUP BY strftime('%m', tanggal_surat) ORDER BY strftime('%m', tanggal_surat)`),

      // Progres data - count records per module
      queryAll(`SELECT
        (SELECT COUNT(*) FROM sekolah WHERE deleted_at IS NULL) as sekolah_count,
        CASE WHEN (SELECT COUNT(*) FROM sekolah WHERE deleted_at IS NULL) > 0 THEN 100 ELSE 0 END as sekolah_persen,
        (SELECT COUNT(*) FROM siswa ${sid ? "WHERE sekolah_id = ? AND " : "WHERE "} deleted_at IS NULL) as siswa_count,
        (SELECT COUNT(*) FROM gtk ${sid ? "WHERE sekolah_id = ? AND " : "WHERE "} deleted_at IS NULL) as gtk_count,
        (SELECT COUNT(*) FROM laporan_bulanan ${sid ? "WHERE sekolah_id = ? AND " : "WHERE "} deleted_at IS NULL) as laporan_count,
        (SELECT COUNT(*) FROM sarpras ${sid ? "WHERE sekolah_id = ? AND " : "WHERE "} deleted_at IS NULL) as sarpras_count,
        (SELECT COUNT(*) FROM spmb ${sid ? "WHERE sekolah_id = ? AND " : "WHERE "} 1=1) as spmb_count,
        (SELECT COUNT(*) FROM surat WHERE deleted_at IS NULL) as surat_count,
        (SELECT COUNT(*) FROM arsip ${sid ? "WHERE sekolah_id = ? AND " : "WHERE "} deleted_at IS NULL) as arsip_count
      `, sid ? [sid, sid, sid, sid, sid, sid] : []),
    ]);

    function p(v: unknown) {
      return Number(v) || 0;
    }

    const s = sekolah[0] || {};
    const sg = siswaGender[0] || {};
    const gt = gtkTotals[0] || {};
    const lt = laporanStats[0] || {};
    const st = sarprasTotals[0] || {};
    const spt = spmbTotals[0] || {};
    const sut = suratTotals[0] || {};
    const pd = progresData[0] || {};

    const progresKategori = [
      { kategori: "Data Sekolah", count: p(pd.sekolah_count), persentase: p(pd.sekolah_persen) },
      { kategori: "Data Siswa", count: p(pd.siswa_count), persentase: Math.min(100, Math.round(p(pd.siswa_count) / Math.max(1, p(pd.siswa_count)) * 100)) },
      { kategori: "Data GTK", count: p(pd.gtk_count), persentase: p(pd.gtk_count) > 0 ? 95 : 0 },
      { kategori: "Laporan Bulanan", count: p(pd.laporan_count), persentase: Math.min(100, Math.round(p(pd.laporan_count) / (p(pd.sekolah_count) * 12 || 1) * 100)) },
      { kategori: "Sarpras", count: p(pd.sarpras_count), persentase: p(pd.sarpras_count) > 0 ? 90 : 0 },
      { kategori: "SPMB", count: p(pd.spmb_count), persentase: p(pd.spmb_count) > 0 ? 100 : 0 },
      { kategori: "Surat", count: p(pd.surat_count), persentase: p(pd.surat_count) > 0 ? 100 : 0 },
    ];

    const sekolahNamaList = mapPegawai.map((r: Record<string, unknown>) => String(r.sekolah || ""));

    return NextResponse.json({
      dataSekolah: [
        { label: "Total Sekolah", value: p(s.total), variant: "info" as const },
        { label: "Negeri", value: p(s.negeri), variant: "success" as const },
        { label: "Swasta", value: p(s.swasta), variant: "warning" as const },
        { label: "Aktif", value: p(s.aktif), variant: "success" as const },
        { label: "Nonaktif", value: p(s.nonaktif), variant: "danger" as const },
        { label: "Terakreditasi A", value: p(s.akreditasi_a), variant: "success" as const },
        { label: "Terakreditasi B", value: p(s.akreditasi_b), variant: "warning" as const },
        { label: "Belum Akreditasi", value: p(s.belum_akreditasi), variant: "default" as const },
      ],
      dataSiswa: {
        total: p(sg.total),
        laki: p(sg.laki),
        perempuan: p(sg.perempuan),
        perKelas: siswaKelas.map((r: Record<string, unknown>) => ({ kelas: String(r.kelas || ""), jumlah: p(r.jumlah) })),
        perSekolah: siswaPerSekolah.map((r: Record<string, unknown>) => ({
          sekolah: String(r.sekolah || ""),
          total: p(r.total),
          laki: p(r.laki),
          perempuan: p(r.perempuan),
          kelas_i: p(r.kelas_i),
          kelas_ii: p(r.kelas_ii),
          kelas_iii: p(r.kelas_iii),
          kelas_iv: p(r.kelas_iv),
          kelas_v: p(r.kelas_v),
          kelas_vi: p(r.kelas_vi),
        })),
      },
      dataGTK: {
        total: p(gt.total),
        pns: p(gt.pns),
        nonPns: p(gt.non_pns),
        honorer: p(gt.honorer),
        perSekolah: gtkPerSekolah.map((r: Record<string, unknown>) => ({
          sekolah: String(r.sekolah || ""),
          total: p(r.total),
          pns: p(r.pns),
          nonPns: p(r.non_pns),
          honorer: p(r.honorer),
        })),
      },
      mappingPegawai: mapPegawai.map((r: Record<string, unknown>) => ({
        sekolah: String(r.sekolah || ""),
        kepala_sekolah: String(r.kepala_sekolah || ""),
        guru: p(r.guru),
        staf: p(r.staf),
        operator: "",
      })),
      laporanBulanan: {
        sekolahNama: sekolahNamaList,
        stats: lt,
      },
      sarpras: {
        totalRuang: p(st.total),
        totalUnit: p(st.total_unit),
        kondisiBaik: p(st.kondisi_baik),
        kondisiSedang: p(st.kondisi_sedang),
        kondisiRusak: p(st.kondisi_rusak),
        perJenis: sarprasJenis.map((r: Record<string, unknown>) => ({
          jenis: String(r.jenis || ""),
          jumlah: p(r.jumlah),
          baik: p(r.baik),
          sedang: p(r.sedang),
          rusak: p(r.rusak),
        })),
      },
      spmb: {
        totalPendaftar: p(spt.pendaftar),
        diterima: p(spt.diterima),
        cadangan: 0,
        mengundurkanDiri: 0,
        perSekolah: spmbSekolah.map((r: Record<string, unknown>) => ({
          sekolah: String(r.sekolah || ""),
          pendaftar: p(r.pendaftar),
          diterima: p(r.diterima),
          cadangan: 0,
          mengundur: 0,
        })),
      },
      surat: {
        total: p(sut.total),
        masuk: p(sut.masuk),
        keluar: p(sut.keluar),
        disposisi: 0,
        perBulan: suratBulan.map((r: Record<string, unknown>) => ({
          bulan: String(r.bulan || ""),
          masuk: p(r.masuk),
          keluar: p(r.keluar),
        })),
      },
      progresData: progresKategori.map((p) => ({
        ...p,
        status: (p.persentase >= 100 ? "lengkap" : p.persentase >= 80 ? "hampir" : "kurang") as "lengkap" | "hampir" | "kurang",
      })),
    });
  } catch {
    return NextResponse.json({
      dataSekolah: [] as { label: string; value: number; variant: string }[],
      dataSiswa: { total: 0, laki: 0, perempuan: 0, perKelas: [] as { kelas: string; jumlah: number }[] },
      dataGTK: { total: 0, pns: 0, nonPns: 0, honorer: 0, perSekolah: [] as { sekolah: string; total: number; pns: number; nonPns: number; honorer: number }[] },
      mappingPegawai: [] as { sekolah: string; kepala_sekolah: string; guru: number; staf: number; operator: string }[],
      laporanBulanan: { sekolahNama: [] as string[], stats: {} },
      sarpras: { totalRuang: 0, totalUnit: 0, kondisiBaik: 0, kondisiSedang: 0, kondisiRusak: 0, perJenis: [] as { jenis: string; jumlah: number; baik: number; sedang: number; rusak: number }[] },
      spmb: { totalPendaftar: 0, diterima: 0, cadangan: 0, mengundurkanDiri: 0, perSekolah: [] as { sekolah: string; pendaftar: number; diterima: number; cadangan: number; mengundur: number }[] },
      surat: { total: 0, masuk: 0, keluar: 0, disposisi: 0, perBulan: [] as { bulan: string; masuk: number; keluar: number }[] },
      progresData: [] as { kategori: string; persentase: number; status: string }[],
    });
  }
}
