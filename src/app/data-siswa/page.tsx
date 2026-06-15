"use client";

import { useState, useMemo } from "react";
import { useSession } from "next-auth/react";
import {
  Users,
  Plus,
  Upload,
  FileDown,
  Printer,
  Eye,
  Pencil,
  Trash2,
  Search,
  GraduationCap,
  ClipboardCheck,
  BarChart3,
} from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { DataTable } from "@/components/ui/Table";
import { Modal } from "@/components/ui/Modal";
import { Badge } from "@/components/ui/Badge";
import { Input, Select, Textarea } from "@/components/ui/Input";
import Button from "@/components/ui/Button";
import { Loading } from "@/components/ui/Loading";
import { EmptyState } from "@/components/ui/EmptyState";
import { formatDate } from "@/lib/utils";
import type { ColumnDef } from "@tanstack/react-table";

type JenisKelamin = "L" | "P";
type StatusSiswa = "aktif" | "keluar" | "lulus" | "mutasi";
type Agama = "Islam" | "Kristen" | "Katolik" | "Hindu" | "Buddha" | "Khonghucu";
type Kelas = "I" | "II" | "III" | "IV" | "V" | "VI";

interface Siswa {
  id: string;
  nik: string;
  nisn: string;
  nama_lengkap: string;
  jenis_kelamin: JenisKelamin;
  tempat_lahir: string;
  tanggal_lahir: string;
  agama: Agama;
  alamat: string;
  nama_ayah: string;
  nama_ibu: string;
  nomor_kk: string;
  kelas: Kelas;
  rombel: string;
  sekolah_id: string;
  tahun_pelajaran: string;
  status_siswa: StatusSiswa;
  tanggal_masuk: string;
  asal_sekolah: string;
  kebutuhan_khusus: string;
  kontak_orang_tua: string;
}

interface SekolahOption {
  id: string;
  nama: string;
}

const sekolahList: SekolahOption[] = [
  { id: "1", nama: "SD Negeri 1 Lemahabang" },
  { id: "2", nama: "SD Negeri 2 Lemahabang" },
  { id: "3", nama: "SD Negeri 3 Lemahabang" },
  { id: "4", nama: "SD Negeri 4 Lemahabang" },
  { id: "5", nama: "MI Al-Ihsan Lemahabang" },
  { id: "6", nama: "SD IT Bina Cendekia" },
];

const kelasOptions: Kelas[] = ["I", "II", "III", "IV", "V", "VI"];

