"use client";

import { useState, useMemo, useEffect, useCallback } from "react";
import toast from "react-hot-toast";
import { useSession } from "next-auth/react";
import {
  Archive,
  Plus,
  Eye,
  Trash2,
  Download,
  Search,
  Upload,
  FileDown,
  FileUp,
  X,
  FileText,
  Image,
  File,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/Card";
import { Modal } from "@/components/ui/Modal";
import { Badge } from "@/components/ui/Badge";
import { Input, Select } from "@/components/ui/Input";
import Button from "@/components/ui/Button";
import { Loading } from "@/components/ui/Loading";
import { EmptyState } from "@/components/ui/EmptyState";
import { formatDate, getBulanName } from "@/lib/utils";
import type { ColumnDef } from "@tanstack/react-table";
import { DataTable } from "@/components/ui/Table";

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
  | "Lainnya"
  | "BPJS Kesehatan"
  | "Ijazah"
  | "KTP"
  | "Kartu Keluarga"
  | "NPWP"
  | "Pass Foto"
  | "SK PPPK PW"
  | "SK Penugasan"
  | "Sertifikat Pendidik";

interface ArsipRow {
  id: string;
  jenis_dokumen: JenisDokumen;
  sekolah_id: string;
  sekolah_nama?: string;
  bulan: number;
  tahun: number;
  pemilik: string;
  file: string;
  file_name?: string;
  versi: number;
  tanggal_upload: string;
}

interface SekolahOption {
  id: string;
  nama: string;
}

interface StatsData {
  total: number;
  byJenis: { jenis_dokumen: string; count: number }[];
}

const sekolahList: SekolahOption[] = [];

const jenisDokumenList: JenisDokumen[] = [
  "Surat", "Laporan", "SK", "Dokumen Siswa", "Dokumen GTK", "Sarpras",
  "SPMB", "Kegiatan", "Monitoring", "Lainnya", "BPJS Kesehatan", "Ijazah",
  "KTP", "Kartu Keluarga", "NPWP", "Pass Foto", "SK PPPK PW", "SK Penugasan",
  "Sertifikat Pendidik",
];

const jenisDokumenBadge: Record<string, "default" | "success" | "warning" | "danger" | "info"> = {
  Surat: "info",
  Laporan: "success",
  SK: "warning",
  "Dokumen Siswa": "default",
  "Dokumen GTK": "danger",
  Sarpras: "info",
  SPMB: "warning",
  Kegiatan: "success",
  Monitoring: "default",
  Lainnya: "default",
  "BPJS Kesehatan": "info",
  Ijazah: "success",
  KTP: "info",
  "Kartu Keluarga": "info",
  NPWP: "warning",
  "Pass Foto": "success",
  "SK PPPK PW": "warning",
  "SK Penugasan": "warning",
  "Sertifikat Pendidik": "success",
};

const bulanOptions = Array.from({ length: 12 }, (_, i) => ({
  value: String(i + 1),
  label: getBulanName(i + 1),
}));

const tahunOptions = Array.from({ length: 8 }, (_, i) => {
  const year = new Date().getFullYear() - 3 + i;
  return { value: String(year), label: String(year) };
});

interface FormState {
  jenis_dokumen: string;
  sekolah_id: string;
  bulan: number;
  tahun: number;
  pemilik: string;
  file: string;
  file_name: string;
}

const defaultForm: FormState = {
  jenis_dokumen: "Surat",
  sekolah_id: "",
  bulan: new Date().getMonth() + 1,
  tahun: new Date().getFullYear(),
  pemilik: "",
  file: "",
  file_name: "",
};

export default function ArsipPage() {
  const { data: session } = useSession();
  const isOperator = session?.user?.role === "operator_sekolah";
  const userSekolahId = session?.user?.sekolah_id;

  const [data, setData] = useState<ArsipRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [sekolahOpts, setSekolahOpts] = useState<SekolahOption[]>([]);
  const [stats, setStats] = useState<StatsData>({ total: 0, byJenis: [] });

  const [filterSearch, setFilterSearch] = useState("");
  const [filterJenis, setFilterJenis] = useState("");
  const [filterSekolah, setFilterSekolah] = useState("");
  const [filterTahun, setFilterTahun] = useState("");

  const [selectedArsip, setSelectedArsip] = useState<ArsipRow | null>(null);

  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>(defaultForm);
  const [gtkPegawai, setGtkPegawai] = useState<string[]>([]);
  const [loadingPegawai, setLoadingPegawai] = useState(false);

  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

  const [importModalOpen, setImportModalOpen] = useState(false);
  const [importData, setImportData] = useState("");

  const fetchData = useCallback(() => {
    const params = new URLSearchParams();
    if (isOperator && userSekolahId) params.set("sekolah_id", userSekolahId);
    const url = `/api/arsip${params.toString() ? "?" + params.toString() : ""}`;
    fetch(url)
      .then((r) => r.json())
      .then((d) => { setData(d); setLoading(false); })
      .catch(() => setLoading(false));
  }, [isOperator, userSekolahId]);

  const fetchStats = useCallback(() => {
    fetch("/api/arsip/stats")
      .then((r) => r.json())
      .then((d) => setStats(d))
      .catch(() => {});
  }, []);

  useEffect(() => {
    fetchData();
    fetchStats();
    fetch("/api/sekolah")
      .then((r) => r.json())
      .then((d) => setSekolahOpts(d.map((s: any) => ({ id: s.id, nama: s.nama }))))
      .catch(() => {});
  }, [fetchData, fetchStats]);

  useEffect(() => {
    if (!form.sekolah_id) { setGtkPegawai([]); return; }
    setLoadingPegawai(true);
    fetch(`/api/gtk?sekolah_id=${form.sekolah_id}`)
      .then((r) => r.json())
      .then((d) => {
        setGtkPegawai(d.map((g: any) => g.nama).filter((n: string) => n.trim()));
        setLoadingPegawai(false);
      })
      .catch(() => setLoadingPegawai(false));
  }, [form.sekolah_id]);

  const filteredData = useMemo(() => {
    let result = data;
    if (filterSearch) {
      const q = filterSearch.toLowerCase();
      result = result.filter(
        (a) =>
          (a.file_name || "").toLowerCase().includes(q) ||
          a.pemilik.toLowerCase().includes(q) ||
          a.jenis_dokumen.toLowerCase().includes(q) ||
          (a.sekolah_nama || "").toLowerCase().includes(q)
      );
    }
    if (filterJenis) result = result.filter((a) => a.jenis_dokumen === filterJenis);
    if (filterSekolah) result = result.filter((a) => a.sekolah_id === filterSekolah);
    if (filterTahun) result = result.filter((a) => a.tahun === Number(filterTahun));
    return result;
  }, [data, filterSearch, filterJenis, filterSekolah, filterTahun]);

  const columns: ColumnDef<ArsipRow>[] = useMemo(
    () => [
      {
        accessorKey: "jenis_dokumen",
        header: "Jenis",
        cell: ({ row }) => (
          <Badge variant={jenisDokumenBadge[row.original.jenis_dokumen] || "default"}>
            {row.original.jenis_dokumen}
          </Badge>
        ),
      },
      {
        accessorKey: "sekolah_nama",
        header: "Sekolah",
        cell: ({ row }) => (
          <span className="text-xs">{row.original.sekolah_nama || "-"}</span>
        ),
      },
      {
        accessorKey: "pemilik",
        header: "Pemilik",
      },
      {
        accessorKey: "file_name",
        header: "File",
        cell: ({ row }) => (
          <span className="max-w-[160px] truncate block" title={row.original.file_name}>
            {row.original.file_name || "-"}
          </span>
        ),
      },
      {
        accessorKey: "tahun",
        header: "Tahun",
        cell: ({ row }) => (
          <span className="text-xs">
            {row.original.bulan ? getBulanName(row.original.bulan) + " " : ""}
            {row.original.tahun}
          </span>
        ),
      },
      {
        accessorKey: "versi",
        header: "Ver",
        cell: ({ row }) => (
          <span className="text-xs text-gray-400">v{row.original.versi}</span>
        ),
      },
      {
        accessorKey: "tanggal_upload",
        header: "Tgl Upload",
        cell: ({ row }) => (
          <span className="text-xs text-gray-500">{formatDate(row.original.tanggal_upload, "dd/MM/yy")}</span>
        ),
      },
      {
        id: "actions",
        header: "",
        cell: ({ row }) => (
          <div className="flex items-center gap-1">
            <button
              onClick={(e) => { e.stopPropagation(); setSelectedArsip(row.original); }}
              className="p-1 text-blue-600 hover:bg-blue-100 rounded"
              title="Lihat"
            >
              <Eye className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); handleDownload(row.original); }}
              className="p-1 text-green-600 hover:bg-green-100 rounded"
              title="Unduh"
            >
              <Download className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); setConfirmDelete(row.original.id); }}
              className="p-1 text-red-600 hover:bg-red-100 rounded"
              title="Hapus"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        ),
      },
    ],
    []
  );

  function handleDownload(arsip: ArsipRow) {
    window.open(`/api/arsip?id=${arsip.id}&download=1`, "_blank");
  }

  async function handleDelete() {
    if (!confirmDelete) return;
    try {
      await fetch(`/api/arsip?id=${confirmDelete}`, { method: "DELETE" });
      setData((prev) => prev.filter((a) => a.id !== confirmDelete));
      if (selectedArsip?.id === confirmDelete) setSelectedArsip(null);
      toast.success("Arsip berhasil dihapus");
    } catch {
      toast.error("Gagal menghapus arsip");
    }
    setConfirmDelete(null);
  }

  function openAddModal() {
    setEditingId(null);
    setForm({
      ...defaultForm,
      sekolah_id: isOperator && userSekolahId ? userSekolahId : "",
    });
    setModalOpen(true);
  }

  function openEditModal(arsip: ArsipRow) {
    setEditingId(arsip.id);
    setForm({
      jenis_dokumen: arsip.jenis_dokumen,
      sekolah_id: arsip.sekolah_id,
      bulan: arsip.bulan,
      tahun: arsip.tahun,
      pemilik: arsip.pemilik,
      file: "",
      file_name: arsip.file_name || "",
    });
    setModalOpen(true);
  }

  async function handleSave() {
    try {
      const payload = {
        jenis_dokumen: form.jenis_dokumen,
        sekolah_id: form.sekolah_id,
        bulan: form.bulan,
        tahun: form.tahun,
        pemilik: form.pemilik,
        file: form.file,
        file_name: form.file_name,
      };
      if (editingId) {
        const res = await fetch("/api/arsip", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id: editingId, ...payload }),
        });
        if (res.ok) { toast.success("Arsip berhasil diperbarui"); fetchData(); fetchStats(); }
        else { toast.error("Gagal memperbarui arsip"); return; }
      } else {
        const res = await fetch("/api/arsip", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ...payload, versi: 1 }),
        });
        if (res.ok) { toast.success("Arsip berhasil ditambahkan"); fetchData(); fetchStats(); }
        else { toast.error("Gagal menambahkan arsip"); return; }
      }
    } catch {
      toast.error("Gagal menyimpan arsip");
    }
    setModalOpen(false);
  }

  async function handleImport() {
    try {
      let items;
      try { items = JSON.parse(importData); }
      catch { toast.error("Format JSON tidak valid"); return; }
      if (!Array.isArray(items)) { toast.error("Data harus berupa array"); return; }
      const res = await fetch("/api/arsip/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ items }),
      });
      const result = await res.json();
      if (res.ok) {
        toast.success(`Berhasil import ${result.imported} arsip`);
        setImportModalOpen(false);
        setImportData("");
        fetchData();
        fetchStats();
      } else {
        toast.error(result.error || "Import gagal");
      }
    } catch {
      toast.error("Gagal import data");
    }
  }

  function updateForm(key: keyof FormState, value: string | number) {
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
              <p className="text-sm text-gray-500 mt-0.5">
                {stats.total} dokumen &middot; Kecamatan Lemahabang
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <Button size="sm" variant="outline" onClick={() => window.open("/api/arsip/export?format=csv", "_blank")}>
              <FileDown className="w-4 h-4 mr-1.5" />
              Export CSV
            </Button>
            <Button size="sm" variant="outline" onClick={() => window.open("/api/arsip/export?format=json", "_blank")}>
              <FileDown className="w-4 h-4 mr-1.5" />
              Export JSON
            </Button>
            <Button size="sm" variant="outline" onClick={() => setImportModalOpen(true)}>
              <FileUp className="w-4 h-4 mr-1.5" />
              Import
            </Button>
            <Button size="sm" onClick={openAddModal}>
              <Plus className="w-4 h-4 mr-1.5" />
              Tambah
            </Button>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
          <Card>
            <CardContent className="p-3 text-center">
              <div className="text-2xl font-bold text-blue-600">{stats.total}</div>
              <div className="text-[11px] text-gray-500 mt-0.5">Total Arsip</div>
            </CardContent>
          </Card>
          {stats.byJenis.slice(0, 4).map((j) => (
            <Card key={j.jenis_dokumen}>
              <CardContent className="p-3 text-center">
                <div className="text-2xl font-bold text-gray-800">{j.count}</div>
                <div className="text-[11px] text-gray-500 mt-0.5 truncate">{j.jenis_dokumen}</div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Main Content: Two Columns */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column: Filters + Table */}
          <div className="lg:col-span-2 space-y-4">
            <Card>
              <div className="flex flex-wrap items-center gap-3">
                <div className="relative flex-1 min-w-[180px]">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    value={filterSearch}
                    onChange={(e) => setFilterSearch(e.target.value)}
                    placeholder="Cari arsip..."
                    className="w-full pl-10 pr-4 py-1.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <select
                  value={filterJenis}
                  onChange={(e) => setFilterJenis(e.target.value)}
                  className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Semua Jenis</option>
                  {jenisDokumenList.map((j) => (
                    <option key={j} value={j}>{j}</option>
                  ))}
                </select>
                {!isOperator && (
                  <select
                    value={filterSekolah}
                    onChange={(e) => setFilterSekolah(e.target.value)}
                    className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Semua Sekolah</option>
                    {sekolahOpts.map((s) => (
                      <option key={s.id} value={s.id}>{s.nama}</option>
                    ))}
                  </select>
                )}
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
                {(filterSearch || filterJenis || filterSekolah || filterTahun) && (
                  <button
                    onClick={() => { setFilterSearch(""); setFilterJenis(""); setFilterSekolah(""); setFilterTahun(""); }}
                    className="text-xs text-blue-600 hover:underline whitespace-nowrap"
                  >
                    Reset filter
                  </button>
                )}
              </div>
            </Card>

            <Card>
              <CardContent className="p-0">
                {filteredData.length === 0 ? (
                  <div className="p-6">
                    <EmptyState
                      title="Belum ada arsip"
                      message="Klik tombol Tambah untuk menambahkan arsip baru."
                      icon={<Archive className="w-12 h-12 text-gray-300" />}
                    />
                  </div>
                ) : (
                  <div className="p-0">
                    <DataTable
                      columns={columns}
                      data={filteredData}
                      searchable={false}
                      pageSize={15}
                    />
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Right Column: Preview Panel */}
          <div className="lg:col-span-1">
            <Card>
              <CardContent className="p-0">
                {selectedArsip ? (
                  <div className="divide-y divide-gray-100">
                    <div className="flex items-center justify-between px-4 py-3">
                      <h3 className="text-sm font-semibold text-gray-800">Detail Arsip</h3>
                      <button onClick={() => setSelectedArsip(null)} className="p-1 text-gray-400 hover:text-gray-600">
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                    <div className="px-4 py-3 space-y-3 text-sm">
                      <div>
                        <span className="block text-[11px] font-medium text-gray-500">Jenis Dokumen</span>
                        <Badge variant={jenisDokumenBadge[selectedArsip.jenis_dokumen] || "default"}>
                          {selectedArsip.jenis_dokumen}
                        </Badge>
                      </div>
                      <div>
                        <span className="block text-[11px] font-medium text-gray-500">Sekolah</span>
                        <span className="text-sm">{selectedArsip.sekolah_nama || "-"}</span>
                      </div>
                      <div>
                        <span className="block text-[11px] font-medium text-gray-500">Pemilik</span>
                        <span className="text-sm">{selectedArsip.pemilik || "-"}</span>
                      </div>
                      <div>
                        <span className="block text-[11px] font-medium text-gray-500">Periode</span>
                        <span className="text-sm">
                          {selectedArsip.bulan ? getBulanName(selectedArsip.bulan) + " " : ""}
                          {selectedArsip.tahun}
                        </span>
                      </div>
                      <div>
                        <span className="block text-[11px] font-medium text-gray-500">Nama File</span>
                        <span className="text-sm text-gray-700 break-all">{selectedArsip.file_name || "-"}</span>
                      </div>
                      <div>
                        <span className="block text-[11px] font-medium text-gray-500">Versi</span>
                        <span className="text-sm">v{selectedArsip.versi}</span>
                      </div>
                      <div>
                        <span className="block text-[11px] font-medium text-gray-500">Tanggal Upload</span>
                        <span className="text-sm">{formatDate(selectedArsip.tanggal_upload)}</span>
                      </div>
                    </div>
                    <div className="px-4 py-3 flex gap-2">
                      <Button size="sm" variant="outline" className="flex-1" onClick={() => handleDownload(selectedArsip)}>
                        <Download className="w-3.5 h-3.5 mr-1" />
                        Unduh
                      </Button>
                      <Button size="sm" variant="secondary" className="flex-1" onClick={() => openEditModal(selectedArsip)}>
                        <FileText className="w-3.5 h-3.5 mr-1" />
                        Edit
                      </Button>
                    </div>
                    <FilePreview arsipId={selectedArsip.id} />
                  </div>
                ) : (
                  <div className="p-6 text-center text-gray-400">
                    <Eye className="w-10 h-10 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">Klik tombol Lihat pada baris arsip untuk melihat detail</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
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
            {isOperator ? (
              <input type="hidden" name="sekolah_id" value={userSekolahId || ""} />
            ) : (
              <Select
                label="Sekolah"
                id="sekolah_id"
                value={form.sekolah_id}
                onChange={(e) => updateForm("sekolah_id", e.target.value)}
                options={sekolahOpts.map((s) => ({ value: s.id, label: s.nama }))}
              />
            )}
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
            <Select
              label="Pemilik"
              id="pemilik"
              value={form.pemilik}
              onChange={(e) => updateForm("pemilik", e.target.value)}
              options={gtkPegawai.map((n) => ({ value: n, label: n }))}
              disabled={!form.sekolah_id || loadingPegawai}
              placeholder={loadingPegawai ? "Memuat..." : (!form.sekolah_id ? "Pilih sekolah dulu" : "Pilih pegawai")}
            />
            <Input
              label="Upload File"
              id="file"
              type="file"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) {
                  const reader = new FileReader();
                  reader.onload = () => {
                    updateForm("file", reader.result as string);
                    updateForm("file_name", f.name);
                  };
                  reader.readAsDataURL(f);
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

      {/* Modal Import */}
      <Modal
        open={importModalOpen}
        onClose={() => setImportModalOpen(false)}
        title="Import Arsip (JSON)"
        size="lg"
      >
        <div className="space-y-4">
          <p className="text-sm text-gray-600">
            Tempel data JSON array arsip di bawah ini. Contoh format:
          </p>
          <pre className="text-xs bg-gray-50 p-3 rounded-lg border overflow-x-auto">
{`[
  {
    "jenis_dokumen": "Surat",
    "sekolah_id": "...",
    "bulan": 6,
    "tahun": "2026",
    "pemilik": "Nama Pegawai",
    "file_name": "surat.pdf"
  }
]`}
          </pre>
          <textarea
            value={importData}
            onChange={(e) => setImportData(e.target.value)}
            rows={10}
            className="w-full border border-gray-300 rounded-lg p-3 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Paste JSON array here..."
          />
          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={() => setImportModalOpen(false)}>Batal</Button>
            <Button onClick={handleImport}>
              <Upload className="w-4 h-4 mr-1.5" />
              Import
            </Button>
          </div>
        </div>
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

function FilePreview({ arsipId }: { arsipId: string }) {
  const [fileData, setFileData] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    fetch(`/api/arsip?id=${arsipId}`)
      .then((r) => r.json())
      .then((d) => { setFileData(d.file); setLoading(false); })
      .catch(() => setLoading(false));
  }, [arsipId]);

  const isPdf = fileData?.startsWith("data:application/pdf");
  const isImage = fileData?.startsWith("data:image/");

  return (
    <div className="border-t border-gray-100">
      <div className="px-4 py-2 bg-gray-50">
        <h4 className="text-xs font-semibold text-gray-600">Pratinjau</h4>
      </div>
      <div className="p-2">
        {loading ? (
          <div className="flex items-center justify-center py-8 text-gray-400 text-xs">Memuat...</div>
        ) : fileData && isPdf ? (
          <iframe src={fileData} className="w-full h-[300px] rounded border" title="Preview" />
        ) : fileData && isImage ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={fileData} alt="" className="w-full h-auto max-h-[300px] object-contain rounded border" />
        ) : fileData ? (
          <div className="flex flex-col items-center justify-center py-8 text-gray-400">
            <File className="w-8 h-8 mb-2" />
            <span className="text-xs">Pratinjau tidak tersedia</span>
          </div>
        ) : (
          <div className="text-center py-8 text-gray-400 text-xs">File tidak ditemukan</div>
        )}
      </div>
    </div>
  );
}
