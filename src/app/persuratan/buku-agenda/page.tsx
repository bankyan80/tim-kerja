"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { Plus, Eye, Pencil, Printer, Trash2, Calendar } from "lucide-react";
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

type BukuAgenda = {
  id: string;
  tanggal: string;
  nomor_agenda: string;
  jenis: "masuk" | "keluar";
  nomor_surat: string;
  pengirim_penerima: string;
  perihal: string;
  keterangan: string;
};

const jenisOptions = [
  { value: "masuk", label: "Surat Masuk" },
  { value: "keluar", label: "Surat Keluar" },
];

const tabs = [
  { label: "Surat Masuk", href: "/persuratan" },
  { label: "Surat Keluar", href: "/persuratan/keluar" },
  { label: "Disposisi", href: "/persuratan/disposisi" },
  { label: "Surat Tugas", href: "/persuratan/surat-tugas" },
  { label: "Undangan", href: "/persuratan/undangan" },
  { label: "Template Surat", href: "/persuratan/template" },
  { label: "Buku Agenda", href: "/persuratan/buku-agenda" },
];



export default function BukuAgendaPage() {
  const { data: session } = useSession();
  const pathname = usePathname();
  const [data, setData] = useState<BukuAgenda[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>("semua");
  const [modalMode, setModalMode] = useState<"add" | "edit" | "view" | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [form, setForm] = useState<BukuAgenda>({
    id: "", tanggal: "", nomor_agenda: "", jenis: "masuk", nomor_surat: "",
    pengirim_penerima: "", perihal: "", keterangan: "",
  });

  useEffect(() => {
    fetch("/api/surat").then(r => r.json()).then(d => { setData(d); setLoading(false); }).catch(() => setLoading(false));
  }, []);

  const resetForm = () => {
    setForm({ id: "", tanggal: "", nomor_agenda: "", jenis: "masuk", nomor_surat: "", pengirim_penerima: "", perihal: "", keterangan: "" });
  };

  const openAdd = () => { resetForm(); setModalMode("add"); };
  const openEdit = (item: BukuAgenda) => { setForm({ ...item }); setModalMode("edit"); };
  const openView = (item: BukuAgenda) => { setForm({ ...item }); setModalMode("view"); };

  async function handleSave() {
    const payload = { ...form };
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

  const filteredData = filter === "semua" ? data : data.filter((d) => d.jenis === filter);

  const columns: ColumnDef<BukuAgenda>[] = [
    { header: "No Agenda", accessorKey: "nomor_agenda" },
    { header: "Tanggal", accessorKey: "tanggal", cell: ({ row }) => formatDateShort(row.original.tanggal) },
    {
      header: "Jenis",
      accessorKey: "jenis",
      cell: ({ row }) => (
        <Badge variant={row.original.jenis === "masuk" ? "info" : "default"}>
          {row.original.jenis === "masuk" ? "Masuk" : "Keluar"}
        </Badge>
      ),
    },
    { header: "No Surat", accessorKey: "nomor_surat" },
    {
      header: "Pengirim/Penerima",
      accessorKey: "pengirim_penerima",
    },
    { header: "Perihal", accessorKey: "perihal" },
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

  if (loading) return <Loading message="Memuat buku agenda..." />;

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
            <h1 className="text-2xl font-bold text-gray-900">Buku Agenda</h1>
            <p className="text-sm text-gray-500 mt-1">Catatan agenda surat masuk dan keluar</p>
          </div>
          <Button onClick={openAdd}>
            <Plus className="w-4 h-4 mr-2" />
            Tambah Catatan
          </Button>
        </div>

        {/* Filter tabs */}
        <div className="flex gap-2">
          {[
            { value: "semua", label: "Semua" },
            { value: "masuk", label: "Surat Masuk" },
            { value: "keluar", label: "Surat Keluar" },
          ].map((opt) => (
            <button
              key={opt.value}
              onClick={() => setFilter(opt.value)}
              className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                filter === opt.value
                  ? "bg-blue-600 text-white"
                  : "bg-white text-gray-600 border border-gray-200 hover:bg-gray-50"
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>

        <Card>
          {filteredData.length === 0 ? (
            <EmptyState title="Belum ada catatan agenda" message="Tambahkan catatan agenda baru untuk memulai." />
          ) : (
            <DataTable columns={columns} data={filteredData} searchable />
          )}
        </Card>
      </div>

      <Modal open={modalMode === "add" || modalMode === "edit"} onClose={() => { setModalMode(null); resetForm(); }} title={modalMode === "add" ? "Tambah Catatan Agenda" : "Edit Catatan Agenda"} size="xl">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input label="Nomor Agenda" value={form.nomor_agenda} onChange={(e) => setForm({ ...form, nomor_agenda: e.target.value })} />
          <Input label="Tanggal" type="date" value={form.tanggal} onChange={(e) => setForm({ ...form, tanggal: e.target.value })} />
          <Select label="Jenis" options={jenisOptions} value={form.jenis} onChange={(e) => setForm({ ...form, jenis: e.target.value as "masuk" | "keluar" })} />
          <Input label="Nomor Surat" value={form.nomor_surat} onChange={(e) => setForm({ ...form, nomor_surat: e.target.value })} />
          <Input label="Pengirim/Penerima" value={form.pengirim_penerima} onChange={(e) => setForm({ ...form, pengirim_penerima: e.target.value })} />
          <div className="md:col-span-2">
            <Input label="Perihal" value={form.perihal} onChange={(e) => setForm({ ...form, perihal: e.target.value })} />
          </div>
          <div className="md:col-span-2">
            <Textarea label="Keterangan" value={form.keterangan} onChange={(e) => setForm({ ...form, keterangan: e.target.value })} rows={3} />
          </div>
        </div>
        <div className="flex justify-end gap-3 mt-6">
          <Button variant="outline" onClick={() => { setModalMode(null); resetForm(); }}>Batal</Button>
          <Button onClick={handleSave}>Simpan</Button>
        </div>
      </Modal>

      <Modal open={modalMode === "view"} onClose={() => setModalMode(null)} title="Detail Catatan Agenda" size="lg">
        <div className="space-y-3 text-sm">
          <div className="flex items-center gap-2 mb-4">
            <Calendar className="w-5 h-5 text-blue-500" />
            <span className="text-lg font-semibold text-gray-900">Agenda #{form.nomor_agenda}</span>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div><span className="text-gray-500">Tanggal:</span><p className="font-medium">{formatDateShort(form.tanggal)}</p></div>
            <div><span className="text-gray-500">Jenis:</span><p><Badge variant={form.jenis === "masuk" ? "info" : "default"}>{form.jenis === "masuk" ? "Surat Masuk" : "Surat Keluar"}</Badge></p></div>
            <div><span className="text-gray-500">No Surat:</span><p className="font-medium">{form.nomor_surat}</p></div>
            <div><span className="text-gray-500">Pengirim/Penerima:</span><p className="font-medium">{form.pengirim_penerima}</p></div>
            <div className="col-span-2"><span className="text-gray-500">Perihal:</span><p className="font-medium">{form.perihal}</p></div>
          </div>
          {form.keterangan && <div><span className="text-gray-500">Keterangan:</span><p className="mt-1 text-gray-700">{form.keterangan}</p></div>}
        </div>
        <div className="flex justify-end mt-6">
          <Button variant="outline" onClick={() => setModalMode(null)}>Tutup</Button>
        </div>
      </Modal>

      <Modal open={deleteId !== null} onClose={() => setDeleteId(null)} title="Konfirmasi Hapus" size="sm">
        <p className="text-sm text-gray-600">Apakah Anda yakin ingin menghapus catatan agenda ini? Tindakan ini tidak dapat dibatalkan.</p>
        <div className="flex justify-end gap-3 mt-6">
          <Button variant="outline" onClick={() => setDeleteId(null)}>Batal</Button>
          <Button variant="danger" onClick={handleDelete}>Hapus</Button>
        </div>
      </Modal>
    </div>
  );
}