const initialData: Siswa[] = [
  {
    id: "1", nik: "3209124509120001", nisn: "0098765431",
    nama_lengkap: "Ahmad Fauzi", jenis_kelamin: "L",
    tempat_lahir: "Cirebon", tanggal_lahir: "2014-05-12",
    agama: "Islam", alamat: "Jl. Merdeka No. 10, Lemahabang",
    nama_ayah: "Supriyanto", nama_ibu: "Siti Aminah", nomor_kk: "3209121234560001",
    kelas: "VI", rombel: "A", sekolah_id: "1",
    tahun_pelajaran: "2025/2026", status_siswa: "aktif",
    tanggal_masuk: "2020-07-15", asal_sekolah: "-",
    kebutuhan_khusus: "Tidak", kontak_orang_tua: "081234567001",
  },
  {
    id: "2", nik: "3209124509120002", nisn: "0098765432",
    nama_lengkap: "Siti Nurhaliza", jenis_kelamin: "P",
    tempat_lahir: "Cirebon", tanggal_lahir: "2015-02-20",
    agama: "Islam", alamat: "Jl. Diponegoro No. 22, Lemahabang",
    nama_ayah: "Hasan Basri", nama_ibu: "Fatimah", nomor_kk: "3209121234560002",
    kelas: "VI", rombel: "A", sekolah_id: "1",
    tahun_pelajaran: "2025/2026", status_siswa: "aktif",
    tanggal_masuk: "2020-07-15", asal_sekolah: "TK Pertiwi Lemahabang",
    kebutuhan_khusus: "Tidak", kontak_orang_tua: "081234567002",
  },
  {
    id: "3", nik: "3209124509120003", nisn: "0098765433",
    nama_lengkap: "Budi Santoso", jenis_kelamin: "L",
    tempat_lahir: "Cirebon", tanggal_lahir: "2016-08-10",
    agama: "Islam", alamat: "Jl. Pahlawan No. 5, Sigong",
    nama_ayah: "Wahyu Hidayat", nama_ibu: "Dewi Sartika", nomor_kk: "3209121234560003",
    kelas: "V", rombel: "A", sekolah_id: "2",
    tahun_pelajaran: "2025/2026", status_siswa: "aktif",
    tanggal_masuk: "2021-07-12", asal_sekolah: "TK Harapan Bangsa",
    kebutuhan_khusus: "Tidak", kontak_orang_tua: "081234567003",
  },
  {
    id: "4", nik: "3209124509120004", nisn: "0098765434",
    nama_lengkap: "Dian Permata", jenis_kelamin: "P",
    tempat_lahir: "Jakarta", tanggal_lahir: "2016-11-25",
    agama: "Islam", alamat: "Jl. Raya Sigong No. 8, Sigong",
    nama_ayah: "Agus Salim", nama_ibu: "Nurlela", nomor_kk: "3209121234560004",
    kelas: "V", rombel: "B", sekolah_id: "2",
    tahun_pelajaran: "2025/2026", status_siswa: "aktif",
    tanggal_masuk: "2021-07-12", asal_sekolah: "TK Al-Hidayah",
    kebutuhan_khusus: "Tidak", kontak_orang_tua: "081234567004",
  },
  {
    id: "5", nik: "3209124509120005", nisn: "0098765435",
    nama_lengkap: "Eko Prasetyo", jenis_kelamin: "L",
    tempat_lahir: "Cirebon", tanggal_lahir: "2017-03-18",
    agama: "Islam", alamat: "Jl. Cipta Karya No. 3, Sindanglaut",
    nama_ayah: "Slamet Riyadi", nama_ibu: "Sri Wahyuni", nomor_kk: "3209121234560005",
    kelas: "IV", rombel: "A", sekolah_id: "1",
    tahun_pelajaran: "2025/2026", status_siswa: "aktif",
    tanggal_masuk: "2022-07-14", asal_sekolah: "TK Tunas Bangsa",
    kebutuhan_khusus: "Tidak", kontak_orang_tua: "081234567005",
  },
  {
    id: "6", nik: "3209124509120006", nisn: "0098765436",
    nama_lengkap: "Fitri Handayani", jenis_kelamin: "P",
    tempat_lahir: "Cirebon", tanggal_lahir: "2017-07-22",
    agama: "Islam", alamat: "Jl. Merdeka No. 15, Lemahabang",
    nama_ayah: "Mulyadi", nama_ibu: "Rohimah", nomor_kk: "3209121234560006",
    kelas: "IV", rombel: "A", sekolah_id: "1",
    tahun_pelajaran: "2025/2026", status_siswa: "aktif",
    tanggal_masuk: "2022-07-14", asal_sekolah: "TK Pertiwi Lemahabang",
    kebutuhan_khusus: "Tidak", kontak_orang_tua: "081234567006",
  },
  {
    id: "7", nik: "3209124509120007", nisn: "0098765437",
    nama_lengkap: "Gilang Ramadan", jenis_kelamin: "L",
    tempat_lahir: "Cirebon", tanggal_lahir: "2018-01-05",
    agama: "Islam", alamat: "Jl. Diponegoro No. 30, Lemahabang",
    nama_ayah: "Rudi Hartono", nama_ibu: "Yuniarti", nomor_kk: "3209121234560007",
    kelas: "III", rombel: "A", sekolah_id: "3",
    tahun_pelajaran: "2025/2026", status_siswa: "aktif",
    tanggal_masuk: "2023-07-13", asal_sekolah: "TK Pembina",
    kebutuhan_khusus: "Tidak", kontak_orang_tua: "081234567007",
  },
  {
    id: "8", nik: "3209124509120008", nisn: "0098765438",
    nama_lengkap: "Heni Rahmawati", jenis_kelamin: "P",
    tempat_lahir: "Cirebon", tanggal_lahir: "2018-06-14",
    agama: "Islam", alamat: "Jl. Pahlawan No. 12, Astana",
    nama_ayah: "Dede Kurniawan", nama_ibu: "Euis Siti", nomor_kk: "3209121234560008",
    kelas: "III", rombel: "B", sekolah_id: "3",
    tahun_pelajaran: "2025/2026", status_siswa: "aktif",
    tanggal_masuk: "2023-07-13", asal_sekolah: "TK Al-Ikhlas",
    kebutuhan_khusus: "Tidak", kontak_orang_tua: "081234567008",
  },
  {
    id: "9", nik: "3209124509120009", nisn: "0098765439",
    nama_lengkap: "Indra Lesmana", jenis_kelamin: "L",
    tempat_lahir: "Cirebon", tanggal_lahir: "2019-09-30",
    agama: "Islam", alamat: "Jl. Raya Lemahabang No. 50, Lemahabang",
    nama_ayah: "Aep Saepullah", nama_ibu: "Iis Ismayati", nomor_kk: "3209121234560009",
    kelas: "II", rombel: "A", sekolah_id: "1",
    tahun_pelajaran: "2025/2026", status_siswa: "aktif",
    tanggal_masuk: "2024-07-17", asal_sekolah: "TK Pertiwi Lemahabang",
    kebutuhan_khusus: "Tidak", kontak_orang_tua: "081234567009",
  },
  {
    id: "10", nik: "3209124509120010", nisn: "0098765440",
    nama_lengkap: "Juwita Sari", jenis_kelamin: "P",
    tempat_lahir: "Cirebon", tanggal_lahir: "2019-12-15",
    agama: "Islam", alamat: "Jl. Cipta Karya No. 1, Sindanglaut",
    nama_ayah: "Taufik Hidayat", nama_ibu: "Rina Marlina", nomor_kk: "3209121234560010",
    kelas: "II", rombel: "A", sekolah_id: "1",
    tahun_pelajaran: "2025/2026", status_siswa: "aktif",
    tanggal_masuk: "2024-07-17", asal_sekolah: "TK Tunas Bangsa",
    kebutuhan_khusus: "Tidak", kontak_orang_tua: "081234567010",
  },
  {
    id: "11", nik: "3209124509120011", nisn: "0098765441",
    nama_lengkap: "Krisna Aditya", jenis_kelamin: "L",
    tempat_lahir: "Cirebon", tanggal_lahir: "2020-04-20",
    agama: "Hindu", alamat: "Jl. Sigong Indah No. 7, Sigong",
    nama_ayah: "I Wayan Sudarma", nama_ibu: "Ni Luh Putu", nomor_kk: "3209121234560011",
    kelas: "I", rombel: "A", sekolah_id: "5",
    tahun_pelajaran: "2025/2026", status_siswa: "aktif",
    tanggal_masuk: "2025-07-16", asal_sekolah: "TK Kumara Sari",
    kebutuhan_khusus: "Tidak", kontak_orang_tua: "081234567011",
  },
  {
    id: "12", nik: "3209124509120012", nisn: "0098765442",
    nama_lengkap: "Lina Marlina", jenis_kelamin: "P",
    tempat_lahir: "Cirebon", tanggal_lahir: "2013-08-08",
    agama: "Islam", alamat: "Jl. Merdeka No. 33, Lemahabang",
    nama_ayah: "H. Ahmad Rifai", nama_ibu: "Hj. Siti Sarah", nomor_kk: "3209121234560012",
    kelas: "VI", rombel: "A", sekolah_id: "1",
    tahun_pelajaran: "2025/2026", status_siswa: "lulus",
    tanggal_masuk: "2019-07-15", asal_sekolah: "TK Pertiwi Lemahabang",
    kebutuhan_khusus: "Tidak", kontak_orang_tua: "081234567012",
  },
  {
    id: "13", nik: "3209124509120013", nisn: "0098765443",
    nama_lengkap: "Mochammad Rizky", jenis_kelamin: "L",
    tempat_lahir: "Cirebon", tanggal_lahir: "2014-11-02",
    agama: "Islam", alamat: "Jl. Diponegoro No. 18, Lemahabang",
    nama_ayah: "H. Rahmat Hidayat", nama_ibu: "Nurjanah", nomor_kk: "3209121234560013",
    kelas: "V", rombel: "B", sekolah_id: "2",
    tahun_pelajaran: "2025/2026", status_siswa: "keluar",
    tanggal_masuk: "2021-07-12", asal_sekolah: "TK Harapan Bangsa",
    kebutuhan_khusus: "Tidak", kontak_orang_tua: "081234567013",
  },
  {
    id: "14", nik: "3209124509120014", nisn: "0098765444",
    nama_lengkap: "Nadia Putri", jenis_kelamin: "P",
    tempat_lahir: "Jakarta", tanggal_lahir: "2017-10-18",
    agama: "Kristen", alamat: "Jl. Cipta Karya No. 5, Sindanglaut",
    nama_ayah: "Andreas Wijaya", nama_ibu: "Maria Oktaviani", nomor_kk: "3209121234560014",
    kelas: "III", rombel: "A", sekolah_id: "4",
    tahun_pelajaran: "2025/2026", status_siswa: "mutasi",
    tanggal_masuk: "2023-07-13", asal_sekolah: "TK Kristen Kalam Kudus",
    kebutuhan_khusus: "Tidak", kontak_orang_tua: "081234567014",
  },
];

