"use client";

import { useState, useMemo } from "react";
import { useSession } from "next-auth/react";
import {
  Monitor,
  Plus,
  Eye,
  Pencil,
  Trash2,
  AlertTriangle,
  Clock,
  CheckCircle,
} from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { DataTable } from "@/components/ui/Table";
import { Modal } from "@/components/ui/Modal";
import { Input, Select, Textarea } from "@/components/ui/Input";
import Button from "@/components/ui/Button";
import { Loading } from "@/components/ui/Loading";
import { EmptyState } from "@/components/ui/EmptyState";
import { Badge } from "@/components/ui/Badge";
import { formatDate } from "@/lib/utils";
import type { ColumnDef } from "@tanstack/react-table";

type JenisMonitoring = "Akademik" | "Administrasi" | "Sarpras" | "Keuangan" | "Lainnya";
type StatusMonitoring = "tertunda" | "ditindaklanjuti" | "selesai";

interface Monitoring {
  id: string;
  sekolah_id: string;
  tanggal: string;
  petugas: string;
  jenis_monitoring: JenisMonitoring;
  instrumen: string;
  temuan: string;
  rekomendasi: string;
  tindak_lanjut: string;
  batas_waktu: string;
  bukti_foto: string;
  status: StatusMonitoring;
}

