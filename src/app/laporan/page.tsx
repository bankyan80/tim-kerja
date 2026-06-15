"use client";

import { useState, useMemo } from "react";
import { useSession } from "next-auth/react";
import {
  FileText,
  Plus,
  Eye,
  Pencil,
  Trash2,
  Printer,
  CheckCircle,
  Send,
  AlertCircle,
  Download,
  Search,
  X,
} from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { DataTable } from "@/components/ui/Table";
import { Modal } from "@/components/ui/Modal";
import { Badge } from "@/components/ui/Badge";
import { Input, Select, Textarea } from "@/components/ui/Input";
import Button from "@/components/ui/Button";
import { Loading } from "@/components/ui/Loading";
import { EmptyState } from "@/components/ui/EmptyState";
import { getBulanName, getTahunPelajaran, formatDate } from "@/lib/utils";
import type { ColumnDef } from "@tanstack/react-table";

type StatusLaporan =
  | "draft"
  | "dikirim"
  | "menunggu_verifikasi"
  | "perlu_perbaikan"
  | "terverifikasi"
  | "terlambat";

interface JumlahSiswaKelas {
  L: number;
  P: number;
}

interface LaporanBulanan {
  id: string;
  sekolah_id: string;
  bulan: number;
  tahun_pelajaran: string;
  status: StatusLaporan;
  tanggal_dibuat: string;
  catatan: string;
  jumlah_siswa: Record<string, JumlahSiswaKelas>;
  siswa_masuk: number;
  siswa_keluar: number;
  siswa_mutasi: number;
  jumlah_guru: number;
  jumlah_tendik: number;
  kehadiran_hadir: number;
  kehadiran_sakit: number;
  kehadiran_izin: number;
  kehadiran_alpha: number;
  kondisi_ruangan: string;
  sarana_prasarana: string;
  meubelair: string;
  sumber_air_bersih: string;
  catatan_sekolah: string;
  lampiran: string[];
}

interface SekolahOption {
  id: string;
  nama: string;
  npsn: string;
  alamat: string;
  kepala_sekolah: string;
}

const sekolahList: SekolahOption[] = [
  { id: "1", nama: "SD Negeri 1 Lemahabang", npsn: "20217101", alamat: "Jl. Raya Lemahabang No. 1", kepala_sekolah: "Drs. H. Ahmad Syarif, M.Pd." },
  { id: "2", nama: "SD Negeri 2 Lemahabang", npsn: "20217102", alamat: "Jl. Diponegoro No. 22", kepala_sekolah: "Hj. Siti Nuraini, S.Pd." },
  { id: "3", nama: "SD Negeri 3 Lemahabang", npsn: "20217103", alamat: "Jl. Pahlawan No. 5", kepala_sekolah: "Drs. Cecep Supriatna, M.M." },
  { id: "4", nama: "SD Negeri 4 Lemahabang", npsn: "20217104", alamat: "Jl. Merdeka No. 33", kepala_sekolah: "H. Maman Suryaman, S.Pd." },
  { id: "5", nama: "MI Al-Ihsan Lemahabang", npsn: "20217105", alamat: "Jl. Sigong Indah No. 7", kepala_sekolah: "K.H. Asep Saepulloh, S.Ag." },
  { id: "6", nama: "SD IT Bina Cendekia", npsn: "20217106", alamat: "Jl. Cipta Karya No. 3", kepala_sekolah: "Ir. H. Faisal Rahman, M.T." },
];

const kelasOptions = ["I", "II", "III", "IV", "V", "VI"];

const bulanOptions = Array.from({ length: 12 }, (_, i) => ({
  value: String(i + 1),
  label: getBulanName(i + 1),
}));

const tahunPelajaranOptions = [
  "2024/2025",
  "2025/2026",
  "2026/2027",
];

const statusList: StatusLaporan[] = [
  "draft",
  "dikirim",
  "menunggu_verifikasi",
  "perlu_perbaikan",
  "terverifikasi",
  "terlambat",
];

const statusLabel: Record<StatusLaporan, string> = {
  draft: "Draft",
  dikirim: "Dikirim",
  menunggu_verifikasi: "Menunggu Verifikasi",
  perlu_perbaikan: "Perlu Perbaikan",
  terverifikasi: "Terverifikasi",
  terlambat: "Terlambat",
};

const statusBadge: Record<StatusLaporan, { variant: "default" | "success" | "warning" | "danger" | "info"; className?: string }> = {
  draft: { variant: "warning" },
  dikirim: { variant: "info" },
  menunggu_verifikasi: { variant: "default" },
  perlu_perbaikan: { variant: "danger" },
  terverifikasi: { variant: "success" },
  terlambat: { variant: "danger", className: "bg-red-600 text-white" },
};

function createDefaultJumlahSiswa(): Record<string, JumlahSiswaKelas> {
  const result: Record<string, JumlahSiswaKelas> = {};
  for (const k of kelasOptions) {
    result[k] = { L: 0, P: 0 };
  }
  return result;
}

const defaultForm: LaporanBulanan = {
  id: "",
  sekolah_id: "",
  bulan: new Date().getMonth() + 1,
  tahun_pelajaran: getTahunPelajaran(),
  status: "draft",
  tanggal_dibuat: new Date().toISOString().split("T")[0],
  catatan: "",
  jumlah_siswa: createDefaultJumlahSiswa(),
  siswa_masuk: 0,
  siswa_keluar: 0,
  siswa_mutasi: 0,
  jumlah_guru: 0,
  jumlah_tendik: 0,
  kehadiran_hadir: 0,
  kehadiran_sakit: 0,
  kehadiran_izin: 0,
  kehadiran_alpha: 0,
  kondisi_ruangan: "",
  sarana_prasarana: "",
  meubelair: "",
  sumber_air_bersih: "",
  catatan_sekolah: "",
  lampiran: [],
};

