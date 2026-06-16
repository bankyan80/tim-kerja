import { NextResponse } from "next/server";
import { queryAll } from "@/lib/db";
import { getSekolahFilter } from "@/lib/auth-utils";
import type { InValue } from "@libsql/client";

export async function GET(request: Request) {
  try {
    const { forcedSekolah } = await getSekolahFilter();
    const sid = forcedSekolah;
    const url = new URL(request.url);
    const tp = url.searchParams.get("tahunPelajaran");

    const wh = sid ? " WHERE sekolah_id = ? AND deleted_at IS NULL" : " WHERE deleted_at IS NULL";
    const args = sid ? [sid] : [];
    const whTp = tp ? (sid ? " AND tahun_pelajaran = ?" : " WHERE tahun_pelajaran = ? AND deleted_at IS NULL") : "";
    const argsTp = tp ? [...args, tp] : args;
    const whSidTp = tp
      ? (sid ? " WHERE sekolah_id = ? AND tahun_pelajaran = ? AND deleted_at IS NULL" : " WHERE tahun_pelajaran = ? AND deleted_at IS NULL")
      : wh;
    const argsSidTp = tp ? (sid ? [sid, tp] : [tp]) : args;

    const [sekolah, siswaKelasSD, siswaKelasTK, siswaGender, siswaPerSekolahSD, siswaPerSekolahTK, gtkTotals, gtkPerSekolah, mapPegawai,
      laporanStats, laporanPerSekolah, sarprasTotals, sarprasJenis, spmbTotals, spmbSekolah, suratTotals,
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

      // Siswa per kelas - SD
      sid
        ? queryAll("SELECT kelas, COUNT(*) as jumlah FROM siswa JOIN sekolah s ON s.id = siswa.sekolah_id WHERE siswa.sekolah_id=? AND s.nama LIKE 'SD%' AND siswa.deleted_at IS NULL" + (tp ? " AND siswa.tahun_pelajaran=?" : "") + " GROUP BY kelas ORDER BY kelas", tp ? [sid, tp] : [sid])
        : queryAll("SELECT kelas, COUNT(*) as jumlah FROM siswa JOIN sekolah s ON s.id = siswa.sekolah_id WHERE s.nama LIKE 'SD%' AND siswa.deleted_at IS NULL" + (tp ? " AND siswa.tahun_pelajaran=?" : "") + " GROUP BY kelas ORDER BY kelas", tp ? [tp] : []),

      // Siswa per kelas - TK/KB
      sid
        ? queryAll("SELECT kelas, COUNT(*) as jumlah FROM siswa JOIN sekolah s ON s.id = siswa.sekolah_id WHERE siswa.sekolah_id=? AND s.nama NOT LIKE 'SD%' AND siswa.deleted_at IS NULL" + (tp ? " AND siswa.tahun_pelajaran=?" : "") + " GROUP BY kelas ORDER BY kelas", tp ? [sid, tp] : [sid])
        : queryAll("SELECT kelas, COUNT(*) as jumlah FROM siswa JOIN sekolah s ON s.id = siswa.sekolah_id WHERE s.nama NOT LIKE 'SD%' AND siswa.deleted_at IS NULL" + (tp ? " AND siswa.tahun_pelajaran=?" : "") + " GROUP BY kelas ORDER BY kelas", tp ? [tp] : []),

      // Siswa gender
      queryAll("SELECT COUNT(*) as total, SUM(CASE WHEN jenis_kelamin='L' THEN 1 ELSE 0 END) as laki, SUM(CASE WHEN jenis_kelamin='P' THEN 1 ELSE 0 END) as perempuan FROM siswa" + whTp, argsTp),

      // Siswa per sekolah SD (kelas I-VI)
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
          WHERE siswa.sekolah_id=? AND s.nama LIKE 'SD%' AND siswa.deleted_at IS NULL` + (tp ? " AND siswa.tahun_pelajaran=?" : "") + `
          GROUP BY s.nama ORDER BY s.nama`, tp ? [sid, tp] : [sid])
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
          WHERE s.nama LIKE 'SD%' AND siswa.deleted_at IS NULL` + (tp ? " AND siswa.tahun_pelajaran=?" : "") + `
          GROUP BY s.nama ORDER BY s.nama`, tp ? [tp] : []),

      // Siswa per sekolah TK/KB (kelas A, B, C)
      sid
        ? queryAll(`SELECT s.nama as sekolah, COUNT(*) as total,
            SUM(CASE WHEN siswa.jenis_kelamin='L' THEN 1 ELSE 0 END) as laki,
            SUM(CASE WHEN siswa.jenis_kelamin='P' THEN 1 ELSE 0 END) as perempuan,
            SUM(CASE WHEN siswa.kelas='I' THEN 1 ELSE 0 END) as kelas_a,
            SUM(CASE WHEN siswa.kelas='II' THEN 1 ELSE 0 END) as kelas_b,
            SUM(CASE WHEN siswa.kelas='III' THEN 1 ELSE 0 END) as kelas_c
          FROM siswa JOIN sekolah s ON s.id = siswa.sekolah_id
          WHERE siswa.sekolah_id=? AND s.nama NOT LIKE 'SD%' AND siswa.deleted_at IS NULL` + (tp ? " AND siswa.tahun_pelajaran=?" : "") + `
          GROUP BY s.nama ORDER BY s.nama`, tp ? [sid, tp] : [sid])
        : queryAll(`SELECT s.nama as sekolah, COUNT(*) as total,
            SUM(CASE WHEN siswa.jenis_kelamin='L' THEN 1 ELSE 0 END) as laki,
            SUM(CASE WHEN siswa.jenis_kelamin='P' THEN 1 ELSE 0 END) as perempuan,
            SUM(CASE WHEN siswa.kelas='I' THEN 1 ELSE 0 END) as kelas_a,
            SUM(CASE WHEN siswa.kelas='II' THEN 1 ELSE 0 END) as kelas_b,
            SUM(CASE WHEN siswa.kelas='III' THEN 1 ELSE 0 END) as kelas_c
          FROM siswa JOIN sekolah s ON s.id = siswa.sekolah_id
          WHERE s.nama NOT LIKE 'SD%' AND siswa.deleted_at IS NULL` + (tp ? " AND siswa.tahun_pelajaran=?" : "") + `
          GROUP BY s.nama
          ORDER BY
            CASE
              WHEN s.nama LIKE 'TK%' THEN 1
              WHEN s.nama LIKE 'KB%' THEN 2
              WHEN s.nama LIKE 'PAUD%' THEN 3
              ELSE 4
            END, s.nama`, tp ? [tp] : []),

      // GTK totals (no tahun_pelajaran column)
      queryAll(`SELECT COUNT(*) as total,
        SUM(CASE WHEN LOWER(status_pegawai)='pns' THEN 1 ELSE 0 END) as pns,
        SUM(CASE WHEN LOWER(status_pegawai)!='pns' THEN 1 ELSE 0 END) as non_pns,
        SUM(CASE WHEN LOWER(status_pegawai) LIKE '%honor%' THEN 1 ELSE 0 END) as honorer
      FROM gtk` + wh, args),

      // GTK per sekolah
      sid
        ? queryAll(`SELECT s.nama as sekolah, COUNT(*) as total,
          SUM(CASE WHEN LOWER(g.status_pegawai)='pns' THEN 1 ELSE 0 END) as pns,
          SUM(CASE WHEN LOWER(g.status_pegawai)!='pns' THEN 1 ELSE 0 END) as non_pns,
          SUM(CASE WHEN LOWER(g.status_pegawai) LIKE '%honor%' THEN 1 ELSE 0 END) as honorer
        FROM gtk g JOIN sekolah s ON g.sekolah_id=s.id WHERE g.sekolah_id=? AND g.deleted_at IS NULL GROUP BY s.nama`, [sid])
        : queryAll(`SELECT s.nama as sekolah, COUNT(*) as total,
          SUM(CASE WHEN LOWER(g.status_pegawai)='pns' THEN 1 ELSE 0 END) as pns,
          SUM(CASE WHEN LOWER(g.status_pegawai)!='pns' THEN 1 ELSE 0 END) as non_pns,
          SUM(CASE WHEN LOWER(g.status_pegawai) LIKE '%honor%' THEN 1 ELSE 0 END) as honorer
        FROM gtk g JOIN sekolah s ON g.sekolah_id=s.id WHERE g.deleted_at IS NULL GROUP BY s.nama
        ORDER BY
          CASE
            WHEN s.nama LIKE 'SD%' THEN 1
            WHEN s.nama LIKE 'TK%' THEN 2
            WHEN s.nama LIKE 'KB%' THEN 3
            WHEN s.nama LIKE 'PAUD%' THEN 4
            ELSE 5
          END, s.nama`),

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
        FROM sekolah s WHERE s.deleted_at IS NULL
        ORDER BY
          CASE
            WHEN s.nama LIKE 'SD%' THEN 1
            WHEN s.nama LIKE 'TK%' THEN 2
            WHEN s.nama LIKE 'KB%' THEN 3
            WHEN s.nama LIKE 'PAUD%' THEN 4
            ELSE 5
          END, s.nama`),

      // Laporan bulanan stats
      queryAll(`SELECT
        COUNT(*) as total,
        SUM(CASE WHEN status='terverifikasi' THEN 1 ELSE 0 END) as selesai,
        SUM(CASE WHEN status='draft' THEN 1 ELSE 0 END) as draft,
        SUM(CASE WHEN status='dikirim' THEN 1 ELSE 0 END) as dikirim,
        SUM(CASE WHEN status='perlu_perbaikan' THEN 1 ELSE 0 END) as perlu_perbaikan
      FROM laporan_bulanan` + whSidTp, argsSidTp),

      // Laporan per sekolah per bulan
      queryAll(`SELECT s.nama as sekolah, lb.bulan,
        SUM(CASE WHEN lb.status='terverifikasi' THEN 1 ELSE 0 END) as selesai,
        SUM(CASE WHEN lb.status='draft' THEN 1 ELSE 0 END) as draft,
        SUM(CASE WHEN lb.status='dikirim' THEN 1 ELSE 0 END) as dikirim,
        SUM(CASE WHEN lb.status='perlu_perbaikan' THEN 1 ELSE 0 END) as perlu_perbaikan
      FROM laporan_bulanan lb JOIN sekolah s ON lb.sekolah_id=s.id
      WHERE lb.deleted_at IS NULL` + (tp ? " AND lb.tahun_pelajaran=?" : "") + (sid ? " AND lb.sekolah_id=?" : "") + `
      GROUP BY s.nama, lb.bulan ORDER BY s.nama, lb.bulan`, tp ? (sid ? [tp, sid] : [tp]) : (sid ? [sid] : [])),

      // Sarpras totals
      queryAll("SELECT COUNT(*) as total, SUM(jumlah) as total_unit, SUM(kondisi_baik) as kondisi_baik, SUM(kondisi_sedang) as kondisi_sedang, SUM(kondisi_rusak) as kondisi_rusak FROM sarpras" + (sid ? " WHERE sekolah_id = ? AND deleted_at IS NULL" : " WHERE deleted_at IS NULL"), args),

      // Sarpras per jenis
      queryAll("SELECT jenis, SUM(jumlah) as jumlah, SUM(kondisi_baik) as baik, SUM(kondisi_sedang) as sedang, SUM(kondisi_rusak) as rusak FROM sarpras" + (sid ? " WHERE sekolah_id = ? AND deleted_at IS NULL" : " WHERE deleted_at IS NULL") + " GROUP BY jenis ORDER BY jenis", args),

      // SPMB totals
      queryAll("SELECT COUNT(*) as total_pendaftar, SUM(pendaftar) as pendaftar, SUM(diterima) as diterima FROM spmb" + (sid && tp ? " WHERE sekolah_id = ? AND tahun_pelajaran=?" : sid ? " WHERE sekolah_id = ?" : tp ? " WHERE tahun_pelajaran=?" : ""), sid && tp ? [sid, tp] : sid ? [sid] : tp ? [tp] : []),

      // SPMB per sekolah
      sid
        ? queryAll("SELECT s.nama as sekolah, sp.pendaftar, sp.diterima FROM spmb sp JOIN sekolah s ON sp.sekolah_id=s.id WHERE sp.sekolah_id=?" + (tp ? " AND sp.tahun_pelajaran=?" : ""), tp ? [sid, tp] : [sid])
        : queryAll(`SELECT s.nama as sekolah, sp.pendaftar, sp.diterima FROM spmb sp JOIN sekolah s ON sp.sekolah_id=s.id` + (tp ? " WHERE sp.tahun_pelajaran=?" : "") + `
        ORDER BY
          CASE
            WHEN s.nama LIKE 'SD%' THEN 1
            WHEN s.nama LIKE 'TK%' THEN 2
            WHEN s.nama LIKE 'KB%' THEN 3
            WHEN s.nama LIKE 'PAUD%' THEN 4
            ELSE 5
          END, s.nama`, tp ? [tp] : []),

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
        (SELECT COUNT(*) FROM siswa ${sid ? "WHERE sekolah_id = ? AND " : "WHERE "} deleted_at IS NULL${tp ? " AND tahun_pelajaran=?" : ""}) as siswa_count,
        (SELECT COUNT(*) FROM gtk ${sid ? "WHERE sekolah_id = ? AND " : "WHERE "} deleted_at IS NULL) as gtk_count,
        (SELECT COUNT(*) FROM laporan_bulanan ${sid ? "WHERE sekolah_id = ? AND " : "WHERE "} deleted_at IS NULL${tp ? " AND tahun_pelajaran=?" : ""}) as laporan_count,
        (SELECT COUNT(*) FROM sarpras ${sid ? "WHERE sekolah_id = ? AND " : "WHERE "} deleted_at IS NULL) as sarpras_count,
        (SELECT COUNT(*) FROM spmb ${sid ? "WHERE sekolah_id = ? AND " : "WHERE "} 1=1${tp ? " AND tahun_pelajaran=?" : ""}) as spmb_count,
        (SELECT COUNT(*) FROM surat WHERE deleted_at IS NULL) as surat_count,
        (SELECT COUNT(*) FROM arsip ${sid ? "WHERE sekolah_id = ? AND " : "WHERE "} deleted_at IS NULL) as arsip_count
      `, (() => {
        const progArgs: InValue[] = [];
        if (sid) progArgs.push(sid);
        if (tp) progArgs.push(tp);
        if (sid) progArgs.push(sid);
        if (tp) progArgs.push(tp);
        if (sid) progArgs.push(sid);
        if (tp) progArgs.push(tp);
        if (sid) progArgs.push(sid);
        if (sid) progArgs.push(sid);
        return progArgs;
      })()),
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
      { kategori: "Data Siswa", count: p(pd.siswa_count), persentase: p(pd.siswa_count) > 0 ? Math.min(100, Math.round(p(pd.siswa_count) / Math.max(1, p(pd.sekolah_count) * 50) * 100)) : 0 },
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
        perKelasSD: siswaKelasSD.map((r: Record<string, unknown>) => ({ kelas: String(r.kelas || ""), jumlah: p(r.jumlah) })),
        perKelasTK: siswaKelasTK.map((r: Record<string, unknown>) => ({ kelas: String(r.kelas || ""), jumlah: p(r.jumlah) })),
        perSekolahSD: siswaPerSekolahSD.map((r: Record<string, unknown>) => ({
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
        perSekolahTK: siswaPerSekolahTK.map((r: Record<string, unknown>) => ({
          sekolah: String(r.sekolah || ""),
          total: p(r.total),
          laki: p(r.laki),
          perempuan: p(r.perempuan),
          kelas_a: p(r.kelas_a),
          kelas_b: p(r.kelas_b),
          kelas_c: p(r.kelas_c),
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
        perSekolah: laporanPerSekolah.map((r: Record<string, unknown>) => ({
          sekolah: String(r.sekolah || ""),
          bulan: p(r.bulan),
          selesai: p(r.selesai),
          draft: p(r.draft),
          dikirim: p(r.dikirim),
          perlu_perbaikan: p(r.perlu_perbaikan),
        })),
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
      dataSiswa: { total: 0, laki: 0, perempuan: 0, perKelasSD: [] as { kelas: string; jumlah: number }[], perKelasTK: [] as { kelas: string; jumlah: number }[], perSekolahSD: [] as { sekolah: string; total: number; laki: number; perempuan: number; kelas_i: number; kelas_ii: number; kelas_iii: number; kelas_iv: number; kelas_v: number; kelas_vi: number }[], perSekolahTK: [] as { sekolah: string; total: number; laki: number; perempuan: number; kelas_a: number; kelas_b: number; kelas_c: number }[] },
      dataGTK: { total: 0, pns: 0, nonPns: 0, honorer: 0, perSekolah: [] as { sekolah: string; total: number; pns: number; nonPns: number; honorer: number }[] },
      mappingPegawai: [] as { sekolah: string; kepala_sekolah: string; guru: number; staf: number; operator: string }[],
      laporanBulanan: { sekolahNama: [] as string[], stats: {}, perSekolah: [] as { sekolah: string; bulan: number; selesai: number; draft: number; dikirim: number; perlu_perbaikan: number }[] },
      sarpras: { totalRuang: 0, totalUnit: 0, kondisiBaik: 0, kondisiSedang: 0, kondisiRusak: 0, perJenis: [] as { jenis: string; jumlah: number; baik: number; sedang: number; rusak: number }[] },
      spmb: { totalPendaftar: 0, diterima: 0, cadangan: 0, mengundurkanDiri: 0, perSekolah: [] as { sekolah: string; pendaftar: number; diterima: number; cadangan: number; mengundur: number }[] },
      surat: { total: 0, masuk: 0, keluar: 0, disposisi: 0, perBulan: [] as { bulan: string; masuk: number; keluar: number }[] },
      progresData: [] as { kategori: string; persentase: number; status: string }[],
    });
  }
}
