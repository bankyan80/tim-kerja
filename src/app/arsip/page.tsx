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
import { Modal } from "@/components/ui/Modal";
import { Badge } from "@/components/ui/Badge";
import { Input, Select } from "@/components/ui/Input";
import Button from "@/components/ui/Button";
import { Loading } from "@/components/ui/Loading";
import { EmptyState } from "@/components/ui/EmptyState";
import { formatDate, getBulanName } from "@/lib/utils";

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
  file_name: string;
  versi: number;
  tanggal_upload: string;
  sekolah_nama?: string;
}

interface SekolahOption {
  id: string;
  nama: string;
}

const sekolahList: SekolahOption[] = [];

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
  "BPJS Kesehatan",
  "Ijazah",
  "KTP",
  "Kartu Keluarga",
  "NPWP",
  "Pass Foto",
  "SK PPPK PW",
  "SK Penugasan",
  "Sertifikat Pendidik",
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
  "BPJS Kesehatan": { variant: "info" },
  Ijazah: { variant: "success" },
  KTP: { variant: "info" },
  "Kartu Keluarga": { variant: "info" },
  NPWP: { variant: "warning" },
  "Pass Foto": { variant: "success" },
  "SK PPPK PW": { variant: "warning" },
  "SK Penugasan": { variant: "warning" },
  "Sertifikat Pendidik": { variant: "success" },
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
  file_name: "",
  versi: 1,
  tanggal_upload: new Date().toISOString().split("T")[0],
  sekolah_nama: "",
};



