"use client";

import { useState, useMemo } from "react";
import { useSession } from "next-auth/react";
import {
  Building2,
  Plus,
  Eye,
  Pencil,
  Trash2,
} from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { DataTable } from "@/components/ui/Table";
import { Modal } from "@/components/ui/Modal";
import { Input, Select, Textarea } from "@/components/ui/Input";
import Button from "@/components/ui/Button";
import { Loading } from "@/components/ui/Loading";
import { EmptyState } from "@/components/ui/EmptyState";
import type { ColumnDef } from "@tanstack/react-table";

type JenisSarpras =
  | "Ruang Kelas"
  | "Perpustakaan"
  | "UKS"
  | "Toilet"
  | "Mushola"
  | "Gudang"
  | "Ruang Guru"
  | "Ruang Kepala Sekolah"
  | "Rumah Dinas"
  | "Meubelair";

interface Sarpras {
  id: string;
  sekolah_id: string;
  jenis: JenisSarpras;
  nama: string;
  jumlah: number;
  kondisi_baik: number;
  kondisi_sedang: number;
  kondisi_rusak: number;
  foto: string;
  usulan_perbaikan: string;
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

const jenisOptions: JenisSarpras[] = [
  "Ruang Kelas",
  "Perpustakaan",
  "UKS",
  "Toilet",
  "Mushola",
  "Gudang",
  "Ruang Guru",
  "Ruang Kepala Sekolah",
  "Rumah Dinas",
  "Meubelair",
];

const initialData: Sarpras[] = [
  {
    id: "1", sekolah_id: "1", jenis: "Ruang Kelas", nama: "Ruang Kelas 1A",
    jumlah: 1, kondisi_baik: 1, kondisi_sedang: 0, kondisi_rusak: 0,
    foto: "", usulan_perbaikan: "",
  },
  {
    id: "2", sekolah_id: "1", jenis: "Ruang Kelas", nama: "Ruang Kelas 1B",
    jumlah: 30, kondisi_baik: 25, kondisi_sedang: 3, kondisi_rusak: 2,
    foto: "", usulan_perbaikan: "Perbaiki meja dan kursi yang rusak",
  },
  {
    id: "3", sekolah_id: "1", jenis: "Perpustakaan", nama: "Perpustakaan SDN 1",
    jumlah: 1, kondisi_baik: 0, kondisi_sedang: 1, kondisi_rusak: 0,
    foto: "", usulan_perbaikan: "Renovasi rak buku",
  },
  {
    id: "4", sekolah_id: "2", jenis: "UKS", nama: "Ruang UKS SDN 2",
    jumlah: 1, kondisi_baik: 1, kondisi_sedang: 0, kondisi_rusak: 0,
    foto: "", usulan_perbaikan: "",
  },
  {
    id: "5", sekolah_id: "2", jenis: "Toilet", nama: "Toilet Siswa Putra",
    jumlah: 4, kondisi_baik: 2, kondisi_sedang: 1, kondisi_rusak: 1,
    foto: "", usulan_perbaikan: "Perbaiki toilet rusak di lantai 2",
  },
  {
    id: "6", sekolah_id: "2", jenis: "Toilet", nama: "Toilet Siswa Putri",
    jumlah: 4, kondisi_baik: 3, kondisi_sedang: 1, kondisi_rusak: 0,
    foto: "", usulan_perbaikan: "",
  },
  {
    id: "7", sekolah_id: "3", jenis: "Mushola", nama: "Mushola Al-Hikmah",
    jumlah: 1, kondisi_baik: 1, kondisi_sedang: 0, kondisi_rusak: 0,
    foto: "", usulan_perbaikan: "",
  },
  {
    id: "8", sekolah_id: "3", jenis: "Gudang", nama: "Gudang Perlengkapan",
    jumlah: 1, kondisi_baik: 0, kondisi_sedang: 0, kondisi_rusak: 1,
    foto: "", usulan_perbaikan: "Atap bocor perlu diganti",
  },
  {
    id: "9", sekolah_id: "4", jenis: "Ruang Guru", nama: "Ruang Guru SDN 4",
    jumlah: 1, kondisi_baik: 0, kondisi_sedang: 1, kondisi_rusak: 0,
    foto: "", usulan_perbaikan: "Cat ulang dinding dan ganti karpet",
  },
  {
    id: "10", sekolah_id: "4", jenis: "Ruang Kepala Sekolah", nama: "Ruang Kepala SDN 4",
    jumlah: 1, kondisi_baik: 1, kondisi_sedang: 0, kondisi_rusak: 0,
    foto: "", usulan_perbaikan: "",
  },
  {
    id: "11", sekolah_id: "5", jenis: "Rumah Dinas", nama: "Rumah Dinas Guru",
    jumlah: 2, kondisi_baik: 1, kondisi_sedang: 1, kondisi_rusak: 0,
    foto: "", usulan_perbaikan: "Perbaikan instalasi listrik",
  },
  {
    id: "12", sekolah_id: "5", jenis: "Meubelair", nama: "Meja & Kursi Siswa",
    jumlah: 80, kondisi_baik: 60, kondisi_sedang: 15, kondisi_rusak: 5,
    foto: "", usulan_perbaikan: "Pengadaan meja kursi baru 20 set",
  },
  {
    id: "13", sekolah_id: "6", jenis: "Ruang Kelas", nama: "Ruang Kelas 1A IT",
    jumlah: 1, kondisi_baik: 1, kondisi_sedang: 0, kondisi_rusak: 0,
    foto: "", usulan_perbaikan: "",
  },
  {
    id: "14", sekolah_id: "6", jenis: "Perpustakaan", nama: "Perpustakaan Digital",
    jumlah: 1, kondisi_baik: 1, kondisi_sedang: 0, kondisi_rusak: 0,
    foto: "", usulan_perbaikan: "Tambahkan komputer baca",
  },
  {
    id: "15", sekolah_id: "6", jenis: "Mushola", nama: "Mushola Bina Cendekia",
    jumlah: 1, kondisi_baik: 1, kondisi_sedang: 0, kondisi_rusak: 0,
    foto: "", usulan_perbaikan: "",
  },
];

const defaultForm: Sarpras = {
  id: "",
  sekolah_id: "",
  jenis: "Ruang Kelas",
  nama: "",
  jumlah: 0,
  kondisi_baik: 0,
  kondisi_sedang: 0,
  kondisi_rusak: 0,
  foto: "",
  usulan_perbaikan: "",
};

export default function SarprasPage() {
  const { data: session } = useSession();

  const [data, setData] = useState<Sarpras[]>(initialData);
  const [loading, setLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<Sarpras>(defaultForm);
  const [viewing, setViewing] = useState<Sarpras | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const [filterSekolah, setFilterSekolah] = useState("");
  const [filterJenis, setFilterJenis] = useState("");

  const filteredData = useMemo(() => {
    let result = data;
    if (filterSekolah) {
      result = result.filter((s) => s.sekolah_id === filterSekolah);
    }
    if (filterJenis) {
      result = result.filter((s) => s.jenis === filterJenis);
    }
    return result;
  }, [data, filterSekolah, filterJenis]);

  const summary = useMemo(() => {
    const total = data.reduce((a, s) => a + s.jumlah, 0);
    const baik = data.reduce((a, s) => a + s.kondisi_baik, 0);
    const sedang = data.reduce((a, s) => a + s.kondisi_sedang, 0);
    const rusak = data.reduce((a, s) => a + s.kondisi_rusak, 0);
    return { total, baik, sedang, rusak };
  }, [data]);

  const columns: ColumnDef<Sarpras>[] = [
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
    { header: "Jenis", accessorKey: "jenis" },
    { header: "Nama", accessorKey: "nama" },
    { header: "Jumlah", accessorKey: "jumlah" },
    { header: "Kondisi Baik", accessorKey: "kondisi_baik" },
    { header: "Kondisi Sedang", accessorKey: "kondisi_sedang" },
    { header: "Kondisi Rusak", accessorKey: "kondisi_rusak" },
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

  function handleEdit(sarpras: Sarpras) {
    setEditingId(sarpras.id);
    setForm(sarpras);
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

  function updateForm(key: keyof Sarpras, value: string | number) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  if (loading) return <Loading message="Memuat data sarpras..." />;

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="max-w-7xl mx-auto px-4 py-6 space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-blue-50 text-blue-600">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Sarpras</h1>
              <p className="text-sm text-gray-500 mt-0.5">Kecamatan Lemahabang</p>
            </div>
          </div>
          <Button onClick={openAddModal}>
            <Plus className="w-4 h-4 mr-2" />
            Tambah Sarpras
          </Button>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <div className="text-center">
              <p className="text-sm text-gray-500">Total Sarpras</p>
              <p className="text-2xl font-bold text-blue-600">{summary.total}</p>
            </div>
          </Card>
          <Card>
            <div className="text-center">
              <p className="text-sm text-gray-500">Kondisi Baik</p>
              <p className="text-2xl font-bold text-green-600">{summary.baik}</p>
            </div>
          </Card>
          <Card>
            <div className="text-center">
              <p className="text-sm text-gray-500">Kondisi Sedang</p>
              <p className="text-2xl font-bold text-yellow-600">{summary.sedang}</p>
            </div>
          </Card>
          <Card>
            <div className="text-center">
              <p className="text-sm text-gray-500">Kondisi Rusak</p>
              <p className="text-2xl font-bold text-red-600">{summary.rusak}</p>
            </div>
          </Card>
        </div>

        {/* Filter */}
        <Card>
          <div className="flex flex-wrap items-center gap-4">
            <span className="text-sm text-gray-500">Filter:</span>
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
              value={filterJenis}
              onChange={(e) => setFilterJenis(e.target.value)}
              className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Semua Jenis</option>
              {jenisOptions.map((j) => (
                <option key={j} value={j}>{j}</option>
              ))}
            </select>
          </div>
        </Card>

        {/* Table */}
        <Card>
          <CardContent>
            {filteredData.length === 0 ? (
              <EmptyState
                title="Belum ada data sarpras"
                message="Klik tombol Tambah Sarpras untuk menambahkan data."
                icon={<Building2 className="w-12 h-12 text-gray-300" />}
              />
            ) : (
              <DataTable
                columns={columns}
                data={filteredData}
                searchPlaceholder="Cari nama sarpras..."
              />
            )}
          </CardContent>
        </Card>
      </div>

      {/* Modal Tambah/Edit */}
      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingId ? "Edit Sarpras" : "Tambah Sarpras"}
        size="lg"
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Select
            label="Sekolah"
            id="sekolah_id"
            value={form.sekolah_id}
            onChange={(e) => updateForm("sekolah_id", e.target.value)}
            options={sekolahList.map((s) => ({ value: s.id, label: s.nama }))}
          />
          <Select
            label="Jenis"
            id="jenis"
            value={form.jenis}
            onChange={(e) => updateForm("jenis", e.target.value)}
            options={jenisOptions.map((j) => ({ value: j, label: j }))}
          />
          <Input
            label="Nama Sarpras"
            id="nama"
            value={form.nama}
            onChange={(e) => updateForm("nama", e.target.value)}
          />
          <Input
            label="Jumlah"
            id="jumlah"
            type="number"
            value={form.jumlah}
            onChange={(e) => updateForm("jumlah", Number(e.target.value))}
          />
          <Input
            label="Kondisi Baik"
            id="kondisi_baik"
            type="number"
            value={form.kondisi_baik}
            onChange={(e) => updateForm("kondisi_baik", Number(e.target.value))}
          />
          <Input
            label="Kondisi Sedang"
            id="kondisi_sedang"
            type="number"
            value={form.kondisi_sedang}
            onChange={(e) => updateForm("kondisi_sedang", Number(e.target.value))}
          />
          <Input
            label="Kondisi Rusak"
            id="kondisi_rusak"
            type="number"
            value={form.kondisi_rusak}
            onChange={(e) => updateForm("kondisi_rusak", Number(e.target.value))}
          />
          <Input
            label="Foto"
            id="foto"
            type="file"
            onChange={(e) => updateForm("foto", e.target.value)}
          />
          <div className="md:col-span-2">
            <Textarea
              label="Usulan Perbaikan"
              id="usulan_perbaikan"
              value={form.usulan_perbaikan}
              onChange={(e) => updateForm("usulan_perbaikan", e.target.value)}
              rows={3}
            />
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
        title="Detail Sarpras"
        size="lg"
      >
        {viewing && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <DetailField
                label="Sekolah"
                value={sekolahList.find((s) => s.id === viewing.sekolah_id)?.nama || "-"}
              />
              <DetailField label="Jenis" value={viewing.jenis} />
              <DetailField label="Nama" value={viewing.nama} />
              <DetailField label="Jumlah" value={String(viewing.jumlah)} />
              <DetailField label="Kondisi Baik" value={String(viewing.kondisi_baik)} />
              <DetailField label="Kondisi Sedang" value={String(viewing.kondisi_sedang)} />
              <DetailField label="Kondisi Rusak" value={String(viewing.kondisi_rusak)} />
              {viewing.foto && <DetailField label="Foto" value={viewing.foto} />}
            </div>
            {viewing.usulan_perbaikan && (
              <div>
                <span className="block text-xs font-medium text-gray-500 mb-0.5">Usulan Perbaikan</span>
                <p className="text-sm text-gray-800">{viewing.usulan_perbaikan}</p>
              </div>
            )}
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
          Apakah Anda yakin ingin menghapus data sarpras ini? Tindakan ini tidak dapat dibatalkan.
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