const initialData: LaporanBulanan[] = [
  {
    id: "1", sekolah_id: "1", bulan: 1, tahun_pelajaran: "2025/2026", status: "terverifikasi",
    tanggal_dibuat: "2025-01-10", catatan: "Laporan bulan Januari lengkap",
    jumlah_siswa: { I: { L: 12, P: 10 }, II: { L: 11, P: 13 }, III: { L: 14, P: 9 }, IV: { L: 10, P: 12 }, V: { L: 13, P: 11 }, VI: { L: 15, P: 8 } },
    siswa_masuk: 0, siswa_keluar: 1, siswa_mutasi: 0,
    jumlah_guru: 12, jumlah_tendik: 3,
    kehadiran_hadir: 148, kehadiran_sakit: 3, kehadiran_izin: 2, kehadiran_alpha: 0,
    kondisi_ruangan: "Baik, semua ruangan layak pakai", sarana_prasarana: "Meja dan kursi dalam kondisi baik",
    meubelair: "Lemari dan rak buku tersedia cukup", sumber_air_bersih: "PDAM",
    catatan_sekolah: "", lampiran: [],
  },
  {
    id: "2", sekolah_id: "1", bulan: 2, tahun_pelajaran: "2025/2026", status: "terverifikasi",
    tanggal_dibuat: "2025-02-10", catatan: "Laporan bulan Februari lengkap",
    jumlah_siswa: { I: { L: 12, P: 10 }, II: { L: 11, P: 13 }, III: { L: 14, P: 9 }, IV: { L: 10, P: 12 }, V: { L: 13, P: 11 }, VI: { L: 15, P: 8 } },
    siswa_masuk: 0, siswa_keluar: 0, siswa_mutasi: 1,
    jumlah_guru: 12, jumlah_tendik: 3,
    kehadiran_hadir: 146, kehadiran_sakit: 4, kehadiran_izin: 1, kehadiran_alpha: 1,
    kondisi_ruangan: "Baik", sarana_prasarana: "Baik",
    meubelair: "Cukup", sumber_air_bersih: "PDAM",
    catatan_sekolah: "", lampiran: [],
  },
  {
    id: "3", sekolah_id: "1", bulan: 3, tahun_pelajaran: "2025/2026", status: "dikirim",
    tanggal_dibuat: "2025-03-08", catatan: "",
    jumlah_siswa: { I: { L: 12, P: 10 }, II: { L: 11, P: 13 }, III: { L: 14, P: 9 }, IV: { L: 10, P: 12 }, V: { L: 13, P: 11 }, VI: { L: 15, P: 8 } },
    siswa_masuk: 1, siswa_keluar: 0, siswa_mutasi: 0,
    jumlah_guru: 12, jumlah_tendik: 3,
    kehadiran_hadir: 150, kehadiran_sakit: 1, kehadiran_izin: 1, kehadiran_alpha: 0,
    kondisi_ruangan: "Baik", sarana_prasarana: "Baik",
    meubelair: "Cukup", sumber_air_bersih: "PDAM",
    catatan_sekolah: "", lampiran: [],
  },
  {
    id: "4", sekolah_id: "2", bulan: 1, tahun_pelajaran: "2025/2026", status: "terverifikasi",
    tanggal_dibuat: "2025-01-11", catatan: "",
    jumlah_siswa: { I: { L: 9, P: 8 }, II: { L: 10, P: 7 }, III: { L: 8, P: 9 }, IV: { L: 11, P: 6 }, V: { L: 7, P: 10 }, VI: { L: 9, P: 8 } },
    siswa_masuk: 0, siswa_keluar: 0, siswa_mutasi: 0,
    jumlah_guru: 10, jumlah_tendik: 2,
    kehadiran_hadir: 102, kehadiran_sakit: 2, kehadiran_izin: 0, kehadiran_alpha: 0,
    kondisi_ruangan: "Baik", sarana_prasarana: "Cukup",
    meubelair: "Cukup", sumber_air_bersih: "Sumur",
    catatan_sekolah: "", lampiran: [],
  },
  {
    id: "5", sekolah_id: "2", bulan: 2, tahun_pelajaran: "2025/2026", status: "menunggu_verifikasi",
    tanggal_dibuat: "2025-02-09", catatan: "Menunggu konfirmasi Dinas",
    jumlah_siswa: { I: { L: 9, P: 8 }, II: { L: 10, P: 7 }, III: { L: 8, P: 9 }, IV: { L: 11, P: 6 }, V: { L: 7, P: 10 }, VI: { L: 9, P: 8 } },
    siswa_masuk: 0, siswa_keluar: 1, siswa_mutasi: 0,
    jumlah_guru: 10, jumlah_tendik: 2,
    kehadiran_hadir: 100, kehadiran_sakit: 1, kehadiran_izin: 2, kehadiran_alpha: 0,
    kondisi_ruangan: "Baik", sarana_prasarana: "Cukup",
    meubelair: "Cukup", sumber_air_bersih: "Sumur",
    catatan_sekolah: "", lampiran: [],
  },
  {
    id: "6", sekolah_id: "2", bulan: 3, tahun_pelajaran: "2025/2026", status: "draft",
    tanggal_dibuat: "2025-03-05", catatan: "Masih melengkapi data kehadiran",
    jumlah_siswa: { I: { L: 9, P: 8 }, II: { L: 10, P: 7 }, III: { L: 8, P: 9 }, IV: { L: 11, P: 6 }, V: { L: 7, P: 10 }, VI: { L: 9, P: 8 } },
    siswa_masuk: 0, siswa_keluar: 0, siswa_mutasi: 0,
    jumlah_guru: 10, jumlah_tendik: 2,
    kehadiran_hadir: 0, kehadiran_sakit: 0, kehadiran_izin: 0, kehadiran_alpha: 0,
    kondisi_ruangan: "", sarana_prasarana: "",
    meubelair: "", sumber_air_bersih: "Sumur",
    catatan_sekolah: "", lampiran: [],
  },
  {
    id: "7", sekolah_id: "3", bulan: 1, tahun_pelajaran: "2025/2026", status: "perlu_perbaikan",
    tanggal_dibuat: "2025-01-12", catatan: "Data jumlah siswa tidak sesuai dengan absensi",
    jumlah_siswa: { I: { L: 15, P: 12 }, II: { L: 14, P: 11 }, III: { L: 13, P: 14 }, IV: { L: 12, P: 13 }, V: { L: 11, P: 12 }, VI: { L: 10, P: 11 } },
    siswa_masuk: 2, siswa_keluar: 0, siswa_mutasi: 0,
    jumlah_guru: 14, jumlah_tendik: 4,
    kehadiran_hadir: 150, kehadiran_sakit: 5, kehadiran_izin: 3, kehadiran_alpha: 1,
    kondisi_ruangan: "Baik", sarana_prasarana: "Perlu perbaikan meja siswa",
    meubelair: "Kursi beberapa rusak", sumber_air_bersih: "PDAM",
    catatan_sekolah: "Mohon verifikasi ulang data", lampiran: [],
  },
  {
    id: "8", sekolah_id: "3", bulan: 2, tahun_pelajaran: "2025/2026", status: "draft",
    tanggal_dibuat: "2025-02-07", catatan: "",
    jumlah_siswa: { I: { L: 15, P: 12 }, II: { L: 14, P: 11 }, III: { L: 13, P: 14 }, IV: { L: 12, P: 13 }, V: { L: 11, P: 12 }, VI: { L: 10, P: 11 } },
    siswa_masuk: 0, siswa_keluar: 0, siswa_mutasi: 1,
    jumlah_guru: 14, jumlah_tendik: 4,
    kehadiran_hadir: 148, kehadiran_sakit: 2, kehadiran_izin: 1, kehadiran_alpha: 0,
    kondisi_ruangan: "Baik", sarana_prasarana: "Baik",
    meubelair: "Cukup", sumber_air_bersih: "PDAM",
    catatan_sekolah: "", lampiran: [],
  },
  {
    id: "9", sekolah_id: "4", bulan: 1, tahun_pelajaran: "2025/2026", status: "terlambat",
    tanggal_dibuat: "2025-02-15", catatan: "Laporan terlambat dikirim",
    jumlah_siswa: { I: { L: 8, P: 7 }, II: { L: 9, P: 6 }, III: { L: 7, P: 8 }, IV: { L: 10, P: 5 }, V: { L: 6, P: 9 }, VI: { L: 8, P: 7 } },
    siswa_masuk: 0, siswa_keluar: 0, siswa_mutasi: 0,
    jumlah_guru: 8, jumlah_tendik: 2,
    kehadiran_hadir: 90, kehadiran_sakit: 1, kehadiran_izin: 0, kehadiran_alpha: 0,
    kondisi_ruangan: "Cukup", sarana_prasarana: "Cukup",
    meubelair: "Kurang", sumber_air_bersih: "Mata Air",
    catatan_sekolah: "", lampiran: [],
  },
  {
    id: "10", sekolah_id: "4", bulan: 2, tahun_pelajaran: "2025/2026", status: "dikirim",
    tanggal_dibuat: "2025-02-10", catatan: "",
    jumlah_siswa: { I: { L: 8, P: 7 }, II: { L: 9, P: 6 }, III: { L: 7, P: 8 }, IV: { L: 10, P: 5 }, V: { L: 6, P: 9 }, VI: { L: 8, P: 7 } },
    siswa_masuk: 1, siswa_keluar: 0, siswa_mutasi: 0,
    jumlah_guru: 8, jumlah_tendik: 2,
    kehadiran_hadir: 88, kehadiran_sakit: 2, kehadiran_izin: 1, kehadiran_alpha: 0,
    kondisi_ruangan: "Cukup", sarana_prasarana: "Cukup",
    meubelair: "Kurang", sumber_air_bersih: "Mata Air",
    catatan_sekolah: "", lampiran: [],
  },
  {
    id: "11", sekolah_id: "5", bulan: 1, tahun_pelajaran: "2025/2026", status: "terverifikasi",
    tanggal_dibuat: "2025-01-09", catatan: "",
    jumlah_siswa: { I: { L: 18, P: 15 }, II: { L: 16, P: 17 }, III: { L: 15, P: 16 }, IV: { L: 17, P: 14 }, V: { L: 14, P: 18 }, VI: { L: 16, P: 15 } },
    siswa_masuk: 0, siswa_keluar: 2, siswa_mutasi: 0,
    jumlah_guru: 18, jumlah_tendik: 5,
    kehadiran_hadir: 195, kehadiran_sakit: 4, kehadiran_izin: 2, kehadiran_alpha: 0,
    kondisi_ruangan: "Baik sekali", sarana_prasarana: "Lengkap",
    meubelair: "Cukup", sumber_air_bersih: "PDAM",
    catatan_sekolah: "", lampiran: [],
  },
  {
    id: "12", sekolah_id: "5", bulan: 2, tahun_pelajaran: "2025/2026", status: "menunggu_verifikasi",
    tanggal_dibuat: "2025-02-08", catatan: "",
    jumlah_siswa: { I: { L: 18, P: 15 }, II: { L: 16, P: 17 }, III: { L: 15, P: 16 }, IV: { L: 17, P: 14 }, V: { L: 14, P: 18 }, VI: { L: 16, P: 15 } },
    siswa_masuk: 0, siswa_keluar: 0, siswa_mutasi: 0,
    jumlah_guru: 18, jumlah_tendik: 5,
    kehadiran_hadir: 192, kehadiran_sakit: 3, kehadiran_izin: 1, kehadiran_alpha: 2,
    kondisi_ruangan: "Baik sekali", sarana_prasarana: "Lengkap",
    meubelair: "Cukup", sumber_air_bersih: "PDAM",
    catatan_sekolah: "", lampiran: [],
  },
  {
    id: "13", sekolah_id: "6", bulan: 1, tahun_pelajaran: "2025/2026", status: "dikirim",
    tanggal_dibuat: "2025-01-10", catatan: "",
    jumlah_siswa: { I: { L: 20, P: 18 }, II: { L: 19, P: 17 }, III: { L: 21, P: 16 }, IV: { L: 18, P: 20 }, V: { L: 17, P: 19 }, VI: { L: 19, P: 18 } },
    siswa_masuk: 0, siswa_keluar: 1, siswa_mutasi: 0,
    jumlah_guru: 20, jumlah_tendik: 6,
    kehadiran_hadir: 220, kehadiran_sakit: 5, kehadiran_izin: 3, kehadiran_alpha: 0,
    kondisi_ruangan: "Sangat baik", sarana_prasarana: "Lengkap dan modern",
    meubelair: "Baik", sumber_air_bersih: "PDAM",
    catatan_sekolah: "", lampiran: [],
  },
  {
    id: "14", sekolah_id: "6", bulan: 2, tahun_pelajaran: "2025/2026", status: "terlambat",
    tanggal_dibuat: "2025-03-02", catatan: "Terlambat 2 minggu",
    jumlah_siswa: { I: { L: 20, P: 18 }, II: { L: 19, P: 17 }, III: { L: 21, P: 16 }, IV: { L: 18, P: 20 }, V: { L: 17, P: 19 }, VI: { L: 19, P: 18 } },
    siswa_masuk: 2, siswa_keluar: 0, siswa_mutasi: 0,
    jumlah_guru: 20, jumlah_tendik: 6,
    kehadiran_hadir: 218, kehadiran_sakit: 4, kehadiran_izin: 2, kehadiran_alpha: 1,
    kondisi_ruangan: "Sangat baik", sarana_prasarana: "Lengkap dan modern",
    meubelair: "Baik", sumber_air_bersih: "PDAM",
    catatan_sekolah: "", lampiran: [],
  },
  {
    id: "15", sekolah_id: "3", bulan: 3, tahun_pelajaran: "2025/2026", status: "draft",
    tanggal_dibuat: "2025-03-03", catatan: "Belum selesai diisi",
    jumlah_siswa: { I: { L: 15, P: 12 }, II: { L: 14, P: 11 }, III: { L: 13, P: 14 }, IV: { L: 12, P: 13 }, V: { L: 11, P: 12 }, VI: { L: 10, P: 11 } },
    siswa_masuk: 0, siswa_keluar: 0, siswa_mutasi: 0,
    jumlah_guru: 14, jumlah_tendik: 4,
    kehadiran_hadir: 0, kehadiran_sakit: 0, kehadiran_izin: 0, kehadiran_alpha: 0,
    kondisi_ruangan: "", sarana_prasarana: "",
    meubelair: "", sumber_air_bersih: "PDAM",
    catatan_sekolah: "", lampiran: [],
  },
  {
    id: "16", sekolah_id: "1", bulan: 4, tahun_pelajaran: "2025/2026", status: "draft",
    tanggal_dibuat: new Date().toISOString().split("T")[0], catatan: "",
    jumlah_siswa: { I: { L: 12, P: 10 }, II: { L: 11, P: 13 }, III: { L: 14, P: 9 }, IV: { L: 10, P: 12 }, V: { L: 13, P: 11 }, VI: { L: 15, P: 8 } },
    siswa_masuk: 0, siswa_keluar: 0, siswa_mutasi: 0,
    jumlah_guru: 12, jumlah_tendik: 3,
    kehadiran_hadir: 0, kehadiran_sakit: 0, kehadiran_izin: 0, kehadiran_alpha: 0,
    kondisi_ruangan: "", sarana_prasarana: "",
    meubelair: "", sumber_air_bersih: "PDAM",
    catatan_sekolah: "", lampiran: [],
  },
];

