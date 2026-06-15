"use client";

import { useState, useMemo, useEffect } from "react";
import toast from "react-hot-toast";
import { useSession } from "next-auth/react";
import {
  Building2,
  Plus,
  Eye,
  Pencil,
  Trash2,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/Card";
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
  const isOperator = session?.user?.role === "operator_sekolah";
  const userSekolahId = session?.user?.sekolah_id;

  const [data, setData] = useState<Sarpras[]>([]);
  const [loading, setLoading] = useState(true);
  const [sekolahList, setSekolahList] = useState<SekolahOption[]>([]);

  useEffect(() => {
    const params = new URLSearchParams();
    if (isOperator && userSekolahId) params.set("sekolah_id", userSekolahId);
    const url = `/api/sarpras${params.toString() ? "?" + params.toString() : ""}`;
    fetch(url)
      .then((r) => r.json())
      .then((d) => {
        setData(d);
        setLoading(false);
      })
      .catch(() => setLoading(false));
    fetch("/api/sekolah").then(r => r.json()).then(d => setSekolahList(d.map((s: any) => ({ id: s.id, nama: s.nama })))).catch(() => {});
  }, [isOperator, userSekolahId]);
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
    setForm({ ...defaultForm, sekolah_id: isOperator && userSekolahId ? userSekolahId : "" });
    setModalOpen(true);
  }

  function handleEdit(sarpras: Sarpras) {
    setEditingId(sarpras.id);
    setForm(sarpras);
    setModalOpen(true);
  }

  async function handleDelete() {
    if (!confirmDelete) return;
    try {
      await fetch(`/api/sarpras?id=${confirmDelete}`, { method: "DELETE" });
      setData((prev) => prev.filter((s) => s.id !== confirmDelete));
      toast.success("Sarpras berhasil dihapus");
    } catch {
      toast.error("Gagal menghapus sarpras");
    }
    setConfirmDelete(null);
  }

  async function handleSave() {
    try {
      if (editingId) {
        const res = await fetch("/api/sarpras", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(form),
        });
        const updated = await res.json();
        setData((prev) => prev.map((s) => (s.id === editingId ? updated : s)));
        toast.success("Sarpras berhasil diperbarui");
      } else {
        const res = await fetch("/api/sarpras", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(form),
        });
        const created = await res.json();
        setData((prev) => [...prev, created]);
        toast.success("Sarpras berhasil dibuat");
      }
    } catch {
      toast.error("Gagal menyimpan sarpras");
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
