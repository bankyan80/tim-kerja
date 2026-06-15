"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { Plus, Eye, Pencil, Printer, Trash2 } from "lucide-react";
import { ColumnDef } from "@tanstack/react-table";
import { DataTable } from "@/components/ui/Table";
import { Badge } from "@/components/ui/Badge";
import { Card, CardHeader, CardTitle } from "@/components/ui/Card";
import { Input, Select, Textarea } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";
import Button from "@/components/ui/Button";
import { Loading } from "@/components/ui/Loading";
import { EmptyState } from "@/components/ui/EmptyState";
import { formatDateShort } from "@/lib/utils";
import toast from "react-hot-toast";

type SuratKeluar = {
  id: string;
  nomor_surat: string;
  tanggal: string;
  tujuan: string;
  perihal: string;
  jenis_surat: string;
  penandatangan: string;
  isi_surat: string;
  lampiran: string;
  status_pengiriman: string;
};

const jenisSuratOptions = [
  { value: "biasa", label: "Biasa" },
  { value: "dinas", label: "Dinas" },
  { value: "edaran", label: "Edaran" },
  { value: "keputusan", label: "Keputusan" },
  { value: "undangan", label: "Undangan" },
];

const statusPengirimanOptions = [
  { value: "draft", label: "Draft" },
  { value: "dikirim", label: "Dikirim" },
  { value: "diterima", label: "Diterima" },
  { value: "diarsipkan", label: "Diarsipkan" },
];