export default function LaporanBulananPage() {
  const { data: session } = useSession();

  const [data, setData] = useState<LaporanBulanan[]>(initialData);
  const [loading, setLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<LaporanBulanan>(defaultForm);
  const [viewing, setViewing] = useState<LaporanBulanan | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const [filterSekolah, setFilterSekolah] = useState("");
  const [filterBulan, setFilterBulan] = useState("");
  const [filterTahunPelajaran, setFilterTahunPelajaran] = useState("");
  const [filterStatus, setFilterStatus] = useState("");

  const filteredData = useMemo(() => {
    let result = data;
    if (filterSekolah) result = result.filter((l) => l.sekolah_id === filterSekolah);
    if (filterBulan) result = result.filter((l) => l.bulan === Number(filterBulan));
    if (filterTahunPelajaran) result = result.filter((l) => l.tahun_pelajaran === filterTahunPelajaran);
    if (filterStatus) result = result.filter((l) => l.status === filterStatus);
    return result;
  }, [data, filterSekolah, filterBulan, filterTahunPelajaran, filterStatus]);

  const rekapData = useMemo(() => {
    const counts: Record<StatusLaporan, number> = {
      draft: 0,
      dikirim: 0,
      menunggu_verifikasi: 0,
      perlu_perbaikan: 0,
      terverifikasi: 0,
      terlambat: 0,
    };
    for (const l of data) {
      counts[l.status]++;
    }
    return counts;
  }, [data]);

  const totalLaporan = data.length;

  const columns: ColumnDef<LaporanBulanan>[] = [
    {
      header: "No",
      id: "no",
      cell: ({ row }) => row.index + 1,
    },
    {
      header: "Sekolah",
      accessorKey: "sekolah_id",
      cell: ({ row }) => {
        const sekolah = sekolahList.find((s) => s.id === row.original.sekolah_id);
        return sekolah?.nama || "-";
      },
    },
    {
      header: "Bulan",
      accessorKey: "bulan",
      cell: ({ row }) => getBulanName(row.original.bulan),
    },
    { header: "Tahun Pelajaran", accessorKey: "tahun_pelajaran" },
    {
      header: "Status",
      accessorKey: "status",
      cell: ({ row }) => {
        const sb = statusBadge[row.original.status];
        return (
          <Badge variant={sb.variant} className={sb.className}>
            {statusLabel[row.original.status]}
          </Badge>
        );
      },
    },
    {
      header: "Tanggal Dibuat",
      accessorKey: "tanggal_dibuat",
      cell: ({ row }) => formatDate(row.original.tanggal_dibuat),
    },
    {
      header: "Catatan",
      accessorKey: "catatan",
      cell: ({ row }) => (
        <span className="max-w-[200px] block truncate" title={row.original.catatan || "-"}>
          {row.original.catatan || "-"}
        </span>
      ),
    },
    {
      header: "Aksi",
      id: "aksi",
      cell: ({ row }) => (
        <div className="flex items-center gap-1">
          <button
            onClick={() => setViewing(row.original)}
            className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
            title="Lihat"
          >
            <Eye className="w-4 h-4" />
          </button>
          <button
            onClick={() => handleEdit(row.original)}
            className="p-1.5 text-yellow-600 hover:bg-yellow-50 rounded-lg transition-colors"
            title="Edit"
          >
            <Pencil className="w-4 h-4" />
          </button>
          {(row.original.status === "menunggu_verifikasi" || row.original.status === "dikirim") && (
            <button
              onClick={() => handleVerify(row.original)}
              className="p-1.5 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
              title="Verifikasi"
            >
              <CheckCircle className="w-4 h-4" />
            </button>
          )}
          <button
            onClick={() => handleCetak(row.original)}
            className="p-1.5 text-purple-600 hover:bg-purple-50 rounded-lg transition-colors"
            title="Cetak"
          >
            <Printer className="w-4 h-4" />
          </button>
          <button
            onClick={() => setConfirmDelete(row.original.id)}
            className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
            title="Hapus"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      ),
    },
  ];

  function openAddModal() {
    setEditingId(null);
    setForm({ ...defaultForm, tanggal_dibuat: new Date().toISOString().split("T")[0] });
    setModalOpen(true);
  }

  function handleEdit(laporan: LaporanBulanan) {
    setEditingId(laporan.id);
    setForm({ ...laporan });
    setModalOpen(true);
  }

  function handleVerify(laporan: LaporanBulanan) {
    setData((prev) =>
      prev.map((l) =>
        l.id === laporan.id ? { ...l, status: "terverifikasi" as StatusLaporan } : l
      )
    );
  }

  function handleCetak(laporan: LaporanBulanan) {
    const sekolah = sekolahList.find((s) => s.id === laporan.sekolah_id);
    alert(`Cetak laporan ${sekolah?.nama} - ${getBulanName(laporan.bulan)} ${laporan.tahun_pelajaran}`);
  }

  function handleDelete() {
    if (!confirmDelete) return;
    setData((prev) => prev.filter((l) => l.id !== confirmDelete));
    setConfirmDelete(null);
  }

  function handleSave() {
    if (editingId) {
      setData((prev) =>
        prev.map((l) => (l.id === editingId ? { ...form, id: editingId } : l))
      );
    } else {
      const newId = String(Date.now());
      setData((prev) => [...prev, { ...form, id: newId }]);
    }
    setModalOpen(false);
  }

  function handleStatusChange(laporan: LaporanBulanan, newStatus: StatusLaporan) {
    setData((prev) =>
      prev.map((l) => (l.id === laporan.id ? { ...l, status: newStatus } : l))
    );
    setViewing(null);
  }

  function updateForm(key: keyof LaporanBulanan, value: unknown) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function updateJumlahSiswa(kelas: string, jenis: "L" | "P", value: number) {
    setForm((prev) => ({
      ...prev,
      jumlah_siswa: {
        ...prev.jumlah_siswa,
        [kelas]: {
          ...prev.jumlah_siswa[kelas],
          [jenis]: value,
        },
      },
    }));
  }

  function getSekolahNama(id: string) {
    return sekolahList.find((s) => s.id === id)?.nama || "-";
  }

  function getSekolahData(id: string) {
    return sekolahList.find((s) => s.id === id);
  }

  if (loading) return <Loading message="Memuat laporan bulanan..." />;

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="max-w-7xl mx-auto px-4 py-6 space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-blue-50 text-blue-600">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Laporan Bulanan</h1>
              <p className="text-sm text-gray-500 mt-0.5">Kecamatan Lemahabang</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button onClick={openAddModal}>
              <Plus className="w-4 h-4 mr-2" />
              Buat Laporan
            </Button>
          </div>
        </div>

        {/* Filter */}
        <Card>
          <div className="flex flex-wrap items-center gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                value={filterSekolah ? "" : undefined}
                onChange={(e) => {
                  const q = e.target.value.toLowerCase();
                  const found = sekolahList.find(
                    (s) => s.nama.toLowerCase().includes(q)
                  );
                  if (found) setFilterSekolah(found.id);
                }}
                placeholder="Cari sekolah..."
                className="pl-10 pr-4 py-1.5 border border-gray-300 rounded-lg text-sm w-56 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <select
              value={filterSekolah}
              onChange={(e) => setFilterSekolah(e.target.value)}
              className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Semua Sekolah</option>
              {sekolahList.map((s) => (
                <option key={s.id} value={s.id}>{s.nama}</option>
              ))}
            </select>
            <select
              value={filterBulan}
              onChange={(e) => setFilterBulan(e.target.value)}
              className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Semua Bulan</option>
              {bulanOptions.map((b) => (
                <option key={b.value} value={b.value}>{b.label}</option>
              ))}
            </select>
            <select
              value={filterTahunPelajaran}
              onChange={(e) => setFilterTahunPelajaran(e.target.value)}
              className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Semua Tahun Pelajaran</option>
              {tahunPelajaranOptions.map((tp) => (
                <option key={tp} value={tp}>{tp}</option>
              ))}
            </select>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Semua Status</option>
              {statusList.map((st) => (
                <option key={st} value={st}>{statusLabel[st]}</option>
              ))}
            </select>
          </div>
        </Card>

        {/* Table */}
        <Card>
          <CardContent>
            {filteredData.length === 0 ? (
              <EmptyState
                title="Belum ada laporan"
                message="Klik tombol Buat Laporan untuk membuat laporan baru."
                icon={<FileText className="w-12 h-12 text-gray-300" />}
              />
            ) : (
              <DataTable
                columns={columns}
                data={filteredData}
                searchable={false}
              />
            )}
          </CardContent>
        </Card>

        {/* Rekap Section */}
        <Card>
          <CardHeader>
            <CardTitle>Rekap Laporan Bulanan</CardTitle>
            <span className="text-sm text-gray-500">Total: {totalLaporan} laporan</span>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-2 text-left text-xs font-semibold text-gray-600 uppercase">Status</th>
                    <th className="px-4 py-2 text-center text-xs font-semibold text-gray-600 uppercase">Jumlah</th>
                    <th className="px-4 py-2 text-center text-xs font-semibold text-gray-600 uppercase">Persentase</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {statusList.map((st) => {
                    const sb = statusBadge[st];
                    const count = rekapData[st];
                    const pct = totalLaporan > 0 ? ((count / totalLaporan) * 100).toFixed(1) : "0.0";
                    return (
                      <tr key={st} className="hover:bg-gray-50">
                        <td className="px-4 py-2 text-sm">
                          <Badge variant={sb.variant} className={sb.className}>
                            {statusLabel[st]}
                          </Badge>
                        </td>
                        <td className="px-4 py-2 text-sm text-center font-semibold text-gray-800">{count}</td>
                        <td className="px-4 py-2 text-sm text-center text-gray-600">{pct}%</td>
                      </tr>
                    );
                  })}
                </tbody>
                <tfoot className="bg-gray-50 font-semibold">
                  <tr>
                    <td className="px-4 py-2 text-sm text-gray-800">Total</td>
                    <td className="px-4 py-2 text-sm text-center text-gray-800">{totalLaporan}</td>
                    <td className="px-4 py-2 text-sm text-center text-gray-800">100%</td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Modal Tambah/Edit */}
      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingId ? "Edit Laporan Bulanan" : "Buat Laporan Bulanan"}
        size="xl"
      >
        <div className="space-y-6">
          {/* Identitas Laporan */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Select
              label="Sekolah"
              id="sekolah_id"
              value={form.sekolah_id}
              onChange={(e) => updateForm("sekolah_id", e.target.value)}
              options={sekolahList.map((s) => ({ value: s.id, label: s.nama }))}
            />
            <Select
              label="Bulan"
              id="bulan"
              value={String(form.bulan)}
              onChange={(e) => updateForm("bulan", Number(e.target.value))}
              options={bulanOptions}
            />
            <Input
              label="Tahun Pelajaran"
              id="tahun_pelajaran"
              value={form.tahun_pelajaran}
              onChange={(e) => updateForm("tahun_pelajaran", e.target.value)}
            />
          </div>

          {/* 1. Data Sekolah */}
          <div className="border rounded-lg p-4 space-y-3">
            <h4 className="font-semibold text-sm text-gray-800">1. Data Sekolah</h4>
            {form.sekolah_id ? (
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <span className="text-xs text-gray-500">Nama Sekolah</span>
                  <p className="font-medium">{getSekolahData(form.sekolah_id)?.nama}</p>
                </div>
                <div>
                  <span className="text-xs text-gray-500">NPSN</span>
                  <p className="font-medium">{getSekolahData(form.sekolah_id)?.npsn}</p>
                </div>
                <div>
                  <span className="text-xs text-gray-500">Alamat</span>
                  <p className="font-medium">{getSekolahData(form.sekolah_id)?.alamat}</p>
                </div>
                <div>
                  <span className="text-xs text-gray-500">Kepala Sekolah</span>
                  <p className="font-medium">{getSekolahData(form.sekolah_id)?.kepala_sekolah}</p>
                </div>
              </div>
            ) : (
              <p className="text-sm text-gray-400 italic">Pilih sekolah untuk melihat data</p>
            )}
          </div>

          {/* 2. Jumlah Siswa per Kelas */}
          <div className="border rounded-lg p-4 space-y-3">
            <h4 className="font-semibold text-sm text-gray-800">2. Jumlah Siswa per Kelas dan Jenis Kelamin</h4>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 text-sm">
                <thead>
                  <tr>
                    <th className="px-3 py-2 text-left text-xs font-semibold text-gray-600">Kelas</th>
                    <th className="px-3 py-2 text-center text-xs font-semibold text-gray-600">L</th>
                    <th className="px-3 py-2 text-center text-xs font-semibold text-gray-600">P</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {kelasOptions.map((k) => (
                    <tr key={k}>
                      <td className="px-3 py-2 text-sm font-medium">Kelas {k}</td>
                      <td className="px-3 py-2">
                        <input
                          type="number"
                          min={0}
                          value={form.jumlah_siswa[k]?.L ?? 0}
                          onChange={(e) => updateJumlahSiswa(k, "L", Number(e.target.value))}
                          className="w-20 px-2 py-1 border border-gray-300 rounded text-sm text-center focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </td>
                      <td className="px-3 py-2">
                        <input
                          type="number"
                          min={0}
                          value={form.jumlah_siswa[k]?.P ?? 0}
                          onChange={(e) => updateJumlahSiswa(k, "P", Number(e.target.value))}
                          className="w-20 px-2 py-1 border border-gray-300 rounded text-sm text-center focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* 3. Siswa Masuk, Keluar, Mutasi */}
          <div className="border rounded-lg p-4 space-y-3">
            <h4 className="font-semibold text-sm text-gray-800">3. Siswa Masuk, Keluar, Mutasi</h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Input
                label="Siswa Masuk"
                id="siswa_masuk"
                type="number"
                min={0}
                value={form.siswa_masuk}
                onChange={(e) => updateForm("siswa_masuk", Number(e.target.value))}
              />
              <Input
                label="Siswa Keluar"
                id="siswa_keluar"
                type="number"
                min={0}
                value={form.siswa_keluar}
                onChange={(e) => updateForm("siswa_keluar", Number(e.target.value))}
              />
              <Input
                label="Siswa Mutasi"
                id="siswa_mutasi"
                type="number"
                min={0}
                value={form.siswa_mutasi}
                onChange={(e) => updateForm("siswa_mutasi", Number(e.target.value))}
              />
            </div>
          </div>

          {/* 4. Jumlah Guru dan Tendik */}
          <div className="border rounded-lg p-4 space-y-3">
            <h4 className="font-semibold text-sm text-gray-800">4. Jumlah Guru dan Tendik</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="Jumlah Guru"
                id="jumlah_guru"
                type="number"
                min={0}
                value={form.jumlah_guru}
                onChange={(e) => updateForm("jumlah_guru", Number(e.target.value))}
              />
              <Input
                label="Jumlah Tendik"
                id="jumlah_tendik"
                type="number"
                min={0}
                value={form.jumlah_tendik}
                onChange={(e) => updateForm("jumlah_tendik", Number(e.target.value))}
              />
            </div>
          </div>

          {/* 5. Kehadiran Siswa */}
          <div className="border rounded-lg p-4 space-y-3">
            <h4 className="font-semibold text-sm text-gray-800">5. Kehadiran Siswa</h4>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Input
                label="Hadir"
                id="kehadiran_hadir"
                type="number"
                min={0}
                value={form.kehadiran_hadir}
                onChange={(e) => updateForm("kehadiran_hadir", Number(e.target.value))}
              />
              <Input
                label="Sakit"
                id="kehadiran_sakit"
                type="number"
                min={0}
                value={form.kehadiran_sakit}
                onChange={(e) => updateForm("kehadiran_sakit", Number(e.target.value))}
              />
              <Input
                label="Izin"
                id="kehadiran_izin"
                type="number"
                min={0}
                value={form.kehadiran_izin}
                onChange={(e) => updateForm("kehadiran_izin", Number(e.target.value))}
              />
              <Input
                label="Alpha"
                id="kehadiran_alpha"
                type="number"
                min={0}
                value={form.kehadiran_alpha}
                onChange={(e) => updateForm("kehadiran_alpha", Number(e.target.value))}
              />
            </div>
          </div>

          {/* 6. Kondisi Ruangan */}
          <div className="border rounded-lg p-4 space-y-3">
            <h4 className="font-semibold text-sm text-gray-800">6. Kondisi Ruangan</h4>
            <Textarea
              id="kondisi_ruangan"
              value={form.kondisi_ruangan}
              onChange={(e) => updateForm("kondisi_ruangan", e.target.value)}
              placeholder="Deskripsikan kondisi ruangan kelas, kantor, dan fasilitas lainnya..."
              rows={3}
            />
          </div>

          {/* 7. Sarana dan Prasarana */}
          <div className="border rounded-lg p-4 space-y-3">
            <h4 className="font-semibold text-sm text-gray-800">7. Sarana dan Prasarana</h4>
            <Textarea
              id="sarana_prasarana"
              value={form.sarana_prasarana}
              onChange={(e) => updateForm("sarana_prasarana", e.target.value)}
              placeholder="Deskripsikan kondisi sarana dan prasarana sekolah..."
              rows={3}
            />
          </div>

          {/* 8. Meubelair */}
          <div className="border rounded-lg p-4 space-y-3">
            <h4 className="font-semibold text-sm text-gray-800">8. Meubelair</h4>
            <Textarea
              id="meubelair"
              value={form.meubelair}
              onChange={(e) => updateForm("meubelair", e.target.value)}
              placeholder="Deskripsikan kondisi meja, kursi, lemari, dan meubelair lainnya..."
              rows={3}
            />
          </div>

          {/* 9. Sumber Air Bersih */}
          <div className="border rounded-lg p-4 space-y-3">
            <h4 className="font-semibold text-sm text-gray-800">9. Sumber Air Bersih</h4>
            <Select
              id="sumber_air_bersih"
              value={form.sumber_air_bersih}
              onChange={(e) => updateForm("sumber_air_bersih", e.target.value)}
              options={[
                { value: "PDAM", label: "PDAM" },
                { value: "Sumur", label: "Sumur" },
                { value: "Mata Air", label: "Mata Air" },
                { value: "Lainnya", label: "Lainnya" },
              ]}
            />
          </div>

          {/* 10. Catatan Sekolah */}
          <div className="border rounded-lg p-4 space-y-3">
            <h4 className="font-semibold text-sm text-gray-800">10. Catatan Sekolah</h4>
            <Textarea
              id="catatan_sekolah"
              value={form.catatan_sekolah}
              onChange={(e) => updateForm("catatan_sekolah", e.target.value)}
              placeholder="Catatan tambahan dari sekolah..."
              rows={3}
            />
          </div>

          {/* 11. Lampiran */}
          <div className="border rounded-lg p-4 space-y-3">
            <h4 className="font-semibold text-sm text-gray-800">11. Lampiran</h4>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => {
                  const name = prompt("Nama file lampiran:");
                  if (name) {
                    updateForm("lampiran", [...form.lampiran, name]);
                  }
                }}
                className="px-4 py-2 border-2 border-dashed border-gray-300 rounded-lg text-sm text-gray-500 hover:border-blue-400 hover:text-blue-500 transition-colors"
              >
                + Tambah Lampiran
              </button>
            </div>
            {form.lampiran.length > 0 && (
              <ul className="space-y-1">
                {form.lampiran.map((file, idx) => (
                  <li key={idx} className="flex items-center justify-between text-sm text-gray-700 bg-gray-50 px-3 py-1.5 rounded">
                    <div className="flex items-center gap-2">
                      <Download className="w-3.5 h-3.5 text-blue-500" />
                      {file}
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        const updated = form.lampiran.filter((_, i) => i !== idx);
                        updateForm("lampiran", updated);
                      }}
                      className="p-1 text-red-500 hover:bg-red-50 rounded"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Catatan Umum */}
          <div>
            <Textarea
              label="Catatan Umum"
              id="catatan"
              value={form.catatan}
              onChange={(e) => updateForm("catatan", e.target.value)}
              placeholder="Catatan untuk laporan ini..."
              rows={2}
            />
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button variant="outline" onClick={() => setModalOpen(false)}>Batal</Button>
            <Button onClick={handleSave}>
              {editingId ? "Simpan Perubahan" : "Simpan"}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Modal Lihat Detail */}
      <Modal
        open={!!viewing}
        onClose={() => setViewing(null)}
        title="Detail Laporan Bulanan"
        size="xl"
      >
        {viewing && (
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <DetailField label="Sekolah" value={getSekolahNama(viewing.sekolah_id)} />
              <DetailField label="Bulan" value={getBulanName(viewing.bulan)} />
              <DetailField label="Tahun Pelajaran" value={viewing.tahun_pelajaran} />
              <DetailField
                label="Status"
                value={
                  <Badge variant={statusBadge[viewing.status].variant} className={statusBadge[viewing.status].className}>
                    {statusLabel[viewing.status]}
                  </Badge>
                }
              />
              <DetailField label="Tanggal Dibuat" value={formatDate(viewing.tanggal_dibuat)} />
              <DetailField label="Catatan" value={viewing.catatan || "-"} />
            </div>

            {/* Data Sekolah */}
            <div className="border rounded-lg p-4">
              <h4 className="font-semibold text-sm text-gray-800 mb-2">Data Sekolah</h4>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <DetailField label="Nama Sekolah" value={getSekolahData(viewing.sekolah_id)?.nama || "-"} />
                <DetailField label="NPSN" value={getSekolahData(viewing.sekolah_id)?.npsn || "-"} />
                <DetailField label="Alamat" value={getSekolahData(viewing.sekolah_id)?.alamat || "-"} />
                <DetailField label="Kepala Sekolah" value={getSekolahData(viewing.sekolah_id)?.kepala_sekolah || "-"} />
              </div>
            </div>

            {/* Jumlah Siswa */}
            <div className="border rounded-lg p-4">
              <h4 className="font-semibold text-sm text-gray-800 mb-2">Jumlah Siswa per Kelas</h4>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200 text-sm">
                  <thead>
                    <tr>
                      <th className="px-3 py-2 text-left text-xs font-semibold text-gray-600">Kelas</th>
                      <th className="px-3 py-2 text-center text-xs font-semibold text-gray-600">L</th>
                      <th className="px-3 py-2 text-center text-xs font-semibold text-gray-600">P</th>
                      <th className="px-3 py-2 text-center text-xs font-semibold text-gray-600">Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {kelasOptions.map((k) => {
                      const js = viewing.jumlah_siswa[k] || { L: 0, P: 0 };
                      return (
                        <tr key={k}>
                          <td className="px-3 py-2 font-medium">Kelas {k}</td>
                          <td className="px-3 py-2 text-center">{js.L}</td>
                          <td className="px-3 py-2 text-center">{js.P}</td>
                          <td className="px-3 py-2 text-center font-semibold">{js.L + js.P}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Ringkasan Data */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="border rounded-lg p-4">
                <h4 className="font-semibold text-sm text-gray-800 mb-2">Siswa Masuk, Keluar, Mutasi</h4>
                <div className="space-y-1 text-sm">
                  <DetailField label="Masuk" value={viewing.siswa_masuk} />
                  <DetailField label="Keluar" value={viewing.siswa_keluar} />
                  <DetailField label="Mutasi" value={viewing.siswa_mutasi} />
                </div>
              </div>
              <div className="border rounded-lg p-4">
                <h4 className="font-semibold text-sm text-gray-800 mb-2">Guru dan Tendik</h4>
                <div className="space-y-1 text-sm">
                  <DetailField label="Jumlah Guru" value={viewing.jumlah_guru} />
                  <DetailField label="Jumlah Tendik" value={viewing.jumlah_tendik} />
                </div>
              </div>
            </div>

            {/* Kehadiran */}
            <div className="border rounded-lg p-4">
              <h4 className="font-semibold text-sm text-gray-800 mb-2">Kehadiran Siswa</h4>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <DetailField label="Hadir" value={viewing.kehadiran_hadir} />
                <DetailField label="Sakit" value={viewing.kehadiran_sakit} />
                <DetailField label="Izin" value={viewing.kehadiran_izin} />
                <DetailField label="Alpha" value={viewing.kehadiran_alpha} />
              </div>
            </div>

            {/* Teks Fields */}
            <div className="grid grid-cols-1 gap-4">
              <DetailField label="Kondisi Ruangan" value={viewing.kondisi_ruangan || "-"} />
              <DetailField label="Sarana dan Prasarana" value={viewing.sarana_prasarana || "-"} />
              <DetailField label="Meubelair" value={viewing.meubelair || "-"} />
              <DetailField label="Sumber Air Bersih" value={viewing.sumber_air_bersih || "-"} />
              <DetailField label="Catatan Sekolah" value={viewing.catatan_sekolah || "-"} />
            </div>

            {/* Lampiran */}
            {viewing.lampiran.length > 0 && (
              <div className="border rounded-lg p-4">
                <h4 className="font-semibold text-sm text-gray-800 mb-2">Lampiran</h4>
                <ul className="space-y-1">
                  {viewing.lampiran.map((file, idx) => (
                    <li key={idx} className="flex items-center gap-2 text-sm text-blue-600">
                      <Download className="w-3.5 h-3.5" />
                      {file}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Status Change Buttons */}
            <div className="flex flex-wrap items-center gap-3 pt-4 border-t">
              {viewing.status === "draft" && (
                <Button
                  onClick={() => handleStatusChange(viewing, "dikirim")}
                >
                  <Send className="w-4 h-4 mr-2" />
                  Kirim
                </Button>
              )}
              {(viewing.status === "menunggu_verifikasi" || viewing.status === "dikirim") && (
                <Button
                  onClick={() => handleStatusChange(viewing, "perlu_perbaikan")}
                  variant="outline"
                >
                  <AlertCircle className="w-4 h-4 mr-2" />
                  Minta Perbaikan
                </Button>
              )}
              {(viewing.status === "menunggu_verifikasi" || viewing.status === "dikirim") && (
                <Button
                  onClick={() => handleStatusChange(viewing, "terverifikasi")}
                  variant="primary"
                >
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Verifikasi
                </Button>
              )}
              {viewing.status !== "draft" && (
                <Button
                  variant="outline"
                  onClick={() => handleCetak(viewing)}
                >
                  <Printer className="w-4 h-4 mr-2" />
                  Cetak
                </Button>
              )}
            </div>
          </div>
        )}
      </Modal>

      {/* Modal Confirm Delete */}
      <Modal
        open={!!confirmDelete}
        onClose={() => setConfirmDelete(null)}
        title="Konfirmasi Hapus"
        size="sm"
      >
        <p className="text-sm text-gray-600">
          Apakah Anda yakin ingin menghapus laporan ini? Tindakan ini tidak dapat dibatalkan.
        </p>
        <div className="flex justify-end gap-3 mt-6">
          <Button variant="outline" onClick={() => setConfirmDelete(null)}>Batal</Button>
          <Button variant="danger" onClick={handleDelete}>Hapus</Button>
        </div>
      </Modal>
    </div>
  );
}

function DetailField({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <span className="block text-xs font-medium text-gray-500 mb-0.5">{label}</span>
      <div className="text-sm text-gray-800">{value}</div>
    </div>
  );
}
