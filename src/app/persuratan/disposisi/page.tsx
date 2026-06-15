"use client";

import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { Plus, Eye, Pencil, Printer, Trash2, CheckCircle } from "lucide-react";
import { ColumnDef } from "@tanstack/react-table";
import { DataTable } from "@/components/ui/Table";
import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import { Input, Select, Textarea } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";
import Button from "@/components/ui/Button";
import { Loading } from "@/components/ui/Loading";
import { EmptyState } from "@/components/ui/EmptyState";
import { formatDateShort } from "@/lib/utils";
import toast from "react-hot-toast";

type Disposisi = {
  id: string;
  nomor_surat: string;
  asal: string;
  perihal: string;
  penerima: string;
  instruksi: string;
  batas_tindak_lanjut: string;
  status: string;
  catatan: string;
};

const statusOptions = [
  { value: "draft", label: "Draft" },
  { value: "diproses", label: "Diproses" },
  { value: "selesai", label: "Selesai" },
  { value: "ditunda", label: "Ditunda" },
];

const statusVariant: Record<string, "warning" | "info" | "default" | "success" | "danger"> = {
  draft: "warning",
  diproses: "info",
  selesai: "success",
  ditunda: "danger",
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



export default function DisposisiPage() {
  const pathname = usePathname();
  const [data, setData] = useState<Disposisi[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalMode, setModalMode] = useState<"add" | "edit" | "view" | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [form, setForm] = useState<Disposisi>({
    id: "", nomor_surat: "", asal: "", perihal: "", penerima: "", instruksi: "",
    batas_tindak_lanjut: "", status: "draft", catatan: "",
  });

  useEffect(() => {
    fetch("/api/surat?jenis=masuk").then(r => r.json()).then(d => { setData(d); setLoading(false); }).catch(() => setLoading(false));
  }, []);

  const resetForm = () => {
    setForm({ id: "", nomor_surat: "", asal: "", perihal: "", penerima: "", instruksi: "", batas_tindak_lanjut: "", status: "draft", catatan: "" });
  };

  const openAdd = () => { resetForm(); setModalMode("add"); };
  const openEdit = (item: Disposisi) => { setForm({ ...item }); setModalMode("edit"); };
  const openView = (item: Disposisi) => { setForm({ ...item }); setModalMode("view"); };

  async function handleSave() {
    const payload = { ...form, jenis: "masuk" };
    if (modalMode === "edit") {
      const res = await fetch("/api/surat", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...payload, id: form.id }) });
      if (res.ok) { setData((prev) => prev.map((d) => (d.id === form.id ? { ...payload, id: form.id } : d))); toast.success("Data berhasil diupdate"); }
    } else {
      const res = await fetch("/api/surat", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
      if (res.ok) { const newId = String(Date.now()); setData((prev) => [{ ...payload, id: newId }, ...prev]); toast.success("Data berhasil ditambahkan"); }
    }
    setModalMode(null);
  }

  async function handleDelete() {
    if (deleteId) {
      await fetch(`/api/surat?id=${deleteId}`, { method: "DELETE" });
      setData((prev) => prev.filter((d) => d.id !== deleteId));
      setDeleteId(null);
      toast.success("Data berhasil dihapus");
    }
  }

  const columns: ColumnDef<Disposisi>[] = [
    { header: "No Surat", accessorKey: "nomor_surat" },
    { header: "Asal", accessorKey: "asal" },
    { header: "Perihal", accessorKey: "perihal" },
    { header: "Penerima", accessorKey: "penerima" },
    {
      header: "Batas Tindak Lanjut",
      accessorKey: "batas_tindak_lanjut",
      cell: ({ row }) => formatDateShort(row.original.batas_tindak_lanjut),
    },
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
          <button className="p-1.5 hover:bg-green-50 rounded-lg text-green-600" title="Selesai"><CheckCircle className="w-4 h-4" /></button>
          <button className="p-1.5 hover:bg-gray-50 rounded-lg text-gray-600" title="Cetak"><Printer className="w-4 h-4" /></button>
          <button onClick={() => setDeleteId(row.original.id)} className="p-1.5 hover:bg-red-50 rounded-lg text-red-600" title="Hapus"><Trash2 className="w-4 h-4" /></button>
        </div>
      ),
    },
  ];

  if (loading) return <Loading message="Memuat data disposisi..." />;

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
            <h1 className="text-2xl font-bold text-gray-900">Disposisi</h1>
            <p className="text-sm text-gray-500 mt-1">Kelola disposisi surat</p>
          </div>
          <Button onClick={openAdd}>
            <Plus className="w-4 h-4 mr-2" />
            Tambah Disposisi
          </Button>
        </div>

        <Card>
          {data.length === 0 ? (
            <EmptyState title="Belum ada disposisi" message="Tambahkan disposisi baru untuk memulai." />
          ) : (
            <DataTable columns={columns} data={data} searchable />
          )}
        </Card>
      </div>

      <Modal open={modalMode === "add" || modalMode === "edit"} onClose={() => { setModalMode(null); resetForm(); }} title={modalMode === "add" ? "Tambah Disposisi" : "Edit Disposisi"} size="xl">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input label="Nomor Surat" value={form.nomor_surat} onChange={(e) => setForm({ ...form, nomor_surat: e.target.value })} />
          <Input label="Asal" value={form.asal} onChange={(e) => setForm({ ...form, asal: e.target.value })} />
          <div className="md:col-span-2">
            <Input label="Perihal" value={form.perihal} onChange={(e) => setForm({ ...form, perihal: e.target.value })} />
          </div>
          <Input label="Penerima" value={form.penerima} onChange={(e) => setForm({ ...form, penerima: e.target.value })} />
          <Input label="Batas Tindak Lanjut" type="date" value={form.batas_tindak_lanjut} onChange={(e) => setForm({ ...form, batas_tindak_lanjut: e.target.value })} />
          <div className="md:col-span-2">
            <Textarea label="Instruksi" value={form.instruksi} onChange={(e) => setForm({ ...form, instruksi: e.target.value })} rows={3} />
          </div>
          <Select label="Status" options={statusOptions} value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })} />
          <div className="md:col-span-2">
            <Textarea label="Catatan" value={form.catatan} onChange={(e) => setForm({ ...form, catatan: e.target.value })} rows={3} />
          </div>
        </div>
        <div className="flex justify-end gap-3 mt-6">
          <Button variant="outline" onClick={() => { setModalMode(null); resetForm(); }}>Batal</Button>
          <Button onClick={handleSave}>Simpan</Button>
        </div>
      </Modal>

      <Modal open={modalMode === "view"} onClose={() => setModalMode(null)} title="Detail Disposisi" size="lg">
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div><span className="text-gray-500">No Surat:</span><p className="font-medium">{form.nomor_surat}</p></div>
            <div><span className="text-gray-500">Asal:</span><p className="font-medium">{form.asal}</p></div>
            <div className="col-span-2"><span className="text-gray-500">Perihal:</span><p className="font-medium">{form.perihal}</p></div>
            <div><span className="text-gray-500">Penerima:</span><p className="font-medium">{form.penerima}</p></div>
            <div><span className="text-gray-500">Batas Tindak Lanjut:</span><p className="font-medium">{form.batas_tindak_lanjut}</p></div>
            {form.instruksi && <div className="col-span-2"><span className="text-gray-500">Instruksi:</span><p className="mt-1 text-gray-700 whitespace-pre-wrap">{form.instruksi}</p></div>}
            <div><span className="text-gray-500">Status:</span><p><Badge variant={statusVariant[form.status] || "default"}>{statusOptions.find((o) => o.value === form.status)?.label || form.status}</Badge></p></div>
          </div>
          {form.catatan && <div className="text-sm"><span className="text-gray-500">Catatan:</span><p className="mt-1 text-gray-700">{form.catatan}</p></div>}
        </div>
        <div className="flex justify-end mt-6">
          <Button variant="outline" onClick={() => setModalMode(null)}>Tutup</Button>
        </div>
      </Modal>

      <Modal open={deleteId !== null} onClose={() => setDeleteId(null)} title="Konfirmasi Hapus" size="sm">
        <p className="text-sm text-gray-600">Apakah Anda yakin ingin menghapus disposisi ini? Tindakan ini tidak dapat dibatalkan.</p>
        <div className="flex justify-end gap-3 mt-6">
          <Button variant="outline" onClick={() => setDeleteId(null)}>Batal</Button>
          <Button variant="danger" onClick={handleDelete}>Hapus</Button>
        </div>
      </Modal>
    </div>
  );
}
