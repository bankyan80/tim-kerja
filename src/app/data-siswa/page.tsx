"use client";

import { useState, useMemo, useEffect } from "react";
import { useSession } from "next-auth/react";
import toast from "react-hot-toast";
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

const kelasOptions: Kelas[] = ["I", "II", "III", "IV", "V", "VI"];



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
  const isOperator = session?.user?.role === "operator_sekolah";
  const userSekolahId = session?.user?.sekolah_id;

  const [data, setData] = useState<Siswa[]>([]);
  const [loading, setLoading] = useState(true);
  const [sekolahList, setSekolahList] = useState<SekolahOption[]>([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<Siswa>(defaultForm);
  const [viewing, setViewing] = useState<Siswa | null>(null);

  const [showRekap, setShowRekap] = useState(false);
  const [search, setSearch] = useState("");
  const [filterSekolah, setFilterSekolah] = useState("");
  const [filterKelas, setFilterKelas] = useState("");
  const [filterStatusSiswa, setFilterStatusSiswa] = useState("");

  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [selectAllPage, setSelectAllPage] = useState(false);
  const [showNaikKelas, setShowNaikKelas] = useState(false);
  const [naikKelasLoading, setNaikKelasLoading] = useState(false);

  function toggleSelect(id: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  }

  function toggleSelectPage() {
    if (selectAllPage) {
      setSelectedIds(new Set());
      setSelectAllPage(false);
    } else {
      setSelectedIds(new Set(filteredData.map((s) => s.id)));
      setSelectAllPage(true);
    }
  }

  useEffect(() => {
    const params = new URLSearchParams();
    if (isOperator && userSekolahId) params.set("sekolah_id", userSekolahId);
    const url = `/api/siswa${params.toString() ? "?" + params.toString() : ""}`;
    fetch(url).then(r => r.json()).then(d => { setData(d); setLoading(false); }).catch(() => setLoading(false));
    fetch("/api/sekolah").then(r => r.json()).then(d => setSekolahList(d.map((s: { id: string; nama: string }) => ({ id: s.id, nama: s.nama })))).catch(() => {});
  }, [isOperator, userSekolahId]);

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

  useEffect(() => {
    setSelectAllPage(false);
  }, [search, filterSekolah, filterKelas, filterStatusSiswa]);

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
      id: "pilih",
      header: () => (
        <input
          type="checkbox"
          checked={selectAllPage && filteredData.length > 0}
          onChange={toggleSelectPage}
          className="w-4 h-4 rounded border-gray-300 text-blue-600 cursor-pointer"
        />
      ),
      cell: ({ row }) => (
        <input
          type="checkbox"
          checked={selectedIds.has(row.original.id)}
          onChange={() => toggleSelect(row.original.id)}
          className="w-4 h-4 rounded border-gray-300 text-blue-600 cursor-pointer"
        />
      ),
      size: 40,
    },
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
    setForm({ ...defaultForm, sekolah_id: isOperator && userSekolahId ? userSekolahId : "" });
    setModalOpen(true);
  }

  function handleEdit(siswa: Siswa) {
    setEditingId(siswa.id);
    setForm(siswa);
    setModalOpen(true);
  }

  async function handleDelete(id: string) {
    if (confirm("Yakin ingin menghapus data siswa ini?")) {
      await fetch(`/api/siswa?id=${id}`, { method: "DELETE" });
      setData((prev) => prev.filter((s) => s.id !== id));
      toast.success("Siswa berhasil dihapus");
    }
  }

  async function handleSave() {
    if (editingId) {
      const res = await fetch("/api/siswa", {
        method: "PUT", headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (res.ok) { setData((prev) => prev.map((s) => (s.id === editingId ? { ...form, id: editingId } : s))); toast.success("Siswa berhasil diupdate"); }
    } else {
      const res = await fetch("/api/siswa", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (res.ok) { const newId = String(Date.now()); setData((prev) => [...prev, { ...form, id: newId }]); toast.success("Siswa berhasil ditambahkan"); }
    }
    setModalOpen(false);
  }

  function updateForm(key: keyof Siswa, value: string) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  if (loading) return <Loading message="Memuat data siswa..." />;

  const kelasNext: Record<string, string | null> = {
    I: "II", II: "III", III: "IV", IV: "V", V: "VI", VI: null,
  };

  async function handleNaikKelas() {
    setNaikKelasLoading(true);
    const siswaNaik = data.filter((s) => selectedIds.has(s.id) && s.status_siswa === "aktif" && kelasNext[s.kelas] !== undefined);
    let sukses = 0;
    let lulus = 0;
    for (const s of siswaNaik) {
      const next = kelasNext[s.kelas];
      try {
        if (next) {
          await fetch("/api/siswa", {
            method: "PUT", headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ id: s.id, kelas: next }),
          });
          sukses++;
        } else {
          await fetch("/api/siswa", {
            method: "PUT", headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ id: s.id, status_siswa: "lulus" }),
          });
          lulus++;
        }
      } catch {}
    }
    const params = new URLSearchParams();
    if (isOperator && userSekolahId) params.set("sekolah_id", userSekolahId);
    const updated = await fetch(`/api/siswa${params.toString() ? "?" + params.toString() : ""}`).then((r) => r.json()).catch(() => []);
    if (updated.length) setData(updated);
    setSelectedIds(new Set());
    setShowNaikKelas(false);
    setNaikKelasLoading(false);
    toast.success(`${sukses} siswa naik kelas, ${lulus} siswa lulus`);
  }

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
            {selectedIds.size > 0 && (
              <Button variant="outline" onClick={() => setShowNaikKelas(true)}>
                <GraduationCap className="w-4 h-4 mr-2" />
                Naik Kelas ({selectedIds.size})
              </Button>
            )}
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
            {!isOperator && (
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
            )}
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
          {isOperator ? (
            <input type="hidden" name="sekolah_id" value={userSekolahId || ""} />
          ) : (
          <Select
            label="Sekolah"
            id="sekolah_id"
            value={form.sekolah_id}
            onChange={(e) => updateForm("sekolah_id", e.target.value)}
            options={sekolahList.map((s) => ({ value: s.id, label: s.nama }))}
          />
          )}
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

      {/* Modal Naik Kelas */}
      <Modal
        open={showNaikKelas}
        onClose={() => setShowNaikKelas(false)}
        title="Konfirmasi Kenaikan Kelas"
        size="md"
      >
        <div className="space-y-4">
          <p className="text-sm text-gray-600">
            {(() => {
              const siswaNaik = data.filter((s) => selectedIds.has(s.id) && s.status_siswa === "aktif" && kelasNext[s.kelas] !== undefined);
              const naik = siswaNaik.filter((s) => kelasNext[s.kelas]);
              const lulus = siswaNaik.filter((s) => !kelasNext[s.kelas]);
              return `${siswaNaik.length} siswa akan diproses (${naik.length} naik kelas, ${lulus.length} lulus).`;
            })()}
          </p>
          <div className="max-h-60 overflow-y-auto border rounded-lg divide-y text-sm">
            {data.filter((s) => selectedIds.has(s.id) && s.status_siswa === "aktif").map((s) => {
              const next = kelasNext[s.kelas];
              return (
                <div key={s.id} className="flex items-center justify-between px-4 py-2">
                  <span>{s.nama_lengkap} - Kelas {s.kelas}</span>
                  <span className="text-blue-600 font-medium">
                    {next ? `→ Kelas ${next}` : "→ Lulus"}
                  </span>
                </div>
              );
            })}
          </div>
          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button variant="outline" onClick={() => setShowNaikKelas(false)}>Batal</Button>
            <Button onClick={handleNaikKelas} disabled={naikKelasLoading}>
              {naikKelasLoading ? "Memproses..." : "Konfirmasi Naik Kelas"}
            </Button>
          </div>
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
