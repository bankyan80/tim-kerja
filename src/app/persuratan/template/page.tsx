"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { Plus, Eye, Pencil, Trash2, FileText } from "lucide-react";
import { ColumnDef } from "@tanstack/react-table";
import { DataTable } from "@/components/ui/Table";
import { Badge } from "@/components/ui/Badge";
import { Card, CardHeader, CardTitle } from "@/components/ui/Card";
import { Input, Select, Textarea } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";
import Button from "@/components/ui/Button";
import { Loading } from "@/components/ui/Loading";
import { EmptyState } from "@/components/ui/EmptyState";

type Template = {
  id: string;
  nama: string;
  jenis: string;
  deskripsi: string;
  isi_template: string;
  status: string;
};

const jenisTemplateOptions = [
  { value: "surat_dinas", label: "Surat Dinas" },
  { value: "surat_edaran", label: "Surat Edaran" },
  { value: "surat_tugas", label: "Surat Tugas" },
  { value: "undangan", label: "Undangan" },
  { value: "keputusan", label: "Keputusan" },
];

const statusOptions = [
  { value: "aktif", label: "Aktif" },
  { value: "tidak_aktif", label: "Tidak Aktif" },
];

const statusVariant: Record<string, "success" | "danger"> = {
  aktif: "success",
  tidak_aktif: "danger",
};

const tabs = [
  { label: "Surat Masuk", href: "/persuratan" },
  { label: "Surat Keluar", href: "/persuratan/keluar" },
  { label: "Disposisi", href: "/persuratan/disposisi" },
  { label: "Surat Tugas", href: "/persuratan/surat-tugas" },
  { label: "Undangan", href: "/persuratan/undangan" },
  { label: "Template Surat", href: "/persuratan/template" },
  { label: "Buku Agenda", href: "/persuratan/buku-agenda" },
];

const demoData: Template[] = [
  { id: "1", nama: "Template Surat Dinas", jenis: "surat_dinas", deskripsi: "Template standar untuk surat dinas resmi", isi_template: "Nomor: {{nomor_surat}}\nLampiran: {{lampiran}}\nPerihal: {{perihal}}\n\nYth. {{tujuan}}\n\nDengan hormat,\n{{isi_surat}}\n\n{{penandatangan}}", status: "aktif" },
  { id: "2", nama: "Template Surat Edaran", jenis: "surat_edaran", deskripsi: "Template untuk surat edaran ke sekolah", isi_template: "Nomor: {{nomor_surat}}\nPerihal: {{perihal}}\n\nKepada Yth.\n{{tujuan}}\n\nDengan ini disampaikan bahwa...\n{{isi_surat}}", status: "aktif" },
  { id: "3", nama: "Template Surat Tugas", jenis: "surat_tugas", deskripsi: "Template untuk surat tugas staf", isi_template: "SURAT TUGAS\nNomor: {{nomor_surat}}\n\nDasar: {{dasar}}\n\nMenugaskan kepada:\nNama: {{tujuan}}\n\nUntuk: {{isi_tugas}}", status: "aktif" },
  { id: "4", nama: "Template Undangan Rapat", jenis: "undangan", deskripsi: "Template untuk undangan rapat", isi_template: "Nomor: {{nomor_undangan}}\nPerihal: {{perihal}}\n\nAcara: {{acara}}\nHari/Tanggal: {{tanggal}}\nWaktu: {{waktu}}\nTempat: {{tempat}}", status: "tidak_aktif" },
];

