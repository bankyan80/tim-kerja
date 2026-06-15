"use client";

import { useState, useMemo, useEffect } from "react";
import toast from "react-hot-toast";
import {
  Calendar,
  Plus,
  Eye,
  Pencil,
  Trash2,
  Search,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/Card";
import { DataTable } from "@/components/ui/Table";
import { Modal } from "@/components/ui/Modal";
import { Badge } from "@/components/ui/Badge";
import { Input, Select, Textarea } from "@/components/ui/Input";
import Button from "@/components/ui/Button";
import { Loading } from "@/components/ui/Loading";
import { EmptyState } from "@/components/ui/EmptyState";
import { formatDate } from "@/lib/utils";
import type { ColumnDef } from "@tanstack/react-table";

type Kategori = "Rapat" | "Pelatihan" | "Sosialisasi" | "Workshop" | "Lomba" | "Lainnya";

interface Kegiatan {
  id: string;
  nama: string;
  kategori: Kategori;
  tanggal: string;
  waktu: string;
  tempat: string;
  peserta: string;
  penanggung_jawab: string;
  undangan: string;
  daftar_hadir: string;
  notulen: string;
  dokumentasi: string;
  biaya: number;
  laporan: string;
}

const kategoriList: Kategori[] = [
  "Rapat",
  "Pelatihan",
  "Sosialisasi",
  "Workshop",
  "Lomba",
  "Lainnya",
];

const kategoriBadge: Record<Kategori, { variant: "default" | "success" | "warning" | "danger" | "info" }> = {
  Rapat: { variant: "info" },
  Pelatihan: { variant: "success" },
  Sosialisasi: { variant: "warning" },
  Workshop: { variant: "default" },
  Lomba: { variant: "danger" },
  Lainnya: { variant: "default" },
};

const defaultForm: Kegiatan = {
  id: "",
  nama: "",
  kategori: "Rapat",
  tanggal: "",
  waktu: "",
  tempat: "",
  peserta: "",
  penanggung_jawab: "",
  undangan: "",
  daftar_hadir: "",
  notulen: "",
  dokumentasi: "",
  biaya: 0,
  laporan: "",
};



export default function KegiatanPage() {
  const [data, setData] = useState<Kegiatan[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/kegiatan")
      .then((r) => r.json())
      .then((d) => {
        setData(d);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<Kegiatan>(defaultForm);
  const [viewing, setViewing] = useState<Kegiatan | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [filterKategori, setFilterKategori] = useState("");
  const [filterDateStart, setFilterDateStart] = useState("");
  const [filterDateEnd, setFilterDateEnd] = useState("");

  const filteredData = useMemo(() => {
    let result = data;
    if (search) {
      const q = search.toLowerCase();
      result = result.filter(
        (k) =>
          k.nama.toLowerCase().includes(q) ||
          k.tempat.toLowerCase().includes(q) ||
          k.penanggung_jawab.toLowerCase().includes(q)
      );
    }
    if (filterKategori) {
      result = result.filter((k) => k.kategori === filterKategori);
    }
    if (filterDateStart) {
      result = result.filter((k) => k.tanggal >= filterDateStart);
    }
    if (filterDateEnd) {
      result = result.filter((k) => k.tanggal <= filterDateEnd);
    }
    return result;
  }, [data, search, filterKategori, filterDateStart, filterDateEnd]);

  const columns: ColumnDef<Kegiatan>[] = [
    {
      header: "No",
      id: "no",
      cell: ({ row }) => row.index + 1,
    },
    { header: "Nama Kegiatan", accessorKey: "nama" },
    {
      header: "Kategori",
      accessorKey: "kategori",
      cell: ({ row }) => {
        const kb = kategoriBadge[row.original.kategori];
        return <Badge variant={kb.variant}>{row.original.kategori}</Badge>;
      },
    },
    {
      header: "Tanggal",
      accessorKey: "tanggal",
      cell: ({ row }) => formatDate(row.original.tanggal),
    },
    { header: "Waktu", accessorKey: "waktu" },
    { header: "Tempat", accessorKey: "tempat" },
    { header: "Penanggung Jawab", accessorKey: "penanggung_jawab" },
    {
      header: "Biaya",
      accessorKey: "biaya",
      cell: ({ row }) =>
        new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", minimumFractionDigits: 0 }).format(row.original.biaya),
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

  function handleEdit(kegiatan: Kegiatan) {
    setEditingId(kegiatan.id);
    setForm({ ...kegiatan });
    setModalOpen(true);
  }

  async function handleDelete() {
    if (!confirmDelete) return;
    try {
      await fetch(`/api/kegiatan?id=${confirmDelete}`, { method: "DELETE" });
      setData((prev) => prev.filter((k) => k.id !== confirmDelete));
      toast.success("Kegiatan berhasil dihapus");
    } catch {
      toast.error("Gagal menghapus kegiatan");
    }
    setConfirmDelete(null);
  }

  async function handleSave() {
    try {
      if (editingId) {
        const res = await fetch("/api/kegiatan", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(form),
        });
        const updated = await res.json();
        setData((prev) => prev.map((k) => (k.id === editingId ? updated : k)));
        toast.success("Kegiatan berhasil diperbarui");
      } else {
        const res = await fetch("/api/kegiatan", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(form),
        });
        const created = await res.json();
        setData((prev) => [...prev, created]);
        toast.success("Kegiatan berhasil dibuat");
      }
    } catch {
      toast.error("Gagal menyimpan kegiatan");
    }
    setModalOpen(false);
  }

  function updateForm(key: keyof Kegiatan, value: string | number) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  if (loading) return <Loading message="Memuat data kegiatan..." />;

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="max-w-7xl mx-auto px-4 py-6 space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-blue-50 text-blue-600">
              <Calendar className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Kegiatan</h1>
              <p className="text-sm text-gray-500 mt-0.5">Kecamatan Lemahabang</p>
            </div>
          </div>
          <Button onClick={openAddModal}>
            <Plus className="w-4 h-4 mr-2" />
            Tambah Kegiatan
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
                placeholder="Cari kegiatan..."
                className="pl-10 pr-4 py-1.5 border border-gray-300 rounded-lg text-sm w-56 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <select
              value={filterKategori}
              onChange={(e) => setFilterKategori(e.target.value)}
              className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Semua Kategori</option>
              {kategoriList.map((k) => (
                <option key={k} value={k}>{k}</option>
              ))}
            </select>
            <input
              type="date"
              value={filterDateStart}
              onChange={(e) => setFilterDateStart(e.target.value)}
              className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              title="Tanggal Mulai"
            />
            <input
              type="date"
              value={filterDateEnd}
              onChange={(e) => setFilterDateEnd(e.target.value)}
              className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              title="Tanggal Akhir"
            />
          </div>
        </Card>

        {/* Table */}
        <Card>
          <CardContent>
            {filteredData.length === 0 ? (
              <EmptyState
                title="Belum ada kegiatan"
                message="Klik tombol Tambah Kegiatan untuk menambahkan kegiatan baru."
                icon={<Calendar className="w-12 h-12 text-gray-300" />}
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
      </div>

      {/* Modal Tambah/Edit */}
      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingId ? "Edit Kegiatan" : "Tambah Kegiatan"}
        size="xl"
      >
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <Input
                label="Nama Kegiatan"
                id="nama"
                value={form.nama}
                onChange={(e) => updateForm("nama", e.target.value)}
              />
            </div>
            <Select
              label="Kategori"
              id="kategori"
              value={form.kategori}
              onChange={(e) => updateForm("kategori", e.target.value)}
              options={kategoriList.map((k) => ({ value: k, label: k }))}
            />
            <Input
              label="Tanggal"
              id="tanggal"
              type="date"
              value={form.tanggal}
              onChange={(e) => updateForm("tanggal", e.target.value)}
            />
            <Input
              label="Waktu"
              id="waktu"
              type="time"
              value={form.waktu}
              onChange={(e) => updateForm("waktu", e.target.value)}
            />
            <Input
              label="Tempat"
              id="tempat"
              value={form.tempat}
              onChange={(e) => updateForm("tempat", e.target.value)}
            />
            <div className="md:col-span-2">
              <Textarea
                label="Peserta"
                id="peserta"
                value={form.peserta}
                onChange={(e) => updateForm("peserta", e.target.value)}
                rows={2}
              />
            </div>
            <Input
              label="Penanggung Jawab"
              id="penanggung_jawab"
              value={form.penanggung_jawab}
              onChange={(e) => updateForm("penanggung_jawab", e.target.value)}
            />
            <Input
              label="Biaya"
              id="biaya"
              type="number"
              min={0}
              value={form.biaya}
              onChange={(e) => updateForm("biaya", Number(e.target.value))}
            />
            <Input
              label="Undangan (File)"
              id="undangan"
              type="file"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) updateForm("undangan", file.name);
              }}
            />
            <Input
              label="Daftar Hadir (File)"
              id="daftar_hadir"
              type="file"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) updateForm("daftar_hadir", file.name);
              }}
            />
            <div className="md:col-span-2">
              <Textarea
                label="Notulen"
                id="notulen"
                value={form.notulen}
                onChange={(e) => updateForm("notulen", e.target.value)}
                rows={3}
              />
            </div>
            <Input
              label="Dokumentasi (File)"
              id="dokumentasi"
              type="file"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) updateForm("dokumentasi", file.name);
              }}
            />
            <Input
              label="Laporan (File)"
              id="laporan"
              type="file"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) updateForm("laporan", file.name);
              }}
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
        title="Detail Kegiatan"
        size="xl"
      >
        {viewing && (
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <DetailField label="Nama Kegiatan" value={viewing.nama} />
              <DetailField
                label="Kategori"
                value={<Badge variant={kategoriBadge[viewing.kategori].variant}>{viewing.kategori}</Badge>}
              />
              <DetailField label="Tanggal" value={formatDate(viewing.tanggal)} />
              <DetailField label="Waktu" value={viewing.waktu} />
              <DetailField label="Tempat" value={viewing.tempat} />
              <DetailField label="Penanggung Jawab" value={viewing.penanggung_jawab} />
              <DetailField
                label="Biaya"
                value={new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", minimumFractionDigits: 0 }).format(viewing.biaya)}
              />
            </div>
            {viewing.peserta && (
              <DetailField label="Peserta" value={viewing.peserta} />
            )}
            {viewing.notulen && (
              <DetailField label="Notulen" value={viewing.notulen} />
            )}
            {(viewing.undangan || viewing.daftar_hadir || viewing.dokumentasi || viewing.laporan) && (
              <div className="border rounded-lg p-4">
                <h4 className="font-semibold text-sm text-gray-800 mb-2">Lampiran</h4>
                <div className="space-y-1 text-sm">
                  {viewing.undangan && <DetailField label="Undangan" value={viewing.undangan} />}
                  {viewing.daftar_hadir && <DetailField label="Daftar Hadir" value={viewing.daftar_hadir} />}
                  {viewing.dokumentasi && <DetailField label="Dokumentasi" value={viewing.dokumentasi} />}
                  {viewing.laporan && <DetailField label="Laporan" value={viewing.laporan} />}
                </div>
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
          Apakah Anda yakin ingin menghapus kegiatan ini? Tindakan ini tidak dapat dibatalkan.
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