const statusVariant: Record<string, "warning" | "info" | "default" | "success" | "danger"> = {
  draft: "warning",
  dikirim: "info",
  diterima: "success",
  diarsipkan: "danger",
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



export default function SuratKeluarPage() {
  const { data: session } = useSession();
  const pathname = usePathname();
  const [data, setData] = useState<SuratKeluar[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalMode, setModalMode] = useState<"add" | "edit" | "view" | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [form, setForm] = useState<SuratKeluar>({
    id: "", nomor_surat: "", tanggal: "", tujuan: "", perihal: "", jenis_surat: "biasa",
    penandatangan: "", isi_surat: "", lampiran: "", status_pengiriman: "draft",
  });

  useEffect(() => {
    fetch("/api/surat?jenis=keluar").then(r => r.json()).then(d => { setData(d); setLoading(false); }).catch(() => setLoading(false));
  }, []);

  const resetForm = () => {
    setForm({ id: "", nomor_surat: "", tanggal: "", tujuan: "", perihal: "", jenis_surat: "biasa", penandatangan: "", isi_surat: "", lampiran: "", status_pengiriman: "draft" });
  };

  const openAdd = () => { resetForm(); setModalMode("add"); };
  const openEdit = (item: SuratKeluar) => { setForm({ ...item }); setModalMode("edit"); };
  const openView = (item: SuratKeluar) => { setForm({ ...item }); setModalMode("view"); };

  async function handleSave() {
    const payload = { ...form, jenis: "keluar" };
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

  const columns: ColumnDef<SuratKeluar>[] = [
    { header: "No Surat", accessorKey: "nomor_surat" },
    { header: "Tanggal", accessorKey: "tanggal", cell: ({ row }) => formatDateShort(row.original.tanggal) },
    { header: "Tujuan", accessorKey: "tujuan" },
    { header: "Perihal", accessorKey: "perihal" },
    {
      header: "Jenis Surat",
      accessorKey: "jenis_surat",
      cell: ({ row }) => <span className="capitalize">{row.original.jenis_surat}</span>,
    },
    { header: "Penandatangan", accessorKey: "penandatangan" },
    {
      header: "Status",
      accessorKey: "status_pengiriman",
      cell: ({ row }) => {
        const s = row.original.status_pengiriman;
        const label = statusPengirimanOptions.find((o) => o.value === s)?.label || s;
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
          <button className="p-1.5 hover:bg-gray-50 rounded-lg text-gray-600" title="Cetak"><Printer className="w-4 h-4" /></button>
          <button onClick={() => setDeleteId(row.original.id)} className="p-1.5 hover:bg-red-50 rounded-lg text-red-600" title="Hapus"><Trash2 className="w-4 h-4" /></button>
        </div>
      ),
    },
  ];

  if (loading) return <Loading message="Memuat data surat keluar..." />;

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
            <h1 className="text-2xl font-bold text-gray-900">Surat Keluar</h1>
            <p className="text-sm text-gray-500 mt-1">Kelola surat keluar yang dikirim</p>
          </div>
          <Button onClick={openAdd}>
            <Plus className="w-4 h-4 mr-2" />
            Tambah Surat Keluar
          </Button>
        </div>

        <Card>
          {data.length === 0 ? (
            <EmptyState title="Belum ada surat keluar" message="Tambahkan surat keluar baru untuk memulai." />
          ) : (
            <DataTable columns={columns} data={data} searchable />
          )}
        </Card>
      </div>

      <Modal open={modalMode === "add" || modalMode === "edit"} onClose={() => { setModalMode(null); resetForm(); }} title={modalMode === "add" ? "Tambah Surat Keluar" : "Edit Surat Keluar"} size="xl">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input label="Nomor Surat" value={form.nomor_surat} onChange={(e) => setForm({ ...form, nomor_surat: e.target.value })} />
          <Input label="Tanggal" type="date" value={form.tanggal} onChange={(e) => setForm({ ...form, tanggal: e.target.value })} />
          <Input label="Tujuan" value={form.tujuan} onChange={(e) => setForm({ ...form, tujuan: e.target.value })} />
          <Select label="Jenis Surat" options={jenisSuratOptions} value={form.jenis_surat} onChange={(e) => setForm({ ...form, jenis_surat: e.target.value })} />
          <div className="md:col-span-2">
            <Input label="Perihal" value={form.perihal} onChange={(e) => setForm({ ...form, perihal: e.target.value })} />
          </div>
          <Input label="Penandatangan" value={form.penandatangan} onChange={(e) => setForm({ ...form, penandatangan: e.target.value })} />
          <Select label="Status Pengiriman" options={statusPengirimanOptions} value={form.status_pengiriman} onChange={(e) => setForm({ ...form, status_pengiriman: e.target.value })} />
          <div className="md:col-span-2">
            <Textarea label="Isi Surat" value={form.isi_surat} onChange={(e) => setForm({ ...form, isi_surat: e.target.value })} rows={4} />
          </div>
          <div className="md:col-span-2">
            <Input label="Lampiran" value={form.lampiran} onChange={(e) => setForm({ ...form, lampiran: e.target.value })} placeholder="Nama file lampiran" />
          </div>
        </div>
        <div className="flex justify-end gap-3 mt-6">
          <Button variant="outline" onClick={() => { setModalMode(null); resetForm(); }}>Batal</Button>
          <Button onClick={handleSave}>Simpan</Button>
        </div>
      </Modal>

      <Modal open={modalMode === "view"} onClose={() => setModalMode(null)} title="Detail Surat Keluar" size="lg">
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div><span className="text-gray-500">No Surat:</span><p className="font-medium">{form.nomor_surat}</p></div>
            <div><span className="text-gray-500">Tanggal:</span><p className="font-medium">{form.tanggal}</p></div>
            <div><span className="text-gray-500">Tujuan:</span><p className="font-medium">{form.tujuan}</p></div>
            <div><span className="text-gray-500">Jenis Surat:</span><p className="font-medium capitalize">{form.jenis_surat}</p></div>
            <div className="col-span-2"><span className="text-gray-500">Perihal:</span><p className="font-medium">{form.perihal}</p></div>
            <div><span className="text-gray-500">Penandatangan:</span><p className="font-medium">{form.penandatangan}</p></div>
            <div><span className="text-gray-500">Status:</span><p><Badge variant={statusVariant[form.status_pengiriman] || "default"}>{statusPengirimanOptions.find((o) => o.value === form.status_pengiriman)?.label || form.status_pengiriman}</Badge></p></div>
          </div>
          {form.isi_surat && <div className="text-sm"><span className="text-gray-500">Isi Surat:</span><p className="mt-1 text-gray-700 whitespace-pre-wrap">{form.isi_surat}</p></div>}
          {form.lampiran && <div className="text-sm"><span className="text-gray-500">Lampiran:</span><p className="font-medium">{form.lampiran}</p></div>}
        </div>
        <div className="flex justify-end mt-6">
          <Button variant="outline" onClick={() => setModalMode(null)}>Tutup</Button>
        </div>
      </Modal>

      <Modal open={deleteId !== null} onClose={() => setDeleteId(null)} title="Konfirmasi Hapus" size="sm">
        <p className="text-sm text-gray-600">Apakah Anda yakin ingin menghapus surat ini? Tindakan ini tidak dapat dibatalkan.</p>
        <div className="flex justify-end gap-3 mt-6">
          <Button variant="outline" onClick={() => setDeleteId(null)}>Batal</Button>
          <Button variant="danger" onClick={handleDelete}>Hapus</Button>
        </div>
      </Modal>
    </div>
  );
}