export default function TemplatePage() {
  const { data: session } = useSession();
  const pathname = usePathname();
  const [data, setData] = useState<Template[]>(demoData);
  const [loading] = useState(false);
  const [modalMode, setModalMode] = useState<"add" | "edit" | "view" | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [form, setForm] = useState<Template>({
    id: "", nama: "", jenis: "surat_dinas", deskripsi: "", isi_template: "", status: "aktif",
  });

  const resetForm = () => {
    setForm({ id: "", nama: "", jenis: "surat_dinas", deskripsi: "", isi_template: "", status: "aktif" });
  };

  const openAdd = () => { resetForm(); setModalMode("add"); };
  const openEdit = (item: Template) => { setForm({ ...item }); setModalMode("edit"); };
  const openView = (item: Template) => { setForm({ ...item }); setModalMode("view"); };

  const handleSave = () => {
    if (modalMode === "add") {
      setData((prev) => [{ ...form, id: String(Date.now()) }, ...prev]);
    } else if (modalMode === "edit") {
      setData((prev) => prev.map((d) => (d.id === form.id ? form : d)));
    }
    setModalMode(null);
    resetForm();
  };

  const handleDelete = () => {
    if (deleteId) {
      setData((prev) => prev.filter((d) => d.id !== deleteId));
      setDeleteId(null);
    }
  };

  const columns: ColumnDef<Template>[] = [
    {
      header: "Nama",
      accessorKey: "nama",
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          <FileText className="w-4 h-4 text-blue-500 shrink-0" />
          <span className="font-medium">{row.original.nama}</span>
        </div>
      ),
    },
    {
      header: "Jenis",
      accessorKey: "jenis",
      cell: ({ row }) => {
        const label = jenisTemplateOptions.find((o) => o.value === row.original.jenis)?.label || row.original.jenis;
        return <span className="capitalize">{label}</span>;
      },
    },
    { header: "Deskripsi", accessorKey: "deskripsi" },
    {
      header: "Status",
      accessorKey: "status",
      cell: ({ row }) => {
        const s = row.original.status;
        const label = statusOptions.find((o) => o.value === s)?.label || s;
        return <Badge variant={statusVariant[s] || "default"}>{label}</Badge>;
      },
    },
    {
      header: "Aksi",
      id: "aksi",
      cell: ({ row }) => (
        <div className="flex items-center gap-1">
          <button onClick={() => openView(row.original)} className="p-1.5 hover:bg-blue-50 rounded-lg text-blue-600" title="Lihat"><Eye className="w-4 h-4" /></button>
          <button onClick={() => openEdit(row.original)} className="p-1.5 hover:bg-yellow-50 rounded-lg text-yellow-600" title="Edit"><Pencil className="w-4 h-4" /></button>
          <button onClick={() => setDeleteId(row.original.id)} className="p-1.5 hover:bg-red-50 rounded-lg text-red-600" title="Hapus"><Trash2 className="w-4 h-4" /></button>
        </div>
      ),
    },
  ];

  if (loading) return <Loading message="Memuat template surat..." />;

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="max-w-7xl mx-auto px-4 py-6 space-y-6">
        <div className="border-b border-gray-200 bg-white rounded-lg shadow-sm px-4">
          <nav className="flex overflow-x-auto gap-6 -mb-px">
            {tabs.map((tab) => (
              <Link
                key={tab.href}
                href={tab.href}
                className={`whitespace-nowrap py-3 px-1 text-sm font-medium border-b-2 transition-colors ${
                  pathname === tab.href
                    ? "border-blue-600 text-blue-600"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }`}
              >
                {tab.label}
              </Link>
            ))}
          </nav>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Template Surat</h1>
            <p className="text-sm text-gray-500 mt-1">Kelola template surat untuk memudahkan pembuatan dokumen</p>
          </div>
          <Button onClick={openAdd}>
            <Plus className="w-4 h-4 mr-2" />
            Tambah Template
          </Button>
        </div>

        <Card>
          {data.length === 0 ? (
            <EmptyState title="Belum ada template" message="Tambahkan template surat baru untuk memulai." />
          ) : (
            <DataTable columns={columns} data={data} searchable />
          )}
        </Card>
      </div>

      <Modal open={modalMode === "add" || modalMode === "edit"} onClose={() => { setModalMode(null); resetForm(); }} title={modalMode === "add" ? "Tambah Template" : "Edit Template"} size="xl">
        <div className="grid grid-cols-1 gap-4">
          <Input label="Nama Template" value={form.nama} onChange={(e) => setForm({ ...form, nama: e.target.value })} />
          <Select label="Jenis Surat" options={jenisTemplateOptions} value={form.jenis} onChange={(e) => setForm({ ...form, jenis: e.target.value })} />
          <Input label="Deskripsi" value={form.deskripsi} onChange={(e) => setForm({ ...form, deskripsi: e.target.value })} />
          <Textarea label="Isi Template" value={form.isi_template} onChange={(e) => setForm({ ...form, isi_template: e.target.value })} rows={8} />
          <Select label="Status" options={statusOptions} value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })} />
        </div>
        <div className="flex justify-end gap-3 mt-6">
          <Button variant="outline" onClick={() => { setModalMode(null); resetForm(); }}>Batal</Button>
          <Button onClick={handleSave}>Simpan</Button>
        </div>
      </Modal>

      <Modal open={modalMode === "view"} onClose={() => setModalMode(null)} title="Detail Template" size="lg">
        <div className="space-y-3 text-sm">
          <div className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-blue-500" />
            <span className="text-lg font-semibold text-gray-900">{form.nama}</span>
          </div>
          <div><span className="text-gray-500">Jenis:</span><p className="font-medium">{jenisTemplateOptions.find((o) => o.value === form.jenis)?.label || form.jenis}</p></div>
          {form.deskripsi && <div><span className="text-gray-500">Deskripsi:</span><p className="text-gray-700">{form.deskripsi}</p></div>}
          <div><span className="text-gray-500">Status:</span><p><Badge variant={statusVariant[form.status] || "default"}>{statusOptions.find((o) => o.value === form.status)?.label || form.status}</Badge></p></div>
          {form.isi_template && (
            <div>
              <span className="text-gray-500">Isi Template:</span>
              <pre className="mt-2 p-3 bg-gray-50 rounded-lg text-xs whitespace-pre-wrap font-mono text-gray-700 border">{form.isi_template}</pre>
            </div>
          )}
        </div>
        <div className="flex justify-end mt-6">
          <Button variant="outline" onClick={() => setModalMode(null)}>Tutup</Button>
        </div>
      </Modal>

      <Modal open={deleteId !== null} onClose={() => setDeleteId(null)} title="Konfirmasi Hapus" size="sm">
        <p className="text-sm text-gray-600">Apakah Anda yakin ingin menghapus template ini? Tindakan ini tidak dapat dibatalkan.</p>
        <div className="flex justify-end gap-3 mt-6">
          <Button variant="outline" onClick={() => setDeleteId(null)}>Batal</Button>
          <Button variant="danger" onClick={handleDelete}>Hapus</Button>
        </div>
      </Modal>
    </div>
  );
}
