"use client";

import { useState, useMemo } from "react";
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

const initialData: Arsip[] = [
  {
    id: "1", jenis_dokumen: "Surat", sekolah_id: "1", bulan: 1, tahun: 2026,
    pemilik: "Operator SDN 1", file: "surat_undangan_rapat.pdf", versi: 1,
    tanggal_upload: "2026-01-10", file_size: "1.2 MB", catatan: "Undangan rapat koordinasi",
    riwayat_versi: [],
  },
  {
    id: "2", jenis_dokumen: "Laporan", sekolah_id: "1", bulan: 2, tahun: 2026,
    pemilik: "Kepala Sekolah", file: "laporan_bulanan_februari.docx", versi: 2,
    tanggal_upload: "2026-02-15", file_size: "2.5 MB", catatan: "",
    riwayat_versi: [
      { versi: 1, file: "laporan_bulanan_februari_v1.docx", tanggal_upload: "2026-02-10", file_size: "2.3 MB" },
    ],
  },
  {
    id: "3", jenis_dokumen: "SK", sekolah_id: "2", bulan: 3, tahun: 2025,
    pemilik: "Dinas Pendidikan", file: "sk_pengawas_sekolah.pdf", versi: 1,
    tanggal_upload: "2025-03-01", file_size: "800 KB", catatan: "SK Pengawas SD",
    riwayat_versi: [],
  },
  {
    id: "4", jenis_dokumen: "Dokumen Siswa", sekolah_id: "3", bulan: 7, tahun: 2025,
    pemilik: "Tata Usaha", file: "data_siswa_baru.xlsx", versi: 1,
    tanggal_upload: "2025-07-20", file_size: "3.1 MB", catatan: "",
    riwayat_versi: [],
  },
  {
    id: "5", jenis_dokumen: "Dokumen GTK", sekolah_id: "4", bulan: 8, tahun: 2025,
    pemilik: "Operator GTK", file: "daftar_gtt_pts.pdf", versi: 1,
    tanggal_upload: "2025-08-12", file_size: "1.5 MB", catatan: "Daftar Guru Tidak Tetap",
    riwayat_versi: [],
  },
  {
    id: "6", jenis_dokumen: "Sarpras", sekolah_id: "5", bulan: 9, tahun: 2025,
    pemilik: "Sarpras", file: "inventaris_ruangan.xlsx", versi: 2,
    tanggal_upload: "2025-09-05", file_size: "4.2 MB", catatan: "Update inventaris kelas",
    riwayat_versi: [
      { versi: 1, file: "inventaris_ruangan_v1.xlsx", tanggal_upload: "2025-08-01", file_size: "3.8 MB" },
    ],
  },
  {
    id: "7", jenis_dokumen: "SPMB", sekolah_id: "6", bulan: 10, tahun: 2025,
    pemilik: "Panitia SPMB", file: "rekap_pendaftar_spmb.pdf", versi: 1,
    tanggal_upload: "2025-10-15", file_size: "2.0 MB", catatan: "",
    riwayat_versi: [],
  },
  {
    id: "8", jenis_dokumen: "Kegiatan", sekolah_id: "1", bulan: 11, tahun: 2025,
    pemilik: "Panitia", file: "proposal_kegiatan_lomba.docx", versi: 1,
    tanggal_upload: "2025-11-01", file_size: "1.8 MB", catatan: "Proposal lomba Hardiknas",
    riwayat_versi: [],
  },
  {
    id: "9", jenis_dokumen: "Monitoring", sekolah_id: "2", bulan: 12, tahun: 2025,
    pemilik: "Pengawas", file: "laporan_monitoring_akm.pdf", versi: 1,
    tanggal_upload: "2025-12-10", file_size: "2.7 MB", catatan: "",
    riwayat_versi: [],
  },
  {
    id: "10", jenis_dokumen: "Laporan", sekolah_id: "3", bulan: 6, tahun: 2026,
    pemilik: "Bendahara BOS", file: "laporan_bos_triwulan_2.pdf", versi: 3,
    tanggal_upload: "2026-06-20", file_size: "5.0 MB", catatan: "Revisi setelah verifikasi",
    riwayat_versi: [
      { versi: 1, file: "laporan_bos_triwulan_2_v1.pdf", tanggal_upload: "2026-06-10", file_size: "4.5 MB" },
      { versi: 2, file: "laporan_bos_triwulan_2_v2.pdf", tanggal_upload: "2026-06-15", file_size: "4.8 MB" },
    ],
  },
];

export default function ArsipPage() {
  const { data: session } = useSession();

  const [data, setData] = useState<Arsip[]>(initialData);
  const [loading, setLoading] = useState(false);
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

  function handleDelete() {
    if (!confirmDelete) return;
    setData((prev) => prev.filter((a) => a.id !== confirmDelete));
    setConfirmDelete(null);
  }

  function handleSave() {
    const payload = {
      ...form,
      versi: editingId
        ? form.versi
        : 1,
    };
    if (editingId) {
      setData((prev) =>
        prev.map((a) => (a.id === editingId ? { ...payload, id: editingId } : a))
      );
    } else {
      const newId = String(Date.now());
      setData((prev) => [...prev, { ...payload, id: newId }]);
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