const defaultForm: Siswa = {
  id: "",
  nik: "",
  nisn: "",
  nama_lengkap: "",
  jenis_kelamin: "L",
  tempat_lahir: "",
  tanggal_lahir: "",
  agama: "Islam",
  alamat: "",
  nama_ayah: "",
  nama_ibu: "",
  nomor_kk: "",
  kelas: "I",
  rombel: "",
  sekolah_id: "",
  tahun_pelajaran: "2025/2026",
  status_siswa: "aktif",
  tanggal_masuk: "",
  asal_sekolah: "",
  kebutuhan_khusus: "Tidak",
  kontak_orang_tua: "",
};

const statusBadge: Record<StatusSiswa, { variant: "success" | "warning" | "info" | "default"; label: string }> = {
  aktif: { variant: "success", label: "Aktif" },
  keluar: { variant: "warning", label: "Keluar" },
  lulus: { variant: "info", label: "Lulus" },
  mutasi: { variant: "default", label: "Mutasi" },
};

export default function DataSiswaPage() {
  const { data: session } = useSession();

  const [data, setData] = useState<Siswa[]>(initialData);
  const [loading, setLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<Siswa>(defaultForm);
  const [viewing, setViewing] = useState<Siswa | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const [showRekap, setShowRekap] = useState(false);
  const [search, setSearch] = useState("");
  const [filterSekolah, setFilterSekolah] = useState("");
  const [filterKelas, setFilterKelas] = useState("");
  const [filterStatusSiswa, setFilterStatusSiswa] = useState("");

  const filteredData = useMemo(() => {
    let result = data;
    if (search) {
      const q = search.toLowerCase();
      result = result.filter(
        (s) => s.nik.toLowerCase().includes(q) || s.nisn.toLowerCase().includes(q)
      );
    }
    if (filterSekolah) {
      result = result.filter((s) => s.sekolah_id === filterSekolah);
    }
    if (filterKelas) {
      result = result.filter((s) => s.kelas === filterKelas);
    }
    if (filterStatusSiswa) {
      result = result.filter((s) => s.status_siswa === filterStatusSiswa);
    }
    return result;
  }, [data, search, filterSekolah, filterKelas, filterStatusSiswa]);

  const rekapData = useMemo(() => {
    const perKelas: Record<string, { L: number; P: number; total: number }> = {};
    for (const k of kelasOptions) {
      perKelas[k] = { L: 0, P: 0, total: 0 };
    }
    for (const s of data) {
      if (s.status_siswa === "aktif" && perKelas[s.kelas]) {
        perKelas[s.kelas][s.jenis_kelamin]++;
        perKelas[s.kelas].total++;
      }
    }
    return perKelas;
  }, [data]);

  const columns: ColumnDef<Siswa>[] = [
    {
      header: "No",
      id: "no",
      cell: ({ row }) => row.index + 1,
    },
    { header: "NIK", accessorKey: "nik" },
    { header: "NISN", accessorKey: "nisn" },
    { header: "Nama Lengkap", accessorKey: "nama_lengkap" },
    {
      header: "Jenis Kelamin",
      accessorKey: "jenis_kelamin",
      cell: ({ row }) => (row.original.jenis_kelamin === "L" ? "Laki-laki" : "Perempuan"),
    },
    { header: "Kelas", accessorKey: "kelas" },
    { header: "Rombel", accessorKey: "rombel" },
    {
      header: "Sekolah",
      accessorKey: "sekolah_id",
      cell: ({ row }) => {
        const sekolah = sekolahList.find((s) => s.id === row.original.sekolah_id);
        return sekolah?.nama || "-";
      },
    },
    {
      header: "Status",
      accessorKey: "status_siswa",
      cell: ({ row }) => {
        const sb = statusBadge[row.original.status_siswa];
        return <Badge variant={sb.variant}>{sb.label}</Badge>;
      },
    },
    {
      header: "Aksi",
      id: "aksi",
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
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
    setForm(defaultForm);
    setModalOpen(true);
  }

  function handleEdit(siswa: Siswa) {
    setEditingId(siswa.id);
    setForm(siswa);
    setModalOpen(true);
  }

  function handleDelete() {
    if (!confirmDelete) return;
    setData((prev) => prev.filter((s) => s.id !== confirmDelete));
    setConfirmDelete(null);
  }

  function handleSave() {
    if (editingId) {
      setData((prev) =>
        prev.map((s) => (s.id === editingId ? { ...form, id: editingId } : s))
      );
    } else {
      const newId = String(Date.now());
      setData((prev) => [...prev, { ...form, id: newId }]);
    }
    setModalOpen(false);
  }

  function updateForm(key: keyof Siswa, value: string) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  if (loading) return <Loading message="Memuat data siswa..." />;

  const totalAktif = data.filter((s) => s.status_siswa === "aktif").length;

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="max-w-7xl mx-auto px-4 py-6 space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-blue-50 text-blue-600">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Data Siswa</h1>
              <p className="text-sm text-gray-500 mt-0.5">Kecamatan Lemahabang</p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Button onClick={openAddModal}>
              <Plus className="w-4 h-4 mr-2" />
              Tambah Siswa
            </Button>
            <Button variant="outline">
              <Upload className="w-4 h-4 mr-2" />
              Import Excel
            </Button>
            <Button variant="outline">
              <FileDown className="w-4 h-4 mr-2" />
              Export Excel
            </Button>
            <Button variant="outline">
              <Printer className="w-4 h-4 mr-2" />
              Cetak PDF
            </Button>
          </div>
        </div>

        {/* Filter */}
        <Card>
          <div className="flex flex-wrap items-center gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Cari NIK/NISN..."
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
              value={filterKelas}
              onChange={(e) => setFilterKelas(e.target.value)}
              className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Semua Kelas</option>
              {kelasOptions.map((k) => (
                <option key={k} value={k}>Kelas {k}</option>
              ))}
            </select>
            <select
              value={filterStatusSiswa}
              onChange={(e) => setFilterStatusSiswa(e.target.value)}
              className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Semua Status</option>
              <option value="aktif">Aktif</option>
              <option value="keluar">Keluar</option>
              <option value="lulus">Lulus</option>
              <option value="mutasi">Mutasi</option>
            </select>
          </div>
        </Card>

        {/* Table */}
        <Card>
          <CardContent>
            {filteredData.length === 0 ? (
              <EmptyState
                title="Belum ada data siswa"
                message="Klik tombol Tambah Siswa untuk menambahkan data."
                icon={<Users className="w-12 h-12 text-gray-300" />}
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

        {/* Special Features */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Fitur Khusus</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-3">
                <Button variant="outline" className="gap-2">
                  <GraduationCap className="w-4 h-4" />
                  Kenaikan Kelas Massal
                </Button>
                <Button variant="outline" className="gap-2">
                  <ClipboardCheck className="w-4 h-4" />
                  Kelulusan Massal
                </Button>
                <Button
                  variant="outline"
                  className="gap-2"
                  onClick={() => setShowRekap(!showRekap)}
                >
                  <BarChart3 className="w-4 h-4" />
                  Rekap Siswa
                </Button>
              </div>
            </CardContent>
          </Card>

          {showRekap && (
            <Card>
              <CardHeader>
                <CardTitle>Rekap Siswa Aktif per Kelas</CardTitle>
                <span className="text-sm text-gray-500">Total: {totalAktif} siswa</span>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-2 text-left text-xs font-semibold text-gray-600 uppercase">Kelas</th>
                        <th className="px-4 py-2 text-center text-xs font-semibold text-gray-600 uppercase">L</th>
                        <th className="px-4 py-2 text-center text-xs font-semibold text-gray-600 uppercase">P</th>
                        <th className="px-4 py-2 text-center text-xs font-semibold text-gray-600 uppercase">Total</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {kelasOptions.map((k) => (
                        <tr key={k} className="hover:bg-gray-50">
                          <td className="px-4 py-2 text-sm font-medium text-gray-800">Kelas {k}</td>
                          <td className="px-4 py-2 text-sm text-center text-gray-600">{rekapData[k].L}</td>
                          <td className="px-4 py-2 text-sm text-center text-gray-600">{rekapData[k].P}</td>
                          <td className="px-4 py-2 text-sm text-center font-semibold text-gray-800">{rekapData[k].total}</td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot className="bg-gray-50 font-semibold">
                      <tr>
                        <td className="px-4 py-2 text-sm text-gray-800">Total</td>
                        <td className="px-4 py-2 text-sm text-center text-gray-800">
                          {kelasOptions.reduce((a, k) => a + rekapData[k].L, 0)}
                        </td>
                        <td className="px-4 py-2 text-sm text-center text-gray-800">
                          {kelasOptions.reduce((a, k) => a + rekapData[k].P, 0)}
                        </td>
                        <td className="px-4 py-2 text-sm text-center text-gray-800">{totalAktif}</td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Modal Tambah/Edit */}
      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingId ? "Edit Data Siswa" : "Tambah Data Siswa"}
        size="xl"
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input label="NIK" id="nik" value={form.nik} onChange={(e) => updateForm("nik", e.target.value)} />
          <Input label="NISN" id="nisn" value={form.nisn} onChange={(e) => updateForm("nisn", e.target.value)} />
          <Input label="Nama Lengkap" id="nama_lengkap" value={form.nama_lengkap} onChange={(e) => updateForm("nama_lengkap", e.target.value)} />
          <Select
            label="Jenis Kelamin"
            id="jenis_kelamin"
            value={form.jenis_kelamin}
            onChange={(e) => updateForm("jenis_kelamin", e.target.value)}
            options={[
              { value: "L", label: "Laki-laki" },
              { value: "P", label: "Perempuan" },
            ]}
          />
          <Input label="Tempat Lahir" id="tempat_lahir" value={form.tempat_lahir} onChange={(e) => updateForm("tempat_lahir", e.target.value)} />
          <Input label="Tanggal Lahir" id="tanggal_lahir" type="date" value={form.tanggal_lahir} onChange={(e) => updateForm("tanggal_lahir", e.target.value)} />
          <Select
            label="Agama"
            id="agama"
            value={form.agama}
            onChange={(e) => updateForm("agama", e.target.value)}
            options={[
              { value: "Islam", label: "Islam" },
              { value: "Kristen", label: "Kristen" },
              { value: "Katolik", label: "Katolik" },
              { value: "Hindu", label: "Hindu" },
              { value: "Buddha", label: "Buddha" },
              { value: "Khonghucu", label: "Khonghucu" },
            ]}
          />
          <Input label="Nama Ayah" id="nama_ayah" value={form.nama_ayah} onChange={(e) => updateForm("nama_ayah", e.target.value)} />
          <Input label="Nama Ibu" id="nama_ibu" value={form.nama_ibu} onChange={(e) => updateForm("nama_ibu", e.target.value)} />
          <Input label="Nomor KK" id="nomor_kk" value={form.nomor_kk} onChange={(e) => updateForm("nomor_kk", e.target.value)} />
          <Select
            label="Kelas"
            id="kelas"
            value={form.kelas}
            onChange={(e) => updateForm("kelas", e.target.value)}
            options={kelasOptions.map((k) => ({ value: k, label: `Kelas ${k}` }))}
          />
          <Input label="Rombel" id="rombel" value={form.rombel} onChange={(e) => updateForm("rombel", e.target.value)} />
          <Select
            label="Sekolah"
            id="sekolah_id"
            value={form.sekolah_id}
            onChange={(e) => updateForm("sekolah_id", e.target.value)}
            options={sekolahList.map((s) => ({ value: s.id, label: s.nama }))}
          />
          <Input label="Tahun Pelajaran" id="tahun_pelajaran" value={form.tahun_pelajaran} onChange={(e) => updateForm("tahun_pelajaran", e.target.value)} />
          <Select
            label="Status Siswa"
            id="status_siswa"
            value={form.status_siswa}
            onChange={(e) => updateForm("status_siswa", e.target.value)}
            options={[
              { value: "aktif", label: "Aktif" },
              { value: "keluar", label: "Keluar" },
              { value: "lulus", label: "Lulus" },
              { value: "mutasi", label: "Mutasi" },
            ]}
          />
          <Input label="Tanggal Masuk" id="tanggal_masuk" type="date" value={form.tanggal_masuk} onChange={(e) => updateForm("tanggal_masuk", e.target.value)} />
          <Input label="Asal Sekolah" id="asal_sekolah" value={form.asal_sekolah} onChange={(e) => updateForm("asal_sekolah", e.target.value)} />
          <Input label="Kebutuhan Khusus" id="kebutuhan_khusus" value={form.kebutuhan_khusus} onChange={(e) => updateForm("kebutuhan_khusus", e.target.value)} />
          <Input label="Kontak Orang Tua" id="kontak_orang_tua" value={form.kontak_orang_tua} onChange={(e) => updateForm("kontak_orang_tua", e.target.value)} />
          <div className="md:col-span-2">
            <Textarea label="Alamat" id="alamat" value={form.alamat} onChange={(e) => updateForm("alamat", e.target.value)} rows={3} />
          </div>
        </div>
        <div className="flex justify-end gap-3 mt-6">
          <Button variant="outline" onClick={() => setModalOpen(false)}>Batal</Button>
          <Button onClick={handleSave}>{editingId ? "Simpan Perubahan" : "Simpan"}</Button>
        </div>
      </Modal>

      {/* Modal Lihat Detail */}
      <Modal
        open={!!viewing}
        onClose={() => setViewing(null)}
        title="Detail Siswa"
        size="xl"
      >
        {viewing && (
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <DetailField label="NIK" value={viewing.nik} />
              <DetailField label="NISN" value={viewing.nisn} />
              <DetailField label="Nama Lengkap" value={viewing.nama_lengkap} />
              <DetailField
                label="Jenis Kelamin"
                value={viewing.jenis_kelamin === "L" ? "Laki-laki" : "Perempuan"}
              />
              <DetailField label="Tempat Lahir" value={viewing.tempat_lahir} />
              <DetailField label="Tanggal Lahir" value={formatDate(viewing.tanggal_lahir)} />
              <DetailField label="Agama" value={viewing.agama} />
              <DetailField label="Nama Ayah" value={viewing.nama_ayah} />
              <DetailField label="Nama Ibu" value={viewing.nama_ibu} />
              <DetailField label="Nomor KK" value={viewing.nomor_kk} />
              <DetailField label="Kelas" value={viewing.kelas} />
              <DetailField label="Rombel" value={viewing.rombel} />
              <DetailField
                label="Sekolah"
                value={sekolahList.find((s) => s.id === viewing.sekolah_id)?.nama || "-"}
              />
              <DetailField label="Tahun Pelajaran" value={viewing.tahun_pelajaran} />
              <DetailField
                label="Status Siswa"
                value={<Badge variant={statusBadge[viewing.status_siswa].variant}>{statusBadge[viewing.status_siswa].label}</Badge>}
              />
              <DetailField label="Tanggal Masuk" value={formatDate(viewing.tanggal_masuk)} />
              <DetailField label="Asal Sekolah" value={viewing.asal_sekolah || "-"} />
              <DetailField label="Kebutuhan Khusus" value={viewing.kebutuhan_khusus} />
              <DetailField label="Kontak Orang Tua" value={viewing.kontak_orang_tua} />
            </div>
            <div>
              <span className="block text-xs font-medium text-gray-500 mb-1">Alamat</span>
              <p className="text-sm text-gray-800">{viewing.alamat}</p>
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
          Apakah Anda yakin ingin menghapus data siswa ini? Tindakan ini tidak dapat dibatalkan.
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
