"use client";

import { useState, useMemo } from "react";
import { useSession } from "next-auth/react";
import {
  GraduationCap,
  Plus,
  Eye,
  Pencil,
  Trash2,
  Search,
  Award,
  Clock,
  AlertTriangle,
  Users,
} from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { DataTable } from "@/components/ui/Table";
import { Modal } from "@/components/ui/Modal";
import { Badge } from "@/components/ui/Badge";
import { Input, Select } from "@/components/ui/Input";
import Button from "@/components/ui/Button";
import { Loading } from "@/components/ui/Loading";
import { EmptyState } from "@/components/ui/EmptyState";
import { formatDate } from "@/lib/utils";
import type { ColumnDef } from "@tanstack/react-table";

type JenisKelamin = "L" | "P";
type StatusPegawai = "PNS" | "PPPK" | "PPPK Paruh Waktu" | "Honorer" | "GTT" | "GTY" | "Tenaga Kependidikan";
type JenisGTK = "Kepala Sekolah" | "Guru" | "Tenaga Kependidikan";
type StatusAktif = "aktif" | "nonaktif";

interface GTK {
  id: string;
  nik: string;
  nip: string;
  nuptk: string;
  nama: string;
  jenis_kelamin: JenisKelamin;
  tempat_lahir: string;
  tanggal_lahir: string;
  status_pegawai: StatusPegawai;
  jabatan: string;
  jenis_gtk: JenisGTK;
  sekolah_id: string;
  pangkat_golongan: string;
  pendidikan_terakhir: string;
  sertifikasi: boolean;
  nrg: string;
  masa_kerja: number;
  tmt: string;
  nomor_sk: string;
  bup: string;
  kontak: string;
  status_aktif: StatusAktif;
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

const statusPegawaiOptions: StatusPegawai[] = [
  "PNS",
  "PPPK",
  "PPPK Paruh Waktu",
  "Honorer",
  "GTT",
  "GTY",
  "Tenaga Kependidikan",
];

const jenisGtkOptions: JenisGTK[] = ["Kepala Sekolah", "Guru", "Tenaga Kependidikan"];

const pendidikanOptions = [
  "SMA/Sederajat",
  "D1",
  "D2",
  "D3",
  "D4",
  "S1",
  "S2",
  "S3",
];

const initialData: GTK[] = [
  {
    id: "1", nik: "3209124509120101", nip: "198705102010011001", nuptk: "1234567890",
    nama: "Dr. H. Ahmad Syarifudin, M.Pd.", jenis_kelamin: "L",
    tempat_lahir: "Cirebon", tanggal_lahir: "1985-05-10",
    status_pegawai: "PNS", jabatan: "Kepala Sekolah", jenis_gtk: "Kepala Sekolah",
    sekolah_id: "1", pangkat_golongan: "IV/a", pendidikan_terakhir: "S2",
    sertifikasi: true, nrg: "NRG001", masa_kerja: 18, tmt: "2005-07-01",
    nomor_sk: "SK.001/V/2025", bup: "2040-05-10", kontak: "081234567101", status_aktif: "aktif",
  },
  {
    id: "2", nik: "3209124509120102", nip: "199003102014112002", nuptk: "2345678901",
    nama: "Dra. Siti Khodijah, M.Si.", jenis_kelamin: "P",
    tempat_lahir: "Cirebon", tanggal_lahir: "1990-03-10",
    status_pegawai: "PNS", jabatan: "Guru Kelas", jenis_gtk: "Guru",
    sekolah_id: "1", pangkat_golongan: "III/d", pendidikan_terakhir: "S2",
    sertifikasi: true, nrg: "NRG002", masa_kerja: 12, tmt: "2012-07-01",
    nomor_sk: "SK.002/V/2025", bup: "2045-03-10", kontak: "081234567102", status_aktif: "aktif",
  },
  {
    id: "3", nik: "3209124509120103", nip: "199208152019031003", nuptk: "3456789012",
    nama: "Rudi Hartono, S.Pd.", jenis_kelamin: "L",
    tempat_lahir: "Cirebon", tanggal_lahir: "1992-08-15",
    status_pegawai: "PPPK", jabatan: "Guru PJOK", jenis_gtk: "Guru",
    sekolah_id: "1", pangkat_golongan: "IX", pendidikan_terakhir: "S1",
    sertifikasi: true, nrg: "NRG003", masa_kerja: 6, tmt: "2019-03-01",
    nomor_sk: "SK.003/V/2025", bup: "2047-08-15", kontak: "081234567103", status_aktif: "aktif",
  },
  {
    id: "4", nik: "3209124509120104", nip: "", nuptk: "4567890123",
    nama: "Nurhayati, S.Pd.I.", jenis_kelamin: "P",
    tempat_lahir: "Cirebon", tanggal_lahir: "1995-01-20",
    status_pegawai: "PPPK Paruh Waktu", jabatan: "Guru PAI", jenis_gtk: "Guru",
    sekolah_id: "2", pangkat_golongan: "-", pendidikan_terakhir: "S1",
    sertifikasi: false, nrg: "", masa_kerja: 3, tmt: "2022-01-01",
    nomor_sk: "SK.004/V/2025", bup: "", kontak: "081234567104", status_aktif: "aktif",
  },
  {
    id: "5", nik: "3209124509120105", nip: "", nuptk: "5678901234",
    nama: "Asep Saepullah, S.Pd.", jenis_kelamin: "L",
    tempat_lahir: "Cirebon", tanggal_lahir: "1993-11-25",
    status_pegawai: "Honorer", jabatan: "Guru Kelas", jenis_gtk: "Guru",
    sekolah_id: "2", pangkat_golongan: "-", pendidikan_terakhir: "S1",
    sertifikasi: false, nrg: "", masa_kerja: 4, tmt: "2020-07-15",
    nomor_sk: "SK.005/V/2025", bup: "", kontak: "081234567105", status_aktif: "aktif",
  },
  {
    id: "6", nik: "3209124509120106", nip: "197806152008011004", nuptk: "6789012345",
    nama: "Drs. H. Mulyadi, M.M.Pd.", jenis_kelamin: "L",
    tempat_lahir: "Cirebon", tanggal_lahir: "1978-06-15",
    status_pegawai: "PNS", jabatan: "Kepala Sekolah", jenis_gtk: "Kepala Sekolah",
    sekolah_id: "3", pangkat_golongan: "IV/b", pendidikan_terakhir: "S2",
    sertifikasi: true, nrg: "NRG004", masa_kerja: 20, tmt: "2004-01-01",
    nomor_sk: "SK.006/V/2025", bup: "2033-06-15", kontak: "081234567106", status_aktif: "aktif",
  },
  {
    id: "7", nik: "3209124509120107", nip: "199102172015052002", nuptk: "7890123456",
    nama: "Rina Marlina, S.Pd.", jenis_kelamin: "P",
    tempat_lahir: "Jakarta", tanggal_lahir: "1991-02-17",
    status_pegawai: "PNS", jabatan: "Guru Bahasa Inggris", jenis_gtk: "Guru",
    sekolah_id: "4", pangkat_golongan: "III/c", pendidikan_terakhir: "S1",
    sertifikasi: true, nrg: "NRG005", masa_kerja: 10, tmt: "2015-05-01",
    nomor_sk: "SK.007/V/2025", bup: "2046-02-17", kontak: "081234567107", status_aktif: "aktif",
  },
  {
    id: "8", nik: "3209124509120108", nip: "", nuptk: "8901234567",
    nama: "Dewi Sartika, A.Md.", jenis_kelamin: "P",
    tempat_lahir: "Cirebon", tanggal_lahir: "1996-09-05",
    status_pegawai: "Tenaga Kependidikan", jabatan: "Tenaga Administrasi", jenis_gtk: "Tenaga Kependidikan",
    sekolah_id: "1", pangkat_golongan: "-", pendidikan_terakhir: "D3",
    sertifikasi: false, nrg: "", masa_kerja: 3, tmt: "2021-08-01",
    nomor_sk: "SK.008/V/2025", bup: "", kontak: "081234567108", status_aktif: "aktif",
  },
  {
    id: "9", nik: "3209124509120109", nip: "198803202014112003", nuptk: "9012345678",
    nama: "Fitri Handayani, S.Pd.", jenis_kelamin: "P",
    tempat_lahir: "Cirebon", tanggal_lahir: "1988-03-20",
    status_pegawai: "GTT", jabatan: "Guru Kelas", jenis_gtk: "Guru",
    sekolah_id: "5", pangkat_golongan: "-", pendidikan_terakhir: "S1",
    sertifikasi: false, nrg: "", masa_kerja: 8, tmt: "2016-07-15",
    nomor_sk: "SK.009/V/2025", bup: "", kontak: "081234567109", status_aktif: "aktif",
  },
  {
    id: "10", nik: "3209124509120110", nip: "", nuptk: "0123456789",
    nama: "Gilang Ramadan, S.Pd.", jenis_kelamin: "L",
    tempat_lahir: "Cirebon", tanggal_lahir: "1994-12-01",
    status_pegawai: "Honorer", jabatan: "Guru Matematika", jenis_gtk: "Guru",
    sekolah_id: "6", pangkat_golongan: "-", pendidikan_terakhir: "S1",
    sertifikasi: false, nrg: "", masa_kerja: 2, tmt: "2023-07-01",
    nomor_sk: "SK.010/V/2025", bup: "", kontak: "081234567110", status_aktif: "aktif",
  },
  {
    id: "11", nik: "3209124509120111", nip: "198201152009042001", nuptk: "1122334455",
    nama: "Hj. Yuni Rahmawati, S.Pd., M.Pd.", jenis_kelamin: "P",
    tempat_lahir: "Cirebon", tanggal_lahir: "1982-01-15",
    status_pegawai: "PNS", jabatan: "Guru Kelas", jenis_gtk: "Guru",
    sekolah_id: "1", pangkat_golongan: "IV/a", pendidikan_terakhir: "S2",
    sertifikasi: true, nrg: "NRG006", masa_kerja: 16, tmt: "2009-01-01",
    nomor_sk: "SK.011/V/2025", bup: "2037-01-15", kontak: "081234567111", status_aktif: "nonaktif",
  },
  {
    id: "12", nik: "3209124509120112", nip: "", nuptk: "2233445566",
    nama: "Budi Santoso, S.Pd.", jenis_kelamin: "L",
    tempat_lahir: "Cirebon", tanggal_lahir: "1997-04-18",
    status_pegawai: "GTY", jabatan: "Guru PAI", jenis_gtk: "Guru",
    sekolah_id: "3", pangkat_golongan: "-", pendidikan_terakhir: "S1",
    sertifikasi: false, nrg: "", masa_kerja: 1, tmt: "2024-01-15",
    nomor_sk: "SK.012/V/2025", bup: "", kontak: "081234567112", status_aktif: "aktif",
  },
];

const defaultForm: GTK = {
  id: "",
  nik: "",
  nip: "",
  nuptk: "",
  nama: "",
  jenis_kelamin: "L",
  tempat_lahir: "",
  tanggal_lahir: "",
  status_pegawai: "PNS",
  jabatan: "",
  jenis_gtk: "Guru",
  sekolah_id: "",
  pangkat_golongan: "",
  pendidikan_terakhir: "S1",
  sertifikasi: false,
  nrg: "",
  masa_kerja: 0,
  tmt: "",
  nomor_sk: "",
  bup: "",
  kontak: "",
  status_aktif: "aktif",
};

export default function DataGTKPage() {
  const { data: session } = useSession();

  const [data, setData] = useState<GTK[]>(initialData);
  const [loading, setLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<GTK>(defaultForm);
  const [viewing, setViewing] = useState<GTK | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [filterSekolah, setFilterSekolah] = useState("");
  const [filterStatusPegawai, setFilterStatusPegawai] = useState("");
  const [filterJabatan, setFilterJabatan] = useState("");
  const [filterStatusAktif, setFilterStatusAktif] = useState("");

  const filteredData = useMemo(() => {
    let result = data;
    if (search) {
      const q = search.toLowerCase();
      result = result.filter(
        (g) =>
          g.nik.toLowerCase().includes(q) ||
          g.nip.toLowerCase().includes(q) ||
          g.nuptk.toLowerCase().includes(q) ||
          g.nama.toLowerCase().includes(q)
      );
    }
    if (filterSekolah) {
      result = result.filter((g) => g.sekolah_id === filterSekolah);
    }
    if (filterStatusPegawai) {
      result = result.filter((g) => g.status_pegawai === filterStatusPegawai);
    }
    if (filterJabatan) {
      result = result.filter((g) => g.jabatan.toLowerCase().includes(filterJabatan.toLowerCase()));
    }
    if (filterStatusAktif) {
      result = result.filter((g) => g.status_aktif === filterStatusAktif);
    }
    return result;
  }, [data, search, filterSekolah, filterStatusPegawai, filterJabatan, filterStatusAktif]);

  const bupData = useMemo(() => {
    return data
      .filter((g) => g.bup && g.status_aktif === "aktif")
      .sort((a, b) => new Date(a.bup).getTime() - new Date(b.bup).getTime());
  }, [data]);

  const sertifikasiData = useMemo(() => {
    const bersertifikat = data.filter((g) => g.sertifikasi).length;
    const nonSertifikat = data.filter((g) => !g.sertifikasi).length;
    return { bersertifikat, nonSertifikat };
  }, [data]);

  const analisisGuru = useMemo(() => {
    const perSekolah: Record<string, { total: number; pns: number; pppk: number; honorer: number }> = {};
    for (const s of sekolahList) {
      perSekolah[s.id] = { total: 0, pns: 0, pppk: 0, honorer: 0 };
    }
    for (const g of data) {
      if (g.status_aktif !== "aktif") continue;
      if (!perSekolah[g.sekolah_id]) continue;
      perSekolah[g.sekolah_id].total++;
      if (g.status_pegawai === "PNS") perSekolah[g.sekolah_id].pns++;
      else if (g.status_pegawai === "PPPK" || g.status_pegawai === "PPPK Paruh Waktu") perSekolah[g.sekolah_id].pppk++;
      else if (["Honorer", "GTT", "GTY"].includes(g.status_pegawai)) perSekolah[g.sekolah_id].honorer++;
    }
    return perSekolah;
  }, [data]);

  const columns: ColumnDef<GTK>[] = [
    {
      header: "No",
      id: "no",
      cell: ({ row }) => row.index + 1,
    },
    { header: "NIK", accessorKey: "nik" },
    { header: "NIP", accessorKey: "nip", cell: ({ row }) => row.original.nip || "-" },
    { header: "NUPTK", accessorKey: "nuptk" },
    { header: "Nama", accessorKey: "nama" },
    {
      header: "Jenis Kelamin",
      accessorKey: "jenis_kelamin",
      cell: ({ row }) => (row.original.jenis_kelamin === "L" ? "Laki-laki" : "Perempuan"),
    },
    { header: "Jabatan", accessorKey: "jabatan" },
    { header: "Status Pegawai", accessorKey: "status_pegawai" },
    {
      header: "Sekolah",
      accessorKey: "sekolah_id",
      cell: ({ row }) => {
        const sekolah = sekolahList.find((s) => s.id === row.original.sekolah_id);
        return sekolah?.nama || "-";
      },
    },
    {
      header: "Sertifikasi",
      accessorKey: "sertifikasi",
      cell: ({ row }) => (
        <Badge variant={row.original.sertifikasi ? "success" : "default"}>
          {row.original.sertifikasi ? "Ya" : "Tidak"}
        </Badge>
      ),
    },
    {
      header: "Status Aktif",
      accessorKey: "status_aktif",
      cell: ({ row }) => (
        <Badge variant={row.original.status_aktif === "aktif" ? "success" : "danger"}>
          {row.original.status_aktif === "aktif" ? "Aktif" : "Nonaktif"}
        </Badge>
      ),
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

  function handleEdit(gtk: GTK) {
    setEditingId(gtk.id);
    setForm(gtk);
    setModalOpen(true);
  }

  function handleDelete() {
    if (!confirmDelete) return;
    setData((prev) => prev.filter((g) => g.id !== confirmDelete));
    setConfirmDelete(null);
  }

  function handleSave() {
    if (editingId) {
      setData((prev) => prev.map((g) => (g.id === editingId ? { ...form, id: editingId } : g)));
    } else {
      const newId = String(Date.now());
      setData((prev) => [...prev, { ...form, id: newId }]);
    }
    setModalOpen(false);
  }

  function updateForm(key: keyof GTK, value: string | number | boolean) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  if (loading) return <Loading message="Memuat data GTK..." />;

  const totalAktif = data.filter((g) => g.status_aktif === "aktif").length;

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="max-w-7xl mx-auto px-4 py-6 space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-blue-50 text-blue-600">
              <GraduationCap className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Data GTK</h1>
              <p className="text-sm text-gray-500 mt-0.5">Kecamatan Lemahabang</p>
            </div>
          </div>
          <Button onClick={openAddModal}>
            <Plus className="w-4 h-4 mr-2" />
            Tambah GTK
          </Button>
        </div>

        {/* Filter */}
        <Card>
          <div className="flex flex-wrap items-center gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Cari NIK/NIP/NUPTK..."
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
              value={filterStatusPegawai}
              onChange={(e) => setFilterStatusPegawai(e.target.value)}
              className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Semua Status Pegawai</option>
              {statusPegawaiOptions.map((sp) => (
                <option key={sp} value={sp}>{sp}</option>
              ))}
            </select>
            <input
              value={filterJabatan}
              onChange={(e) => setFilterJabatan(e.target.value)}
              placeholder="Filter Jabatan..."
              className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm w-44 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <select
              value={filterStatusAktif}
              onChange={(e) => setFilterStatusAktif(e.target.value)}
              className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Semua Status</option>
              <option value="aktif">Aktif</option>
              <option value="nonaktif">Nonaktif</option>
            </select>
          </div>
        </Card>

        {/* Table */}
        <Card>
          <CardContent>
            {filteredData.length === 0 ? (
              <EmptyState
                title="Belum ada data GTK"
                message="Klik tombol Tambah GTK untuk menambahkan data."
                icon={<GraduationCap className="w-12 h-12 text-gray-300" />}
              />
            ) : (
              <DataTable columns={columns} data={filteredData} searchable={false} />
            )}
          </CardContent>
        </Card>

        {/* Bottom Cards */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* BUP/Pensiun */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Clock className="w-5 h-5 text-orange-500" />
                <CardTitle>Data BUP/Pensiun</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              {bupData.length === 0 ? (
                <p className="text-sm text-gray-500">Tidak ada data BUP/Pensiun</p>
              ) : (
                <div className="space-y-3">
                  {bupData.map((g) => (
                    <div key={g.id} className="flex items-center justify-between p-2 bg-orange-50 rounded-lg">
                      <div>
                        <p className="text-sm font-medium text-gray-800">{g.nama}</p>
                        <p className="text-xs text-gray-500">
                          {sekolahList.find((s) => s.id === g.sekolah_id)?.nama} -
                          BUP: {g.bup ? formatDate(g.bup) : "-"}
                        </p>
                      </div>
                      <Badge variant="warning">Pensiun</Badge>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Sertifikasi */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Award className="w-5 h-5 text-blue-500" />
                <CardTitle>Sertifikasi</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                  <span className="text-sm font-medium text-gray-700">Bersertifikat</span>
                  <span className="text-2xl font-bold text-green-600">{sertifikasiData.bersertifikat}</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <span className="text-sm font-medium text-gray-700">Non-Sertifikat</span>
                  <span className="text-2xl font-bold text-gray-600">{sertifikasiData.nonSertifikat}</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                  <span className="text-sm font-medium text-gray-700">Total GTK</span>
                  <span className="text-2xl font-bold text-blue-600">{data.length}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Kekurangan/Kelebihan Guru */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-yellow-500" />
                <CardTitle>Kekurangan/Kelebihan Guru</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {sekolahList.map((s) => {
                  const analisis = analisisGuru[s.id];
                  if (!analisis) return null;
                  return (
                    <div key={s.id} className="p-2 border border-gray-200 rounded-lg">
                      <p className="text-sm font-medium text-gray-800 truncate">{s.nama}</p>
                      <div className="flex items-center gap-3 mt-1 text-xs text-gray-500">
                        <span>Total: <strong>{analisis.total}</strong></span>
                        <span>PNS: <strong>{analisis.pns}</strong></span>
                        <span>PPPK: <strong>{analisis.pppk}</strong></span>
                        <span>Honorer: <strong>{analisis.honorer}</strong></span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Modal Tambah/Edit */}
      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingId ? "Edit Data GTK" : "Tambah Data GTK"}
        size="xl"
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input label="NIK" id="nik" value={form.nik} onChange={(e) => updateForm("nik", e.target.value)} />
          <Input label="NIP" id="nip" value={form.nip} onChange={(e) => updateForm("nip", e.target.value)} />
          <Input label="NUPTK" id="nuptk" value={form.nuptk} onChange={(e) => updateForm("nuptk", e.target.value)} />
          <Input label="Nama Lengkap" id="nama" value={form.nama} onChange={(e) => updateForm("nama", e.target.value)} />
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
            label="Status Pegawai"
            id="status_pegawai"
            value={form.status_pegawai}
            onChange={(e) => updateForm("status_pegawai", e.target.value)}
            options={statusPegawaiOptions.map((sp) => ({ value: sp, label: sp }))}
          />
          <Input label="Jabatan" id="jabatan" value={form.jabatan} onChange={(e) => updateForm("jabatan", e.target.value)} />
          <Select
            label="Jenis GTK"
            id="jenis_gtk"
            value={form.jenis_gtk}
            onChange={(e) => updateForm("jenis_gtk", e.target.value)}
            options={jenisGtkOptions.map((j) => ({ value: j, label: j }))}
          />
          <Select
            label="Sekolah"
            id="sekolah_id"
            value={form.sekolah_id}
            onChange={(e) => updateForm("sekolah_id", e.target.value)}
            options={sekolahList.map((s) => ({ value: s.id, label: s.nama }))}
          />
          <Input label="Pangkat/Golongan" id="pangkat_golongan" value={form.pangkat_golongan} onChange={(e) => updateForm("pangkat_golongan", e.target.value)} />
          <Select
            label="Pendidikan Terakhir"
            id="pendidikan_terakhir"
            value={form.pendidikan_terakhir}
            onChange={(e) => updateForm("pendidikan_terakhir", e.target.value)}
            options={pendidikanOptions.map((p) => ({ value: p, label: p }))}
          />
          <div className="space-y-1">
            <label className="block text-sm font-medium text-gray-700">Sertifikasi</label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={form.sertifikasi}
                onChange={(e) => updateForm("sertifikasi", e.target.checked)}
                className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              />
              <span className="text-sm text-gray-600">{form.sertifikasi ? "Bersertifikat" : "Belum Sertifikasi"}</span>
            </label>
          </div>
          <Input label="NRG" id="nrg" value={form.nrg} onChange={(e) => updateForm("nrg", e.target.value)} />
          <Input label="Masa Kerja (Tahun)" id="masa_kerja" type="number" value={form.masa_kerja} onChange={(e) => updateForm("masa_kerja", Number(e.target.value))} />
          <Input label="TMT" id="tmt" type="date" value={form.tmt} onChange={(e) => updateForm("tmt", e.target.value)} />
          <Input label="Nomor SK" id="nomor_sk" value={form.nomor_sk} onChange={(e) => updateForm("nomor_sk", e.target.value)} />
          <Input label="BUP" id="bup" type="date" value={form.bup} onChange={(e) => updateForm("bup", e.target.value)} />
          <Input label="Kontak" id="kontak" value={form.kontak} onChange={(e) => updateForm("kontak", e.target.value)} />
          <Select
            label="Status Aktif"
            id="status_aktif"
            value={form.status_aktif}
            onChange={(e) => updateForm("status_aktif", e.target.value)}
            options={[
              { value: "aktif", label: "Aktif" },
              { value: "nonaktif", label: "Nonaktif" },
            ]}
          />
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
        title="Detail GTK"
        size="xl"
      >
        {viewing && (
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <DetailField label="NIK" value={viewing.nik} />
              <DetailField label="NIP" value={viewing.nip || "-"} />
              <DetailField label="NUPTK" value={viewing.nuptk} />
              <DetailField label="Nama Lengkap" value={viewing.nama} />
              <DetailField label="Jenis Kelamin" value={viewing.jenis_kelamin === "L" ? "Laki-laki" : "Perempuan"} />
              <DetailField label="Tempat Lahir" value={viewing.tempat_lahir} />
              <DetailField label="Tanggal Lahir" value={formatDate(viewing.tanggal_lahir)} />
              <DetailField label="Status Pegawai" value={viewing.status_pegawai} />
              <DetailField label="Jabatan" value={viewing.jabatan} />
              <DetailField label="Jenis GTK" value={viewing.jenis_gtk} />
              <DetailField label="Sekolah" value={sekolahList.find((s) => s.id === viewing.sekolah_id)?.nama || "-"} />
              <DetailField label="Pangkat/Golongan" value={viewing.pangkat_golongan || "-"} />
              <DetailField label="Pendidikan Terakhir" value={viewing.pendidikan_terakhir} />
              <DetailField label="Sertifikasi" value={<Badge variant={viewing.sertifikasi ? "success" : "default"}>{viewing.sertifikasi ? "Ya" : "Tidak"}</Badge>} />
              <DetailField label="NRG" value={viewing.nrg || "-"} />
              <DetailField label="Masa Kerja" value={`${viewing.masa_kerja} tahun`} />
              <DetailField label="TMT" value={viewing.tmt ? formatDate(viewing.tmt) : "-"} />
              <DetailField label="Nomor SK" value={viewing.nomor_sk || "-"} />
              <DetailField label="BUP" value={viewing.bup ? formatDate(viewing.bup) : "-"} />
              <DetailField label="Kontak" value={viewing.kontak || "-"} />
              <DetailField
                label="Status Aktif"
                value={<Badge variant={viewing.status_aktif === "aktif" ? "success" : "danger"}>{viewing.status_aktif === "aktif" ? "Aktif" : "Nonaktif"}</Badge>}
              />
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
          Apakah Anda yakin ingin menghapus data GTK ini? Tindakan ini tidak dapat dibatalkan.
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
