"use client";

import { useState, useMemo, useEffect } from "react";
import toast from "react-hot-toast";
import { useSession } from "next-auth/react";
import {
  Archive,
  Plus,
  Eye,
  Trash2,
  Download,
  Search,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/Card";
import { DataTable } from "@/components/ui/Table";
import { Modal } from "@/components/ui/Modal";
import { Badge } from "@/components/ui/Badge";
import { Input, Select } from "@/components/ui/Input";
import Button from "@/components/ui/Button";
import { Loading } from "@/components/ui/Loading";
import { EmptyState } from "@/components/ui/EmptyState";
import { formatDate, getBulanName } from "@/lib/utils";
import type { ColumnDef } from "@tanstack/react-table";

type JenisDokumen =
  | "Surat"
  | "Laporan"
  | "SK"
  | "Dokumen Siswa"
  | "Dokumen GTK"
  | "Sarpras"
  | "SPMB"
  | "Kegiatan"
  | "Monitoring"
  | "Lainnya";

interface VersiArsip {
  versi: number;
  file: string;
  tanggal_upload: string;
  file_size: string;
}

interface Arsip {
  id: string;
  jenis_dokumen: JenisDokumen;
  sekolah_id: string;
  bulan: number;
  tahun: number;
  pemilik: string;
  file: string;
  versi: number;
  tanggal_upload: string;
  file_size: string;
  catatan: string;
  riwayat_versi: VersiArsip[];
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

const jenisDokumenList: JenisDokumen[] = [
  "Surat",
  "Laporan",
  "SK",
  "Dokumen Siswa",
  "Dokumen GTK",
  "Sarpras",
  "SPMB",
  "Kegiatan",
  "Monitoring",
  "Lainnya",
];

const jenisDokumenBadge: Record<JenisDokumen, { variant: "default" | "success" | "warning" | "danger" | "info" }> = {
  Surat: { variant: "info" },
  Laporan: { variant: "success" },
  SK: { variant: "warning" },
  "Dokumen Siswa": { variant: "default" },
  "Dokumen GTK": { variant: "danger" },
  Sarpras: { variant: "info" },
  SPMB: { variant: "warning" },
  Kegiatan: { variant: "success" },
  Monitoring: { variant: "default" },
  Lainnya: { variant: "default" },
};

const bulanOptions = Array.from({ length: 12 }, (_, i) => ({
  value: String(i + 1),
  label: getBulanName(i + 1),
}));

const tahunOptions = Array.from({ length: 6 }, (_, i) => {
  const year = new Date().getFullYear() - 2 + i;
  return { value: String(year), label: String(year) };
});

const defaultForm: Arsip = {
  id: "",
  jenis_dokumen: "Surat",
  sekolah_id: "",
  bulan: new Date().getMonth() + 1,
  tahun: new Date().getFullYear(),
  pemilik: "",
  file: "",
  versi: 1,
  tanggal_upload: new Date().toISOString().split("T")[0],
  file_size: "",
  catatan: "",
  riwayat_versi: [],
};



export default function ArsipPage() {
  const { data: session } = useSession();

  const [data, setData] = useState<Arsip[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/arsip")
      .then((r) => r.json())
      .then((d) => {
        setData(d);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<Arsip>(defaultForm);
  const [viewing, setViewing] = useState<Arsip | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [filterJenisDokumen, setFilterJenisDokumen] = useState("");
  const [filterSekolah, setFilterSekolah] = useState("");
  const [filterTahun, setFilterTahun] = useState("");

  const filteredData = useMemo(() => {
    let result = data;
    if (search) {
      const q = search.toLowerCase();
      result = result.filter(
        (a) =>
          a.file.toLowerCase().includes(q) ||
          a.pemilik.toLowerCase().includes(q) ||
          a.catatan.toLowerCase().includes(q)
      );
    }
    if (filterJenisDokumen) {
      result = result.filter((a) => a.jenis_dokumen === filterJenisDokumen);
    }
    if (filterSekolah) {
      result = result.filter((a) => a.sekolah_id === filterSekolah);
    }
    if (filterTahun) {
      result = result.filter((a) => a.tahun === Number(filterTahun));
    }
    return result;
  }, [data, search, filterJenisDokumen, filterSekolah, filterTahun]);

  const columns: ColumnDef<Arsip>[] = [
    {
      header: "No",
      id: "no",
      cell: ({ row }) => row.index + 1,
    },
    {
      header: "Jenis Dokumen",
      accessorKey: "jenis_dokumen",
      cell: ({ row }) => {
        const jb = jenisDokumenBadge[row.original.jenis_dokumen];
        return <Badge variant={jb.variant}>{row.original.jenis_dokumen}</Badge>;
      },
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
    {
      header: "Tahun",
      accessorKey: "tahun",
    },
    { header: "Pemilik", accessorKey: "pemilik" },
    {
      header: "Versi",
      accessorKey: "versi",
      cell: ({ row }) => `v${row.original.versi}`,
    },
    {
      header: "Tanggal Upload",
      accessorKey: "tanggal_upload",
      cell: ({ row }) => formatDate(row.original.tanggal_upload),
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
            onClick={() => handleDownload(row.original)}
            className="p-1.5 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
            title="Unduh"
          >
            <Download className="w-4 h-4" />
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
    setForm({
      ...defaultForm,
      tanggal_upload: new Date().toISOString().split("T")[0],
      bulan: new Date().getMonth() + 1,
      tahun: new Date().getFullYear(),
    });
    setModalOpen(true);
  }

  function handleEdit(arsip: Arsip) {
    setEditingId(arsip.id);
    setForm({ ...arsip });
    setModalOpen(true);
  }

  function handleDownload(arsip: Arsip) {
    alert(`Mengunduh: ${arsip.file} (${arsip.file_size})`);
  }

  async function handleDelete() {
    if (!confirmDelete) return;
    try {
      await fetch(`/api/arsip?id=${confirmDelete}`, { method: "DELETE" });
      setData((prev) => prev.filter((a) => a.id !== confirmDelete));
      toast.success("Arsip berhasil dihapus");
    } catch {
      toast.error("Gagal menghapus arsip");
    }
    setConfirmDelete(null);
  }

  async function handleSave() {
    try {
      const payload = {
        ...form,
        versi: editingId ? form.versi : 1,
      };
      if (editingId) {
        const res = await fetch("/api/arsip", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        const updated = await res.json();
        setData((prev) => prev.map((a) => (a.id === editingId ? updated : a)));
        toast.success("Arsip berhasil diperbarui");
      } else {
        const res = await fetch("/api/arsip", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        const created = await res.json();
        setData((prev) => [...prev, created]);
        toast.success("Arsip berhasil dibuat");
      }
    } catch {
      toast.error("Gagal menyimpan arsip");
    }
    setModalOpen(false);
  }

  function updateForm(key: keyof Arsip, value: string | number) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  if (loading) return <Loading message="Memuat arsip digital..." />;

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="max-w-7xl mx-auto px-4 py-6 space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-blue-50 text-blue-600">
              <Archive className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Arsip Digital</h1>
              <p className="text-sm text-gray-500 mt-0.5">Kecamatan Lemahabang</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button onClick={openAddModal}>
              <Plus className="w-4 h-4 mr-2" />
              Tambah Arsip
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
                placeholder="Cari arsip..."
                className="pl-10 pr-4 py-1.5 border border-gray-300 rounded-lg text-sm w-56 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <select
              value={filterJenisDokumen}
              onChange={(e) => setFilterJenisDokumen(e.target.value)}
              className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Semua Jenis</option>
              {jenisDokumenList.map((j) => (
                <option key={j} value={j}>{j}</option>
              ))}
            </select>
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
              value={filterTahun}
              onChange={(e) => setFilterTahun(e.target.value)}
              className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Semua Tahun</option>
              {tahunOptions.map((t) => (
                <option key={t.value} value={t.value}>{t.label}</option>
              ))}
            </select>
          </div>
        </Card>

        {/* Table */}
        <Card>
          <CardContent>
            {filteredData.length === 0 ? (
              <EmptyState
                title="Belum ada arsip"
                message="Klik tombol Tambah Arsip untuk menambahkan arsip baru."
                icon={<Archive className="w-12 h-12 text-gray-300" />}
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
        title={editingId ? "Edit Arsip" : "Tambah Arsip"}
        size="lg"
      >
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Select
              label="Jenis Dokumen"
              id="jenis_dokumen"
              value={form.jenis_dokumen}
              onChange={(e) => updateForm("jenis_dokumen", e.target.value)}
              options={jenisDokumenList.map((j) => ({ value: j, label: j }))}
            />
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
            <Select
              label="Tahun"
              id="tahun"
              value={String(form.tahun)}
              onChange={(e) => updateForm("tahun", Number(e.target.value))}
              options={tahunOptions}
            />
            <Input
              label="Pemilik"
              id="pemilik"
              value={form.pemilik}
              onChange={(e) => updateForm("pemilik", e.target.value)}
            />
            <Input
              label="File"
              id="file"
              type="file"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) {
                  updateForm("file", file.name);
                  updateForm("file_size", `${(file.size / (1024 * 1024)).toFixed(1)} MB`);
                }
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
        title="Detail Arsip"
        size="lg"
      >
        {viewing && (
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <DetailField
                label="Jenis Dokumen"
                value={<Badge variant={jenisDokumenBadge[viewing.jenis_dokumen].variant}>{viewing.jenis_dokumen}</Badge>}
              />
              <DetailField
                label="Sekolah"
                value={sekolahList.find((s) => s.id === viewing.sekolah_id)?.nama || "-"}
              />
              <DetailField label="Bulan" value={getBulanName(viewing.bulan)} />
              <DetailField label="Tahun" value={viewing.tahun} />
              <DetailField label="Pemilik" value={viewing.pemilik} />
              <DetailField label="File" value={viewing.file} />
              <DetailField label="Ukuran File" value={viewing.file_size} />
              <DetailField label="Versi" value={`v${viewing.versi}`} />
              <DetailField label="Tanggal Upload" value={formatDate(viewing.tanggal_upload)} />
            </div>
            {viewing.catatan && (
              <DetailField label="Catatan" value={viewing.catatan} />
            )}

            {/* Riwayat Versi */}
            {viewing.riwayat_versi.length > 0 && (
              <div className="border rounded-lg p-4">
                <h4 className="font-semibold text-sm text-gray-800 mb-2">Riwayat Versi</h4>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200 text-sm">
                    <thead>
                      <tr>
                        <th className="px-3 py-2 text-left text-xs font-semibold text-gray-600">Versi</th>
                        <th className="px-3 py-2 text-left text-xs font-semibold text-gray-600">File</th>
                        <th className="px-3 py-2 text-left text-xs font-semibold text-gray-600">Ukuran</th>
                        <th className="px-3 py-2 text-left text-xs font-semibold text-gray-600">Tanggal Upload</th>
                        <th className="px-3 py-2 text-center text-xs font-semibold text-gray-600">Aksi</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {[...viewing.riwayat_versi].reverse().map((v) => (
                        <tr key={v.versi} className="hover:bg-gray-50">
                          <td className="px-3 py-2 font-medium">v{v.versi}</td>
                          <td className="px-3 py-2">{v.file}</td>
                          <td className="px-3 py-2">{v.file_size}</td>
                          <td className="px-3 py-2">{formatDate(v.tanggal_upload)}</td>
                          <td className="px-3 py-2 text-center">
                            <button
                              onClick={() => alert(`Mengunduh: ${v.file}`)}
                              className="p-1 text-green-600 hover:bg-green-50 rounded inline-flex"
                              title="Unduh versi ini"
                            >
                              <Download className="w-4 h-4" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-sm text-blue-700">
              <strong>Catatan:</strong> Pratinjau file (preview) tersedia untuk format PDF dan gambar.
              Untuk format dokumen lainnya, unduh file terlebih dahulu.
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
          Apakah Anda yakin ingin menghapus arsip ini? Tindakan ini tidak dapat dibatalkan.
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