export default function ArsipPage() {
  const { data: session } = useSession();

  const [data, setData] = useState<Arsip[]>([]);
  const [loading, setLoading] = useState(true);
  const [sekolahList, setSekolahList] = useState<SekolahOption[]>([]);

  function fetchList() {
    fetch("/api/arsip")
      .then((r) => r.json())
      .then((d) => { setData(d); setLoading(false); })
      .catch(() => setLoading(false));
  }

  useEffect(() => {
    fetchList();
    fetch("/api/sekolah").then(r => r.json()).then(d => setSekolahList(d.map((s: any) => ({ id: s.id, nama: s.nama })))).catch(() => {});
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
  const [expandedPemilik, setExpandedPemilik] = useState<string | null>(null);

  const groupedData = useMemo(() => {
    let result = data;
    if (search) {
      const q = search.toLowerCase();
      result = result.filter(
        (a) =>
          (a.file_name || "").toLowerCase().includes(q) ||
          a.pemilik.toLowerCase().includes(q) ||
          a.jenis_dokumen.toLowerCase().includes(q)
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
    const grouped: Record<string, { arsip: Arsip[]; sekolah_id: string; sekolah_nama: string }> = {};
    for (const a of result) {
      const key = a.pemilik || "(tanpa nama)";
      if (!grouped[key]) grouped[key] = { arsip: [], sekolah_id: a.sekolah_id, sekolah_nama: a.sekolah_nama || "" };
      grouped[key].arsip.push(a);
    }
    return Object.entries(grouped).sort((a, b) => a[0].localeCompare(b[0]));
  }, [data, search, filterJenisDokumen, filterSekolah, filterTahun]);

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
    window.open(`/api/arsip?id=${arsip.id}&download=1`, "_blank");
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
      const { id, jenis_dokumen, sekolah_id, bulan, tahun, pemilik, file } = form;
      const payload = { jenis_dokumen, sekolah_id, bulan, tahun, pemilik, file, versi: editingId ? form.versi : 1, file_name: form.file_name || "" };
      if (editingId) {
        const res = await fetch("/api/arsip", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id: editingId, ...payload }),
        });
        if (res.ok) { toast.success("Arsip berhasil diperbarui"); fetchList(); }
      } else {
        const res = await fetch("/api/arsip", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        if (res.ok) { toast.success("Arsip berhasil dibuat"); fetchList(); }
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

        {/* Grouped List */}
        <Card>
          <CardContent className="p-0">
            {groupedData.length === 0 ? (
              <div className="p-6">
                <EmptyState
                  title="Belum ada arsip"
                  message="Klik tombol Tambah Arsip untuk menambahkan arsip baru."
                  icon={<Archive className="w-12 h-12 text-gray-300" />}
                />
              </div>
            ) : (
              <div className="divide-y divide-gray-100">
                {groupedData.map(([pemilik, group]) => (
                  <div key={pemilik}>
                    <button
                      onClick={() => setExpandedPemilik(expandedPemilik === pemilik ? null : pemilik)}
                      className="w-full flex items-center justify-between px-4 py-3 hover:bg-gray-50 transition-colors text-left"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="flex items-center justify-center w-8 h-8 rounded-full bg-blue-50 text-blue-600 shrink-0">
                          <span className="text-xs font-bold">{group.arsip.length}</span>
                        </div>
                        <div className="min-w-0">
                          <div className="text-sm font-medium text-gray-900 truncate">{pemilik}</div>
                          <div className="text-xs text-gray-500">{group.sekolah_nama || "-"}</div>
                        </div>
                      </div>
                      <svg
                        className={`w-4 h-4 text-gray-400 shrink-0 transition-transform ${expandedPemilik === pemilik ? "rotate-180" : ""}`}
                        fill="none" viewBox="0 0 24 24" stroke="currentColor"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </button>

                    {expandedPemilik === pemilik && (
                      <div className="bg-gray-50 border-t border-gray-100">
                        <table className="w-full text-xs">
                          <thead>
                            <tr className="border-b border-gray-200">
                              <th className="px-4 py-2 text-left font-semibold text-gray-600 w-10">No</th>
                              <th className="px-4 py-2 text-left font-semibold text-gray-600">Jenis</th>
                              <th className="px-4 py-2 text-left font-semibold text-gray-600">File</th>
                              <th className="px-4 py-2 text-left font-semibold text-gray-600 hidden sm:table-cell">Tanggal</th>
                              <th className="px-4 py-2 text-center font-semibold text-gray-600 w-24">Aksi</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-200">
                            {group.arsip.map((a, i) => (
                              <tr key={a.id} className="hover:bg-white transition-colors">
                                <td className="px-4 py-2 text-gray-500">{i + 1}</td>
                                <td className="px-4 py-2">
                                  <Badge variant={jenisDokumenBadge[a.jenis_dokumen].variant}>{a.jenis_dokumen}</Badge>
                                </td>
                                <td className="px-4 py-2 max-w-[200px] truncate" title={a.file_name}>{a.file_name || "-"}</td>
                                <td className="px-4 py-2 text-gray-500 hidden sm:table-cell">{formatDate(a.tanggal_upload)}</td>
                                <td className="px-4 py-2">
                                  <div className="flex items-center justify-center gap-1">
                                    <button onClick={() => setViewing(a)} className="p-1 text-blue-600 hover:bg-blue-100 rounded" title="Lihat">
                                      <Eye className="w-3.5 h-3.5" />
                                    </button>
                                    <button onClick={() => handleDownload(a)} className="p-1 text-green-600 hover:bg-green-100 rounded" title="Unduh">
                                      <Download className="w-3.5 h-3.5" />
                                    </button>
                                    <button onClick={() => setConfirmDelete(a.id)} className="p-1 text-red-600 hover:bg-red-100 rounded" title="Hapus">
                                      <Trash2 className="w-3.5 h-3.5" />
                                    </button>
                                  </div>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                ))}
              </div>
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

      {/* Modal Lihat Detail */}
      <Modal
        open={!!viewing}
        onClose={() => setViewing(null)}
        title="Detail Arsip"
        size="full"
      >
        {viewing && <FileViewer arsip={viewing} sekolahList={sekolahList} />}
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

function FileViewer({ arsip, sekolahList }: { arsip: Arsip; sekolahList: SekolahOption[] }) {
  const [fileData, setFileData] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    fetch(`/api/arsip?id=${arsip.id}`)
      .then(r => r.json())
      .then(d => { setFileData(d.file); setLoading(false); })
      .catch(() => setLoading(false));
  }, [arsip.id]);

  const isPdf = fileData?.startsWith("data:application/pdf");
  const isImage = fileData?.startsWith("data:image/");

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3 text-sm">
        <DetailField label="Jenis Dokumen" value={<Badge variant={jenisDokumenBadge[arsip.jenis_dokumen].variant}>{arsip.jenis_dokumen}</Badge>} />
        <DetailField label="Sekolah" value={sekolahList.find(s => s.id === arsip.sekolah_id)?.nama || "-"} />
        <DetailField label="Pemilik" value={arsip.pemilik} />
        <DetailField label="Nama File" value={arsip.file_name || "-"} />
        <DetailField label="Tanggal Upload" value={formatDate(arsip.tanggal_upload)} />
      </div>

      <div className="border-t pt-4">
        <div className="flex items-center justify-between mb-2">
          <h4 className="font-semibold text-sm text-gray-800">Pratinjau Dokumen</h4>
          <a
            href={`/api/arsip?id=${arsip.id}&download=1`}
            download={arsip.file_name}
            className="inline-flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800"
          >
            <Download className="w-3 h-3" />
            Unduh
          </a>
        </div>
        {loading ? (
          <div className="flex items-center justify-center py-12 text-gray-400 text-sm">Memuat file...</div>
        ) : fileData && isPdf ? (
          <iframe src={fileData} className="w-full h-[70vh] border rounded-lg" title="PDF Preview" />
        ) : fileData && isImage ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={fileData} alt={arsip.file_name} className="max-w-full max-h-[70vh] object-contain mx-auto border rounded-lg" />
        ) : (
          <div className="text-center py-12 text-gray-400 text-sm">
            Pratinjau tidak tersedia untuk format ini.
            <br />
            <a href={`/api/arsip?id=${arsip.id}&download=1`} className="text-blue-600 underline mt-1 inline-block">Unduh file</a>
          </div>
        )}
      </div>
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
