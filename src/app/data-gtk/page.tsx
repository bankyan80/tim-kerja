"use client";

import { useState, useMemo, useEffect } from "react";
import { useSession } from "next-auth/react";
import toast from "react-hot-toast";
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

  const [data, setData] = useState<GTK[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<GTK>(defaultForm);
  const [viewing, setViewing] = useState<GTK | null>(null);

  const [search, setSearch] = useState("");
  const [filterSekolah, setFilterSekolah] = useState("");
  const [filterStatusPegawai, setFilterStatusPegawai] = useState("");
  const [filterJabatan, setFilterJabatan] = useState("");
  const [filterStatusAktif, setFilterStatusAktif] = useState("");

  useEffect(() => {
    fetch("/api/gtk").then(r => r.json()).then(d => { setData(d); setLoading(false); }).catch(() => setLoading(false));
  }, []);

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
            onClick={() => handleDelete(row.original.id)}
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

  async function handleDelete(id: string) {
    if (confirm("Yakin ingin menghapus data GTK ini?")) {
      await fetch(`/api/gtk?id=${id}`, { method: "DELETE" });
      setData((prev) => prev.filter((g) => g.id !== id));
      toast.success("GTK berhasil dihapus");
    }
  }

  async function handleSave() {
    if (editingId) {
      const res = await fetch("/api/gtk", {
        method: "PUT", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, sertifikasi: form.sertifikasi ? 1 : 0 }),
      });
      if (res.ok) { setData((prev) => prev.map((g) => (g.id === editingId ? { ...form, id: editingId } : g))); toast.success("GTK berhasil diupdate"); }
    } else {
      const res = await fetch("/api/gtk", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, sertifikasi: form.sertifikasi ? 1 : 0 }),
      });
      if (res.ok) { const newId = String(Date.now()); setData((prev) => [...prev, { ...form, id: newId }]); toast.success("GTK berhasil ditambahkan"); }
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