interface TimelineEntry {
  tanggal: string;
  aksi: string;
  petugas: string;
  status: StatusMonitoring;
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

const jenisOptions: JenisMonitoring[] = [
  "Akademik",
  "Administrasi",
  "Sarpras",
  "Keuangan",
  "Lainnya",
];

const statusOptions: StatusMonitoring[] = [
  "tertunda",
  "ditindaklanjuti",
  "selesai",
];

const statusBadge: Record<StatusMonitoring, "warning" | "info" | "success"> = {
  tertunda: "warning",
  ditindaklanjuti: "info",
  selesai: "success",
};

const statusLabel: Record<StatusMonitoring, string> = {
  tertunda: "Tertunda",
  ditindaklanjuti: "Ditindaklanjuti",
  selesai: "Selesai",
};

const timelineData: Record<string, TimelineEntry[]> = {
  "1": [
    { tanggal: "2025-07-10", aksi: "Monitoring dilaksanakan", petugas: "Tim Pengawas", status: "tertunda" },
    { tanggal: "2025-07-15", aksi: "Temuan dilaporkan ke sekolah", petugas: "Tim Pengawas", status: "ditindaklanjuti" },
    { tanggal: "2025-07-20", aksi: "Sekolah mengirimkan tindak lanjut", petugas: "Kepala Sekolah", status: "ditindaklanjuti" },
    { tanggal: "2025-07-28", aksi: "Verifikasi tindak lanjut selesai", petugas: "Tim Pengawas", status: "selesai" },
  ],
  "2": [
    { tanggal: "2025-08-05", aksi: "Monitoring dilaksanakan", petugas: "Tim Pengawas", status: "tertunda" },
    { tanggal: "2025-08-10", aksi: "Temuan dilaporkan ke sekolah", petugas: "Tim Pengawas", status: "ditindaklanjuti" },
  ],
  "3": [
    { tanggal: "2025-08-20", aksi: "Monitoring dilaksanakan", petugas: "Tim Pengawas", status: "tertunda" },
  ],
};

const initialData: Monitoring[] = [
  {
    id: "1",
    sekolah_id: "1",
    tanggal: "2025-07-10",
    petugas: "Drs. Ahmad Suherman",
    jenis_monitoring: "Akademik",
    instrumen: "instrumen_akademik_1.pdf",
    temuan: "Kurangnya media pembelajaran interaktif di kelas 1-3. Guru belum menggunakan metode pembelajaran berbasis teknologi.",
    rekomendasi: "Sekolah perlu mengadakan pelatihan IT untuk guru dan mengalokasikan dana BOS untuk pengadaan media pembelajaran interaktif.",
    tindak_lanjut: "Sekolah telah mengajukan proposal pengadaan LCD proyektor dan pelatihan IT guru untuk semester depan.",
    batas_waktu: "2025-09-10",
    bukti_foto: "foto_monitoring_1.jpg",
    status: "selesai",
  },
  {
    id: "2",
    sekolah_id: "2",
    tanggal: "2025-08-05",
    petugas: "Hj. Siti Maryam, S.Pd.",
    jenis_monitoring: "Administrasi",
    instrumen: "ceklist_administrasi_2.pdf",
    temuan: "Dokumen administrasi kelas belum lengkap. Beberapa RPP tidak sesuai dengan format terbaru kurikulum merdeka.",
    rekomendasi: "Melengkapi dokumen administrasi kelas dan merevisi RPP sesuai format kurikulum merdeka.",
    tindak_lanjut: "Sedang dalam proses revisi RPP oleh tim guru kelas.",
    batas_waktu: "2025-10-05",
    bukti_foto: "",
    status: "ditindaklanjuti",
  },
  {
    id: "3",
    sekolah_id: "3",
    tanggal: "2025-08-20",
    petugas: "Drs. H. Edi Sumantri",
    jenis_monitoring: "Sarpras",
    instrumen: "ceklist_sarpras_3.pdf",
    temuan: "Atap ruang kelas IV bocor saat hujan. WC siswa rusak dan tidak berfungsi.",
    rekomendasi: "Perbaikan atap dan renovasi WC siswa harus segera dilakukan sebelum tahun ajaran baru.",
    tindak_lanjut: "",
    batas_waktu: "2025-11-20",
    bukti_foto: "foto_atap_bocor.jpg",
    status: "tertunda",
  },
  {
    id: "4",
    sekolah_id: "4",
    tanggal: "2025-06-15",
    petugas: "Ibu Yuniarti, S.Pd.",
    jenis_monitoring: "Keuangan",
    instrumen: "ceklist_keuangan_4.pdf",
    temuan: "Laporan penggunaan dana BOS triwulan II belum disusun. Terdapat selisih pencatatan kas kecil sebesar Rp 250.000.",
    rekomendasi: "Segera menyusun laporan BOS triwulan II dan melakukan audit internal kas kecil.",
    tindak_lanjut: "Laporan BOS sudah selesai disusun dan diverifikasi oleh tim pengawas. Selisih kas kecil sudah ditemukan penyebabnya.",
    batas_waktu: "2025-08-15",
    bukti_foto: "",
    status: "selesai",
  },
  {
    id: "5",
    sekolah_id: "5",
    tanggal: "2025-09-01",
    petugas: "K. Ahmad Fauzi, S.Ag.",
    jenis_monitoring: "Lainnya",
    instrumen: "ceklist_ekstra_5.pdf",
    temuan: "Kegiatan ekstrakurikuler belum berjalan optimal. Jadwal ekstrakurikuler bentrok dengan jadwal pondok pesantren.",
    rekomendasi: "Menyusun ulang jadwal ekstrakurikuler dengan mempertimbangkan jadwal pondok pesantren.",
    tindak_lanjut: "Sedang dilakukan koordinasi dengan pihak pondok pesantren untuk penyesuaian jadwal.",
    batas_waktu: "2025-11-01",
    bukti_foto: "",
    status: "ditindaklanjuti",
  },
  {
    id: "6",
    sekolah_id: "6",
    tanggal: "2025-05-10",
    petugas: "Dra. Hj. Nurhayati",
    jenis_monitoring: "Akademik",
    instrumen: "instrumen_akademik_6.pdf",
    temuan: "Nilai rata-rata UTS siswa kelas 4-6 di bawah KKM pada mata pelajaran Matematika dan IPA.",
    rekomendasi: "Program remedial dan pengayaan harus dijalankan secara intensif. Guru mapel perlu mengikuti bimbingan teknis.",
    tindak_lanjut: "Program remedial sudah berjalan setiap hari Sabtu. Guru sudah mengikuti bimtek Matematika dan IPA.",
    batas_waktu: "2025-08-10",
    bukti_foto: "",
    status: "selesai",
  },
  {
    id: "7",
    sekolah_id: "1",
    tanggal: "2025-09-15",
    petugas: "Drs. Ahmad Suherman",
    jenis_monitoring: "Administrasi",
    instrumen: "ceklist_dapodik_7.pdf",
    temuan: "Data Dapodik belum terupdate untuk 5 siswa pindah dan 3 guru baru. Terdapat ketidaksesuaian data rombel.",
    rekomendasi: "Operator Dapodik harus segera melakukan update data dan verifikasi ulang data rombel.",
    tindak_lanjut: "",
    batas_waktu: "2025-11-15",
    bukti_foto: "",
    status: "tertunda",
  },
  {
    id: "8",
    sekolah_id: "2",
    tanggal: "2025-04-20",
    petugas: "Hj. Siti Maryam, S.Pd.",
    jenis_monitoring: "Sarpras",
    instrumen: "ceklist_sarpras_8.pdf",
    temuan: "Perpustakaan sekolah kekurangan buku bacaan untuk siswa kelas 1-3. Rak buku beberapa dalam kondisi rusak.",
    rekomendasi: "Pengadaan buku bacaan bergambar untuk kelas rendah dan perbaikan rak buku.",
    tindak_lanjut: "Buku bacaan baru sudah diadakan sebanyak 100 eksemplar. Rak buku sudah diperbaiki.",
    batas_waktu: "2025-07-20",
    bukti_foto: "foto_perpustakaan_baru.jpg",
    status: "selesai",
  },
];

const defaultForm: Monitoring = {
  id: "",
  sekolah_id: "",
  tanggal: "",
  petugas: "",
  jenis_monitoring: "Akademik",
  instrumen: "",
  temuan: "",
  rekomendasi: "",
  tindak_lanjut: "",
  batas_waktu: "",
  bukti_foto: "",
  status: "tertunda",
};

export default function MonitoringPage() {
  const { data: session } = useSession();

  const [data, setData] = useState<Monitoring[]>(initialData);
  const [loading, setLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<Monitoring>(defaultForm);
  const [viewing, setViewing] = useState<Monitoring | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const [filterSekolah, setFilterSekolah] = useState("");
  const [filterJenis, setFilterJenis] = useState("");
  const [filterStatus, setFilterStatus] = useState("");

  const filteredData = useMemo(() => {
    let result = data;
    if (filterSekolah) result = result.filter((m) => m.sekolah_id === filterSekolah);
    if (filterJenis) result = result.filter((m) => m.jenis_monitoring === filterJenis);
    if (filterStatus) result = result.filter((m) => m.status === filterStatus);
    return result;
  }, [data, filterSekolah, filterJenis, filterStatus]);

  const columns: ColumnDef<Monitoring>[] = [
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
      header: "Tanggal",
      accessorKey: "tanggal",
      cell: ({ row }) => formatDate(row.original.tanggal),
    },
    { header: "Petugas", accessorKey: "petugas" },
    { header: "Jenis Monitoring", accessorKey: "jenis_monitoring" },
    {
      header: "Status",
      accessorKey: "status",
      cell: ({ row }) => (
        <Badge variant={statusBadge[row.original.status]}>
          {statusLabel[row.original.status]}
        </Badge>
      ),
    },
    {
      header: "Batas Waktu",
      accessorKey: "batas_waktu",
      cell: ({ row }) =>
        row.original.batas_waktu ? formatDate(row.original.batas_waktu) : "-",
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

  function handleEdit(monitoring: Monitoring) {
    setEditingId(monitoring.id);
    setForm(monitoring);
    setModalOpen(true);
  }

  function handleDelete() {
    if (!confirmDelete) return;
    setData((prev) => prev.filter((m) => m.id !== confirmDelete));
    setConfirmDelete(null);
  }

  function handleSave() {
    if (editingId) {
      setData((prev) =>
        prev.map((m) => (m.id === editingId ? { ...form, id: editingId } : m))
      );
    } else {
      const newId = String(Date.now());
      setData((prev) => [...prev, { ...form, id: newId }]);
    }
    setModalOpen(false);
  }

  function updateForm(key: keyof Monitoring, value: string) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  if (loading) return <Loading message="Memuat data monitoring..." />;

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="max-w-7xl mx-auto px-4 py-6 space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-blue-50 text-blue-600">
              <Monitor className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Monitoring</h1>
              <p className="text-sm text-gray-500 mt-0.5">Kecamatan Lemahabang</p>
            </div>
          </div>
          <Button onClick={openAddModal}>
            <Plus className="w-4 h-4 mr-2" />
            Tambah Monitoring
          </Button>
        </div>

        {/* Summary */}
        <div className="grid grid-cols-3 gap-4">
          <Card>
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-red-50 text-red-600">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{data.filter((m) => m.status === "tertunda").length}</p>
                <p className="text-sm text-gray-500">Tertunda</p>
              </div>
            </div>
          </Card>
          <Card>
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-blue-50 text-blue-600">
                <Clock className="w-5 h-5" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{data.filter((m) => m.status === "ditindaklanjuti").length}</p>
                <p className="text-sm text-gray-500">Ditindaklanjuti</p>
              </div>
            </div>
          </Card>
          <Card>
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-green-50 text-green-600">
                <CheckCircle className="w-5 h-5" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{data.filter((m) => m.status === "selesai").length}</p>
                <p className="text-sm text-gray-500">Selesai</p>
              </div>
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
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Semua Status</option>
              {statusOptions.map((s) => (
                <option key={s} value={s}>{statusLabel[s]}</option>
              ))}
            </select>
          </div>
        </Card>

        {/* Table */}
        <Card>
          <CardContent>
            {filteredData.length === 0 ? (
              <EmptyState
                title="Belum ada data monitoring"
                message="Klik tombol Tambah Monitoring untuk menambahkan data."
                icon={<Monitor className="w-12 h-12 text-gray-300" />}
              />
            ) : (
              <DataTable
                columns={columns}
                data={filteredData}
                searchPlaceholder="Cari sekolah, petugas..."
              />
            )}
          </CardContent>
        </Card>
      </div>

      {/* Modal Tambah/Edit */}
      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingId ? "Edit Monitoring" : "Tambah Monitoring"}
        size="xl"
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Select
            label="Sekolah"
            id="sekolah_id"
            value={form.sekolah_id}
            onChange={(e) => updateForm("sekolah_id", e.target.value)}
            options={sekolahList.map((s) => ({ value: s.id, label: s.nama }))}
          />
          <Input
            label="Tanggal"
            id="tanggal"
            type="date"
            value={form.tanggal}
            onChange={(e) => updateForm("tanggal", e.target.value)}
          />
          <Input
            label="Petugas"
            id="petugas"
            value={form.petugas}
            onChange={(e) => updateForm("petugas", e.target.value)}
            placeholder="Nama petugas monitoring"
          />
          <Select
            label="Jenis Monitoring"
            id="jenis_monitoring"
            value={form.jenis_monitoring}
            onChange={(e) => updateForm("jenis_monitoring", e.target.value)}
            options={jenisOptions.map((j) => ({ value: j, label: j }))}
          />
          <Input
            label="Instrumen (File)"
            id="instrumen"
            type="file"
            onChange={(e) => updateForm("instrumen", e.target.value)}
          />
          <Input
            label="Batas Waktu"
            id="batas_waktu"
            type="date"
            value={form.batas_waktu}
            onChange={(e) => updateForm("batas_waktu", e.target.value)}
          />
          <Input
            label="Bukti Foto (File)"
            id="bukti_foto"
            type="file"
            onChange={(e) => updateForm("bukti_foto", e.target.value)}
          />
          <Select
            label="Status"
            id="status"
            value={form.status}
            onChange={(e) => updateForm("status", e.target.value)}
            options={statusOptions.map((s) => ({ value: s, label: statusLabel[s] }))}
          />
          <div className="md:col-span-2">
            <Textarea
              label="Temuan"
              id="temuan"
              value={form.temuan}
              onChange={(e) => updateForm("temuan", e.target.value)}
              rows={3}
              placeholder="Deskripsi temuan monitoring"
            />
          </div>
          <div className="md:col-span-2">
            <Textarea
              label="Rekomendasi"
              id="rekomendasi"
              value={form.rekomendasi}
              onChange={(e) => updateForm("rekomendasi", e.target.value)}
              rows={3}
              placeholder="Rekomendasi tindak lanjut"
            />
          </div>
          <div className="md:col-span-2">
            <Textarea
              label="Tindak Lanjut"
              id="tindak_lanjut"
              value={form.tindak_lanjut}
              onChange={(e) => updateForm("tindak_lanjut", e.target.value)}
              rows={3}
              placeholder="Tindak lanjut yang sudah dilakukan"
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
        title="Detail Monitoring"
        size="lg"
      >
        {viewing && (
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <DetailField
                label="Sekolah"
                value={sekolahList.find((s) => s.id === viewing.sekolah_id)?.nama || "-"}
              />
              <DetailField label="Tanggal" value={formatDate(viewing.tanggal)} />
              <DetailField label="Petugas" value={viewing.petugas} />
              <DetailField
                label="Jenis Monitoring"
                value={viewing.jenis_monitoring}
              />
              <DetailField
                label="Status"
                value={
                  <Badge variant={statusBadge[viewing.status]}>
                    {statusLabel[viewing.status]}
                  </Badge>
                }
              />
              <DetailField label="Batas Waktu" value={viewing.batas_waktu ? formatDate(viewing.batas_waktu) : "-"} />
              {viewing.instrumen && <DetailField label="Instrumen" value={viewing.instrumen} />}
              {viewing.bukti_foto && <DetailField label="Bukti Foto" value={viewing.bukti_foto} />}
            </div>

            <div>
              <h4 className="text-sm font-semibold text-gray-700 mb-2">Temuan</h4>
              <p className="text-sm text-gray-600 bg-gray-50 rounded-lg p-3">{viewing.temuan}</p>
            </div>

            <div>
              <h4 className="text-sm font-semibold text-gray-700 mb-2">Rekomendasi</h4>
              <p className="text-sm text-gray-600 bg-blue-50 rounded-lg p-3">{viewing.rekomendasi}</p>
            </div>

            <div>
              <h4 className="text-sm font-semibold text-gray-700 mb-2">Tindak Lanjut</h4>
              <p className="text-sm text-gray-600 bg-green-50 rounded-lg p-3">
                {viewing.tindak_lanjut || "Belum ada tindak lanjut"}
              </p>
            </div>

            {/* Timeline */}
            <div>
              <h4 className="text-sm font-semibold text-gray-700 mb-3">Timeline Progress</h4>
              <div className="space-y-0">
                {(timelineData[viewing.id] || []).map((entry, idx) => (
                  <div key={idx} className="flex gap-3">
                    <div className="flex flex-col items-center">
                      <div className={`w-3 h-3 rounded-full border-2 ${
                        entry.status === "selesai"
                          ? "bg-green-500 border-green-500"
                          : entry.status === "ditindaklanjuti"
                            ? "bg-blue-500 border-blue-500"
                            : "bg-yellow-500 border-yellow-500"
                      }`} />
                      {idx < (timelineData[viewing.id] || []).length - 1 && (
                        <div className="w-0.5 h-full bg-gray-200" />
                      )}
                    </div>
                    <div className="pb-4 flex-1">
                      <div className="flex items-center gap-2">
                        <p className="text-xs text-gray-400">{formatDate(entry.tanggal)}</p>
                        <Badge variant={statusBadge[entry.status]}>{statusLabel[entry.status]}</Badge>
                      </div>
                      <p className="text-sm text-gray-700 mt-0.5">{entry.aksi}</p>
                      <p className="text-xs text-gray-400 mt-0.5">Oleh: {entry.petugas}</p>
                    </div>
                  </div>
                ))}
              </div>
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
          Apakah Anda yakin ingin menghapus data monitoring ini? Tindakan ini tidak dapat dibatalkan.
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
